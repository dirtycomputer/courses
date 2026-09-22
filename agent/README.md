# Agent 查询工具

这个目录提供一个零依赖、只读的课程查询层，直接解析仓库根目录 `index.html` 中的 `const DATA = [...]`。课程数据仍只有一份；网页更新后，CLI/API 会自动读取新数据。

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

## HTTP API

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

## Agent 集成

`agent/openapi.json` 提供 OpenAPI 3.1 描述。支持 OpenAPI function/tool import 的 agent 可以直接注册 `/courses`、`/courses/{id}`、`/facets` 和 `/schema`。

返回字段统一成英文机器字段：

- `id`
- `course_code`
- `course_name`
- `class_no`
- `teacher`
- `credits`
- `hours`
- `level`
- `degree_type`
- `department`
- `campus`
- `schedule`
- `syllabus_url`

API 是只读的，不修改课程数据。
