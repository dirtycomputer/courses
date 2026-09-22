import { getCourses, json, options, SOURCE_URL } from './_shared.mjs';

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return options();
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, { status: 405 });

    try {
      const courses = await getCourses();
      return json({
        service: 'fudan-courses-agent-api',
        ok: true,
        course_count: courses.length,
        source: SOURCE_URL,
        endpoints: ['/courses', '/facets', '/schema', '/openapi.json', '/api/mcp'],
      }, { headers: { 'cache-control': 'no-store' } });
    } catch (error) {
      return json({ ok: false, error: 'source_unavailable', message: error.message }, { status: 503, headers: { 'cache-control': 'no-store' } });
    }
  },
};
