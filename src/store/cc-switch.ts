import Database from "better-sqlite3";
import { homedir } from "os";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import type { DataStore, Profile } from "./interface.js";

const DB_PATH = join(homedir(), ".cc-switch", "cc-switch.db");
const SETTINGS_PATH = join(homedir(), ".cc-switch", "settings.json");

export function ccSwitchExists(): boolean {
  return existsSync(DB_PATH);
}

export class CcSwitchStore implements DataStore {
  private db: Database.Database;

  constructor() {
    if (!existsSync(DB_PATH)) {
      throw new Error(`cc-switch 数据库不存在: ${DB_PATH}`);
    }
    this.db = new Database(DB_PATH);
  }

  list(): Profile[] {
    const rows = this.db
      .prepare(
        `SELECT id, name, settings_config FROM providers WHERE app_type = 'claude' ORDER BY sort_index`
      )
      .all() as Array<{ id: string; name: string; settings_config: string }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      settingsConfig: JSON.parse(row.settings_config),
    }));
  }

  get(name: string): Profile | undefined {
    const row = this.db
      .prepare(
        `SELECT id, name, settings_config FROM providers WHERE app_type = 'claude' AND name = ?`
      )
      .get(name) as
      | { id: string; name: string; settings_config: string }
      | undefined;

    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      settingsConfig: JSON.parse(row.settings_config),
    };
  }

  save(name: string, settingsConfig: Record<string, unknown>): void {
    const existing = this.get(name);
    if (existing) {
      this.db
        .prepare(
          `UPDATE providers SET settings_config = ? WHERE app_type = 'claude' AND name = ?`
        )
        .run(JSON.stringify(settingsConfig), name);
    } else {
      const id = crypto.randomUUID();
      this.db
        .prepare(
          `INSERT INTO providers (id, app_type, name, settings_config, meta, created_at) VALUES (?, 'claude', ?, ?, '{}', ?)`
        )
        .run(id, name, JSON.stringify(settingsConfig), Date.now());
    }
  }

  remove(name: string): boolean {
    const result = this.db
      .prepare(
        `DELETE FROM providers WHERE app_type = 'claude' AND name = ?`
      )
      .run(name);
    return result.changes > 0;
  }

  getCurrent(): string | undefined {
    if (!existsSync(SETTINGS_PATH)) return undefined;
    try {
      const settings = JSON.parse(readFileSync(SETTINGS_PATH, "utf-8"));
      const currentId = settings.currentProviderClaude;
      if (!currentId) return undefined;
      const row = this.db
        .prepare(
          `SELECT name FROM providers WHERE app_type = 'claude' AND id = ?`
        )
        .get(currentId) as { name: string } | undefined;
      return row?.name;
    } catch {
      return undefined;
    }
  }

  setCurrent(name: string): void {
    const profile = this.get(name);
    if (!profile) throw new Error(`配置 "${name}" 不存在`);

    if (existsSync(SETTINGS_PATH)) {
      const settings = JSON.parse(readFileSync(SETTINGS_PATH, "utf-8"));
      settings.currentProviderClaude = profile.id;
      writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    }
  }

  close(): void {
    this.db.close();
  }
}
