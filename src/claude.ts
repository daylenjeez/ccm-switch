import { homedir } from "os";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";

const SETTINGS_PATH = join(homedir(), ".claude", "settings.json");

export function readClaudeSettings(): Record<string, unknown> {
  if (!existsSync(SETTINGS_PATH)) return {};
  return JSON.parse(readFileSync(SETTINGS_PATH, "utf-8"));
}

export function applyProfile(_name: string, settingsConfig: Record<string, unknown>): void {
  const current = readClaudeSettings();

  // 保留用户级字段，用 profile 的配置覆盖
  const preserved: Record<string, unknown> = {};
  const USER_FIELDS = ["language", "permissions"];
  for (const key of USER_FIELDS) {
    if (key in current) {
      preserved[key] = current[key];
    }
  }

  // Merge instead of replace: keep any top-level keys from the existing file
  // that the profile does not explicitly set (e.g. common snippets from cc-switch)
  const merged = { ...current, ...preserved, ...settingsConfig };
  writeFileSync(SETTINGS_PATH, JSON.stringify(merged, null, 2));
}

export function getSettingsPath(): string {
  return SETTINGS_PATH;
}
