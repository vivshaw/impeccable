/**
 * Anti-Pattern Browser Detector for Impeccable
 * GENERATED — do not edit. Source: detect-antipatterns-core.mjs + this wrapper.
 * Rebuild: node scripts/build-browser-detector.js
 *
 * Usage: <script src="detect-antipatterns-browser.js"></script>
 * Re-scan: window.impeccableScan()
 */
(function () {
  if (typeof window === 'undefined') return;

  const LABEL_BG = 'oklch(55% 0.25 350)';
  const OUTLINE_COLOR = 'oklch(60% 0.25 350)';

  // ===========================================================================
  // Core detection logic (injected from detect-antipatterns-core.mjs at build)
  // ===========================================================================

  // {{CORE_INJECTION_POINT}}

  // ===========================================================================
  // Browser-specific: DOM element adapters
  // ===========================================================================

  function resolveBackground(el) {
    let current = el;
    while (current && current.nodeType === 1) {
      const bg = parseRgb(getComputedStyle(current).backgroundColor);
      if (bg && bg.a > 0.1) return bg;
      current = current.parentElement;
    }
    return { r: 255, g: 255, b: 255 };
  }

  function checkElementBordersDOM(el) {
    const tag = el.tagName.toLowerCase();
    if (SAFE_TAGS.has(tag)) return [];
    const rect = el.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return [];
    const style = getComputedStyle(el);
    const sides = ['Top', 'Right', 'Bottom', 'Left'];
    const widths = {}, colors = {};
    for (const s of sides) {
      widths[s] = parseFloat(style[`border${s}Width`]) || 0;
      colors[s] = style[`border${s}Color`] || '';
    }
    return checkBorders(tag, widths, colors, parseFloat(style.borderRadius) || 0);
  }

  function checkElementColorsDOM(el) {
    const tag = el.tagName.toLowerCase();
    if (SAFE_TAGS.has(tag)) return [];
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return [];
    const style = getComputedStyle(el);
    const hasDirectText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    return checkColors({
      tag,
      textColor: parseRgb(style.color),
      bgColor: parseRgb(style.backgroundColor),
      effectiveBg: resolveBackground(el),
      fontSize: parseFloat(style.fontSize) || 16,
      fontWeight: parseInt(style.fontWeight) || 400,
      hasDirectText,
      bgClip: style.webkitBackgroundClip || style.backgroundClip || '',
      bgImage: style.backgroundImage || '',
      classList: el.getAttribute('class') || '',
    });
  }

  // ===========================================================================
  // Browser-specific: Page-level checks
  // ===========================================================================

  function checkTypography() {
    const findings = [];
    const fonts = new Set();
    const overusedFound = new Set();

    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules || sheet.rules; } catch { continue; }
      if (!rules) continue;
      for (const rule of rules) {
        if (rule.type !== 1) continue;
        const ff = rule.style?.fontFamily;
        if (!ff) continue;
        const stack = ff.split(',').map(f => f.trim().replace(/^['"]|['"]$/g, '').toLowerCase());
        const primary = stack.find(f => f && !GENERIC_FONTS.has(f));
        if (primary) {
          fonts.add(primary);
          if (OVERUSED_FONTS.has(primary)) overusedFound.add(primary);
        }
      }
    }

    const html = document.documentElement.outerHTML;
    const gfRe = /fonts\.googleapis\.com\/css2?\?family=([^&"'\s]+)/gi;
    let m;
    while ((m = gfRe.exec(html)) !== null) {
      for (const f of m[1].split('|').map(f => f.split(':')[0].replace(/\+/g, ' ').toLowerCase())) {
        fonts.add(f);
        if (OVERUSED_FONTS.has(f)) overusedFound.add(f);
      }
    }

    for (const font of overusedFound) {
      findings.push({ type: 'overused-font', detail: `Primary font: ${font}` });
    }
    if (fonts.size === 1 && document.querySelectorAll('*').length >= 20) {
      findings.push({ type: 'single-font', detail: `Only font: ${[...fonts][0]}` });
    }

    const sizes = new Set();
    for (const el of document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li,td,th,label,button,div')) {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs > 0 && fs < 200) sizes.add(Math.round(fs * 10) / 10);
    }
    if (sizes.size >= 3) {
      const sorted = [...sizes].sort((a, b) => a - b);
      const ratio = sorted[sorted.length - 1] / sorted[0];
      if (ratio < 2.0) {
        findings.push({ type: 'flat-type-hierarchy', detail: `Sizes: ${sorted.map(s => s + 'px').join(', ')} (ratio ${ratio.toFixed(1)}:1)` });
      }
    }

    return findings;
  }

  function isCardLikeDOM(el) {
    const tag = el.tagName.toLowerCase();
    if (SAFE_TAGS.has(tag) || ['input','select','textarea','img','video','canvas','picture'].includes(tag)) return false;
    const style = getComputedStyle(el);
    const cls = el.getAttribute('class') || '';
    const hasShadow = (style.boxShadow && style.boxShadow !== 'none') || /\bshadow(?:-sm|-md|-lg|-xl|-2xl)?\b/.test(cls);
    const hasBorder = /\bborder\b/.test(cls);
    const hasRadius = parseFloat(style.borderRadius) > 0 || /\brounded(?:-sm|-md|-lg|-xl|-2xl|-full)?\b/.test(cls);
    const hasBg = (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') || /\bbg-(?:white|gray-\d+|slate-\d+)\b/.test(cls);
    return isCardLikeFromProps(hasShadow, hasBorder, hasRadius, hasBg);
  }

  function checkLayout() {
    const findings = [];
    const flaggedEls = new Set();

    for (const el of document.querySelectorAll('*')) {
      if (!isCardLikeDOM(el) || flaggedEls.has(el)) continue;
      const cls = el.getAttribute('class') || '';
      const style = getComputedStyle(el);
      if (style.position === 'absolute' || style.position === 'fixed') continue;
      if (/\b(?:dropdown|popover|tooltip|menu|modal|dialog)\b/i.test(cls)) continue;
      if ((el.textContent?.trim().length || 0) < 10) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 30) continue;

      let parent = el.parentElement;
      while (parent) {
        if (isCardLikeDOM(parent)) { flaggedEls.add(el); break; }
        parent = parent.parentElement;
      }
    }

    for (const el of flaggedEls) {
      let isAncestor = false;
      for (const other of flaggedEls) {
        if (other !== el && el.contains(other)) { isAncestor = true; break; }
      }
      if (!isAncestor) findings.push({ type: 'nested-cards', detail: 'Card inside card', el });
    }

    return findings;
  }

  // ===========================================================================
  // Highlighting & UI
  // ===========================================================================

  const overlays = [];
  const TYPE_LABELS = {};
  for (const ap of ANTIPATTERNS) {
    TYPE_LABELS[ap.id] = ap.name.toLowerCase().substring(0, 20);
  }

  function highlight(el, findings) {
    const rect = el.getBoundingClientRect();
    const outline = document.createElement('div');
    outline.className = 'impeccable-overlay';
    Object.assign(outline.style, {
      position: 'absolute',
      top: `${rect.top + scrollY - 2}px`, left: `${rect.left + scrollX - 2}px`,
      width: `${rect.width + 4}px`, height: `${rect.height + 4}px`,
      border: `2px solid ${OUTLINE_COLOR}`, borderRadius: '4px',
      pointerEvents: 'none', zIndex: '99999', boxSizing: 'border-box',
    });

    const label = document.createElement('div');
    label.className = 'impeccable-label';
    label.textContent = findings.map(f => TYPE_LABELS[f.type || f.id] || f.type || f.id).join(', ');
    Object.assign(label.style, {
      position: 'absolute', top: '-20px', left: '0',
      background: LABEL_BG, color: 'white',
      fontSize: '11px', fontFamily: 'system-ui, sans-serif', fontWeight: '600',
      padding: '2px 8px', borderRadius: '3px', whiteSpace: 'nowrap',
      lineHeight: '16px', letterSpacing: '0.02em',
    });
    outline.appendChild(label);

    const tooltip = document.createElement('div');
    tooltip.className = 'impeccable-tooltip';
    tooltip.innerHTML = findings.map(f => f.detail || f.snippet).join('<br>');
    Object.assign(tooltip.style, {
      position: 'absolute', bottom: '-28px', left: '0',
      background: 'rgba(0,0,0,0.85)', color: '#e5e5e5',
      fontSize: '11px', fontFamily: 'ui-monospace, monospace',
      padding: '4px 8px', borderRadius: '3px', whiteSpace: 'nowrap',
      lineHeight: '16px', display: 'none', zIndex: '100000',
    });
    outline.appendChild(tooltip);

    outline.addEventListener('mouseenter', () => {
      outline.style.pointerEvents = 'auto';
      tooltip.style.display = 'block';
      outline.style.background = 'oklch(60% 0.25 350 / 0.08)';
    });
    outline.addEventListener('mouseleave', () => {
      outline.style.pointerEvents = 'none';
      tooltip.style.display = 'none';
      outline.style.background = 'none';
    });

    document.body.appendChild(outline);
    overlays.push(outline);
  }

  function showPageBanner(findings) {
    if (!findings.length) return;
    const banner = document.createElement('div');
    banner.className = 'impeccable-overlay';
    Object.assign(banner.style, {
      position: 'fixed', top: '0', left: '0', right: '0', zIndex: '100000',
      background: LABEL_BG, color: 'white',
      fontFamily: 'system-ui, sans-serif', fontSize: '13px',
      padding: '8px 16px', display: 'flex', flexWrap: 'wrap',
      gap: '12px', alignItems: 'center', pointerEvents: 'auto',
    });
    for (const f of findings) {
      const tag = document.createElement('span');
      tag.textContent = `${TYPE_LABELS[f.type] || f.type}: ${f.detail}`;
      Object.assign(tag.style, {
        background: 'rgba(255,255,255,0.15)', padding: '2px 8px',
        borderRadius: '3px', fontSize: '12px', fontFamily: 'ui-monospace, monospace',
      });
      banner.appendChild(tag);
    }
    const close = document.createElement('button');
    close.textContent = '\u00d7';
    Object.assign(close.style, {
      marginLeft: 'auto', background: 'none', border: 'none',
      color: 'white', fontSize: '18px', cursor: 'pointer', padding: '0 4px',
    });
    close.addEventListener('click', () => banner.remove());
    banner.appendChild(close);
    document.body.appendChild(banner);
    overlays.push(banner);
  }

  function printSummary(allFindings) {
    if (allFindings.length === 0) {
      console.log('%c[impeccable] No anti-patterns found.', 'color: #22c55e; font-weight: bold');
      return;
    }
    console.group(
      `%c[impeccable] ${allFindings.length} anti-pattern${allFindings.length === 1 ? '' : 's'} found`,
      'color: oklch(60% 0.25 350); font-weight: bold'
    );
    for (const { el, findings } of allFindings) {
      for (const f of findings) {
        console.log(`%c${f.type || f.id}%c ${f.detail || f.snippet}`,
          'color: oklch(55% 0.25 350); font-weight: bold', 'color: inherit', el);
      }
    }
    console.groupEnd();
  }

  // ===========================================================================
  // Main scan
  // ===========================================================================

  function scan() {
    for (const o of overlays) o.remove();
    overlays.length = 0;
    const allFindings = [];

    for (const el of document.querySelectorAll('*')) {
      if (el.classList.contains('impeccable-overlay') ||
          el.classList.contains('impeccable-label') ||
          el.classList.contains('impeccable-tooltip')) continue;

      const findings = [
        ...checkElementBordersDOM(el).map(f => ({ type: f.id, detail: f.snippet })),
        ...checkElementColorsDOM(el).map(f => ({ type: f.id, detail: f.snippet })),
      ];

      if (findings.length > 0) {
        highlight(el, findings);
        allFindings.push({ el, findings });
      }
    }

    const typoFindings = checkTypography();
    if (typoFindings.length > 0) {
      showPageBanner(typoFindings);
      allFindings.push({ el: document.body, findings: typoFindings });
    }

    const layoutFindings = checkLayout();
    for (const f of layoutFindings) {
      const el = f.el || document.body;
      delete f.el;
      highlight(el, [f]);
      allFindings.push({ el, findings: [f] });
    }

    printSummary(allFindings);
    return allFindings;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(scan, 100));
  } else {
    setTimeout(scan, 100);
  }

  window.impeccableScan = scan;
})();
