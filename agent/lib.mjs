import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_INDEX = resolve(HERE, '..', 'index.html');

const DAY_NAMES = {
  '1': ['周一', '星期一'],
  '2': ['周二', '星期二'],
  '3': ['周三', '星期三'],
  '4': ['周四', '星期四'],
  '5': ['周五', '星期五'],
  '6': ['周六', '星期六'],
  '7': ['周日', '周天', '星期日', '星期天'],
};

export function extractDataJson(html) {
  const marker = 'const DATA =';
  const markerAt = html.indexOf(marker);
  if (markerAt < 0) throw new Error('Cannot find "const DATA =" in index.html');

  const start = html.indexOf('[', markerAt + marker.length);
  if (start < 0) throw new Error('Cannot find DATA array start');

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < html.length; i += 1) {
    const ch = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '[') depth += 1;
    else if (ch === ']') {
      depth -= 1;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('Unterminated DATA array');
}

export async function loadRawCourses(indexPath = process.env.COURSES_HTML || DEFAULT_INDEX) {
  const html = await readFile(indexPath, 'utf8');
  const rows = JSON.parse(extractDataJson(html));
  if (!Array.isArray(rows)) throw new Error('DATA is not an array');
  return rows;
}

export function parseRawCoursesFromHtml(html) {
  const rows = JSON.parse(extractDataJson(html));
  if (!Array.isArray(rows)) throw new Error('DATA is not an array');
  return rows;
}

export async function loadRawCoursesFromUrl(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'fudan-courses-agent/1.1' },
  });
  if (!response.ok) {
    throw new Error(`Cannot fetch course source: ${response.status} ${response.statusText}`);
  }
  return parseRawCoursesFromHtml(await response.text());
}

function firstHttpUrl(row) {
  for (const value of Object.values(row)) {
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value;
  }
  return null;
}

export function normalizeCourse(row) {
  return {
    id: `${row.kcdm ?? ''}:${row.bj ?? ''}`,
    course_code: row.kcdm ?? null,
    course_name: row.kcmc ?? null,
    class_no: row.bj ?? null,
    teacher: row.rkjs ?? null,
    credits: row.xf ?? null,
    hours: row.xs ?? null,
    level: row.kccc ?? null,
    degree_type: row.syxw ?? null,
    department: row.yx ?? null,
    campus: row.xq ?? null,
    schedule: row.sjdd ?? null,
    syllabus_url: firstHttpUrl(row),
  };
}

export async function loadCourses(indexPath) {
  return (await loadRawCourses(indexPath)).map(normalizeCourse);
}

export async function loadCoursesFromUrl(url) {
  return (await loadRawCoursesFromUrl(url)).map(normalizeCourse);
}

function text(value) {
  return String(value ?? '').trim();
}

function includesCI(value, query) {
  return text(value).toLocaleLowerCase('zh-CN').includes(text(query).toLocaleLowerCase('zh-CN'));
}

function matchDay(schedule, day) {
  if (day === undefined || day === null || text(day) === '') return true;
  const d = text(day);
  const names = DAY_NAMES[d] || [d];
  return names.some((name) => text(schedule).includes(name));
}

function matchWeek(schedule, weekValue) {
  if (weekValue === undefined || weekValue === null || text(weekValue) === '') return true;
  const week = Number(weekValue);
  if (!Number.isInteger(week) || week < 1 || week > 30) return false;

  const s = text(schedule)
    .replace(/[至—–－-]/g, '~')
    .replace(/，/g, ',')
    .replace(/、/g, ',');

  let sawWeekExpression = false;
  let matched = false;

  for (const m of s.matchAll(/(\d+)\s*~\s*(\d+)\s*周/g)) {
    sawWeekExpression = true;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (week >= Math.min(a, b) && week <= Math.max(a, b)) matched = true;
  }

  for (const m of s.matchAll(/((?:\d+\s*,\s*)+\d+)\s*周/g)) {
    sawWeekExpression = true;
    const weeks = m[1].split(',').map(Number);
    if (weeks.includes(week)) matched = true;
  }

  for (const m of s.matchAll(/(^|[^\d])(\d+)\s*周/g)) {
    sawWeekExpression = true;
    if (Number(m[2]) === week) matched = true;
  }

  if (!sawWeekExpression) return false;
  if (!matched) return false;
  if (s.includes('单周') && week % 2 === 0) return false;
  if (s.includes('双周') && week % 2 !== 0) return false;
  return true;
}

function matchPeriod(schedule, periodValue) {
  if (periodValue === undefined || periodValue === null || text(periodValue) === '') return true;
  const period = Number(periodValue);
  if (!Number.isInteger(period) || period < 1 || period > 20) return false;

  const s = text(schedule).replace(/[至—–－-]/g, '~');
  let saw = false;
  let matched = false;

  for (const m of s.matchAll(/(?:第)?\s*(\d+)\s*~\s*(\d+)\s*节/g)) {
    saw = true;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (period >= Math.min(a, b) && period <= Math.max(a, b)) matched = true;
  }
  for (const m of s.matchAll(/(?:第)?\s*(\d+)\s*节/g)) {
    saw = true;
    if (Number(m[1]) === period) matched = true;
  }

  return saw && matched;
}

export function filterCourses(courses, params = {}) {
  const q = text(params.q);
  const teacher = text(params.teacher);
  const campus = text(params.campus);
  const department = text(params.department);
  const level = text(params.level);
  const degreeType = text(params.degree_type ?? params.degreeType);

  return courses.filter((course) => {
    if (q) {
      const haystack = [
        course.course_code,
        course.course_name,
        course.class_no,
        course.teacher,
        course.department,
        course.campus,
        course.level,
        course.degree_type,
        course.schedule,
      ];
      if (!haystack.some((v) => includesCI(v, q))) return false;
    }
    if (teacher && !includesCI(course.teacher, teacher)) return false;
    if (campus && !includesCI(course.campus, campus)) return false;
    if (department && !includesCI(course.department, department)) return false;
    if (level && !includesCI(course.level, level)) return false;
    if (degreeType && !includesCI(course.degree_type, degreeType)) return false;
    if (!matchDay(course.schedule, params.day)) return false;
    if (!matchWeek(course.schedule, params.week)) return false;
    if (!matchPeriod(course.schedule, params.period)) return false;
    return true;
  });
}

export function paginate(courses, params = {}) {
  const limit = Math.min(Math.max(Number.parseInt(params.limit ?? '20', 10) || 20, 1), 200);
  const offset = Math.max(Number.parseInt(params.offset ?? '0', 10) || 0, 0);
  return {
    meta: { total: courses.length, limit, offset, returned: Math.max(0, Math.min(limit, courses.length - offset)) },
    results: courses.slice(offset, offset + limit),
  };
}

function uniqueSorted(courses, key) {
  return [...new Set(courses.map((c) => text(c[key])).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

export function buildFacets(courses) {
  return {
    campus: uniqueSorted(courses, 'campus'),
    department: uniqueSorted(courses, 'department'),
    level: uniqueSorted(courses, 'level'),
    degree_type: uniqueSorted(courses, 'degree_type'),
  };
}

export const COURSE_SCHEMA = {
  id: 'stable key generated as course_code:class_no',
  course_code: '课程代码',
  course_name: '课程名称',
  class_no: '班级/教学班号',
  teacher: '任课教师',
  credits: '学分',
  hours: '学时',
  level: '课程层次',
  degree_type: '学位类型',
  department: '开课单位',
  campus: '校区',
  schedule: '原始上课时间地点文本',
  syllabus_url: '课程相关公开 URL（若源数据存在）',
};
