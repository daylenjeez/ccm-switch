import type { TranslationKey } from "./zh.js";

const en: Record<TranslationKey, string> = {
  // program
  "program.description": "Claude Code Model Switcher - Quickly switch Claude Code custom model configurations",

  // common
  "common.not_init": "Not initialized yet. Run: ccm init",
  "common.model": "Model",
  "common.model_default": "default",
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
  "init.cc_switch_found":"cc-switch detected. Import configurations from it? (Y/n) ",
  "init.done": "✓ Initialized",

  // config
  "config.description": "View data source mode (deprecated)",

  // list
  "list.description": "List and select configurations",
  "list.empty": "No configurations yet. Use ccm save <name> to save current config",
  "list.header": "Available configurations:",
  "list.select": "Select configuration:",
  "list.current_marker": "(current)",
  "list.choose_number": "Enter number to switch (Enter to skip): ",

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
  "remove.select": "Select configuration to delete:",
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
  "locale.list_description": "List and select language",
  "locale.list_header": "Supported languages:",
  "locale.list_current_marker": "(current)",
  "locale.select": "Select language:",
  "locale.choose_number": "Enter number to switch (Enter to skip): ",

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

  // modify
  "modify.description": "Modify an existing configuration",
  "modify.select": "Select configuration to modify:",
  "modify.done": '✓ Updated configuration "{name}"',
  "modify.no_change": "No changes made",

  // alias conflict
  "alias.is_alias": '"{name}" is an alias for "{target}"',
  "alias.conflict": '"{name}" is both an alias (→ {target}) and a config name. Which one?',
  "alias.conflict_alias": "Alias (→ {target})",
  "alias.conflict_config": "Config {name}",
  "alias.choose_conflict": "Choose (1/2): ",
  "alias.rm_which": "Which one to delete?",
  "alias.rm_alias": "Alias {name}",
  "alias.rm_config": "Config {target}",
  "alias.rm_choose": "Choose (1/2): ",

  // sync
  "sync.description": "Sync configurations from cc-switch",
  "sync.no_cc_switch": "cc-switch database not detected",
  "sync.empty": "No Claude configurations found in cc-switch",
  "sync.done": "✓ Synced {count} configurations",
  "sync.current": "Active: {name}",
  "sync.no_current": "No active configuration",
  "sync.prompt_alias": "Set alias for current config (Enter to skip): ",

  // uninstall
  "uninstall.description": "Uninstall ccm and clean up data files",
  "uninstall.confirm": "Delete all ccm data files? (y/N) ",
  "uninstall.cancelled": "Uninstall cancelled",
  "uninstall.removed": "✓ Deleted {path}",
  "uninstall.clear_env": "Also clear env config in ~/.claude/settings.json? (y/N) ",
  "uninstall.env_cleared": "✓ Cleared env config",
  "uninstall.done": "✓ Uninstall complete",
  "uninstall.npm_remove": "Tip: to remove the CLI, run npm uninstall -g @daylenjeez/ccm-switch",

  // store errors
  "store.db_not_found": "cc-switch database not found: {path}",
};

export default en;
