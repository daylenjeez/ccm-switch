<div align="center">

# ccm

**Claude Code Model Switcher**

Switch Claude Code custom model configurations from the terminal in seconds.

[![npm version](https://img.shields.io/npm/v/ccm-cli.svg?style=flat-square)](https://www.npmjs.com/package/ccm-cli)
[![license](https://img.shields.io/npm/l/ccm-cli.svg?style=flat-square)](https://github.com/daylenjeez/ccm/blob/main/LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)

[中文文档](./README.zh-CN.md) | English

</div>

---

## ✨ Highlights

| | Feature | Description |
|---|---|---|
| 🔌 | **cc-switch Integration** | Reads [cc-switch](https://github.com/nicepkg/cc-switch) database directly — zero migration |
| 🧙 | **Interactive Wizard** | `ccm add` guides you step by step, with `<` to go back |
| ⚡ | **One-command Switch** | `ccm use OpenRouter` or `ccm ls` with arrow keys |
| 🔍 | **Fuzzy Matching** | Mistyped? Auto-suggests the closest config name |
| 🛡️ | **Safe Switching** | Preserves `language`, `permissions` and other personal settings |
| 🌍 | **i18n** | English / 中文 (`ccm locale set en/zh`) |

## 📦 Install

```bash
npm install -g ccm-cli
```

Or build from source:

```bash
git clone git@github.com:daylenjeez/ccm.git
cd ccm && npm install && npm run build && npm link
```

## 🚀 Quick Start

```bash
# 1. Initialize — auto-detects cc-switch
ccm init

# 2. Browse & switch with arrow keys
ccm ls

# 3. Or switch directly
ccm use OpenRouter
```

## 🔌 cc-switch Integration

Already using [cc-switch](https://github.com/nicepkg/cc-switch)? ccm reads its SQLite database directly:

```bash
$ ccm init
cc-switch detected. Import configurations from it? (Y/n)
✓ Initialized in cc-switch mode
✓ Imported 4 configurations
Active: OpenRouter
```

All configs sync both ways — add in ccm, see it in cc-switch UI, and vice versa.

## ➕ Adding Configurations

Two ways to add a provider configuration:

### 1. Interactive wizard (recommended)

Run `ccm add` and follow the prompts:

```
$ ccm add
```

**Step 1** — Enter provider name and choose input mode:

```
Provider name (e.g. OpenRouter): OpenRouter

Choose how to add:
  1) Step by step
  2) Write JSON directly
Choose (1/2): 1
```

**Step 2** — Fill in configuration fields (type `<` to go back):

| Field | Required | Example |
|---|---|---|
| `ANTHROPIC_BASE_URL` | ✅ | `https://openrouter.ai/api/v1` |
| `ANTHROPIC_AUTH_TOKEN` | ✅ | `sk-or-xxx` |
| `ANTHROPIC_MODEL` | ✅ | `anthropic/claude-opus-4.6` |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | | `Claude Opus 4.6` |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | | `Claude Sonnet 4.6` |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | | `Claude Haiku 4.5` |

**Step 3** — Preview, optionally edit in `$EDITOR`, save & switch:

```
✓ Saved configuration "OpenRouter"
Switch to this configuration now? (Y/n)
```

### 2. Edit JSON directly

In standalone mode, edit `~/.ccm/config.json`:

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

## 📖 Commands

### Core

| Command | Alias | Description |
|---|---|---|
| `ccm init` | | Initialize, auto-detect cc-switch |
| `ccm list` | `ls` | Interactive list & switch |
| `ccm use <name>` | | Switch by name (fuzzy matching) |
| `ccm add` | `new` | Interactive add wizard |
| `ccm save <name>` | | Save current settings as profile |
| `ccm show [name]` | | View config details |
| `ccm remove [name]` | `rm` | Interactive or named delete |
| `ccm current` | | Show active configuration |
| `ccm config` | | Switch storage mode |

### Aliases

| Command | Description |
|---|---|
| `ccm alias set <short> <name>` | Create alias, e.g. `ccm alias set or OpenRouter` |
| `ccm alias rm <short>` | Remove alias |
| `ccm alias list` / `ls` | List all aliases |

### Aliases

Create shortcuts for frequently used configurations:

```bash
ccm alias set or OpenRouter
ccm use or  # same as: ccm use OpenRouter
```

### Locale

| Command | Description |
|---|---|
| `ccm locale` / `ls` | List & switch language |
| `ccm locale set <lang>` | Set language (`zh` / `en`) |

## 🔍 Fuzzy Matching

```
$ ccm use openroter
Configuration "openroter" not found
Did you mean: OpenRouter?
```

| Strategy | Priority |
|---|---|
| Case-insensitive exact match | 1st |
| Substring match | 2nd |
| Levenshtein distance ≤ 3 | 3rd |

## ⚙️ How It Works

Claude Code reads `~/.claude/settings.json` on startup. The `env` field controls the API provider and model:

| Variable | Description |
|---|---|
| `ANTHROPIC_BASE_URL` | API endpoint URL |
| `ANTHROPIC_AUTH_TOKEN` | Authentication token |
| `ANTHROPIC_MODEL` | Default model |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | Model used when selecting Opus via `/model` |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Model used when selecting Sonnet via `/model` |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Model used when selecting Haiku via `/model` |

`ccm use` writes the selected profile into `settings.json` while preserving personal settings (`language`, `permissions`, etc.). Restart Claude Code to apply.

## 📄 License

[MIT](./LICENSE)
