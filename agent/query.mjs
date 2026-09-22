#!/usr/bin/env node
import { buildFacets, COURSE_SCHEMA, filterCourses, loadCourses, paginate } from './lib.mjs';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2).replaceAll('-', '_');
    if (['help', 'facets', 'schema', 'jsonl'].includes(key)) out[key] = true;
    else out[key] = argv[++i];
  }
  return out;
}

function printHelp() {
  console.log(`Usage: node agent/query.mjs [options]\n\nFilters:\n  --q TEXT\n  --teacher TEXT\n  --campus TEXT\n  --department TEXT\n  --level TEXT\n  --degree-type TEXT\n  --day 1..7|周一..周日\n  --week N\n  --period N\n  --limit N            default 20, max 200\n  --offset N\n\nModes:\n  --facets             list available filter values\n  --schema             print normalized schema\n  --jsonl              emit one JSON object per line\n  --help\n\nEnvironment:\n  COURSES_HTML=/path/to/index.html\n`);
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

const courses = await loadCourses();
if (args.schema) {
  console.log(JSON.stringify(COURSE_SCHEMA, null, 2));
  process.exit(0);
}
if (args.facets) {
  console.log(JSON.stringify(buildFacets(courses), null, 2));
  process.exit(0);
}

const filtered = filterCourses(courses, args);
const page = paginate(filtered, args);
if (args.jsonl) {
  for (const row of page.results) console.log(JSON.stringify(row));
} else {
  console.log(JSON.stringify(page, null, 2));
}
