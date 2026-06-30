# aywebp MCP Server

Use **aywebp** from AI agents via the [Model Context Protocol (MCP)](https://modelcontextprotocol.io). The server exposes structured JSON tools for converting, inspecting, and listing images — with path sandboxing for safer agent use.

## Install

```bash
npm install -g aywebp
```

Or run without global install:

```bash
npx -y aywebp-mcp
```

## Cursor configuration

Add to your Cursor MCP settings (`Settings → MCP → Edit Config`):

```json
{
  "mcpServers": {
    "aywebp": {
      "command": "npx",
      "args": ["-y", "aywebp-mcp"],
      "env": {
        "AYWEBP_ALLOWED_ROOTS": "D:\\Projects"
      }
    }
  }
}
```

After global install:

```json
{
  "mcpServers": {
    "aywebp": {
      "command": "aywebp-mcp",
      "env": {
        "AYWEBP_ALLOWED_ROOTS": "D:\\Projects,D:\\Photos"
      }
    }
  }
}
```

Restart Cursor after saving the config.

## Path sandbox

All tool paths are validated against allowed roots:

| Env var | Behavior |
|---------|----------|
| `AYWEBP_ALLOWED_ROOTS` | Comma-separated list of directories agents may access |
| *(unset)* | Defaults to `process.cwd()` only |

Paths outside allowed roots are rejected with a clear error.

## Tools

### `convert_images`

Convert a file or directory to WebP beside each source file.

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | **Required.** File or directory |
| `recursive` | boolean | Scan subdirectories |
| `quality` | number | WebP quality 1–100 (default 85) |
| `force` | boolean | Overwrite existing `.webp` |
| `deleteSource` | boolean | Delete source after success |
| `width` | number | Resize width (px) |
| `height` | number | Resize height (px) |
| `fit` | string | `inside`, `cover`, `fill`, `outside` |
| `enlarge` | boolean | Allow upscaling |

**Example agent call:**

```json
{
  "path": "D:\\Projects\\site\\public\\images",
  "recursive": true,
  "width": 1920,
  "quality": 85
}
```

**Response shape:**

```json
{
  "converted": 2,
  "skipped": 0,
  "failed": 0,
  "deleted": 0,
  "total": 2,
  "files": [
    {
      "input": "D:\\Projects\\site\\public\\images\\hero.jpg",
      "output": "D:\\Projects\\site\\public\\images\\hero.webp",
      "status": "converted",
      "inputBytes": 245000,
      "outputBytes": 82000,
      "sourceDeleted": false
    }
  ]
}
```

### `inspect_image`

Read metadata before converting.

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | **Required.** Single image file |

**Response:**

```json
{
  "path": "D:\\Projects\\photo.png",
  "format": "png",
  "width": 2400,
  "height": 1600,
  "size": 1048576,
  "hasAlpha": true
}
```

### `list_convertible`

Dry-run: list what would be converted or skipped (no files written).

Same parameters as `convert_images`.

**Response:**

```json
{
  "total": 3,
  "wouldConvert": 2,
  "wouldSkip": 1,
  "files": [
    {
      "input": "D:\\Projects\\images\\a.png",
      "output": "D:\\Projects\\images\\a.webp",
      "action": "convert"
    },
    {
      "input": "D:\\Projects\\images\\b.jpg",
      "output": "D:\\Projects\\images\\b.webp",
      "action": "skip",
      "reason": "output_exists"
    }
  ]
}
```

### `get_version`

Returns aywebp version and supported input extensions. No parameters.

## CLI JSON mode

The CLI also supports structured output without MCP:

```bash
aywebp ./images -r --json
```

## Security notes

- Set `AYWEBP_ALLOWED_ROOTS` to directories your agent should access — never use drive root (`D:\\`) unless intentional.
- `deleteSource: true` permanently removes originals; use with care in agent workflows.
- The MCP server runs locally with the same filesystem access as the user running Cursor.
