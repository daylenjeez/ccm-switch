import { homedir } from "os";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import type { RcConfig } from "./types.js";
import type { DataStore } from "./store/interface.js";
import { CcSwitchStore } from "./store/cc-switch.js";
import { StandaloneStore } from "./store/standalone.js";

const CCM_DIR = join(homedir(), ".ccm");
const RC_PATH = join(CCM_DIR, "rc.json");

export function readRc(): RcConfig | undefined {
  if (!existsSync(RC_PATH)) return undefined;
  try {
    return JSON.parse(readFileSync(RC_PATH, "utf-8"));
  } catch {
    return undefined;
  }
}

export function writeRc(rc: RcConfig): void {
  if (!existsSync(CCM_DIR)) {
    mkdirSync(CCM_DIR, { recursive: true });
  }
  writeFileSync(RC_PATH, JSON.stringify(rc, null, 2));
}

export function getStore(): DataStore | null {
  const rc = readRc();
  if (!rc) return null;

  if (rc.mode === "cc-switch") {
    return new CcSwitchStore();
  } else {
    return new StandaloneStore();
  }
}
