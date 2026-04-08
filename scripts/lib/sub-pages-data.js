/**
 * Build the data model used by the skill / anti-pattern / tutorial page
 * generators.
 *
 * Single source of truth:
 * - source/skills/{id}/SKILL.md          → skill frontmatter + body
 * - source/skills/{id}/reference/*.md     → skill reference files
 * - src/detect-antipatterns.mjs           → ANTIPATTERNS array (parsed)
 * - content/site/skills/{id}.md           → optional editorial wrapper
 * - content/site/tutorials/{slug}.md       → full tutorial content
 */

import fs from 'node:fs';
import path from 'node:path';
import { readSourceFiles, parseFrontmatter } from './utils.js';

/**
 * Skills that should be excluded from the index and not get a detail page.
 * These are deprecated shims or internal skills that users shouldn't browse.
 */
const EXCLUDED_SKILLS = new Set([
  'frontend-design',   // deprecated, renamed to impeccable
  'teach-impeccable',  // deprecated, folded into /impeccable teach
]);

/**
 * Hand-curated category map for user-invocable skills.
 * Mirrors public/js/data.js commandCategories. Validated below: the
 * generator fails if any user-invocable skill is missing from this map.
 */
const SKILL_CATEGORIES = {
  // CREATE - build something new
  impeccable: 'create',
  shape: 'create',
  overdrive: 'create',
  // EVALUATE - review and assess
  critique: 'evaluate',
  audit: 'evaluate',
  // REFINE - improve existing design
  typeset: 'refine',
  arrange: 'refine',
  colorize: 'refine',
  animate: 'refine',
  delight: 'refine',
  bolder: 'refine',
  quieter: 'refine',
  onboard: 'refine',
  // SIMPLIFY - reduce and clarify
  distill: 'simplify',
  clarify: 'simplify',
  adapt: 'simplify',
  // HARDEN - production-ready
  normalize: 'harden',
  polish: 'harden',
  optimize: 'harden',
  harden: 'harden',
  // SYSTEM - setup and tooling
  extract: 'system',
};

export const CATEGORY_ORDER = ['create', 'evaluate', 'refine', 'simplify', 'harden', 'system'];

export const CATEGORY_LABELS = {
  create: 'Create',
  evaluate: 'Evaluate',
  refine: 'Refine',
  simplify: 'Simplify',
  harden: 'Harden',
  system: 'System',
};

export const CATEGORY_DESCRIPTIONS = {
  create: 'Build something new, from a blank page to a working feature.',
  evaluate: 'Review what you have. Score it, critique it, find what to fix.',
  refine: 'Improve one dimension at a time: type, layout, color, motion.',
  simplify: 'Strip complexity. Remove what does not earn its place.',
  harden: 'Make it production-ready. Edge cases, performance, polish.',
  system: 'Setup and tooling. Design system work, extraction, organization.',
};

/**
 * Parse the ANTIPATTERNS array out of src/detect-antipatterns.mjs.
 * Mirrors the trick in scripts/build.js validateAntipatternRules() so we
 * don't have to run the browser-only module.
 */
export function readAntipatternRules(rootDir) {
  const detectPath = path.join(rootDir, 'src/detect-antipatterns.mjs');
  const src = fs.readFileSync(detectPath, 'utf-8');
  const match = src.match(/const ANTIPATTERNS = \[([\s\S]*?)\n\];/);
  if (!match) {
    throw new Error(`Could not extract ANTIPATTERNS from ${detectPath}`);
  }
  // eslint-disable-next-line no-new-func
  return new Function(`return [${match[1]}]`)();
}

/**
 * Read an optional editorial wrapper file for a skill or tutorial.
 * Returns { frontmatter, body } or null if the file doesn't exist.
 */
export function readEditorialWrapper(contentDir, kind, slug) {
  const filePath = path.join(contentDir, kind, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseFrontmatter(content);
}

/**
 * Build the full sub-page data model.
 *
 * @param {string} rootDir - repo root
 * @returns {{
 *   skills: Array,
 *   skillsByCategory: Record<string, Array>,
 *   knownSkillIds: Set<string>,
 *   rules: Array,
 *   tutorials: Array,
 * }}
 */
export function buildSubPageData(rootDir) {
  const { skills: rawSkills } = readSourceFiles(rootDir);
  const contentDir = path.join(rootDir, 'content/site');

  // Filter to user-invocable, non-deprecated skills.
  const skills = rawSkills
    .filter((s) => s.userInvocable && !EXCLUDED_SKILLS.has(s.name))
    .map((s) => {
      const category = SKILL_CATEGORIES[s.name];
      const editorial = readEditorialWrapper(contentDir, 'skills', s.name);
      return {
        id: s.name,
        name: s.name,
        description: s.description,
        argumentHint: s.argumentHint,
        category,
        body: s.body,
        references: s.references,
        editorial, // may be null
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Validate the category map covers every user-invocable skill.
  const missing = skills.filter((s) => !s.category).map((s) => s.id);
  if (missing.length > 0) {
    throw new Error(
      `SKILL_CATEGORIES in scripts/lib/sub-pages-data.js is missing entries for: ${missing.join(', ')}`,
    );
  }

  const knownSkillIds = new Set(skills.map((s) => s.id));

  const skillsByCategory = {};
  for (const cat of CATEGORY_ORDER) skillsByCategory[cat] = [];
  for (const skill of skills) skillsByCategory[skill.category].push(skill);

  // Anti-pattern rules, grouped for the index.
  const rules = readAntipatternRules(rootDir);

  // Tutorials: each required file in content/site/tutorials/.
  const tutorialsDir = path.join(contentDir, 'tutorials');
  const tutorials = [];
  if (fs.existsSync(tutorialsDir)) {
    const files = fs.readdirSync(tutorialsDir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const slug = path.basename(file, '.md');
      const raw = fs.readFileSync(path.join(tutorialsDir, file), 'utf-8');
      const { frontmatter, body } = parseFrontmatter(raw);
      tutorials.push({
        slug,
        title: frontmatter.title || slug,
        description: frontmatter.description || '',
        tagline: frontmatter.tagline || '',
        order: frontmatter.order ? Number(frontmatter.order) : 99,
        body,
      });
    }
    tutorials.sort((a, b) => a.order - b.order);
  }

  return {
    skills,
    skillsByCategory,
    knownSkillIds,
    rules,
    tutorials,
  };
}
