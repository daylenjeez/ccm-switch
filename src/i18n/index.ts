import zh, { type TranslationKey } from "./zh.js";
import en from "./en.js";
import { readRc } from "../utils.js";

export type Locale = "zh" | "en";

const locales: Record<Locale, Record<string, string>> = { zh, en };

function detectLocale(): Locale {
  // 1. rc.json locale setting takes priority
  const rc = readRc();
  if (rc?.locale && rc.locale in locales) return rc.locale;

  // 2. Fallback to system LANG/LC_ALL
  const lang = process.env.LC_ALL || process.env.LANG || "";
  if (lang.startsWith("en")) return "en";

  // 3. Default to Chinese
  return "zh";
}

let currentLocale: Locale | undefined;

function getLocale(): Locale {
  if (!currentLocale) currentLocale = detectLocale();
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function t(key: TranslationKey, vars?: Record<string, string>): string {
  const locale = getLocale();
  let text = locales[locale][key] ?? locales.zh[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
  }
  return text;
}

export { getLocale, type TranslationKey };
