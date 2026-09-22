#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFacets, COURSE_SCHEMA, filterCourses, loadCourses, paginate } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.COURSES_PORT || 8787);
const HOST = process.env.COURSES_HOST || '127.0.0.1';
const courses = await loadCourses();

function send(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(body, null, 2));
}

function queryObject(url) {
  return Object.fromEntries(url.searchParams.entries());
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });

    if (url.pathname === '/' || url.pathname === '/health') {
      return send(res, 200, {
        service: 'fudan-courses-agent-api',
        ok: true,
        course_count: courses.length,
        endpoints: ['/courses', '/facets', '/schema', '/openapi.json'],
      });
    }

    if (url.pathname === '/schema') return send(res, 200, COURSE_SCHEMA);
    if (url.pathname === '/facets') return send(res, 200, buildFacets(courses));

    if (url.pathname === '/openapi.json') {
      const spec = JSON.parse(await readFile(resolve(HERE, 'openapi.json'), 'utf8'));
      return send(res, 200, spec);
    }

    if (url.pathname === '/courses') {
      const params = queryObject(url);
      const filtered = filterCourses(courses, params);
      return send(res, 200, paginate(filtered, params));
    }

    if (url.pathname.startsWith('/courses/')) {
      const id = decodeURIComponent(url.pathname.slice('/courses/'.length));
      const course = courses.find((c) => c.id === id);
      if (!course) return send(res, 404, { error: 'course_not_found', id });
      return send(res, 200, course);
    }

    return send(res, 404, { error: 'not_found' });
  } catch (error) {
    return send(res, 500, { error: 'internal_error', message: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.error(`courses agent API listening on http://${HOST}:${PORT}`);
});
