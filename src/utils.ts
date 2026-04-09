import { homedir } from "os";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { spawnSync } from "child_process";
import type { RcConfig } from "./types.js";
import type { DataStore } from "./store/interface.js";
import { StandaloneStore } from "./store/standalone.js";
import { CcSwitchStore, ccSwitchExists } from "./store/cc-switch.js";

const CC_CAST_DIR = join(homedir(), ".cc-cast");
const RC_PATH = join(CC_CAST_DIR, "rc.json");

export function readRc(): RcConfig {
  if (!existsSync(RC_PATH)) {
    writeRc({});
    return {};
  }
  try {
    return JSON.parse(readFileSync(RC_PATH, "utf-8"));
  } catch {
    writeRc({});
    return {};
  }
}

export function writeRc(rc: RcConfig): void {
  if (!existsSync(CC_CAST_DIR)) {
    mkdirSync(CC_CAST_DIR, { recursive: true });
  }
  writeFileSync(RC_PATH, JSON.stringify(rc, null, 2));
}

export function getStore(): DataStore {
  if (ccSwitchExists()) {
    return new CcSwitchStore();
  }
  return new StandaloneStore();
}

export function isCcSwitchGuiRunning(): boolean {
  try {
    const result = spawnSync("pgrep", ["-f", "cc-switch"], { encoding: "utf-8" });
    return result.status === 0 && (result.stdout?.trim().length ?? 0) > 0;
  } catch {
    return false;
  }
}
