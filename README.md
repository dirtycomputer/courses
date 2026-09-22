# courses

复旦课程浏览与课表查询页面，数据和前端逻辑主要位于 `index.html`。

## Agent 查询

仓库提供 `agent/` 目录，为 agent、脚本和自动化程序提供只读查询层：

```bash
# CLI
node agent/query.mjs --q 机器学习 --campus 邯郸 --limit 10

# 本地 HTTP / OpenAPI
node agent/server.mjs
curl 'http://127.0.0.1:8787/courses?q=机器学习&limit=5'
```

支持按课程关键词、教师、校区、开课单位、层次、学位类型、星期、周次、节次过滤，并提供 `/facets`、`/schema` 和 `/openapi.json`。

## Vercel HTTPS API + MCP

仓库根目录已经包含 Vercel Functions 和远程 MCP Server。可直接部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdirtycomputer%2Fcourses&project-name=fudan-courses-agent&repository-name=fudan-courses-agent)

部署后可用：

```text
https://<deployment>/health
https://<deployment>/courses?q=机器学习&limit=5
https://<deployment>/facets
https://<deployment>/schema
https://<deployment>/openapi.json
https://<deployment>/api/mcp
```

云端查询层默认读取 `https://raw.githubusercontent.com/dirtycomputer/courses/main/index.html`，因此课程页面数据更新后无需维护第二份数据。可用环境变量 `COURSES_SOURCE_URL` 指向其他兼容数据源。

远程 MCP 基于官方 `@modelcontextprotocol/server` v2，提供 `search_courses`、`get_course`、`list_course_facets`、`get_course_schema` 四个工具。

详细说明见 [`agent/README.md`](agent/README.md)。
