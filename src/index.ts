#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { readRc, writeRc, getStore } from "./utils.js";
import { ccSwitchExists } from "./store/cc-switch.js";
import { readClaudeSettings, applyProfile, getSettingsPath } from "./claude.js";
import { createInterface } from "readline";
import { spawnSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { t } from "./i18n/index.js";
import prompts from "prompts";

const program = new Command();

program
  .name("ccm")
  .description(t("program.description"))
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
    console.log(chalk.yellow(t("common.not_init")));
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
    console.log(chalk.red(t("error.alias_target_missing", { alias: input, target: resolved })));
    return null;
  }

  const allNames = store.list().map((p) => p.name);
  const suggestions = findSuggestions(input, allNames);

  console.log(chalk.red(t("error.not_found", { name: input })));
  if (suggestions.length === 1) {
    console.log(chalk.yellow(t("suggest.did_you_mean", { name: chalk.bold(suggestions[0]) })));
  } else if (suggestions.length > 1) {
    console.log(chalk.yellow(t("suggest.did_you_mean_header")));
    for (const s of suggestions) {
      console.log(`  - ${chalk.bold(s)}`);
    }
  } else {
    console.log(chalk.gray(t("suggest.use_list")));
  }
  return null;
}

// ccm init
program
  .command("init")
  .description(t("init.description"))
  .action(async () => {
    if (ccSwitchExists()) {
      const use = await ask(t("init.cc_switch_found"));
      if (use.toLowerCase() !== "n") {
        writeRc({ mode: "cc-switch" });
        const { CcSwitchStore } = await import("./store/cc-switch.js");
        const store = new CcSwitchStore();
        const profiles = store.list();
        const current = store.getCurrent();
        console.log(chalk.green(t("init.done_cc_switch")));
        console.log(chalk.green(t("init.imported", { count: String(profiles.length) })));
        if (current) {
          console.log(chalk.gray(t("init.current", { name: current })));
        } else {
          console.log(chalk.gray(t("init.no_current")));
        }
        return;
      }
    }

    writeRc({ mode: "standalone" });
    console.log(chalk.green(t("init.done_standalone")));
  });

// ccm config
program
  .command("config")
  .description(t("config.description"))
  .action(async () => {
    const rc = readRc();
    if (!rc) {
      console.log(chalk.yellow(t("common.not_init")));
      return;
    }
    console.log(t("config.current_mode", { mode: chalk.cyan(rc.mode) }));
    const confirm = await ask(t("config.switch_confirm"));
    if (confirm.toLowerCase() === "y") {
      const newMode = rc.mode === "cc-switch" ? "standalone" : "cc-switch";
      if (newMode === "cc-switch" && !ccSwitchExists()) {
        console.log(chalk.red(t("config.cc_switch_not_installed")));
        return;
      }
      writeRc({ mode: newMode });
      console.log(chalk.green(t("config.switched", { mode: newMode })));
    }
  });

// ccm list
program
  .command("list")
  .alias("ls")
  .description(t("list.description"))
  .action(async () => {
    const store = ensureStore();
    const profiles = store.list();
    const current = store.getCurrent();

    if (profiles.length === 0) {
      console.log(chalk.yellow(t("list.empty")));
      return;
    }

    const choices = profiles.map((p) => {
      const isCurrent = p.name === current;
      const env = (p.settingsConfig.env || {}) as Record<string, string>;
      const model = env["ANTHROPIC_MODEL"] || "N/A";
      const baseUrl = env["ANTHROPIC_BASE_URL"] || "default";
      const marker = isCurrent ? chalk.green("● ") : "  ";
      const label = isCurrent ? chalk.green.bold(p.name) : p.name;
      const tag = isCurrent ? chalk.gray(` ${t("list.current_marker")}`) : "";
      return {
        title: `${marker}${label}${tag}`,
        description: `${t("common.model")}: ${model}  ${t("common.source")}: ${baseUrl}`,
        value: p.name,
      };
    });

    const initial = profiles.findIndex((p) => p.name === current);
    const response = await prompts({
      type: "select",
      name: "name",
      message: t("list.select"),
      choices,
      initial: initial >= 0 ? initial : 0,
    });

    if (!response.name) {
      console.log(chalk.gray(t("list.cancelled")));
      return;
    }

    if (response.name === current) return;

    const profile = store.get(response.name)!;
    applyProfile(profile.settingsConfig);
    store.setCurrent(profile.name);

    const env = (profile.settingsConfig.env || {}) as Record<string, string>;
    const model = env["ANTHROPIC_MODEL"] || "N/A";
    console.log(chalk.green(t("use.done", { name: chalk.bold(profile.name) })));
    console.log(`  ${t("common.model")}: ${chalk.cyan(model)}`);
    console.log(chalk.gray(`  ${t("use.restart")}`));
  });

// ccm current
program
  .command("current")
  .description(t("current.description"))
  .action(() => {
    const store = ensureStore();
    const currentName = store.getCurrent();

    if (!currentName) {
      console.log(chalk.yellow(t("current.none")));
      console.log(chalk.gray(`\n${t("current.settings_header")}`));
      const settings = readClaudeSettings();
      const env = (settings.env || {}) as Record<string, string>;
      console.log(formatEnv(env));
      return;
    }

    const profile = store.get(currentName);
    if (!profile) {
      console.log(chalk.yellow(t("current.not_exist", { name: currentName })));
      return;
    }

    console.log(`\n${t("current.header", { name: chalk.green.bold(profile.name) })}\n`);
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
  .description(t("use.description"))
  .action((name: string) => {
    const store = ensureStore();
    const profile = resolveProfile(store, name);
    if (!profile) return;

    applyProfile(profile.settingsConfig);
    store.setCurrent(profile.name);

    const env = (profile.settingsConfig.env || {}) as Record<string, string>;
    const model = env["ANTHROPIC_MODEL"] || "N/A";
    console.log(chalk.green(t("use.done", { name: chalk.bold(profile.name) })));
    console.log(`  ${t("common.model")}: ${chalk.cyan(model)}`);
    console.log(chalk.gray(`  ${t("use.restart")}`));
  });

// ccm save <name>
program
  .command("save <name>")
  .description(t("save.description"))
  .action((name: string) => {
    const store = ensureStore();
    const existing = store.get(name);

    if (existing) {
      console.log(chalk.yellow(t("save.overwrite", { name })));
    }

    const settings = readClaudeSettings();
    const settingsConfig: Record<string, unknown> = {};
    if (settings.env) settingsConfig.env = settings.env;
    if (settings.model) settingsConfig.model = settings.model;
    if (settings.hooks) settingsConfig.hooks = settings.hooks;
    if (settings.statusLine) settingsConfig.statusLine = settings.statusLine;

    store.save(name, settingsConfig);
    store.setCurrent(name);

    console.log(chalk.green(t("save.done", { name })));
  });

// Helper: open editor with content, return parsed JSON or null
function openEditor(name: string, content: Record<string, unknown>): Record<string, unknown> | null {
  const tmpFile = join(tmpdir(), `ccm-${name}-${Date.now()}.json`);
  writeFileSync(tmpFile, JSON.stringify(content, null, 2));

  const editor = process.env.EDITOR || "vi";
  const result = spawnSync(editor, [tmpFile], { stdio: "inherit" });

  let parsed: Record<string, unknown> | null = null;
  if (result.status === 0) {
    try {
      parsed = JSON.parse(readFileSync(tmpFile, "utf-8"));
    } catch {
      console.log(chalk.red(t("add.json_parse_error")));
    }
  }

  try { unlinkSync(tmpFile); } catch { /* ignore */ }
  return parsed;
}

// Helper: save and optionally switch after add
async function saveAndSwitch(store: ReturnType<typeof ensureStore>, name: string, settingsConfig: Record<string, unknown>) {
  store.save(name, settingsConfig);
  console.log(chalk.green(t("add.done", { name })));

  const switchChoice = await ask(t("add.switch_confirm"));
  if (switchChoice.toLowerCase() !== "n") {
    applyProfile(settingsConfig);
    store.setCurrent(name);
    console.log(chalk.green(t("use.done", { name: chalk.bold(name) })));
    console.log(chalk.gray(`  ${t("use.restart")}`));
  }
}

// ccm add
program
  .command("add")
  .alias("new")
  .description(t("add.description"))
  .action(async () => {
    const store = ensureStore();

    // 1. Ask name first
    const name = await ask(t("add.prompt_name"));
    if (!name) {
      console.log(chalk.red(t("add.name_required")));
      return;
    }

    // Check if exists
    const existing = store.get(name);
    if (existing) {
      const overwrite = await ask(t("add.already_exists", { name }));
      if (overwrite.toLowerCase() !== "y") {
        console.log(chalk.gray(t("add.cancelled")));
        return;
      }
    }

    // 2. Choose mode
    console.log(`\n${chalk.bold(t("add.mode_select"))}\n`);
    console.log(`  ${chalk.cyan("1)")} ${t("add.mode_interactive")}`);
    console.log(`  ${chalk.cyan("2)")} ${t("add.mode_json")}\n`);
    const mode = await ask(t("add.mode_choose"));

    if (mode === "2") {
      // JSON mode: open editor with template
      const template: Record<string, unknown> = {
        env: {
          ANTHROPIC_BASE_URL: "",
          ANTHROPIC_AUTH_TOKEN: "",
          ANTHROPIC_MODEL: "",
          ANTHROPIC_DEFAULT_OPUS_MODEL: "",
          ANTHROPIC_DEFAULT_SONNET_MODEL: "",
          ANTHROPIC_DEFAULT_HAIKU_MODEL: "",
        },
      };

      console.log(chalk.gray(t("add.json_template_hint")));
      const edited = openEditor(name, template);
      if (!edited) return;

      await saveAndSwitch(store, name, edited);
      return;
    }

    // Interactive mode with step-based back support
    interface Step { key: string; prompt: string; required: boolean; }
    const steps: Step[] = [
      { key: "ANTHROPIC_BASE_URL", prompt: t("add.prompt_base_url"), required: true },
      { key: "ANTHROPIC_AUTH_TOKEN", prompt: t("add.prompt_auth_token"), required: true },
      { key: "ANTHROPIC_MODEL", prompt: t("add.prompt_model"), required: true },
      { key: "ANTHROPIC_DEFAULT_OPUS_MODEL", prompt: t("add.prompt_default_opus"), required: false },
      { key: "ANTHROPIC_DEFAULT_SONNET_MODEL", prompt: t("add.prompt_default_sonnet"), required: false },
      { key: "ANTHROPIC_DEFAULT_HAIKU_MODEL", prompt: t("add.prompt_default_haiku"), required: false },
    ];

    console.log(chalk.gray(t("add.back_hint")));
    const values: Record<string, string> = {};
    let i = 0;
    while (i < steps.length) {
      const step = steps[i];
      const input = await ask(step.prompt);

      if (input === "<") {
        if (i > 0) i--;
        continue;
      }

      if (step.required && !input) {
        console.log(chalk.red(t("add.field_required", { field: step.key })));
        continue;
      }

      if (input) values[step.key] = input;
      else delete values[step.key];
      i++;
    }

    // Build config
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) {
      env[k] = v;
    }

    let settingsConfig: Record<string, unknown> = { env };

    // Preview + optional edit
    console.log(`\n${chalk.bold(t("add.preview_header"))}\n`);
    console.log(JSON.stringify(settingsConfig, null, 2));
    console.log();

    const editChoice = await ask(t("add.edit_confirm"));
    if (editChoice.toLowerCase() === "y") {
      const edited = openEditor(name, settingsConfig);
      if (edited) settingsConfig = edited;
    }

    await saveAndSwitch(store, name, settingsConfig);
  });

// ccm show <name>
program
  .command("show [name]")
  .description(t("show.description"))
  .action((name?: string) => {
    const store = ensureStore();

    if (!name) {
      const currentName = store.getCurrent();
      if (!currentName) {
        console.log(chalk.yellow(t("show.no_current")));
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
  .description(t("remove.description"))
  .action(async (name: string) => {
    const store = ensureStore();

    const profile = resolveProfile(store, name);
    if (!profile) return;

    const confirm = await ask(t("remove.confirm", { name: profile.name }));
    if (confirm.toLowerCase() !== "y") return;

    store.remove(profile.name);
    console.log(chalk.green(t("remove.done", { name })));
  });

// ccm alias
const aliasCmd = program
  .command("alias")
  .description(t("alias.description"));

aliasCmd
  .command("set <short> <name>")
  .description(t("alias.set_description"))
  .action((short: string, name: string) => {
    const store = ensureStore();
    if (!store.get(name)) {
      const allNames = store.list().map((p) => p.name);
      const suggestions = findSuggestions(name, allNames);
      console.log(chalk.red(t("error.not_found", { name })));
      if (suggestions.length > 0) {
        console.log(chalk.yellow(t("suggest.did_you_mean", { name: suggestions.join(", ") })));
      }
      return;
    }

    const rc = readRc()!;
    rc.aliases = rc.aliases || {};
    rc.aliases[short] = name;
    writeRc(rc);
    console.log(chalk.green(t("alias.set_done", { short: chalk.bold(short), name })));
  });

aliasCmd
  .command("rm <short>")
  .description(t("alias.rm_description"))
  .action((short: string) => {
    const rc = readRc();
    if (!rc?.aliases?.[short]) {
      console.log(chalk.red(t("alias.rm_not_found", { short })));
      return;
    }
    delete rc.aliases![short];
    writeRc(rc);
    console.log(chalk.green(t("alias.rm_done", { short })));
  });

aliasCmd
  .command("list")
  .alias("ls")
  .description(t("alias.list_description"))
  .action(() => {
    const rc = readRc();
    const aliases = rc?.aliases || {};
    const entries = Object.entries(aliases);

    if (entries.length === 0) {
      console.log(chalk.yellow(t("alias.list_empty")));
      return;
    }

    console.log(chalk.bold(`\n${t("alias.list_header")}\n`));
    for (const [short, name] of entries) {
      console.log(`  ${chalk.cyan.bold(short)} → ${name}`);
    }
    console.log();
  });

// Default: ccm alias (no subcommand) → show list
aliasCmd.action(() => {
  aliasCmd.commands.find((c) => c.name() === "list")!.parseAsync([]);
});

// ccm locale
const localeCmd = program
  .command("locale")
  .description(t("locale.description"));

localeCmd
  .command("set <lang>")
  .description(t("locale.set_description"))
  .action((lang: string) => {
    if (lang !== "zh" && lang !== "en") {
      console.log(chalk.red(t("locale.set_invalid", { locale: lang })));
      return;
    }
    const rc = readRc();
    if (!rc) {
      console.log(chalk.yellow(t("common.not_init")));
      return;
    }
    rc.locale = lang;
    writeRc(rc);
    console.log(chalk.green(t("locale.set_done", { locale: lang })));
  });

const SUPPORTED_LOCALES: Record<string, string> = {
  zh: "中文",
  en: "English",
};

localeCmd
  .command("list")
  .alias("ls")
  .description(t("locale.list_description"))
  .action(() => {
    const rc = readRc();
    const current = rc?.locale || "zh";
    console.log(chalk.bold(`\n${t("locale.list_header")}\n`));
    for (const [code, label] of Object.entries(SUPPORTED_LOCALES)) {
      const isCurrent = code === current;
      const marker = isCurrent ? chalk.green("● ") : "  ";
      const name = isCurrent ? chalk.green.bold(`${code} - ${label}`) : `${code} - ${label}`;
      const tag = isCurrent ? ` ${chalk.gray(t("locale.list_current_marker"))}` : "";
      console.log(`${marker}${name}${tag}`);
    }
    console.log();
  });

// Default: ccm locale (no subcommand) → show list
localeCmd.action(() => {
  localeCmd.commands.find((c) => c.name() === "list")!.parseAsync([]);
});

program.parse();
