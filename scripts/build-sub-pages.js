/**
 * Generate static HTML files for /skills, /anti-patterns, /tutorials.
 *
 * Called from both scripts/build.js (before buildStaticSite) and
 * server/index.js (at module load), so dev and prod share the same
 * code path and output shape.
 *
 * Output lives under public/skills/, public/anti-patterns/,
 * public/tutorials/, all gitignored. Bun's HTML loader picks them up
 * the same way it picks up the hand-authored pages.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  buildSubPageData,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
} from './lib/sub-pages-data.js';
import { renderMarkdown, slugify } from './lib/render-markdown.js';
import { renderPage } from './lib/render-page.js';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render one skill detail page HTML body (without the site shell).
 */
function renderSkillDetail(skill, knownSkillIds) {
  const bodyHtml = renderMarkdown(skill.body, {
    knownSkillIds,
    currentSkillId: skill.id,
  });

  const editorialHtml = skill.editorial
    ? renderMarkdown(skill.editorial.body, { knownSkillIds, currentSkillId: skill.id })
    : '';

  const tagline = skill.editorial?.frontmatter?.tagline || skill.description;
  const categoryLabel = CATEGORY_LABELS[skill.category] || skill.category;

  // Reference files as collapsible <details> blocks
  let referencesHtml = '';
  if (skill.references && skill.references.length > 0) {
    const refs = skill.references
      .map((ref) => {
        const slug = slugify(ref.name);
        const refBody = renderMarkdown(ref.content, {
          knownSkillIds,
          currentSkillId: skill.id,
        });
        const title = ref.name
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        return `
<details class="skill-reference" id="reference-${slug}">
  <summary><span class="skill-reference-label">Reference</span><span class="skill-reference-title">${escapeHtml(title)}</span></summary>
  <div class="prose skill-reference-body">
${refBody}
  </div>
</details>`;
      })
      .join('\n');
    referencesHtml = `
<section class="skill-references" aria-label="Reference material">
  <h2 class="skill-references-heading">Deeper reference</h2>
  ${refs}
</section>`;
  }

  const metaStrip = `
<div class="skill-meta-strip">
  <span class="skill-meta-chip skill-meta-category" data-category="${skill.category}">${escapeHtml(categoryLabel)}</span>
  <span class="skill-meta-chip">User-invocable</span>
  ${skill.argumentHint ? `<span class="skill-meta-chip skill-meta-args">${escapeHtml(skill.argumentHint)}</span>` : ''}
</div>`;

  return `
<article class="skill-detail">
  <header class="skill-detail-header">
    <p class="skill-detail-eyebrow"><a href="/skills">Skills</a> / ${escapeHtml(categoryLabel)}</p>
    <h1 class="skill-detail-title"><span class="skill-detail-title-slash">/</span>${escapeHtml(skill.id)}</h1>
    <p class="skill-detail-tagline">${escapeHtml(tagline)}</p>
    ${metaStrip}
  </header>

  ${editorialHtml ? `<section class="skill-detail-editorial prose">\n${editorialHtml}\n</section>` : ''}

  <section class="skill-source-card">
    <header class="skill-source-card-header">
      <span class="skill-source-card-label">SKILL.md</span>
      <span class="skill-source-card-subtitle">The canonical skill definition your AI harness loads.</span>
    </header>
    <div class="skill-source-card-body prose">
${bodyHtml}
    </div>
  </section>

  ${referencesHtml}
</article>
`;
}

/**
 * Render the left sidebar used across the /skills section.
 * Shows every skill grouped by category. Pass the current skill id to
 * mark it with aria-current="page".
 */
function renderSkillsSidebar(skillsByCategory, currentSkillId = null) {
  let html = `
<aside class="skills-sidebar" aria-label="All skills">
  <div class="skills-sidebar-inner">
    <p class="skills-sidebar-label">Skills</p>
`;

  for (const category of CATEGORY_ORDER) {
    const list = skillsByCategory[category] || [];
    if (list.length === 0) continue;
    html += `
    <div class="skills-sidebar-group" data-category="${category}">
      <p class="skills-sidebar-group-title">${escapeHtml(CATEGORY_LABELS[category])}</p>
      <ul class="skills-sidebar-list">
${list
  .map((s) => {
    const current = s.id === currentSkillId ? ' aria-current="page"' : '';
    return `        <li><a href="/skills/${s.id}"${current}>/${escapeHtml(s.id)}</a></li>`;
  })
  .join('\n')}
      </ul>
    </div>
`;
  }

  html += `
  </div>
</aside>`;
  return html;
}

/**
 * Render the /skills overview main column content (not the sidebar).
 * This is the orientation piece: what skills are, how to pick one,
 * the six categories explained with inline cross-links to detail pages.
 */
function renderSkillsOverviewMain(skillsByCategory) {
  const totalSkills = Object.values(skillsByCategory).reduce(
    (sum, list) => sum + list.length,
    0,
  );

  let categoriesHtml = '';
  for (const category of CATEGORY_ORDER) {
    const list = skillsByCategory[category] || [];
    if (list.length === 0) continue;

    const skillChips = list
      .map(
        (s) =>
          `<a class="skills-overview-chip" href="/skills/${s.id}">/${escapeHtml(s.id)}</a>`,
      )
      .join('');

    categoriesHtml += `
    <section class="skills-overview-category" data-category="${category}" id="category-${category}">
      <div class="skills-overview-category-meta">
        <h2 class="skills-overview-category-title">${escapeHtml(CATEGORY_LABELS[category])}</h2>
        <p class="skills-overview-category-count">${list.length} ${list.length === 1 ? 'skill' : 'skills'}</p>
      </div>
      <p class="skills-overview-category-desc">${escapeHtml(CATEGORY_DESCRIPTIONS[category])}</p>
      <div class="skills-overview-chips">
${skillChips}
      </div>
    </section>
`;
  }

  return `
<div class="skills-overview-content">
  <header class="skills-overview-header">
    <p class="sub-page-eyebrow">${totalSkills} commands</p>
    <h1 class="sub-page-title">Skills</h1>
    <p class="sub-page-lede">One skill, <a href="/skills/impeccable">/impeccable</a>, teaches your AI design. Twenty commands steer the result. Each command does one job with an opinion about what good looks like.</p>
  </header>

  <section class="skills-overview-howto">
    <h2 class="skills-overview-howto-title">How to pick one</h2>
    <p>Skills are named after the intent you bring to them. Reviewing something? <a href="/skills/critique">/critique</a> or <a href="/skills/audit">/audit</a>. Fixing type? <a href="/skills/typeset">/typeset</a>. Last-mile pass before shipping? <a href="/skills/polish">/polish</a>. The categories below group skills by the job.</p>
  </section>

  <div class="skills-overview-categories">
${categoriesHtml}
  </div>
</div>`;
}

/**
 * Wrap sidebar + main content in the docs-browser layout shell.
 */
function wrapInDocsLayout(sidebarHtml, mainHtml) {
  return `
<div class="skills-layout">
  ${sidebarHtml}
  <div class="skills-main">
${mainHtml}
  </div>
</div>`;
}

/**
 * Group anti-pattern rules by skill section.
 * Rules without a skillSection fall into a 'General quality' bucket.
 */
function groupRulesBySection(rules) {
  const order = [
    'Visual Details',
    'Typography',
    'Color & Contrast',
    'Layout & Space',
    'Motion',
    'General quality',
  ];
  const bySection = {};
  for (const name of order) bySection[name] = [];
  for (const rule of rules) {
    const section = rule.skillSection || 'General quality';
    if (!bySection[section]) bySection[section] = [];
    bySection[section].push(rule);
  }
  // Sort each bucket: slop first (they're the named tells), then quality.
  for (const name of Object.keys(bySection)) {
    bySection[name].sort((a, b) => {
      if (a.category !== b.category) return a.category === 'slop' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }
  return { order, bySection };
}

/**
 * Render the anti-patterns sidebar: a table of contents of rule sections
 * with per-section rule counts. Every entry anchor-jumps to the section
 * in the main column.
 */
function renderAntiPatternsSidebar(grouped) {
  const entries = grouped.order
    .filter((section) => grouped.bySection[section]?.length > 0)
    .map((section) => {
      const slug = slugify(section);
      const count = grouped.bySection[section].length;
      return `        <li><a href="#section-${slug}"><span>${escapeHtml(section)}</span><span class="anti-patterns-sidebar-count">${count}</span></a></li>`;
    })
    .join('\n');

  return `
<aside class="skills-sidebar anti-patterns-sidebar" aria-label="Anti-pattern sections">
  <div class="skills-sidebar-inner">
    <p class="skills-sidebar-label">Sections</p>
    <div class="skills-sidebar-group">
      <ul class="skills-sidebar-list anti-patterns-sidebar-list">
${entries}
      </ul>
    </div>
  </div>
</aside>`;
}

/**
 * Render one rule card inside the anti-patterns main column.
 */
function renderRuleCard(rule) {
  const categoryLabel = rule.category === 'slop' ? 'AI slop' : 'Quality';
  const skillLink = rule.skillSection
    ? `<a class="rule-card-skill-link" href="/skills/impeccable#${slugify(rule.skillSection)}">See in /impeccable</a>`
    : '';
  return `
    <article class="rule-card" id="rule-${rule.id}">
      <div class="rule-card-head">
        <code class="rule-card-id">${escapeHtml(rule.id)}</code>
        <span class="rule-card-category" data-category="${rule.category}">${categoryLabel}</span>
      </div>
      <h3 class="rule-card-name">${escapeHtml(rule.name)}</h3>
      <p class="rule-card-desc">${escapeHtml(rule.description)}</p>
      ${skillLink}
    </article>`;
}

/**
 * Render the tutorials sidebar: list of tutorial pages in order, with
 * the current tutorial marked via aria-current.
 */
function renderTutorialsSidebar(tutorials, currentSlug = null) {
  const entries = tutorials
    .map((t) => {
      const current = t.slug === currentSlug ? ' aria-current="page"' : '';
      return `        <li><a href="/tutorials/${t.slug}"${current}>${escapeHtml(t.title)}</a></li>`;
    })
    .join('\n');

  return `
<aside class="skills-sidebar tutorials-sidebar" aria-label="Tutorials">
  <div class="skills-sidebar-inner">
    <p class="skills-sidebar-label">Tutorials</p>
    <div class="skills-sidebar-group">
      <p class="skills-sidebar-group-title">Walk-throughs</p>
      <ul class="skills-sidebar-list">
${entries}
      </ul>
    </div>
  </div>
</aside>`;
}

/**
 * Render the /tutorials index main content.
 */
function renderTutorialsIndexMain(tutorials) {
  const cards = tutorials
    .map(
      (t) => `
    <a class="tutorial-card" href="/tutorials/${t.slug}">
      <span class="tutorial-card-number">${String(t.order).padStart(2, '0')}</span>
      <div class="tutorial-card-body">
        <h2 class="tutorial-card-title">${escapeHtml(t.title)}</h2>
        <p class="tutorial-card-tagline">${escapeHtml(t.tagline || t.description)}</p>
      </div>
      <span class="tutorial-card-arrow">→</span>
    </a>`,
    )
    .join('\n');

  return `
<div class="tutorials-content">
  <header class="sub-page-header">
    <p class="sub-page-eyebrow">${tutorials.length} walk-throughs</p>
    <h1 class="sub-page-title">Tutorials</h1>
    <p class="sub-page-lede">Short, opinionated walk-throughs of the highest-leverage workflows. Each one takes around ten minutes and ends with something working in your project.</p>
  </header>

  <div class="tutorial-cards">
${cards}
  </div>
</div>`;
}

/**
 * Render a tutorial detail page main content.
 */
function renderTutorialDetail(tutorial, knownSkillIds) {
  const bodyHtml = renderMarkdown(tutorial.body, { knownSkillIds });
  return `
<article class="tutorial-detail">
  <header class="tutorial-detail-header">
    <p class="skill-detail-eyebrow"><a href="/tutorials">Tutorials</a> / ${String(tutorial.order).padStart(2, '0')}</p>
    <h1 class="tutorial-detail-title">${escapeHtml(tutorial.title)}</h1>
    ${tutorial.tagline ? `<p class="tutorial-detail-tagline">${escapeHtml(tutorial.tagline)}</p>` : ''}
  </header>

  <section class="tutorial-detail-body prose">
${bodyHtml}
  </section>
</article>`;
}

/**
 * Render the /anti-patterns main column content.
 */
function renderAntiPatternsMain(grouped, totalRules) {
  let sectionsHtml = '';
  for (const section of grouped.order) {
    const rules = grouped.bySection[section] || [];
    if (rules.length === 0) continue;
    const slug = slugify(section);
    sectionsHtml += `
    <section class="anti-patterns-section" id="section-${slug}">
      <header class="anti-patterns-section-header">
        <h2 class="anti-patterns-section-title">${escapeHtml(section)}</h2>
        <p class="anti-patterns-section-count">${rules.length} ${rules.length === 1 ? 'rule' : 'rules'}</p>
      </header>
      <div class="rule-card-grid">
${rules.map(renderRuleCard).join('\n')}
      </div>
    </section>`;
  }

  return `
<div class="anti-patterns-content">
  <header class="anti-patterns-header">
    <p class="sub-page-eyebrow">${totalRules} detection rules</p>
    <h1 class="sub-page-title">Anti-patterns</h1>
    <p class="sub-page-lede">These are the visible tells of AI-generated interfaces. Every rule in this catalog is implemented as a deterministic check in <code>npx impeccable detect</code> and in the browser extension. Run <a href="/skills/critique">/critique</a> on any page to see which ones it triggers.</p>
  </header>

  <section class="anti-patterns-legend">
    <h2 class="anti-patterns-legend-title">How to read this</h2>
    <p>Rules are grouped by the section of the <a href="/skills/impeccable">/impeccable</a> skill that teaches the pattern to avoid. <strong>AI slop</strong> rules flag the specific visual tells (gradient text, purple palettes, side-tab borders, nested cards). <strong>Quality</strong> rules flag general design mistakes that are not AI-specific but still hurt the work.</p>
  </section>

  <div class="anti-patterns-sections">
${sectionsHtml}
  </div>
</div>`;
}

/**
 * Entry point. Generates all sub-page HTML files.
 *
 * @param {string} rootDir
 * @returns {Promise<{ files: string[] }>} list of generated file paths (absolute)
 */
export async function generateSubPages(rootDir) {
  const data = buildSubPageData(rootDir);
  const outDirs = {
    skills: path.join(rootDir, 'public/skills'),
    antiPatterns: path.join(rootDir, 'public/anti-patterns'),
    tutorials: path.join(rootDir, 'public/tutorials'),
  };

  // Fresh output dirs each time so stale files don't linger.
  for (const dir of Object.values(outDirs)) {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
  }

  const generated = [];

  // Skills index: docs-browser layout with sticky sidebar.
  {
    const sidebar = renderSkillsSidebar(data.skillsByCategory, null);
    const main = renderSkillsOverviewMain(data.skillsByCategory);
    const html = renderPage({
      title: 'Skills | Impeccable',
      description:
        '21 commands that teach your AI harness how to design. Browse by category: create, evaluate, refine, simplify, harden, system.',
      bodyHtml: wrapInDocsLayout(sidebar, main),
      activeNav: 'skills',
      canonicalPath: '/skills',
      bodyClass: 'sub-page skills-layout-page',
    });
    const out = path.join(outDirs.skills, 'index.html');
    fs.writeFileSync(out, html, 'utf-8');
    generated.push(out);
  }

  // Skills detail pages: same docs-browser shell as the overview.
  for (const skill of data.skills) {
    const sidebar = renderSkillsSidebar(data.skillsByCategory, skill.id);
    const main = renderSkillDetail(skill, data.knownSkillIds);
    const title = `/${skill.id} | Impeccable`;
    const description = skill.editorial?.frontmatter?.tagline || skill.description;
    const html = renderPage({
      title,
      description,
      bodyHtml: wrapInDocsLayout(sidebar, main),
      activeNav: 'skills',
      canonicalPath: `/skills/${skill.id}`,
      bodyClass: 'sub-page skills-layout-page',
    });
    const out = path.join(outDirs.skills, `${skill.id}.html`);
    fs.writeFileSync(out, html, 'utf-8');
    generated.push(out);
  }

  // Anti-patterns index: single page, docs-browser shell with TOC sidebar.
  {
    const grouped = groupRulesBySection(data.rules);
    const sidebar = renderAntiPatternsSidebar(grouped);
    const main = renderAntiPatternsMain(grouped, data.rules.length);
    const html = renderPage({
      title: 'Anti-patterns | Impeccable',
      description: `${data.rules.length} deterministic detection rules that flag the visible tells of AI-generated interfaces and common quality issues. Used by npx impeccable detect and the browser extension.`,
      bodyHtml: wrapInDocsLayout(sidebar, main),
      activeNav: 'anti-patterns',
      canonicalPath: '/anti-patterns',
      bodyClass: 'sub-page skills-layout-page anti-patterns-page',
    });
    const out = path.join(outDirs.antiPatterns, 'index.html');
    fs.writeFileSync(out, html, 'utf-8');
    generated.push(out);
  }

  // Tutorials index.
  if (data.tutorials.length > 0) {
    const sidebar = renderTutorialsSidebar(data.tutorials, null);
    const main = renderTutorialsIndexMain(data.tutorials);
    const html = renderPage({
      title: 'Tutorials | Impeccable',
      description: `${data.tutorials.length} short, opinionated walk-throughs of the highest-leverage Impeccable workflows.`,
      bodyHtml: wrapInDocsLayout(sidebar, main),
      activeNav: 'tutorials',
      canonicalPath: '/tutorials',
      bodyClass: 'sub-page skills-layout-page tutorials-page',
    });
    const out = path.join(outDirs.tutorials, 'index.html');
    fs.writeFileSync(out, html, 'utf-8');
    generated.push(out);
  }

  // Tutorial detail pages.
  for (const tutorial of data.tutorials) {
    const sidebar = renderTutorialsSidebar(data.tutorials, tutorial.slug);
    const main = renderTutorialDetail(tutorial, data.knownSkillIds);
    const html = renderPage({
      title: `${tutorial.title} | Tutorials | Impeccable`,
      description: tutorial.description || tutorial.tagline || '',
      bodyHtml: wrapInDocsLayout(sidebar, main),
      activeNav: 'tutorials',
      canonicalPath: `/tutorials/${tutorial.slug}`,
      bodyClass: 'sub-page skills-layout-page tutorials-page',
    });
    const out = path.join(outDirs.tutorials, `${tutorial.slug}.html`);
    fs.writeFileSync(out, html, 'utf-8');
    generated.push(out);
  }

  return { files: generated };
}
