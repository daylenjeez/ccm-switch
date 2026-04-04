<div align="center">

# ccm

**Claude Code Model Switcher**

在终端几秒内完成 Claude Code 自定义模型配置的管理和切换。

[![npm version](https://img.shields.io/npm/v/ccm-cli.svg?style=flat-square)](https://www.npmjs.com/package/ccm-cli)
[![license](https://img.shields.io/npm/l/ccm-cli.svg?style=flat-square)](https://github.com/daylenjeez/ccm/blob/main/LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)

English | [中文文档](./README.zh-CN.md)

</div>

---

## ✨ 亮点

| | 特性 | 说明 |
|---|---|---|
| 🔌 | **cc-switch 无缝对接** | 直接读取 [cc-switch](https://github.com/nicepkg/cc-switch) 数据库，无需迁移 |
| 🧙 | **交互式向导** | `ccm add` 逐步引导，输入 `<` 可返回上一步 |
| ⚡ | **一键切换** | `ccm use OpenRouter` 或 `ccm ls` 方向键选择 |
| 🛡️ | **安全切换** | 自动保留 `language`、`permissions` 等个人设置 |
| 🚀 | **零配置上手** | 直接 `ccm init`，跟着提示走，无需阅读文档 |
| 🌍 | **中英双语** | `ccm locale set zh/en` 切换界面语言 |

## 📦 安装

```bash
npm install -g ccm-cli
```

或从源码构建：

```bash
git clone git@github.com:daylenjeez/ccm.git
cd ccm && npm install && npm run build && npm link
```

## 🚀 快速开始

```bash
ccm init   # 自动检测 cc-switch 或初始化独立模式
ccm ls     # 选择并切换
```

## 🔌 cc-switch 集成

已经在用 [cc-switch](https://github.com/nicepkg/cc-switch)？ccm 直接读取它的 SQLite 数据库：

```bash
$ ccm init
检测到 cc-switch 已安装，是否从中导入配置？(Y/n)
✓ 已初始化为 cc-switch 模式
✓ 已导入 4 个配置
当前激活: OpenRouter
```

双向同步 — 在 ccm 中添加的配置在 cc-switch UI 中也能看到，反之亦然。

## ➕ 添加配置

两种方式添加供应商配置：

### 1. 交互式向导（推荐）

运行 `ccm add`，按提示操作：

```
$ ccm add
```

**第一步** — 输入供应商名称，选择输入方式：

```
供应商名称 (如 OpenRouter): OpenRouter

选择添加方式:
  1) 逐步填写
  2) 直接编写 JSON
请选择 (1/2): 1
```

**第二步** — 逐步填写配置字段（输入 `<` 返回上一步）：

| 字段 | 必填 | 示例 |
|---|---|---|
| `ANTHROPIC_BASE_URL` | ✅ | `https://openrouter.ai/api/v1` |
| `ANTHROPIC_AUTH_TOKEN` | ✅ | `sk-or-xxx` |
| `ANTHROPIC_MODEL` | ✅ | `anthropic/claude-opus-4.6` |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | | `Claude Opus 4.6` |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | | `Claude Sonnet 4.6` |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | | `Claude Haiku 4.5` |

**第三步** — 预览配置，可选在 `$EDITOR` 中编辑，保存并切换：

```
✓ 已保存配置 "OpenRouter"
是否立即切换到此配置？(Y/n)
```

### 2. 直接编辑 JSON

独立模式下，编辑 `~/.ccm/config.json`：

```json
{
  "profiles": {
    "OpenRouter": {
      "env": {
        "ANTHROPIC_BASE_URL": "https://openrouter.ai/api/v1",
        "ANTHROPIC_AUTH_TOKEN": "sk-or-...",
        "ANTHROPIC_MODEL": "anthropic/claude-opus-4.6",
        "ANTHROPIC_DEFAULT_OPUS_MODEL": "Claude Opus 4.6",
        "ANTHROPIC_DEFAULT_SONNET_MODEL": "Claude Sonnet 4.6",
        "ANTHROPIC_DEFAULT_HAIKU_MODEL": "Claude Haiku 4.5"
      }
    }
  }
}
```

别名存储在 `~/.ccm/rc.json` 中：

```json
{
  "aliases": {
    "or": "OpenRouter"
  }
}
```

## 📖 命令一览

### 核心命令

| 命令 | 缩写 | 说明 |
|---|---|---|
| `ccm init` | | 初始化，自动检测 cc-switch |
| `ccm list` | `ls` | 交互式列表 & 切换 |
| `ccm use <name>` | | 按名称切换 |
| `ccm add` | `new` | 交互式添加向导 |
| `ccm save <name>` | | 将当前设置保存为方案 |
| `ccm show [name]` | | 查看配置详情 |
| `ccm remove [name]` | `rm` | 交互式或指定名称删除 |
| `ccm current` | | 显示当前激活配置 |
| `ccm config` | | 切换存储模式 |

### 别名管理

| 命令 | 说明 |
|---|---|
| `ccm alias set <short> <name>` | 创建别名，如 `ccm alias set or OpenRouter` |
| `ccm alias rm <short>` | 删除别名 |
| `ccm alias list` / `ls` | 列出所有别名 |

### 别名管理

为常用配置创建快捷方式：

```bash
ccm alias set or OpenRouter
ccm use or  # 等同于: ccm use OpenRouter
```

### 语言设置

| 命令 | 说明 |
|---|---|
| `ccm locale` / `ls` | 列出并切换语言 |
| `ccm locale set <lang>` | 设置语言（`zh` / `en`） |

## ⚙️ 工作原理

Claude Code 启动时读取 `~/.claude/settings.json`，`env` 字段控制 API 供应商和模型：

| 变量 | 说明 |
|---|---|
| `ANTHROPIC_BASE_URL` | API 端点地址 |
| `ANTHROPIC_AUTH_TOKEN` | ��证令牌 |
| `ANTHROPIC_MODEL` | 默认模型 |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | 在 Claude Code 中通过 `/model` 选择 Opus 时使用的模型 |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | 选择 Sonnet 时使用的模型 |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | 选择 Haiku 时使用的模型 |

`ccm use` 将选中配置写入 `settings.json`，同时保留 `language`、`permissions` 等个人设置。重启 Claude Code 后生效。

## 📄 License

[MIT](./LICENSE)
