import { buildFacets, getCourses, json, options } from './_shared.mjs';

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return options();
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, { status: 405 });
    try {
      return json(buildFacets(await getCourses()));
    } catch (error) {
      return json({ error: 'internal_error', message: error.message }, { status: 500, headers: { 'cache-control': 'no-store' } });
    }
  },
};
