import { homedir } from "os";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import type { DataStore, Profile } from "./interface.js";
import { t } from "../i18n/index.js";

const CC_CAST_DIR = join(homedir(), ".cc-cast");
const CONFIG_PATH = join(CC_CAST_DIR, "config.json");

interface StandaloneConfig {
  current?: string;
  profiles: Record<string, Record<string, unknown>>;
}

function ensureDir(): void {
  if (!existsSync(CC_CAST_DIR)) {
    mkdirSync(CC_CAST_DIR, { recursive: true });
  }
}

function readConfig(): StandaloneConfig {
  if (!existsSync(CONFIG_PATH)) {
    return { profiles: {} };
  }
  return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
}

function writeConfig(config: StandaloneConfig): void {
  ensureDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export class StandaloneStore implements DataStore {
  list(): Profile[] {
    const config = readConfig();
    return Object.entries(config.profiles).map(([name, settingsConfig]) => ({
      id: name,
      name,
      settingsConfig,
    }));
  }

  get(name: string): Profile | undefined {
    const config = readConfig();
    const settingsConfig = config.profiles[name];
    if (!settingsConfig) return undefined;
    return { id: name, name, settingsConfig };
  }

  save(name: string, settingsConfig: Record<string, unknown>): void {
    const config = readConfig();
    config.profiles[name] = settingsConfig;
    writeConfig(config);
  }

  remove(name: string): boolean {
    const config = readConfig();
    if (!(name in config.profiles)) return false;
    delete config.profiles[name];
    if (config.current === name) {
      config.current = undefined;
    }
    writeConfig(config);
    return true;
  }

  getCurrent(): string | undefined {
    return readConfig().current;
  }

  setCurrent(name: string): void {
    const config = readConfig();
    if (!(name in config.profiles)) {
      throw new Error(t("error.not_found", { name }));
    }
    config.current = name;
    writeConfig(config);
  }

}
