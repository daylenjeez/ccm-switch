const zh = {
  // program
  "program.description": "Claude Code Model Switcher - 快速切换 Claude Code 自定义模型配置",

  // common
  "common.not_init": "尚未初始化，请先运行: ccm init",
  "common.model": "模型",
  "common.source": "来源",

  // error
  "error.not_found": '配置 "{name}" 不存在',
  "error.alias_target_missing": '别名 "{alias}" 指向 "{target}"，但该配置不存在',
  "error.invalid_choice": "无效选择",

  // suggest
  "suggest.did_you_mean": "你是不是想说: {name}?",
  "suggest.did_you_mean_header": "你是不是想说:",
  "suggest.use_list": "使用 ccm list 查看所有可用配置",

  // init
  "init.description": "初始化 ccm",
  "init.already": "已初始化为 {mode} 模式，是否重新配置？(y/N) ",
  "init.cc_switch_found": "检测到 cc-switch 已安装，是否从中导入配置？(Y/n) ",
  "init.imported": "✓ 已导入 {count} 个配置",
  "init.current": "当前激活: {name}",
  "init.no_current": "当前无激活配置",
  "init.done_cc_switch": "✓ 已初始化为 cc-switch 模式",
  "init.done_standalone": "✓ 已初始化为独立模式",

  // config
  "config.description": "查看或切换数据源模式",
  "config.current_mode": "当前模式: {mode}",
  "config.switch_confirm": "是否切换模式？(y/N) ",
  "config.cc_switch_not_installed": "cc-switch 未安装",
  "config.switched": "✓ 已切换为 {mode} 模式",

  // list
  "list.description": "列出所有可用的配置方案",
  "list.empty": "暂无配置方案。使用 ccm save <name> 保存当前配置",
  "list.header": "可用配置:",

  // current
  "current.description": "显示当前生效的配置",
  "current.none": "当前无激活配置",
  "current.settings_header": "当前 settings.json:",
  "current.not_exist": '当前配置 "{name}" 已不存在',
  "current.header": "当前配置: {name}",

  // use
  "use.description": "切换到指定配置方案",
  "use.done": "✓ 已切换到 {name}",
  "use.restart": "重启 Claude Code 生效",

  // save
  "save.description": "从当前 settings.json 保存为新配置",
  "save.overwrite": '配置 "{name}" 已存在，将覆盖',
  "save.done": '✓ 已保存当前配置为 "{name}"',

  // show
  "show.description": "查看配置详情（不指定则显示当前）",
  "show.no_current": "当前无激活配置，请指定名称: ccm show <name>",

  // remove
  "remove.description": "删除配置方案",
  "remove.confirm": '确认删除 "{name}"？(y/N) ',
  "remove.done": '✓ 已删除 "{name}"',

  // alias
  "alias.description": "管理别名",
  "alias.set_description": "设置别名，如: ccm alias set or openrouter-opus4.6",
  "alias.set_done": "✓ 别名已设置: {short} → {name}",
  "alias.rm_description": "删除别名",
  "alias.rm_not_found": '别名 "{short}" 不存在',
  "alias.rm_done": '✓ 已删除别名 "{short}"',
  "alias.list_description": "列出所有别名",
  "alias.list_empty": "暂无别名。使用 ccm alias set <short> <name> 添加",
  "alias.list_header": "别名列表:",

  // locale
  "locale.description": "管理界面语言",
  "locale.current": "当前语言: {locale}",
  "locale.set_description": "设置语言 (zh/en)",
  "locale.set_done": "✓ 语言已设置为 {locale}",
  "locale.set_invalid": "不支持的语言: {locale}，可选: zh, en",
  "locale.list_description": "列出所有支持的语言",
  "locale.list_header": "支持的语言:",
  "locale.list_current_marker": "(当前)",

  // add
  "add.description": "交互式添加新配置",
  "add.prompt_name": "供应商名称 (如 OpenRouter): ",
  "add.prompt_base_url": "ANTHROPIC_BASE_URL: ",
  "add.prompt_auth_token": "ANTHROPIC_AUTH_TOKEN: ",
  "add.prompt_model": "ANTHROPIC_MODEL: ",
  "add.prompt_default_opus": "ANTHROPIC_DEFAULT_OPUS_MODEL (回车跳过): ",
  "add.prompt_default_sonnet": "ANTHROPIC_DEFAULT_SONNET_MODEL (回车跳过): ",
  "add.prompt_default_haiku": "ANTHROPIC_DEFAULT_HAIKU_MODEL (回车跳过): ",
  "add.mode_select": "选择添加方式:",
  "add.mode_interactive": "逐步填写",
  "add.mode_json": "直接编写 JSON",
  "add.mode_choose": "请选择 (1/2): ",
  "add.json_template_hint": "请在编辑器中填写配置，保存并退出",
  "add.json_parse_error": "JSON 解析失败，请检查格式",
  "add.back_hint": "输入 < 返回上一步",
  "add.name_required": "供应商名称不能为空",
  "add.field_required": "{field} 不能为空",
  "add.already_exists": '配置 "{name}" 已存在，是否覆盖？(y/N) ',
  "add.edit_confirm": "是否在编辑器中编辑配置？(y/N) ",
  "add.preview_header": "配置预览:",
  "add.done": '✓ 已保存配置 "{name}"',
  "add.switch_confirm": "是否立即切换到此配置？(Y/n) ",
  "add.cancelled": "已取消",

  // store errors
  "store.db_not_found": "cc-switch 数据库不存在: {path}",
} as const;

export type TranslationKey = keyof typeof zh;
export default zh;
