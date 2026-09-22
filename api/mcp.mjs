import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import {
  buildFacets,
  COURSE_SCHEMA,
  filterCourses,
  getCourses,
  paginate,
} from './_shared.mjs';

const searchShape = {
  q: z.string().optional().describe('Free-text search across course code, name, teacher, department, campus and schedule'),
  teacher: z.string().optional(),
  campus: z.string().optional(),
  department: z.string().optional(),
  level: z.string().optional(),
  degree_type: z.string().optional(),
  day: z.union([z.string(), z.number().int().min(1).max(7)]).optional().describe('1=Monday ... 7=Sunday, or Chinese day text'),
  week: z.number().int().min(1).max(30).optional(),
  period: z.number().int().min(1).max(20).optional(),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
};

function toolJson(value) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'search_courses',
      'Search and filter Fudan graduate courses by keyword, teacher, campus, department, level, weekday, teaching week, and class period.',
      searchShape,
      async (params) => {
        const courses = await getCourses();
        return toolJson(paginate(filterCourses(courses, params), params));
      },
    );

    server.tool(
      'get_course',
      'Get one course by its stable course_code:class_no id.',
      { id: z.string().min(1) },
      async ({ id }) => {
        const courses = await getCourses();
        const course = courses.find((item) => item.id === id);
        return course
          ? toolJson(course)
          : { isError: true, content: [{ type: 'text', text: `Course not found: ${id}` }] };
      },
    );

    server.tool(
      'list_course_facets',
      'List valid campus, department, level, and degree-type values for planning a course query.',
      {},
      async () => toolJson(buildFacets(await getCourses())),
    );

    server.tool(
      'get_course_schema',
      'Describe the normalized course fields returned by this server.',
      {},
      async () => toolJson(COURSE_SCHEMA),
    );
  },
  {
    serverInfo: {
      name: 'fudan-courses',
      version: '1.1.0',
    },
  },
  { basePath: '/api' },
);

export { handler as GET, handler as POST, handler as DELETE };
export default { fetch: handler };
