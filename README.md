<div align="center">

# ccm

**Claude Code Model Switcher**

Switch Claude Code custom model configurations from the terminal in seconds.

[![npm version](https://img.shields.io/npm/v/@daylenjeez/ccm-switch.svg?style=flat-square)](https://www.npmjs.com/package/@daylenjeez/ccm-switch)
[![license](https://img.shields.io/npm/l/@daylenjeez/ccm-switch.svg?style=flat-square)](https://github.com/daylenjeez/ccm-switch/blob/main/LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)

[中文文档](https://github.com/daylenjeez/ccm-switch/blob/main/README.zh-CN.md) | English

[Install](#-install) · [Quick Start](#-quick-start) · [Commands](#-commands) · [How It Works](#%EF%B8%8F-how-it-works)

</div>

---

## ✨ Highlights

- 🔌 **cc-switch Integration** — Reads [cc-switch](https://github.com/farion1231/cc-switch) database directly, zero migration
- 🧙 **Interactive Wizard** — `ccm add` guides you step by step, type `<` to go back
- ⚡ **One-command Switch** — `ccm use OpenRouter` or `ccm ls` with arrow keys
- 🛡️ **Safe Switching** — Preserves `language`, `permissions` and other personal settings
- 🚀 **Zero Config** — Just `ccm init` and follow the prompts, no docs needed
- 🌍 **i18n** — English / 中文 (`ccm locale set en/zh`)

## 📦 Install

```bash
npm install -g @daylenjeez/ccm-switch
```

Or build from source:

```bash
git clone git@github.com:daylenjeez/ccm-switch.git
cd ccm && npm install && npm run build && npm link
```

## 🚀 Quick Start

```bash
ccm init   # Auto-detects cc-switch or initializes standalone mode
ccm add    # Interactive wizard to add a provider
```

> **Without ccm**: Manually edit `~/.claude/settings.json`, copy-paste API keys, restart, hope the JSON isn't broken.
> **With ccm**: `ccm use OpenRouter` — done.

## 🔌 cc-switch Integration

Already using [cc-switch](https://github.com/farion1231/cc-switch)? ccm can sync its configurations into standalone storage:

```bash
$ ccm init
cc-switch detected. Import configurations from it? (Y/n)
✓ Initialized
✓ Synced 4 configurations
Active: OpenRouter
```

You can also run `ccm sync` at any time to pull the latest cc-switch configurations into `~/.ccm/config.json`.

> ⚠️ **Known Issue**: After ccm modifies `~/.claude/settings.json`, cc-switch will automatically sync the content back to its database, overwriting the current provider's `settings_config`. If the configurations differ between the two tools, the original configuration stored in cc-switch will be modified.

## ➕ Adding Configurations

### Interactive wizard (recommended)

```bash
$ ccm add
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
<summary>Standalone mode: <code>~/.ccm/config.json</code></summary>

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

Aliases are stored in `~/.ccm/rc.json`:

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
| `ccm init` | | Initialize, auto-detect cc-switch |
| `ccm list` | `ls` | Interactive list & switch |
| `ccm use <name>` | | Switch by name |
| `ccm add` | `new` | Interactive add wizard |
| `ccm save <name>` | | Save current settings as profile |
| `ccm show [name]` | | View config details |
| `ccm modify [name]` | `edit` | Edit existing configuration |
| `ccm remove [name]` | `rm` | Interactive or named delete |
| `ccm current` | | Show active configuration |
| `ccm sync` | | Sync cc-switch configs into standalone |
| `ccm clear` | | Clean up data files |

### Aliases

| Command | Description |
|---|---|
| `ccm alias set <short> <name>` | Create alias, e.g. `ccm alias set or OpenRouter` |
| `ccm alias rm <short>` | Remove alias |
| `ccm alias list` / `ls` | List all aliases |

```bash
ccm alias set or OpenRouter
ccm use or  # same as: ccm use OpenRouter
```

### Locale

| Command | Description |
|---|---|
| `ccm locale` / `ls` | List & switch language |
| `ccm locale set <lang>` | Set language (`zh` / `en`) |

### Examples

```bash
# Switch provider
$ ccm use OpenRouter
✓ Switched to OpenRouter
  Model: anthropic/claude-opus-4.6
  Restart Claude Code to apply

# View current config
$ ccm current
Current configuration: OpenRouter
  ANTHROPIC_BASE_URL: https://openrouter.ai/api/v1
  ANTHROPIC_MODEL: anthropic/claude-opus-4.6
  ANTHROPIC_AUTH_TOKEN: sk-or-v1...a3f2

# Save current settings.json as a new profile
$ ccm save my-backup
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

`ccm use` writes the selected profile into `settings.json` while preserving personal settings (`language`, `permissions`, etc.). Restart Claude Code to apply.

## 🗑️ Uninstall

Removing `ccm` only removes the CLI itself. Your data files are left behind.

Use `ccm clear` to delete them automatically, or clean them up manually:

- `~/.ccm/rc.json` — aliases and locale
- `~/.ccm/config.json` — profiles
- `~/.claude/settings.json` — may still contain an active `env` profile written by ccm

Then remove the CLI:

```bash
npm uninstall -g @daylenjeez/ccm-switch
```

## 📄 License

[MIT](./LICENSE)
