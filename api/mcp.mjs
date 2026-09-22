import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import {
  buildFacets,
  COURSE_SCHEMA,
  filterCourses,
  getCourses,
  paginate,
} from './_shared.mjs';

const searchSchema = z.object({
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
});

function toolJson(value) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}

function createServer() {
  const server = new McpServer({
    name: 'fudan-courses',
    version: '1.1.0',
  });

  server.registerTool(
    'search_courses',
    {
      description: 'Search and filter Fudan graduate courses by keyword, teacher, campus, department, level, weekday, teaching week, and class period.',
      inputSchema: searchSchema,
    },
    async (params) => {
      const courses = await getCourses();
      return toolJson(paginate(filterCourses(courses, params), params));
    },
  );

  server.registerTool(
    'get_course',
    {
      description: 'Get one course by its stable course_code:class_no id.',
      inputSchema: z.object({ id: z.string().min(1) }),
    },
    async ({ id }) => {
      const courses = await getCourses();
      const course = courses.find((item) => item.id === id);
      return course
        ? toolJson(course)
        : { isError: true, content: [{ type: 'text', text: `Course not found: ${id}` }] };
    },
  );

  server.registerTool(
    'list_course_facets',
    {
      description: 'List valid campus, department, level, and degree-type values for planning a course query.',
      inputSchema: z.object({}),
    },
    async () => toolJson(buildFacets(await getCourses())),
  );

  server.registerTool(
    'get_course_schema',
    {
      description: 'Describe the normalized course fields returned by this server.',
      inputSchema: z.object({}),
    },
    async () => toolJson(COURSE_SCHEMA),
  );

  return server;
}

export default createMcpHandler(createServer);
