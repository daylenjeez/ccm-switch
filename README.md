# ccm - Claude Code Model Switcher

A CLI tool for quickly switching Claude Code custom model configurations from the terminal.

[中文文档](./README.zh-CN.md)

## Why

Claude Code reads `~/.claude/settings.json` on startup. To switch between API providers or models (e.g., ZenMux, OpenRouter, Kimi), you need to manually edit this file each time. **ccm** makes this a one-command operation.

## Features

- **One-command switching** - `ccm use <name>` to switch provider/model instantly
- **Two storage modes** - Read from [cc-switch](https://github.com/nicepkg/cc-switch) database or use standalone config
- **Fuzzy matching** - Typo-tolerant name resolution with suggestions
- **Alias support** - Create shortcuts like `or` for `openrouter-opus4.6`
- **Safe switching** - Preserves user-level settings (`language`, `permissions`) when switching profiles
- **i18n** - Supports English and Chinese (`ccm locale set en/zh`)

## Install

```bash
npm install -g ccm-cli
```

Or from source:

```bash
git clone git@github.com:daylenjeez/ccm.git
cd ccm
npm install && npm run build
npm link
```

## Quick Start

```bash
# 1. Initialize (choose storage mode)
ccm init

# 2. List available configurations
ccm list

# 3. Switch to a configuration
ccm use openrouter-opus4.6

# 4. Check current configuration
ccm current
```

## Commands

| Command | Description |
| --- | --- |
| `ccm init` | Initialize ccm, choose data source mode |
| `ccm config` | View or switch data source mode |
| `ccm list` / `ls` | List all available configurations |
| `ccm current` | Show the currently active configuration |
| `ccm use <name>` | Switch to a specified configuration |
| `ccm save <name>` | Save current settings.json as a new configuration |
| `ccm show [name]` | View configuration details (defaults to current) |
| `ccm remove <name>` / `rm` | Delete a configuration |
| `ccm alias set <short> <name>` | Create an alias |
| `ccm alias rm <short>` | Remove an alias |
| `ccm alias list` / `ls` | List all aliases |
| `ccm locale` | Show supported languages |
| `ccm locale set <lang>` | Set language (zh/en) |

## Storage Modes

**cc-switch mode** - Reads directly from [cc-switch](https://github.com/nicepkg/cc-switch) SQLite database (`~/.cc-switch/cc-switch.db`). Configurations are shared with the cc-switch UI.

**Standalone mode** - Uses `~/.ccm/config.json` for independent configuration storage. No external dependencies required.

## Fuzzy Matching

If you mistype a configuration name, ccm will suggest the closest match:

```
$ ccm use openroter
Configuration "openroter" not found
Did you mean: openrouter-opus4.6?
```

Matching strategy: case-insensitive exact -> substring -> Levenshtein distance (threshold: 3).

## Aliases

```bash
ccm alias set or openrouter-opus4.6
ccm use or  # same as: ccm use openrouter-opus4.6
```

## How It Works

Claude Code uses environment variables in `~/.claude/settings.json` to determine the API provider and model:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://your-provider.com/api/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "sk-...",
    "ANTHROPIC_MODEL": "anthropic/claude-opus-4.6"
  }
}
```

`ccm use` writes the selected profile's config into this file, preserving user-level fields like `language` and `permissions`. Restart Claude Code to apply.

## License

MIT
