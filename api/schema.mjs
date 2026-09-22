import { COURSE_SCHEMA, json, options } from './_shared.mjs';

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return options();
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, { status: 405 });
    return json(COURSE_SCHEMA, { headers: { 'cache-control': 'public, max-age=3600, s-maxage=86400' } });
  },
};
