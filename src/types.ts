export interface Profile {
  id: string;
  name: string;
  settingsConfig: Record<string, unknown>;
}

export interface DataStore {
  list(): Profile[];
  get(name: string): Profile | undefined;
  save(name: string, settingsConfig: Record<string, unknown>): void;
  remove(name: string): boolean;
  getCurrent(): string | undefined;
  setCurrent(name: string): void;
}

export interface RcConfig {
  mode: "cc-switch" | "standalone";
  aliases?: Record<string, string>;
}
