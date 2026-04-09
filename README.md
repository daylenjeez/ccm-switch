<div align="center">

# cc-cast

**Claude Code Model Switcher**

Switch Claude Code custom model configurations from the terminal in seconds.

[![npm version](https://img.shields.io/npm/v/@daylenjeez/cc-cast.svg?style=flat-square)](https://www.npmjs.com/package/@daylenjeez/cc-cast)
[![license](https://img.shields.io/github/license/daylenjeez/cc-cast?style=flat-square)](https://github.com/daylenjeez/cc-cast/blob/main/LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)

[中文文档](https://github.com/daylenjeez/cc-cast/blob/main/README.zh-CN.md) | English

[Install](#-install) · [Quick Start](#-quick-start) · [Commands](#-commands) · [How It Works](#%EF%B8%8F-how-it-works)

</div>

---

## ✨ Highlights

- 🔌 **cc-switch Integration** — Reads [cc-switch](https://github.com/farion1231/cc-switch) database directly, zero migration
- 🧙 **Interactive Wizard** — `cc-cast add` guides you step by step, type `<` to go back
- ⚡ **One-command Switch** — `cc-cast use OpenRouter` or `cc-cast ls` with arrow keys
- 🛡️ **Safe Switching** — Preserves `language`, `permissions` and other personal settings
- 🪶 **Lightweight** — No extra features, just model switching. Tiny footprint, fast startup, no background processes
- 🚀 **Zero Config** — Just `cc-cast init` and follow the prompts, no docs needed
- 🌍 **i18n** — English / 中文 (`cc-cast locale set en/zh`)

## 📦 Install

```bash
npm install -g @daylenjeez/cc-cast
```

## 🚀 Quick Start

```bash
cc-cast init   # Auto-detects cc-switch or initializes standalone mode
cc-cast add    # Interactive wizard to add a provider
```

## 🔌 cc-switch Integration

Already using [cc-switch](https://github.com/farion1231/cc-switch)? When the cc-switch database is detected, cc-cast works directly with it instead of using standalone storage:

```bash
$ cc-cast init
✓ Initialized
✓ cc-switch detected — cc-cast will use cc-switch's configuration store directly
```

You can also run `cc-cast sync` at any time to pull the latest cc-switch configurations into standalone mode.

## ➕ Adding Configurations

### Interactive wizard (recommended)

```bash
$ cc-cast add
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
| `cc-cast init` | | Initialize, auto-detect cc-switch |
| `cc-cast list` | `ls` | Interactive list & switch |
| `cc-cast use <name>` | | Switch by name |
| `cc-cast add` | `new` | Interactive add wizard |
| `cc-cast save <name>` | | Save current settings as profile |
| `cc-cast show [name]` | | View config details (all configs in JSON if no name) |
| `cc-cast modify [name]` | `edit` | Edit existing configuration |
| `cc-cast remove [name]` | `rm` | Interactive or named delete |
| `cc-cast current` | | Show active configuration |
| `cc-cast sync` | | Sync cc-switch configs into standalone |
| `cc-cast import [file]` | | Import configs from JSON (stdin if no file) |
| `cc-cast clear` | | Clean up data files |

### Aliases

| Command | Description |
|---|---|
| `cc-cast alias set <short> <name>` | Create alias, e.g. `cc-cast alias set or OpenRouter` |
| `cc-cast alias rm <short>` | Remove alias |
| `cc-cast alias list` / `ls` | List all aliases |

```bash
cc-cast alias set or OpenRouter
cc-cast use or  # same as: cc-cast use OpenRouter
```

### Locale

| Command | Description |
|---|---|
| `cc-cast locale` / `ls` | List & switch language |
| `cc-cast locale set <lang>` | Set language (`zh` / `en`) |

### Examples

```bash
# Switch provider
$ cc-cast use OpenRouter
✓ Switched to OpenRouter
  Model: anthropic/claude-opus-4.6
  Restart Claude Code to apply

# View current config
$ cc-cast current
Current configuration: OpenRouter
  ANTHROPIC_BASE_URL: https://openrouter.ai/api/v1
  ANTHROPIC_MODEL: anthropic/claude-opus-4.6
  ANTHROPIC_AUTH_TOKEN: sk-or-v1...a3f2

# Save current settings.json as a new profile
$ cc-cast save my-backup
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

`cc-cast use` writes the selected profile into `settings.json` while preserving personal settings (`language`, `permissions`, etc.). Restart Claude Code to apply.

## 🗑️ Uninstall

Removing `cc-cast` only removes the CLI itself. Your data files are left behind.

Use `cc-cast clear` to delete them automatically, or clean them up manually:

- `~/.cc-cast/rc.json` — aliases and locale
- `~/.cc-cast/config.json` — profiles
- `~/.claude/settings.json` — may still contain an active `env` profile written by cc-cast

Then remove the CLI:

```bash
npm uninstall -g @daylenjeez/cc-cast
```

## 📄 License

[MIT](./LICENSE)
