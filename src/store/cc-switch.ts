import Database from "better-sqlite3";
import { homedir } from "os";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import type { DataStore, Profile } from "./interface.js";
import { t } from "../i18n/index.js";

const DB_PATH = join(homedir(), ".cc-switch", "cc-switch.db");
const SETTINGS_PATH = join(homedir(), ".cc-switch", "settings.json");

export function ccSwitchExists(): boolean {
  return existsSync(DB_PATH);
}

export class CcSwitchStore implements DataStore {
  private db: Database.Database;

  constructor() {
    if (!existsSync(DB_PATH)) {
      throw new Error(t("store.db_not_found", { path: DB_PATH }));
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
      const maxSort = this.db
        .prepare(
          `SELECT COALESCE(MAX(sort_index), -1) as max_sort FROM providers WHERE app_type = 'claude'`
        )
        .get() as { max_sort: number } | undefined;
      const sortIndex = (maxSort?.max_sort ?? -1) + 1;

      const id = crypto.randomUUID();
      this.db
        .prepare(
          `INSERT INTO providers (
            id, app_type, name, settings_config, website_url, category,
            created_at, sort_index, notes, icon, icon_color, meta, is_current, in_failover_queue
          ) VALUES (?, 'claude', ?, ?, NULL, NULL, ?, ?, NULL, NULL, NULL, '{}', 0, 0)`
        )
        .run(id, name, JSON.stringify(settingsConfig), Date.now(), sortIndex);
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
    // Prefer DB is_current so we stay in sync with cc-switch UI
    const dbRow = this.db
      .prepare(
        `SELECT name FROM providers WHERE app_type = 'claude' AND is_current = 1 LIMIT 1`
      )
      .get() as { name: string } | undefined;
    if (dbRow) return dbRow.name;

    // Fallback to settings.json
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
    if (!profile) throw new Error(t("error.not_found", { name }));

    const tx = this.db.transaction(() => {
      this.db
        .prepare(`UPDATE providers SET is_current = 0 WHERE app_type = 'claude'`)
        .run();
      this.db
        .prepare(
          `UPDATE providers SET is_current = 1 WHERE app_type = 'claude' AND id = ?`
        )
        .run(profile.id);
    });
    tx();

    const settings = existsSync(SETTINGS_PATH)
      ? JSON.parse(readFileSync(SETTINGS_PATH, "utf-8"))
      : {};
    settings.currentProviderClaude = profile.id;
    writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  }

  close(): void {
    this.db.close();
  }
}
