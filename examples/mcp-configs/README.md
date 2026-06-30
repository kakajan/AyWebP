# MCP configuration examples for aywebp

Copy the file that matches your AI tool. All examples assume you installed aywebp globally:

```bash
npm install -g aywebp
```

Or use the **npx** variants below (no global install).

Set `AYWEBP_ALLOWED_ROOTS` to directories your agent may access (comma-separated).

---

## Quick reference

| Tool | Copy this file to | Docs |
|------|-------------------|------|
| [Cursor (global)](cursor-global.mcp.json) | `%USERPROFILE%\.cursor\mcp.json` | [Cursor MCP](https://docs.cursor.com/context/mcp) |
| [Cursor (project)](cursor-project.mcp.json) | `.cursor/mcp.json` in repo root | same |
| [Claude Code (project)](claude-code-project.mcp.json) | `.mcp.json` in repo root | [Claude Code MCP](https://code.claude.com/docs/en/mcp) |
| [Claude Code (user)](claude-code-user.json) | Merge into `~/.claude.json` under `mcpServers` | same |
| [Claude Desktop](claude-desktop.config.json) | `%APPDATA%\Claude\claude_desktop_config.json` | [Claude Desktop MCP](https://modelcontextprotocol.io/quickstart/user) |
| [OpenCode](opencode.json) | `opencode.json` or `~/.config/opencode/opencode.jsonc` | [OpenCode MCP](https://opencode.ai/docs/mcp-servers/) |
| [OpenAI Codex](codex.config.toml) | `~/.codex/config.toml` | [Codex MCP](https://developers.openai.com/codex/mcp) |
| [Windsurf](windsurf.mcp.json) | Windsurf MCP settings / `~/.codeium/windsurf/mcp_config.json` | [Windsurf MCP](https://docs.windsurf.com/windsurf/cascade/mcp) |
| [VS Code + Cline](cline-mcp.json) | Cline MCP settings (paste `mcpServers` block) | [Cline MCP](https://docs.cline.bot/mcp/configuring-mcp-servers) |

---

## One-line CLI setup (where supported)

### Claude Code

```bash
claude mcp add --scope user aywebp --env AYWEBP_ALLOWED_ROOTS=D:\Projects -- aywebp-mcp
```

### OpenAI Codex

```bash
codex mcp add aywebp --env AYWEBP_ALLOWED_ROOTS=D:\Projects -- aywebp-mcp
```

---

## npx (no global install)

Replace `"command": "aywebp-mcp"` with:

```json
"command": "npx",
"args": ["-y", "aywebp-mcp"]
```

On **Windows**, some tools need:

```json
"command": "cmd",
"args": ["/c", "npx", "-y", "aywebp-mcp"]
```

---

## Local development (this repo)

Use absolute path to the server script:

```json
"command": "node",
"args": ["D:\\Projects\\AyWebp\\bin\\aywebp-mcp.js"]
```

See [cursor-project-dev.mcp.json](cursor-project-dev.mcp.json).

---

## Verify

```bash
node scripts/test-mcp.mjs
```

After configuring your IDE, reload it and check that **aywebp** appears in MCP tools with:

- `convert_images`
- `inspect_image`
- `list_convertible`
- `get_version`
