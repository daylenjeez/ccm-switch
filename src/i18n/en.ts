import type { TranslationKey } from "./zh.js";

const en: Record<TranslationKey, string> = {
  // program
  "program.description": "Claude Code Model Switcher - Quickly switch Claude Code custom model configurations",

  // common
  "common.not_init": "Not initialized yet. Run: ccm init",
  "common.model": "Model",
  "common.source": "Source",

  // error
  "error.not_found": 'Configuration "{name}" not found',
  "error.alias_target_missing": 'Alias "{alias}" points to "{target}", but it does not exist',
  "error.invalid_choice": "Invalid choice",

  // suggest
  "suggest.did_you_mean": "Did you mean: {name}?",
  "suggest.did_you_mean_header": "Did you mean:",
  "suggest.use_list": "Use ccm list to see all available configurations",

  // init
  "init.description": "Initialize ccm",
  "init.already": "Already initialized as {mode} mode. Reconfigure? (y/N) ",
  "init.cc_switch_found": "cc-switch detected. Import configurations from it? (Y/n) ",
  "init.imported": "✓ Imported {count} configurations",
  "init.current": "Active: {name}",
  "init.no_current": "No active configuration",
  "init.done_cc_switch": "✓ Initialized in cc-switch mode",
  "init.done_standalone": "✓ Initialized in standalone mode",

  // config
  "config.description": "View or switch data source mode",
  "config.current_mode": "Current mode: {mode}",
  "config.switch_confirm": "Switch mode? (y/N) ",
  "config.cc_switch_not_installed": "cc-switch is not installed",
  "config.switched": "✓ Switched to {mode} mode",

  // list
  "list.description": "List all available configurations",
  "list.empty": "No configurations yet. Use ccm save <name> to save current config",
  "list.header": "Available configurations:",

  // current
  "current.description": "Show the currently active configuration",
  "current.none": "No active configuration",
  "current.settings_header": "Current settings.json:",
  "current.not_exist": 'Current configuration "{name}" no longer exists',
  "current.header": "Current configuration: {name}",

  // use
  "use.description": "Switch to a specified configuration",
  "use.done": "✓ Switched to {name}",
  "use.restart": "Restart Claude Code to apply",

  // save
  "save.description": "Save current settings.json as a new configuration",
  "save.overwrite": 'Configuration "{name}" already exists, will overwrite',
  "save.done": '✓ Saved current configuration as "{name}"',

  // show
  "show.description": "View configuration details (defaults to current)",
  "show.no_current": "No active configuration. Specify a name: ccm show <name>",

  // remove
  "remove.description": "Delete a configuration",
  "remove.confirm": 'Delete "{name}"? (y/N) ',
  "remove.done": '✓ Deleted "{name}"',

  // alias
  "alias.description": "Manage aliases",
  "alias.set_description": "Set alias, e.g.: ccm alias set or openrouter-opus4.6",
  "alias.set_done": "✓ Alias set: {short} → {name}",
  "alias.rm_description": "Remove an alias",
  "alias.rm_not_found": 'Alias "{short}" not found',
  "alias.rm_done": '✓ Removed alias "{short}"',
  "alias.list_description": "List all aliases",
  "alias.list_empty": "No aliases yet. Use ccm alias set <short> <name> to add one",
  "alias.list_header": "Aliases:",

  // locale
  "locale.description": "Manage interface language",
  "locale.current": "Current language: {locale}",
  "locale.set_description": "Set language (zh/en)",
  "locale.set_done": "✓ Language set to {locale}",
  "locale.set_invalid": "Unsupported language: {locale}. Available: zh, en",
  "locale.list_description": "List all supported languages",
  "locale.list_header": "Supported languages:",
  "locale.list_current_marker": "(current)",

  // add
  "add.description": "Interactively add a new configuration",
  "add.prompt_name": "Provider name (e.g. OpenRouter): ",
  "add.prompt_base_url": "ANTHROPIC_BASE_URL: ",
  "add.prompt_auth_token": "ANTHROPIC_AUTH_TOKEN: ",
  "add.prompt_model": "ANTHROPIC_MODEL: ",
  "add.prompt_default_opus": "ANTHROPIC_DEFAULT_OPUS_MODEL (press Enter to skip): ",
  "add.prompt_default_sonnet": "ANTHROPIC_DEFAULT_SONNET_MODEL (press Enter to skip): ",
  "add.prompt_default_haiku": "ANTHROPIC_DEFAULT_HAIKU_MODEL (press Enter to skip): ",
  "add.mode_select": "Choose how to add:",
  "add.mode_interactive": "Step by step",
  "add.mode_json": "Write JSON directly",
  "add.mode_choose": "Choose (1/2): ",
  "add.json_template_hint": "Fill in the configuration in editor, save and exit",
  "add.json_parse_error": "JSON parse error, please check format",
  "add.back_hint": "Type < to go back",
  "add.name_required": "Provider name cannot be empty",
  "add.field_required": "{field} cannot be empty",
  "add.already_exists": 'Configuration "{name}" already exists. Overwrite? (y/N) ',
  "add.edit_confirm": "Edit configuration in editor? (y/N) ",
  "add.preview_header": "Configuration preview:",
  "add.done": '✓ Saved configuration "{name}"',
  "add.switch_confirm": "Switch to this configuration now? (Y/n) ",
  "add.cancelled": "Cancelled",

  // store errors
  "store.db_not_found": "cc-switch database not found: {path}",
};

export default en;
