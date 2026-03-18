/**
 * Anti-Pattern Detection Core — shared between CLI and browser.
 *
 * All functions here are pure (no DOM/Node dependencies) and work in both
 * jsdom and real browser environments. They take primitive/data arguments,
 * not raw DOM elements.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SAFE_TAGS = new Set([
  'blockquote', 'nav', 'a', 'input', 'textarea', 'select',
  'pre', 'code', 'span', 'th', 'td', 'tr', 'li', 'label',
  'button', 'hr', 'html', 'head', 'body', 'script', 'style',
  'link', 'meta', 'title', 'br', 'img', 'svg', 'path', 'circle',
  'rect', 'line', 'polyline', 'polygon', 'g', 'defs', 'use',
]);

export const OVERUSED_FONTS = new Set([
  'inter', 'roboto', 'open sans', 'lato', 'montserrat', 'arial', 'helvetica',
]);

export const GENERIC_FONTS = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
  'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded',
  '-apple-system', 'blinkmacsystemfont', 'segoe ui',
  'inherit', 'initial', 'unset', 'revert',
]);

export const ANTIPATTERNS = [
  {
    id: 'side-tab',
    name: 'Side-tab accent border',
    description:
      'Thick colored border on one side of a card — the most recognizable tell of AI-generated UIs. Use a subtler accent or remove it entirely.',
  },
  {
    id: 'border-accent-on-rounded',
    name: 'Border accent on rounded element',
    description:
      'Thick accent border on a rounded card — the border clashes with the rounded corners. Remove the border or the border-radius.',
  },
  {
    id: 'overused-font',
    name: 'Overused font',
    description:
      'Inter, Roboto, Open Sans, Lato, Montserrat, and Arial are used on millions of sites. Choose a distinctive font that gives your interface personality.',
  },
  {
    id: 'single-font',
    name: 'Single font for everything',
    description:
      'Only one font family is used for the entire page. Pair a distinctive display font with a refined body font to create typographic hierarchy.',
  },
  {
    id: 'flat-type-hierarchy',
    name: 'Flat type hierarchy',
    description:
      'Font sizes are too close together — no clear visual hierarchy. Use fewer sizes with more contrast (aim for at least a 1.25 ratio between steps).',
  },
  {
    id: 'pure-black-white',
    name: 'Pure black background',
    description:
      'Pure #000000 as a background color looks harsh and unnatural. Tint it slightly toward your brand hue (e.g., oklch(12% 0.01 250)) for a more refined feel.',
  },
  {
    id: 'gray-on-color',
    name: 'Gray text on colored background',
    description:
      'Gray text looks washed out on colored backgrounds. Use a darker shade of the background color instead, or white/near-white for contrast.',
  },
  {
    id: 'low-contrast',
    name: 'Low contrast text',
    description:
      'Text does not meet WCAG AA contrast requirements (4.5:1 for body, 3:1 for large text). Increase the contrast between text and background.',
  },
  {
    id: 'gradient-text',
    name: 'Gradient text',
    description:
      'Gradient text is decorative rather than meaningful — a common AI tell, especially on headings and metrics. Use solid colors for text.',
  },
  {
    id: 'ai-color-palette',
    name: 'AI color palette',
    description:
      'Purple/violet gradients and cyan-on-dark are the most recognizable tells of AI-generated UIs. Choose a distinctive, intentional palette.',
  },
  {
    id: 'nested-cards',
    name: 'Nested cards',
    description:
      'Cards inside cards create visual noise and excessive depth. Flatten the hierarchy — use spacing, typography, and dividers instead of nesting containers.',
  },
  {
    id: 'monotonous-spacing',
    name: 'Monotonous spacing',
    description:
      'The same spacing value used everywhere — no rhythm, no variation. Use tight groupings for related items and generous separations between sections.',
  },
  {
    id: 'everything-centered',
    name: 'Everything centered',
    description:
      'Every text element is center-aligned. Left-aligned text with asymmetric layouts feels more designed. Center only hero sections and CTAs.',
  },
];

// ---------------------------------------------------------------------------
// Color utilities
// ---------------------------------------------------------------------------

export function isNeutralColor(color) {
  if (!color || color === 'transparent') return true;
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return true;
  return (Math.max(+m[1], +m[2], +m[3]) - Math.min(+m[1], +m[2], +m[3])) < 30;
}

export function parseRgb(color) {
  if (!color || color === 'transparent') return null;
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
}

export function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(c1, c2) {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function hasChroma(c, threshold = 30) {
  if (!c) return false;
  return (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)) >= threshold;
}

export function getHue(c) {
  if (!c) return 0;
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return Math.round(h * 360);
}

export function colorToHex(c) {
  if (!c) return '?';
  return '#' + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Element-level detection (pure: takes data, not DOM elements)
// ---------------------------------------------------------------------------

/**
 * Check border widths/colors/radius for side-tab and accent-on-rounded patterns.
 * @param {string} tag  Element tag name (lowercase)
 * @param {{ Top: number, Right: number, Bottom: number, Left: number }} widths  Border widths in px
 * @param {{ Top: string, Right: string, Bottom: string, Left: string }} colors  Border colors as rgb() strings
 * @param {number} radius  Border radius in px
 * @returns {Array<{ id: string, snippet: string }>}
 */
export function checkBorders(tag, widths, colors, radius) {
  if (SAFE_TAGS.has(tag)) return [];
  const findings = [];
  const sides = ['Top', 'Right', 'Bottom', 'Left'];

  for (const side of sides) {
    const w = widths[side];
    if (w < 1 || isNeutralColor(colors[side])) continue;

    const otherSides = sides.filter(s => s !== side);
    const maxOther = Math.max(...otherSides.map(s => widths[s]));
    if (!(w >= 2 && (maxOther <= 1 || w >= maxOther * 2))) continue;

    const sn = side.toLowerCase();
    const isSide = side === 'Left' || side === 'Right';

    if (isSide) {
      if (radius > 0) findings.push({ id: 'side-tab', snippet: `border-${sn}: ${w}px + border-radius: ${radius}px` });
      else if (w >= 3) findings.push({ id: 'side-tab', snippet: `border-${sn}: ${w}px` });
    } else {
      if (radius > 0 && w >= 2) findings.push({ id: 'border-accent-on-rounded', snippet: `border-${sn}: ${w}px + border-radius: ${radius}px` });
    }
  }

  return findings;
}

/**
 * Check colors for anti-patterns given pre-extracted data.
 * @param {object} opts
 * @param {string} opts.tag
 * @param {object|null} opts.textColor  Parsed RGB
 * @param {object|null} opts.bgColor   Parsed RGB (direct background)
 * @param {object} opts.effectiveBg    Resolved background (walked ancestors)
 * @param {number} opts.fontSize       In px
 * @param {number} opts.fontWeight
 * @param {boolean} opts.hasDirectText
 * @param {string} opts.bgClip         Computed background-clip value
 * @param {string} opts.bgImage        Computed background-image value
 * @param {string} opts.classList       Raw class attribute string
 * @returns {Array<{ id: string, snippet: string }>}
 */
export function checkColors(opts) {
  const { tag, textColor, bgColor, effectiveBg, fontSize, fontWeight, hasDirectText, bgClip, bgImage, classList } = opts;
  if (SAFE_TAGS.has(tag)) return [];
  const findings = [];

  // Pure black background
  if (bgColor && bgColor.a > 0.1 && bgColor.r === 0 && bgColor.g === 0 && bgColor.b === 0) {
    findings.push({ id: 'pure-black-white', snippet: '#000000 background' });
  }

  if (hasDirectText && textColor) {
    // Gray on colored background
    const textLum = relativeLuminance(textColor);
    const isGray = !hasChroma(textColor, 20) && textLum > 0.05 && textLum < 0.85;
    if (isGray && hasChroma(effectiveBg, 40)) {
      findings.push({ id: 'gray-on-color', snippet: `text ${colorToHex(textColor)} on bg ${colorToHex(effectiveBg)}` });
    }

    // Low contrast (WCAG AA)
    const ratio = contrastRatio(textColor, effectiveBg);
    const isHeading = ['h1', 'h2', 'h3'].includes(tag);
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700) || isHeading;
    const threshold = isLargeText ? 3.0 : 4.5;
    if (ratio < threshold) {
      findings.push({ id: 'low-contrast', snippet: `${ratio.toFixed(1)}:1 (need ${threshold}:1) — text ${colorToHex(textColor)} on ${colorToHex(effectiveBg)}` });
    }

    // AI palette: purple/violet on headings
    if (hasChroma(textColor, 50)) {
      const hue = getHue(textColor);
      if (hue >= 260 && hue <= 310 && (['h1', 'h2', 'h3'].includes(tag) || fontSize >= 20)) {
        findings.push({ id: 'ai-color-palette', snippet: `Purple/violet text (${colorToHex(textColor)}) on heading` });
      }
    }
  }

  // Gradient text
  if (bgClip === 'text' && bgImage && bgImage.includes('gradient')) {
    findings.push({ id: 'gradient-text', snippet: 'background-clip: text + gradient' });
  }

  // Tailwind class checks
  if (classList) {
    if (/\bbg-black\b/.test(classList)) {
      findings.push({ id: 'pure-black-white', snippet: 'bg-black' });
    }

    const grayMatch = classList.match(/\btext-(?:gray|slate|zinc|neutral|stone)-\d+\b/);
    const colorBgMatch = classList.match(/\bbg-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+\b/);
    if (grayMatch && colorBgMatch) {
      findings.push({ id: 'gray-on-color', snippet: `${grayMatch[0]} on ${colorBgMatch[0]}` });
    }

    if (/\bbg-clip-text\b/.test(classList) && /\bbg-gradient-to-/.test(classList)) {
      findings.push({ id: 'gradient-text', snippet: 'bg-clip-text + bg-gradient (Tailwind)' });
    }

    const purpleText = classList.match(/\btext-(?:purple|violet|indigo)-\d+\b/);
    if (purpleText && (['h1', 'h2', 'h3'].includes(tag) || /\btext-(?:[2-9]xl)\b/.test(classList))) {
      findings.push({ id: 'ai-color-palette', snippet: `${purpleText[0]} on heading` });
    }

    if (/\bfrom-(?:purple|violet|indigo)-\d+\b/.test(classList) && /\bto-(?:purple|violet|indigo|blue|cyan|pink|fuchsia)-\d+\b/.test(classList)) {
      findings.push({ id: 'ai-color-palette', snippet: 'Purple/violet gradient (Tailwind)' });
    }
  }

  return findings;
}

/**
 * Check if an element's properties make it "card-like".
 */
export function isCardLikeFromProps(hasShadow, hasBorder, hasRadius, hasBg) {
  if (!hasShadow && !hasBorder) return false;
  return hasRadius || hasBg;
}
