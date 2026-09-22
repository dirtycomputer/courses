# Agent 查询工具

这个目录提供一个只读的课程查询层。CLI/本地 API 直接解析仓库根目录 `index.html` 中的 `const DATA = [...]`；Vercel 云端 API 默认读取 GitHub Raw 上的当前 `main` 数据，因此无需维护第二份课程数据库。

## CLI

要求 Node.js 18+。

```bash
node agent/query.mjs --q 机器学习 --campus 邯郸 --limit 10
node agent/query.mjs --teacher 张 --day 2 --week 4
node agent/query.mjs --facets
node agent/query.mjs --schema
node agent/query.mjs --q 人工智能 --jsonl
```

主要参数：`q`、`teacher`、`campus`、`department`、`level`、`degree-type`、`day`、`week`、`period`、`limit`、`offset`。

`day` 可使用 `1..7`（周一到周日）或中文星期文本。`week` 和 `period` 会尝试从原始 `schedule` 文本中解析周次和节次；无法识别的时间格式不会被当作匹配。

## 本地 HTTP API

```bash
node agent/server.mjs
```

默认监听 `127.0.0.1:8787`：

```bash
curl 'http://127.0.0.1:8787/courses?q=机器学习&campus=邯郸&limit=5'
curl 'http://127.0.0.1:8787/courses?day=2&week=4&period=3'
curl 'http://127.0.0.1:8787/facets'
curl 'http://127.0.0.1:8787/schema'
curl 'http://127.0.0.1:8787/openapi.json'
```

可通过环境变量覆盖：

```bash
COURSES_PORT=9000 COURSES_HOST=0.0.0.0 node agent/server.mjs
COURSES_HTML=/path/to/index.html node agent/query.mjs --q 统计
```

## Vercel HTTPS API

仓库根目录的 `api/`、`package.json` 和 `vercel.json` 可直接部署到 Vercel。部署完成后提供：

```text
GET /health
GET /courses
GET /courses/{id}
GET /facets
GET /schema
GET /openapi.json
POST /api/mcp
```

云端默认数据源：

```text
https://raw.githubusercontent.com/dirtycomputer/courses/main/index.html
```

如需切换数据源，可设置 `COURSES_SOURCE_URL`；`COURSES_CACHE_TTL_MS` 可覆盖默认 5 分钟的内存缓存时间。

## OpenAPI Agent 集成

本地 `agent/openapi.json` 提供 OpenAPI 3.1 描述；部署后建议使用动态的 `https://<deployment>/openapi.json`，其中 `servers` 会自动指向当前部署域名。

## MCP Agent 集成

远程 MCP endpoint：

```text
https://<deployment>/api/mcp
```

MCP Server 使用官方 `@modelcontextprotocol/server` v2 的 Streamable HTTP handler，同时兼容其默认的 legacy stateless 流量。提供四个工具：`search_courses`、`get_course`、`list_course_facets`、`get_course_schema`。

Codex CLI 示例：

```bash
codex mcp add fudan-courses --url https://<deployment>/api/mcp
```

Claude Code 示例：

```bash
claude mcp add --transport http fudan-courses https://<deployment>/api/mcp
```

返回字段统一为英文机器字段：`id`、`course_code`、`course_name`、`class_no`、`teacher`、`credits`、`hours`、`level`、`degree_type`、`department`、`campus`、`schedule`、`syllabus_url`。

所有查询接口均为只读，不修改课程数据。
