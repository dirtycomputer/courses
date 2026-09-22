import {
  buildFacets,
  COURSE_SCHEMA,
  filterCourses,
  loadCourses,
  loadCoursesFromUrl,
  paginate,
} from '../agent/lib.mjs';

export const SOURCE_URL = process.env.COURSES_SOURCE_URL
  || 'https://raw.githubusercontent.com/dirtycomputer/courses/main/index.html';

const CACHE_TTL_MS = Number(process.env.COURSES_CACHE_TTL_MS || 300_000);
let cached = { expiresAt: 0, promise: null };

export async function getCourses() {
  const now = Date.now();
  if (cached.promise && now < cached.expiresAt) return cached.promise;

  const promise = process.env.COURSES_HTML
    ? loadCourses(process.env.COURSES_HTML)
    : loadCoursesFromUrl(SOURCE_URL);

  cached = { expiresAt: now + CACHE_TTL_MS, promise };
  try {
    return await promise;
  } catch (error) {
    cached = { expiresAt: 0, promise: null };
    throw error;
  }
}

export function queryParams(request) {
  return Object.fromEntries(new URL(request.url).searchParams.entries());
}

export function json(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-methods', 'GET,OPTIONS');
  headers.set('access-control-allow-headers', 'content-type,authorization,mcp-session-id,mcp-protocol-version');
  if (!headers.has('cache-control')) headers.set('cache-control', 'public, max-age=60, s-maxage=300');
  return new Response(JSON.stringify(body, null, 2), { ...init, headers });
}

export function options() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization,mcp-session-id,mcp-protocol-version',
      'access-control-expose-headers': 'mcp-session-id',
    },
  });
}

export { buildFacets, COURSE_SCHEMA, filterCourses, paginate };
