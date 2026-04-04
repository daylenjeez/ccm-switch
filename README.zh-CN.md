<div align="center">

# ccm

**Claude Code Model Switcher**

在终端几秒内完成 Claude Code 自定义模型配置的管理和切换。

[![npm version](https://img.shields.io/npm/v/@daylenjeez/ccm-switch.svg?style=flat-square)](https://www.npmjs.com/package/@daylenjeez/ccm-switch)
[![license](https://img.shields.io/npm/l/@daylenjeez/ccm-switch.svg?style=flat-square)](https://github.com/daylenjeez/ccm-switch/blob/main/LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)

English | [中文文档](https://github.com/daylenjeez/ccm-switch/blob/main/README.zh-CN.md)

[安装](#-安装) · [快速开始](#-快速开始) · [命令一览](#-命令一览) · [工作原理](#%EF%B8%8F-工作原理)

</div>

---

## ✨ 亮点

- 🔌 **cc-switch 无缝对接** — 直接读取 [cc-switch](https://github.com/farion1231/cc-switch) 数据库，无需迁移
- 🧙 **交互式向导** — `ccm add` 逐步引导，输入 `<` 可返回上一步
- ⚡ **一键切换** — `ccm use OpenRouter` 或 `ccm ls` 方向键选择
- 🛡️ **安全切换** — 自动保留 `language`、`permissions` 等个人设置
- 🚀 **零配置上手** — 直接 `ccm init`，跟着提示走，无需阅读文档
- 🌍 **中英双语** — `ccm locale set zh/en` 切换界面语言

## 📦 安装

```bash
npm install -g @daylenjeez/ccm-switch
```

或从源码构建：

```bash
git clone git@github.com:daylenjeez/ccm-switch.git
cd ccm && npm install && npm run build && npm link
```

## 🚀 快速开始

```bash
ccm init   # 自动检测 cc-switch 或初始化独立模式
ccm add    # 交互式向导添加供应商
```

> **没有 ccm**: 手动编辑 `~/.claude/settings.json`，复制粘贴 API key，重启，祈祷 JSON 没写错。
> **使用 ccm**: `ccm use OpenRouter` — 搞定。

## 🔌 cc-switch 集成

已经在用 [cc-switch](https://github.com/farion1231/cc-switch)？ccm 可以将它的配置同步到本地：

```bash
$ ccm init
检测到 cc-switch 已安装，是否从中导入配置？(Y/n)
✓ 初始化完成
✓ 已同步 4 个配置
当前激活: OpenRouter
```

你也可以随时运行 `ccm sync` 将最新的 cc-switch 配置同步到 `~/.ccm/config.json`。

## ➕ 添加配置

### 交互式向导（推荐）

```bash
$ ccm add
供应商名称 (如 OpenRouter): OpenRouter

选择添加方式:
  1) 逐步填写           # 按步骤输入，输入 < 返回上一步
  2) 直接编写 JSON      # 打开 $EDITOR 编辑

ANTHROPIC_BASE_URL: https://openrouter.ai/api/v1
ANTHROPIC_AUTH_TOKEN: sk-or-xxx
ANTHROPIC_MODEL: anthropic/claude-opus-4.6
ANTHROPIC_DEFAULT_OPUS_MODEL (可选):
ANTHROPIC_DEFAULT_SONNET_MODEL (可选):
ANTHROPIC_DEFAULT_HAIKU_MODEL (可选):

✓ 已保存配置 "OpenRouter"
是否立即切换到此配置？(Y/n)
```

### 直接编辑 JSON

<details>
<summary>独立模式：<code>~/.ccm/config.json</code></summary>

```json
{
  "profiles": {
    "OpenRouter": {
      "env": {
        "ANTHROPIC_BASE_URL": "https://openrouter.ai/api/v1",
        "ANTHROPIC_AUTH_TOKEN": "sk-or-...",
        "ANTHROPIC_MODEL": "anthropic/claude-opus-4.6"
      }
    }
  }
}
```
</details>

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
| `ccm modify [name]` | `edit` | 修改已有配置 |
| `ccm remove [name]` | `rm` | 交互式或指定名称删除 |
| `ccm current` | | 显示当前激活配置 |
| `ccm config` | | 查看数据源模式（已废弃） |
| `ccm sync` | | 从 cc-switch 同步配置到本地 |
| `ccm clear` | | 清理数据文件 |

### 别名管理

| 命令 | 说明 |
|---|---|
| `ccm alias set <short> <name>` | 创建别名，如 `ccm alias set or OpenRouter` |
| `ccm alias rm <short>` | 删除别名 |
| `ccm alias list` / `ls` | 列出所有别名 |

```bash
ccm alias set or OpenRouter
ccm use or  # 等同于: ccm use OpenRouter
```

### 语言设置

| 命令 | 说明 |
|---|---|
| `ccm locale` / `ls` | 列出并切换语言 |
| `ccm locale set <lang>` | 设置语言（`zh` / `en`） |

### 使用示例

```bash
# 切换供应商
$ ccm use OpenRouter
✓ 已切换到 OpenRouter
  模型: anthropic/claude-opus-4.6
  重启 Claude Code 生效

# 查看当前配置
$ ccm current
当前配置: OpenRouter
  ANTHROPIC_BASE_URL: https://openrouter.ai/api/v1
  ANTHROPIC_MODEL: anthropic/claude-opus-4.6
  ANTHROPIC_AUTH_TOKEN: sk-or-v1...a3f2

# 将当前 settings.json 保存为新方案
$ ccm save my-backup
✓ 已保存当前配置为 "my-backup"
```

## ⚙️ 工作原理

Claude Code 启动时读取 `~/.claude/settings.json`，`env` 字段控制 API 供应商和模型：

| 变量 | 说明 |
|---|---|
| `ANTHROPIC_BASE_URL` | API 端点地址 |
| `ANTHROPIC_AUTH_TOKEN` | 认证令牌 |
| `ANTHROPIC_MODEL` | 默认模型 |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | 在 Claude Code 中通过 `/model` 选择 Opus 时使用的模型 |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | 选择 Sonnet 时使用的模型 |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | 选择 Haiku 时使用的模型 |

`ccm use` 将选中配置写入 `settings.json`，同时保留 `language`、`permissions` 等个人设置。重启 Claude Code 后生效。

## 🗑️ 卸载

卸载 `ccm` 只会删除 CLI 程序本身，相关的数据文件仍然保留。如需彻底清理，请手动删除以下文件：

- `~/.ccm/rc.json` — 别名和存储模式
- `~/.ccm/config.json` — standalone 模式的配置（仅在使用 standalone 模式时存在）
- `~/.claude/settings.json` — 可能仍包含 ccm 写入的 `env` 配置

> 除非你也卸载了 cc-switch，否则**不要**删除 `~/.cc-switch/cc-switch.db`；该数据库由 cc-switch 管理。

## 📄 License

[MIT](./LICENSE)
