import { json, options } from './_shared.mjs';

function spec(origin) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Fudan Courses Agent API',
      version: '1.1.0',
      description: 'Read-only query API for the Fudan graduate course dataset.',
    },
    servers: [{ url: origin }],
    paths: {
      '/courses': {
        get: {
          operationId: 'searchCourses',
          summary: 'Search and filter courses',
          parameters: [
            { name: 'q', in: 'query', schema: { type: 'string' } },
            { name: 'teacher', in: 'query', schema: { type: 'string' } },
            { name: 'campus', in: 'query', schema: { type: 'string' } },
            { name: 'department', in: 'query', schema: { type: 'string' } },
            { name: 'level', in: 'query', schema: { type: 'string' } },
            { name: 'degree_type', in: 'query', schema: { type: 'string' } },
            { name: 'day', in: 'query', description: '1=Monday ... 7=Sunday, or Chinese day text', schema: { type: 'string' } },
            { name: 'week', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 30 } },
            { name: 'period', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 20 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, minimum: 1, maximum: 200 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0, minimum: 0 } },
          ],
          responses: { 200: { description: 'Paginated course results' } },
        },
      },
      '/courses/{id}': {
        get: {
          operationId: 'getCourse',
          summary: 'Get one course by stable id',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Course' }, 404: { description: 'Not found' } },
        },
      },
      '/facets': {
        get: {
          operationId: 'listCourseFacets',
          summary: 'List available campuses, departments, levels and degree types',
          responses: { 200: { description: 'Facet values' } },
        },
      },
      '/schema': {
        get: {
          operationId: 'getCourseSchema',
          summary: 'Describe normalized course fields',
          responses: { 200: { description: 'Schema description' } },
        },
      },
      '/health': {
        get: {
          operationId: 'healthCheck',
          summary: 'Check API and upstream dataset availability',
          responses: { 200: { description: 'Healthy' }, 503: { description: 'Source unavailable' } },
        },
      },
    },
  };
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return options();
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, { status: 405 });
    return json(spec(new URL(request.url).origin), { headers: { 'cache-control': 'public, max-age=3600, s-maxage=86400' } });
  },
};
