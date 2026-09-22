import { filterCourses, getCourses, json, options, paginate, queryParams } from './_shared.mjs';

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return options();
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, { status: 405 });

    try {
      const params = queryParams(request);
      const courses = await getCourses();

      if (params.id) {
        const course = courses.find((item) => item.id === params.id);
        if (!course) return json({ error: 'course_not_found', id: params.id }, { status: 404 });
        return json(course);
      }

      return json(paginate(filterCourses(courses, params), params));
    } catch (error) {
      return json({ error: 'internal_error', message: error.message }, { status: 500, headers: { 'cache-control': 'no-store' } });
    }
  },
};
