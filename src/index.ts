#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { readRc, writeRc, getStore } from "./utils.js";
import { ccSwitchExists } from "./store/cc-switch.js";
import { readClaudeSettings, applyProfile, clearEnvFromSettings, getSettingsPath } from "./claude.js";
import { createInterface } from "readline";
import { spawnSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir, homedir } from "os";
import { join } from "path";
import { t, setLocale } from "./i18n/index.js";
import * as clack from "@clack/prompts";

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

// Helper: get alias target if exists
function getAliasTarget(input: string): string | undefined {
  const rc = readRc();
  return rc?.aliases?.[input];
}

// Helper: resolve name with alias conflict handling, returns profile or null
async function resolveProfile(store: ReturnType<typeof ensureStore>, input: string) {
  const aliasTarget = getAliasTarget(input);
  const directProfile = store.get(input);

  // Both alias and config name exist → ask
  if (aliasTarget && directProfile && aliasTarget !== input) {
    console.log(chalk.yellow(t("alias.conflict", { name: input, target: aliasTarget })));
    console.log(`  ${chalk.cyan("1)")} ${t("alias.conflict_alias", { target: aliasTarget })}`);
    console.log(`  ${chalk.cyan("2)")} ${t("alias.conflict_config", { name: input })}`);
    const choice = await ask(t("alias.choose_conflict"));
    if (choice === "1") {
      const profile = store.get(aliasTarget);
      if (!profile) {
        console.log(chalk.red(t("error.alias_target_missing", { alias: input, target: aliasTarget })));
        return null;
      }
      return profile;
    }
    return directProfile;
  }

  // Alias exists → resolve
  if (aliasTarget) {
    const profile = store.get(aliasTarget);
    if (profile) return profile;
    console.log(chalk.red(t("error.alias_target_missing", { alias: input, target: aliasTarget })));
    return null;
  }

  // Direct match
  if (directProfile) return directProfile;

  // Fuzzy matching
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
    const rc = readRc();
    writeRc({ aliases: rc?.aliases, locale: rc?.locale });
    console.log(chalk.green(t("init.done")));

    if (ccSwitchExists()) {
      const use = await ask(t("init.cc_switch_found"));
      if (use.toLowerCase() !== "n") {
        const { CcSwitchStore } = await import("./store/cc-switch.js");
        const { StandaloneStore } = await import("./store/standalone.js");
        const ccStore = new CcSwitchStore();
        const standaloneStore = new StandaloneStore();
        const profiles = ccStore.list();
        const current = ccStore.getCurrent();

        for (const profile of profiles) {
          standaloneStore.save(profile.name, profile.settingsConfig);
        }
        if (current) {
          standaloneStore.setCurrent(current);
        }

        console.log(chalk.green(t("sync.done", { count: String(profiles.length) })));
        if (current) {
          console.log(chalk.gray(t("sync.current", { name: current })));
        } else {
          console.log(chalk.gray(t("sync.no_current")));
        }
        ccStore.close();
      }
    }
  });

// ccm config (deprecated, kept for compatibility)
program
  .command("config")
  .description(t("config.description"))
  .action(async () => {
    const rc = readRc();
    if (!rc) {
      console.log(chalk.yellow(t("common.not_init")));
      return;
    }
    console.log(chalk.gray("ccm now only uses standalone mode. No configuration needed."));
  });

// ccm sync
program
  .command("sync")
  .description(t("sync.description"))
  .action(async () => {
    if (!ccSwitchExists()) {
      console.log(chalk.red(t("sync.no_cc_switch")));
      return;
    }
    const { CcSwitchStore } = await import("./store/cc-switch.js");
    const { StandaloneStore } = await import("./store/standalone.js");
    const ccStore = new CcSwitchStore();
    const standaloneStore = new StandaloneStore();

    const profiles = ccStore.list();
    if (profiles.length === 0) {
      console.log(chalk.yellow(t("sync.empty")));
      ccStore.close();
      return;
    }

    for (const profile of profiles) {
      standaloneStore.save(profile.name, profile.settingsConfig);
    }

    const current = ccStore.getCurrent();
    if (current) {
      standaloneStore.setCurrent(current);
    }

    console.log(chalk.green(t("sync.done", { count: String(profiles.length) })));
    if (current) {
      console.log(chalk.gray(t("sync.current", { name: current })));
      const alias = await ask(t("sync.prompt_alias"));
      if (alias) {
        const rc2 = readRc();
        writeRc({
          aliases: { ...(rc2?.aliases || {}), [alias]: current },
          locale: rc2?.locale,
        });
      }
    } else {
      console.log(chalk.gray(t("sync.no_current")));
    }

    ccStore.close();
  });

// ccm uninstall
program
  .command("uninstall")
  .description(t("uninstall.description"))
  .action(async () => {
    const confirm = await ask(t("uninstall.confirm"));
    if (confirm.toLowerCase() !== "y") {
      console.log(chalk.gray(t("uninstall.cancelled")));
      return;
    }

    const rcPath = join(homedir(), ".ccm", "rc.json");
    const configPath = join(homedir(), ".ccm", "config.json");

    if (existsSync(configPath)) {
      unlinkSync(configPath);
      console.log(chalk.green(t("uninstall.removed", { path: configPath })));
    }
    if (existsSync(rcPath)) {
      unlinkSync(rcPath);
      console.log(chalk.green(t("uninstall.removed", { path: rcPath })));
    }

    const settingsPath = getSettingsPath();
    if (existsSync(settingsPath)) {
      const settings = readClaudeSettings();
      if ("env" in settings) {
        const clearEnv = await ask(t("uninstall.clear_env"));
        if (clearEnv.toLowerCase() === "y") {
          clearEnvFromSettings();
          console.log(chalk.green(t("uninstall.env_cleared")));
        }
      }
    }

    console.log(chalk.green(t("uninstall.done")));
    console.log(chalk.gray(t("uninstall.npm_remove")));
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

    // Helper: apply selected profile
    const switchTo = (name: string) => {
      if (name === current) return;
      const profile = store.get(name)!;
      applyProfile(profile.settingsConfig);
      store.setCurrent(profile.name);
      const env = (profile.settingsConfig.env || {}) as Record<string, string>;
      const model = env["ANTHROPIC_MODEL"] || t("common.model_default");
      console.log(chalk.green(t("use.done", { name: chalk.bold(profile.name) })));
      console.log(`  ${t("common.model")}: ${chalk.cyan(model)}`);
      console.log(chalk.gray(`  ${t("use.restart")}`));
    };

    const isInteractive = process.stdin.isTTY && process.stdout.isTTY;

    if (isInteractive) {
      const options = profiles.map((p) => {
        const isCurrent = p.name === current;
        const env = (p.settingsConfig.env || {}) as Record<string, string>;
        const model = env["ANTHROPIC_MODEL"] || t("common.model_default");
        const baseUrl = env["ANTHROPIC_BASE_URL"] || "default";
        const tag = isCurrent ? ` ${t("list.current_marker")}` : "";
        return {
          label: `${p.name}${tag}`,
          hint: `${t("common.model")}: ${model}  ${t("common.source")}: ${baseUrl}`,
          value: p.name,
        };
      });

      const initial = profiles.findIndex((p) => p.name === current);
      const selected = await clack.select({
        message: "",
        options,
        initialValue: initial >= 0 ? profiles[initial].name : profiles[0].name,
      });

      if (clack.isCancel(selected)) {
        process.exit(0);
      }
      switchTo(selected as string);
    } else {
      // Fallback: numbered list + type to select
      console.log(chalk.bold(`\n${t("list.header")}\n`));
      profiles.forEach((p, i) => {
        const isCurrent = p.name === current;
        const marker = isCurrent ? chalk.green("● ") : "  ";
        const name = isCurrent ? chalk.green.bold(p.name) : p.name;
        const env = (p.settingsConfig.env || {}) as Record<string, string>;
        const model = env["ANTHROPIC_MODEL"] || t("common.model_default");
        const baseUrl = env["ANTHROPIC_BASE_URL"] || "default";
        console.log(`${marker}${chalk.gray(`${i + 1}.`)} ${name}`);
        console.log(`     ${t("common.model")}: ${chalk.cyan(model)}  ${t("common.source")}: ${chalk.gray(baseUrl)}`);
      });
      console.log();
      const input = await ask(t("list.choose_number"));
      if (!input) return;
      const idx = parseInt(input, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= profiles.length) {
        console.log(chalk.red(t("error.invalid_choice")));
        return;
      }
      switchTo(profiles[idx].name);
    }
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
  .action(async (name: string) => {
    const store = ensureStore();
    const profile = await resolveProfile(store, name);
    if (!profile) return;

    applyProfile(profile.settingsConfig);
    store.setCurrent(profile.name);

    const env = (profile.settingsConfig.env || {}) as Record<string, string>;
    const model = env["ANTHROPIC_MODEL"] || t("common.model_default");
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
  .action(async (name?: string) => {
    const store = ensureStore();

    if (!name) {
      const currentName = store.getCurrent();
      if (!currentName) {
        console.log(chalk.yellow(t("show.no_current")));
        return;
      }
      name = currentName;
    }

    const profile = await resolveProfile(store, name);
    if (!profile) return;

    console.log(`\n${chalk.bold(profile.name)}\n`);
    const env = (profile.settingsConfig.env || {}) as Record<string, string>;
    console.log(formatEnv(env));
    if (profile.settingsConfig.model) {
      console.log(`  ${chalk.gray("model")}: ${profile.settingsConfig.model}`);
    }
    console.log();
  });

// ccm modify [name]
program
  .command("modify [name]")
  .alias("edit")
  .description(t("modify.description"))
  .action(async (name?: string) => {
    const store = ensureStore();
    const profiles = store.list();
    const current = store.getCurrent();

    // 1. Select profile
    if (!name) {
      if (profiles.length === 0) {
        console.log(chalk.yellow(t("list.empty")));
        return;
      }

      const isInteractive = process.stdin.isTTY && process.stdout.isTTY;

      if (isInteractive) {
        const options = profiles.map((p) => {
          const isCurrent = p.name === current;
          const env = (p.settingsConfig.env || {}) as Record<string, string>;
          const model = env["ANTHROPIC_MODEL"] || t("common.model_default");
          const tag = isCurrent ? ` ${t("list.current_marker")}` : "";
          return {
            label: `${p.name}${tag}`,
            hint: `${t("common.model")}: ${model}`,
            value: p.name,
          };
        });

        const selected = await clack.select({
          message: "",
          options,
        });

        if (clack.isCancel(selected)) {
          process.exit(0);
        }
        name = selected as string;
      } else {
        console.log(chalk.bold(`\n${t("list.header")}\n`));
        profiles.forEach((p, i) => {
          const isCurrent = p.name === current;
          const marker = isCurrent ? chalk.green("● ") : "  ";
          const label = isCurrent ? chalk.green.bold(p.name) : p.name;
          const env = (p.settingsConfig.env || {}) as Record<string, string>;
          const model = env["ANTHROPIC_MODEL"] || t("common.model_default");
          console.log(`${marker}${chalk.gray(`${i + 1}.`)} ${label}`);
          console.log(`     ${t("common.model")}: ${chalk.cyan(model)}`);
        });
        console.log();
        const input = await ask(t("list.choose_number"));
        if (!input) return;
        const idx = parseInt(input, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= profiles.length) {
          console.log(chalk.red(t("error.invalid_choice")));
          return;
        }
        name = profiles[idx].name;
      }
    }

    const profile = await resolveProfile(store, name);
    if (!profile) return;

    const currentEnv = (profile.settingsConfig.env || {}) as Record<string, string>;

    // 2. Choose mode
    console.log(`\n${chalk.bold(t("add.mode_select"))}\n`);
    console.log(`  ${chalk.cyan("1)")} ${t("add.mode_interactive")}`);
    console.log(`  ${chalk.cyan("2)")} ${t("add.mode_json")}\n`);
    const mode = await ask(t("add.mode_choose"));

    let settingsConfig: Record<string, unknown>;

    if (mode === "2") {
      // JSON mode
      const edited = openEditor(profile.name, profile.settingsConfig);
      if (!edited) return;
      settingsConfig = edited;
    } else {
      // Step-by-step mode with current values as defaults
      interface Step { key: string; prompt: string; required: boolean; }
      const steps: Step[] = [
        { key: "ANTHROPIC_BASE_URL", prompt: "ANTHROPIC_BASE_URL", required: true },
        { key: "ANTHROPIC_AUTH_TOKEN", prompt: "ANTHROPIC_AUTH_TOKEN", required: true },
        { key: "ANTHROPIC_MODEL", prompt: "ANTHROPIC_MODEL", required: true },
        { key: "ANTHROPIC_DEFAULT_OPUS_MODEL", prompt: "ANTHROPIC_DEFAULT_OPUS_MODEL", required: false },
        { key: "ANTHROPIC_DEFAULT_SONNET_MODEL", prompt: "ANTHROPIC_DEFAULT_SONNET_MODEL", required: false },
        { key: "ANTHROPIC_DEFAULT_HAIKU_MODEL", prompt: "ANTHROPIC_DEFAULT_HAIKU_MODEL", required: false },
      ];

      console.log(chalk.gray(t("add.back_hint")));
      const values: Record<string, string> = { ...currentEnv };
      let i = 0;
      while (i < steps.length) {
        const step = steps[i];
        const cur = currentEnv[step.key] || "";
        const hint = cur ? chalk.gray(` [${cur}]`) : "";
        const input = await ask(`${step.prompt}${hint}: `);

        if (input === "<") {
          if (i > 0) i--;
          continue;
        }

        if (input) {
          values[step.key] = input;
        } else if (step.required && !cur) {
          console.log(chalk.red(t("add.field_required", { field: step.key })));
          continue;
        }
        // empty input + has current value → keep current (already in values)
        i++;
      }

      const env: Record<string, string> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v) env[k] = v;
      }
      settingsConfig = { ...profile.settingsConfig, env };
    }

    // 3. Preview
    console.log(`\n${chalk.bold(t("add.preview_header"))}\n`);
    console.log(JSON.stringify(settingsConfig, null, 2));
    console.log();

    // 4. Optional editor (only for step mode)
    if (mode !== "2") {
      const editChoice = await ask(t("add.edit_confirm"));
      if (editChoice.toLowerCase() === "y") {
        const edited = openEditor(profile.name, settingsConfig);
        if (edited) settingsConfig = edited;
      }
    }

    // 5. Save
    store.save(profile.name, settingsConfig);
    console.log(chalk.green(t("modify.done", { name: profile.name })));

    // 6. Switch if not current
    if (profile.name !== current) {
      const switchChoice = await ask(t("add.switch_confirm"));
      if (switchChoice.toLowerCase() !== "n") {
        applyProfile(settingsConfig);
        store.setCurrent(profile.name);
        console.log(chalk.green(t("use.done", { name: chalk.bold(profile.name) })));
        console.log(chalk.gray(`  ${t("use.restart")}`));
      }
    } else {
      applyProfile(settingsConfig);
      console.log(chalk.gray(`  ${t("use.restart")}`));
    }
  });

// ccm remove [name]
program
  .command("remove [name]")
  .alias("rm")
  .description(t("remove.description"))
  .action(async (name?: string) => {
    const store = ensureStore();
    const profiles = store.list();
    const current = store.getCurrent();

    if (!name) {
      if (profiles.length === 0) {
        console.log(chalk.yellow(t("list.empty")));
        return;
      }

      const isInteractive = process.stdin.isTTY && process.stdout.isTTY;

      if (isInteractive) {
        const options = profiles.map((p) => {
          const isCurrent = p.name === current;
          const env = (p.settingsConfig.env || {}) as Record<string, string>;
          const model = env["ANTHROPIC_MODEL"] || t("common.model_default");
          const tag = isCurrent ? ` ${t("list.current_marker")}` : "";
          return {
            label: `${p.name}${tag}`,
            hint: `${t("common.model")}: ${model}`,
            value: p.name,
          };
        });

        const selected = await clack.select({
          message: "",
          options,
        });

        if (clack.isCancel(selected)) {
          process.exit(0);
        }
        name = selected as string;
      } else {
        console.log(chalk.bold(`\n${t("list.header")}\n`));
        profiles.forEach((p, i) => {
          const isCurrent = p.name === current;
          const marker = isCurrent ? chalk.green("● ") : "  ";
          const label = isCurrent ? chalk.green.bold(p.name) : p.name;
          const env = (p.settingsConfig.env || {}) as Record<string, string>;
          const model = env["ANTHROPIC_MODEL"] || t("common.model_default");
          console.log(`${marker}${chalk.gray(`${i + 1}.`)} ${label}`);
          console.log(`     ${t("common.model")}: ${chalk.cyan(model)}`);
        });
        console.log();
        const input = await ask(t("list.choose_number"));
        if (!input) return;
        const idx = parseInt(input, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= profiles.length) {
          console.log(chalk.red(t("error.invalid_choice")));
          return;
        }
        name = profiles[idx].name;
      }
    }

    // Check if name is an alias
    const aliasTarget = getAliasTarget(name);
    if (aliasTarget) {
      console.log(chalk.yellow(t("alias.is_alias", { name, target: aliasTarget })));
      console.log(`\n${t("alias.rm_which")}\n`);
      console.log(`  ${chalk.cyan("1)")} ${t("alias.rm_alias", { name })}`);
      console.log(`  ${chalk.cyan("2)")} ${t("alias.rm_config", { target: aliasTarget })}`);
      const choice = await ask(t("alias.rm_choose"));
      if (choice === "1") {
        const rc = readRc()!;
        delete rc.aliases![name];
        writeRc(rc);
        console.log(chalk.green(t("alias.rm_done", { short: name })));
        return;
      }
      // choice === "2" → delete the config
      name = aliasTarget;
    }

    const profile = await resolveProfile(store, name);
    if (!profile) return;

    const confirm = await ask(t("remove.confirm", { name: profile.name }));
    if (confirm.toLowerCase() !== "y") return;

    store.remove(profile.name);
    console.log(chalk.green(t("remove.done", { name: profile.name })));
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
    switchLocale(lang);
  });

const SUPPORTED_LOCALES: Array<{ code: string; label: string }> = [
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
];

const switchLocale = (code: string) => {
  const rc = readRc();
  if (!rc) { console.log(chalk.yellow(t("common.not_init"))); return; }
  rc.locale = code as "zh" | "en";
  writeRc(rc);
  setLocale(code as "zh" | "en");
  console.log(chalk.green(t("locale.set_done", { locale: code })));
};

localeCmd
  .command("list")
  .alias("ls")
  .description(t("locale.list_description"))
  .action(async () => {
    const rc = readRc();
    const current = rc?.locale || "zh";
    const isInteractive = process.stdin.isTTY && process.stdout.isTTY;

    if (isInteractive) {
      const options = SUPPORTED_LOCALES.map(({ code, label }) => {
        const isCurrent = code === current;
        const tag = isCurrent ? ` ${t("locale.list_current_marker")}` : "";
        return { label: `${code} - ${label}${tag}`, value: code };
      });

      const selected = await clack.select({
        message: "",
        options,
        initialValue: current,
      });

      if (clack.isCancel(selected)) process.exit(0);
      if (selected === current) return;
      switchLocale(selected as string);
    } else {
      console.log(chalk.bold(`\n${t("locale.list_header")}\n`));
      SUPPORTED_LOCALES.forEach(({ code, label }, i) => {
        const isCurrent = code === current;
        const marker = isCurrent ? chalk.green("● ") : "  ";
        const name = isCurrent ? chalk.green.bold(`${code} - ${label}`) : `${code} - ${label}`;
        const tag = isCurrent ? chalk.gray(` ${t("locale.list_current_marker")}`) : "";
        console.log(`${marker}${chalk.gray(`${i + 1}.`)} ${name}${tag}`);
      });
      console.log();
      const input = await ask(t("locale.choose_number"));
      if (!input) return;
      const idx = parseInt(input, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= SUPPORTED_LOCALES.length) {
        console.log(chalk.red(t("error.invalid_choice")));
        return;
      }
      const selected = SUPPORTED_LOCALES[idx].code;
      if (selected === current) return;
      switchLocale(selected);
    }
  });

// Default: ccm locale (no subcommand) → show list
localeCmd.action(() => {
  localeCmd.commands.find((c) => c.name() === "list")!.parseAsync([]);
});

program.parse();
