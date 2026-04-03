#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { readRc, writeRc, getStore } from "./utils.js";
import { ccSwitchExists } from "./store/cc-switch.js";
import { readClaudeSettings, applyProfile, getSettingsPath } from "./claude.js";
import { createInterface } from "readline";

const program = new Command();

program
  .name("ccm")
  .description("Claude Code Model Switcher - 快速切换 Claude Code 自定义模型配置")
  .version("1.0.0");

// Helper: prompt user for input
function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Helper: ensure initialized
function ensureStore() {
  const store = getStore();
  if (!store) {
    console.log(chalk.yellow("尚未初始化，请先运行: ccm init"));
    process.exit(1);
  }
  return store;
}

// Helper: format env for display
function formatEnv(env: Record<string, string>): string {
  const lines: string[] = [];
  const order = [
    "ANTHROPIC_BASE_URL",
    "ANTHROPIC_MODEL",
    "ANTHROPIC_DEFAULT_OPUS_MODEL",
    "ANTHROPIC_DEFAULT_SONNET_MODEL",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  ];
  for (const key of order) {
    if (key in env) {
      lines.push(`  ${chalk.gray(key)}: ${env[key]}`);
    }
  }
  // Show remaining keys (skip token for security)
  for (const [key, val] of Object.entries(env)) {
    if (!order.includes(key) && key !== "ANTHROPIC_AUTH_TOKEN") {
      lines.push(`  ${chalk.gray(key)}: ${val}`);
    }
  }
  if ("ANTHROPIC_AUTH_TOKEN" in env) {
    const token = env["ANTHROPIC_AUTH_TOKEN"];
    const masked = token.slice(0, 8) + "..." + token.slice(-4);
    lines.push(`  ${chalk.gray("ANTHROPIC_AUTH_TOKEN")}: ${masked}`);
  }
  return lines.join("\n");
}

// Helper: Levenshtein distance
function levenshtein(a: string, b: string): number {
  const la = a.length, lb = b.length;
  const dp: number[][] = Array.from({ length: la + 1 }, (_, i) =>
    Array.from({ length: lb + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[la][lb];
}

// Helper: find suggestions for a mistyped name
function findSuggestions(input: string, names: string[]): string[] {
  const lower = input.toLowerCase();

  // 1. exact case-insensitive match
  const exact = names.find((n) => n.toLowerCase() === lower);
  if (exact) return [exact];

  // 2. substring match (input is part of name, or name is part of input)
  const substring = names.filter(
    (n) => n.toLowerCase().includes(lower) || lower.includes(n.toLowerCase())
  );
  if (substring.length > 0) return substring;

  // 3. Levenshtein distance <= 3
  const fuzzy = names
    .map((n) => ({ name: n, dist: levenshtein(lower, n.toLowerCase()) }))
    .filter((x) => x.dist <= 3)
    .sort((a, b) => a.dist - b.dist)
    .map((x) => x.name);

  return fuzzy;
}

// Helper: resolve alias → real name
function resolveAlias(input: string): string {
  const rc = readRc();
  return rc?.aliases?.[input] ?? input;
}

// Helper: resolve name with fuzzy matching, returns profile or exits
function resolveProfile(store: ReturnType<typeof ensureStore>, input: string) {
  // 1. check alias first
  const resolved = resolveAlias(input);
  const profile = store.get(resolved);
  if (profile) return profile;

  // If alias resolved to something different but not found, mention it
  if (resolved !== input) {
    console.log(chalk.red(`别名 "${input}" 指向 "${resolved}"，但该配置不存在`));
    return null;
  }

  const allNames = store.list().map((p) => p.name);
  const suggestions = findSuggestions(input, allNames);

  console.log(chalk.red(`配置 "${input}" 不存在`));
  if (suggestions.length === 1) {
    console.log(chalk.yellow(`你是不是想说: ${chalk.bold(suggestions[0])}?`));
  } else if (suggestions.length > 1) {
    console.log(chalk.yellow(`你是不是想说:`));
    for (const s of suggestions) {
      console.log(`  - ${chalk.bold(s)}`);
    }
  } else {
    console.log(chalk.gray("使用 ccm list 查看所有可用配置"));
  }
  return null;
}

// ccm init
program
  .command("init")
  .description("初始化 ccm，选择数据源模式")
  .action(async () => {
    const existing = readRc();
    if (existing) {
      const confirm = await ask(
        `已初始化为 ${chalk.cyan(existing.mode)} 模式，是否重新配置？(y/N) `
      );
      if (confirm.toLowerCase() !== "y") return;
    }

    const hasCcSwitch = ccSwitchExists();

    console.log(chalk.bold("\n选择数据源模式:\n"));
    if (hasCcSwitch) {
      console.log(`  ${chalk.cyan("1)")} cc-switch 模式 ${chalk.green("(检测到已安装)")}`);
      console.log(`     直接读写 cc-switch 数据库，配置与 cc-switch UI 共享\n`);
    } else {
      console.log(`  ${chalk.gray("1)")} cc-switch 模式 ${chalk.red("(未检测到)")}`);
      console.log(`     需要先安装 cc-switch\n`);
    }
    console.log(`  ${chalk.cyan("2)")} 独立模式`);
    console.log(`     使用 ~/.ccm/config.json 存储配置，不依赖 cc-switch\n`);

    const choice = await ask("请选择 (1/2): ");

    if (choice === "1") {
      if (!hasCcSwitch) {
        console.log(chalk.red("cc-switch 未安装，请先安装后再选择此模式"));
        return;
      }
      writeRc({ mode: "cc-switch" });
      console.log(chalk.green("\n✓ 已设置为 cc-switch 模式"));
    } else if (choice === "2") {
      writeRc({ mode: "standalone" });
      console.log(chalk.green("\n✓ 已设置为独立模式"));
    } else {
      console.log(chalk.red("无效选择"));
    }
  });

// ccm config
program
  .command("config")
  .description("查看或切换数据源模式")
  .action(async () => {
    const rc = readRc();
    if (!rc) {
      console.log(chalk.yellow("尚未初始化，请先运行: ccm init"));
      return;
    }
    console.log(`当前模式: ${chalk.cyan(rc.mode)}`);
    const confirm = await ask("是否切换模式？(y/N) ");
    if (confirm.toLowerCase() === "y") {
      const newMode = rc.mode === "cc-switch" ? "standalone" : "cc-switch";
      if (newMode === "cc-switch" && !ccSwitchExists()) {
        console.log(chalk.red("cc-switch 未安装"));
        return;
      }
      writeRc({ mode: newMode });
      console.log(chalk.green(`✓ 已切换为 ${newMode} 模式`));
    }
  });

// ccm list
program
  .command("list")
  .alias("ls")
  .description("列出所有可用的配置方案")
  .action(() => {
    const store = ensureStore();
    const profiles = store.list();
    const current = store.getCurrent();

    if (profiles.length === 0) {
      console.log(chalk.yellow("暂无配置方案。使用 ccm save <name> 保存当前配置"));
      return;
    }

    console.log(chalk.bold("\n可用配置:\n"));
    for (const p of profiles) {
      const isCurrent = p.name === current;
      const marker = isCurrent ? chalk.green("● ") : "  ";
      const name = isCurrent ? chalk.green.bold(p.name) : p.name;
      const env = (p.settingsConfig.env || {}) as Record<string, string>;
      const model = env["ANTHROPIC_MODEL"] || "N/A";
      const baseUrl = env["ANTHROPIC_BASE_URL"] || "default";
      console.log(`${marker}${name}`);
      console.log(`    模型: ${chalk.cyan(model)}  来源: ${chalk.gray(baseUrl)}`);
    }
    console.log();
  });

// ccm current
program
  .command("current")
  .description("显示当前生效的配置")
  .action(() => {
    const store = ensureStore();
    const currentName = store.getCurrent();

    if (!currentName) {
      console.log(chalk.yellow("当前无激活配置"));
      console.log(chalk.gray("\n当前 settings.json:"));
      const settings = readClaudeSettings();
      const env = (settings.env || {}) as Record<string, string>;
      console.log(formatEnv(env));
      return;
    }

    const profile = store.get(currentName);
    if (!profile) {
      console.log(chalk.yellow(`当前配置 "${currentName}" 已不存在`));
      return;
    }

    console.log(`\n当前配置: ${chalk.green.bold(profile.name)}\n`);
    const env = (profile.settingsConfig.env || {}) as Record<string, string>;
    console.log(formatEnv(env));
    if (profile.settingsConfig.model) {
      console.log(`  ${chalk.gray("model")}: ${profile.settingsConfig.model}`);
    }
    console.log();
  });

// ccm use <name>
program
  .command("use <name>")
  .description("切换到指定配置方案")
  .action((name: string) => {
    const store = ensureStore();
    const profile = resolveProfile(store, name);
    if (!profile) return;

    applyProfile(profile.settingsConfig);
    store.setCurrent(profile.name);

    const env = (profile.settingsConfig.env || {}) as Record<string, string>;
    const model = env["ANTHROPIC_MODEL"] || "N/A";
    console.log(chalk.green(`✓ 已切换到 ${chalk.bold(name)}`));
    console.log(`  模型: ${chalk.cyan(model)}`);
    console.log(chalk.gray(`  重启 Claude Code 生效`));
  });

// ccm save <name>
program
  .command("save <name>")
  .description("从当前 settings.json 保存为新配置")
  .action((name: string) => {
    const store = ensureStore();
    const existing = store.get(name);

    if (existing) {
      console.log(chalk.yellow(`配置 "${name}" 已存在，将覆盖`));
    }

    const settings = readClaudeSettings();
    // 只保存模型相关字段
    const settingsConfig: Record<string, unknown> = {};
    if (settings.env) settingsConfig.env = settings.env;
    if (settings.model) settingsConfig.model = settings.model;
    if (settings.hooks) settingsConfig.hooks = settings.hooks;
    if (settings.statusLine) settingsConfig.statusLine = settings.statusLine;

    store.save(name, settingsConfig);
    store.setCurrent(name);

    console.log(chalk.green(`✓ 已保存当前配置为 "${name}"`));
  });

// ccm show <name>
program
  .command("show [name]")
  .description("查看配置详情（不指定则显示当前）")
  .action((name?: string) => {
    const store = ensureStore();

    if (!name) {
      const currentName = store.getCurrent();
      if (!currentName) {
        console.log(chalk.yellow("当前无激活配置，请指定名称: ccm show <name>"));
        return;
      }
      name = currentName;
    }

    const profile = resolveProfile(store, name);
    if (!profile) return;

    console.log(`\n${chalk.bold(profile.name)}\n`);
    const env = (profile.settingsConfig.env || {}) as Record<string, string>;
    console.log(formatEnv(env));
    if (profile.settingsConfig.model) {
      console.log(`  ${chalk.gray("model")}: ${profile.settingsConfig.model}`);
    }
    console.log();
  });

// ccm remove <name>
program
  .command("remove <name>")
  .alias("rm")
  .description("删除配置方案")
  .action(async (name: string) => {
    const store = ensureStore();

    const profile = resolveProfile(store, name);
    if (!profile) return;

    const confirm = await ask(`确认删除 "${profile.name}"？(y/N) `);
    if (confirm.toLowerCase() !== "y") return;

    store.remove(profile.name);
    console.log(chalk.green(`✓ 已删除 "${name}"`));
  });

// ccm alias
const aliasCmd = program
  .command("alias")
  .description("管理别名");

aliasCmd
  .command("set <short> <name>")
  .description("设置别名，如: ccm alias set z zenMux-opus4.6")
  .action((short: string, name: string) => {
    const store = ensureStore();
    // Verify target exists
    if (!store.get(name)) {
      const allNames = store.list().map((p) => p.name);
      const suggestions = findSuggestions(name, allNames);
      console.log(chalk.red(`配置 "${name}" 不存在`));
      if (suggestions.length > 0) {
        console.log(chalk.yellow(`你是不是想说: ${suggestions.join(", ")}?`));
      }
      return;
    }

    const rc = readRc()!;
    rc.aliases = rc.aliases || {};
    rc.aliases[short] = name;
    writeRc(rc);
    console.log(chalk.green(`✓ 别名已设置: ${chalk.bold(short)} → ${name}`));
  });

aliasCmd
  .command("rm <short>")
  .description("删除别名")
  .action((short: string) => {
    const rc = readRc();
    if (!rc?.aliases?.[short]) {
      console.log(chalk.red(`别名 "${short}" 不存在`));
      return;
    }
    delete rc.aliases![short];
    writeRc(rc);
    console.log(chalk.green(`✓ 已删除别名 "${short}"`));
  });

aliasCmd
  .command("list")
  .alias("ls")
  .description("列出所有别名")
  .action(() => {
    const rc = readRc();
    const aliases = rc?.aliases || {};
    const entries = Object.entries(aliases);

    if (entries.length === 0) {
      console.log(chalk.yellow("暂无别名。使用 ccm alias set <short> <name> 添加"));
      return;
    }

    console.log(chalk.bold("\n别名列表:\n"));
    for (const [short, name] of entries) {
      console.log(`  ${chalk.cyan.bold(short)} → ${name}`);
    }
    console.log();
  });

// Default: ccm alias (no subcommand) → show list
aliasCmd.action(() => {
  aliasCmd.commands.find((c) => c.name() === "list")!.parseAsync([]);
});

program.parse();
