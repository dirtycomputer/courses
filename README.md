# courses

复旦课程浏览与课表查询页面，数据和前端逻辑主要位于 `index.html`。

## Agent 查询

仓库新增了 `agent/` 目录，为 agent、脚本和自动化程序提供只读查询层：

```bash
# CLI
node agent/query.mjs --q 机器学习 --campus 邯郸 --limit 10

# HTTP / OpenAPI
node agent/server.mjs
curl 'http://127.0.0.1:8787/courses?q=机器学习&limit=5'
```

支持按课程关键词、教师、校区、开课单位、层次、学位类型、星期、周次、节次过滤，并提供 `/facets`、`/schema` 和 `/openapi.json`。

详细说明见 [`agent/README.md`](agent/README.md)。
