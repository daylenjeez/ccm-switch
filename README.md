<div align="center">

# cc-cast

**Claude Code Model Switcher**

Switch Claude Code custom model configurations from the terminal in seconds.

[![npm version](https://img.shields.io/npm/v/cc-cast.svg?style=flat-square)](https://www.npmjs.com/package/cc-cast)
[![license](https://img.shields.io/github/license/daylenjeez/cc-cast?style=flat-square)](https://github.com/daylenjeez/cc-cast/blob/main/LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)

[中文文档](https://github.com/daylenjeez/cc-cast/blob/main/README.zh-CN.md) | English

[Install](#-install) · [Quick Start](#-quick-start) · [Commands](#-commands) · [How It Works](#%EF%B8%8F-how-it-works)

</div>

---

## ✨ Highlights

- 🔌 **cc-switch Integration** — Reads [cc-switch](https://github.com/farion1231/cc-switch) database directly, zero migration
- 🧙 **Interactive Wizard** — `ccc add` guides you step by step, type `<` to go back
- ⚡ **One-command Switch** — `ccc use OpenRouter` or `ccc ls` with arrow keys
- 🛡️ **Safe Switching** — Preserves `language`, `permissions` and other personal settings
- 🪶 **Lightweight** — No extra features, just model switching. Tiny footprint, fast startup, no background processes
- 🚀 **Zero Config** — Just `ccc init` and follow the prompts, no docs needed
- 🌍 **i18n** — English / 中文 (`ccc locale set en/zh`)

## 📦 Install

```bash
npm install -g cc-cast
```

## 🚀 Quick Start

```bash
ccc init   # Auto-detects cc-switch or initializes standalone mode
ccc add    # Interactive wizard to add a provider
```

## 🔌 cc-switch Integration

Already using [cc-switch](https://github.com/farion1231/cc-switch)? When the cc-switch database is detected, ccc works directly with it instead of using standalone storage:

```bash
$ ccc init
✓ Initialized
✓ cc-switch detected — ccc will use cc-switch's configuration store directly
```

You can also run `ccc sync` at any time to pull the latest cc-switch configurations into standalone mode.

## ➕ Adding Configurations

### Interactive wizard (recommended)

```bash
$ ccc add
Provider name (e.g. OpenRouter): OpenRouter

Choose how to add:
  1) Step by step     # guided prompts, type < to go back
  2) Write JSON       # opens $EDITOR

ANTHROPIC_BASE_URL: https://openrouter.ai/api/v1
ANTHROPIC_AUTH_TOKEN: sk-or-xxx
ANTHROPIC_MODEL: anthropic/claude-opus-4.6
ANTHROPIC_DEFAULT_OPUS_MODEL (optional):
ANTHROPIC_DEFAULT_SONNET_MODEL (optional):
ANTHROPIC_DEFAULT_HAIKU_MODEL (optional):

✓ Saved configuration "OpenRouter"
Switch to this configuration now? (Y/n)
```

### Edit JSON directly

<details>
<summary>Standalone mode: <code>~/.cc-cast/config.json</code></summary>

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

Aliases are stored in `~/.cc-cast/rc.json`:

```json
{
  "aliases": {
    "or": "OpenRouter"
  }
}
```

## 📖 Commands

### Core

| Command | Alias | Description |
|---|---|---|
| `ccc init` | | Initialize, auto-detect cc-switch |
| `ccc list` | `ls` | Interactive list & switch |
| `ccc use <name>` | | Switch by name |
| `ccc add` | `new` | Interactive add wizard |
| `ccc save <name>` | | Save current settings as profile |
| `ccc show [name]` | | View config details (all configs in JSON if no name) |
| `ccc modify [name]` | `edit` | Edit existing configuration |
| `ccc remove [name]` | `rm` | Interactive or named delete |
| `ccc current` | | Show active configuration |
| `ccc sync` | | Sync cc-switch configs into standalone |
| `ccc import [file]` | | Import configs from JSON (stdin if no file) |
| `ccc clear` | | Clean up data files |

### Aliases

| Command | Description |
|---|---|
| `ccc alias set <short> <name>` | Create alias, e.g. `ccc alias set or OpenRouter` |
| `ccc alias rm <short>` | Remove alias |
| `ccc alias list` / `ls` | List all aliases |

```bash
ccc alias set or OpenRouter
ccc use or  # same as: ccc use OpenRouter
```

### Locale

| Command | Description |
|---|---|
| `ccc locale` / `ls` | List & switch language |
| `ccc locale set <lang>` | Set language (`zh` / `en`) |

### Examples

```bash
# Switch provider
$ ccc use OpenRouter
✓ Switched to OpenRouter
  Model: anthropic/claude-opus-4.6
  Restart Claude Code to apply

# View current config
$ ccc current
Current configuration: OpenRouter
  ANTHROPIC_BASE_URL: https://openrouter.ai/api/v1
  ANTHROPIC_MODEL: anthropic/claude-opus-4.6
  ANTHROPIC_AUTH_TOKEN: sk-or-v1...a3f2

# Save current settings.json as a new profile
$ ccc save my-backup
✓ Saved current configuration as "my-backup"
```

## ⚙️ How It Works

Claude Code reads `~/.claude/settings.json` on startup. The `env` field controls the API provider and model:

| Variable | Description |
|---|---|
| `ANTHROPIC_BASE_URL` | API endpoint URL |
| `ANTHROPIC_AUTH_TOKEN` | Authentication token |
| `ANTHROPIC_MODEL` | Default model (optional) |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | Model used when selecting Opus via `/model` |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Model used when selecting Sonnet via `/model` |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Model used when selecting Haiku via `/model` |

`ccc use` writes the selected profile into `settings.json` while preserving personal settings (`language`, `permissions`, etc.). Restart Claude Code to apply.

## 🗑️ Uninstall

Removing `cc-cast` only removes the CLI itself. Your data files are left behind.

Use `ccc clear` to delete them automatically, or clean them up manually:

- `~/.cc-cast/rc.json` — aliases and locale
- `~/.cc-cast/config.json` — profiles
- `~/.claude/settings.json` — may still contain an active `env` profile written by cc-cast

Then remove the CLI:

```bash
npm uninstall -g cc-cast
```

## 📄 License

[MIT](./LICENSE)
