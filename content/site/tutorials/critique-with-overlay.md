---
title: Critique with the visual overlay
tagline: "Use /critique plus the browser overlay to review a live page with ground truth."
order: 2
description: "Run a full design critique that combines LLM assessment, the automated detector, and a live browser overlay so you can see exactly which elements trigger which anti-patterns on the page you're looking at."
---

## What you'll build

You will run a complete design critique against a live page in your browser, with every flagged anti-pattern highlighted directly on the element that caused it. No screenshots, no guesswork, no paragraph of findings you have to map back to the code.

Total time: about ten minutes.

## Prerequisites

- Impeccable installed in your project (see [getting started](/tutorials/getting-started) if you have not).
- A harness with browser automation available (Claude Code with the Chrome extension, or similar).
- A page you want to critique, either local (`localhost:3000/pricing`) or deployed.

## Step 1. Run /critique

From your harness, run:

```
/critique the pricing page at localhost:3000/pricing
```

The skill kicks off two independent assessments in parallel. Do not skip the "independent" part. They are in separate sub-agents or separate tabs so one does not bias the other.

### What the LLM assessment does

The first assessment reads your source code and, if browser automation is available, opens the live page in a new tab. It walks the full impeccable skill DO/DON'T catalog and scores the page against Nielsen's 10 heuristics, the 8-item cognitive load checklist, and the brand fit from your `.impeccable.md`.

It labels the tab it opens with `[LLM]` in the title so you can tell which one is which.

### What the automated detector does

The second assessment runs `npx impeccable detect` against the page. This is deterministic: 25 specific pattern checks that fire or do not fire. Gradient text, purple palettes, side-tab borders, nested cards, line length problems, low contrast, tiny body text, and the rest.

You get back a JSON list of every finding with its element selector, the rule that fired, and a short description.

## Step 2. Open the visual overlay

Impeccable ships with a visual mode that highlights every detected anti-pattern directly on the page. Here is what it looks like running on a deliberately-bad synthwave landing page:

<div class="tutorial-embed">
  <div class="tutorial-embed-header">
    <span class="tutorial-embed-dot red"></span>
    <span class="tutorial-embed-dot yellow"></span>
    <span class="tutorial-embed-dot green"></span>
    <span class="tutorial-embed-title">Live detection overlay</span>
  </div>
  <iframe src="/antipattern-examples/visual-mode-demo.html" class="tutorial-embed-iframe" loading="lazy" title="Impeccable visual overlay running on a demo page"></iframe>
</div>

Every outlined element has a floating label naming the rule that fired. Hover an outline to see the full finding. This is exactly what you will see on your own page.

You have three ways to open it:

1. **Chrome extension (coming soon)**: one-click activation on any page.
2. **Inside `/critique`**: the skill opens the overlay automatically during the browser portion of the assessment.
3. **Standalone CLI**: `npx impeccable live` starts a local overlay server, then you paste any URL.

For this tutorial we will use the standalone CLI so you can see it without depending on the extension.

In a new terminal:

```
npx impeccable live
```

This starts a server on `localhost:5199`. Open it. Paste the URL of your pricing page. The page loads inside an iframe with the detector script injected, and you get back the same overlay you saw above but on your own work.

## Step 3. Merge the two assessments

Back in your harness, `/critique` has finished and produced a combined report. It looks something like:

```
AI slop verdict: FAIL
  Detected tells: gradient-text (2), ai-color-palette (1),
                  nested-cards (1), side-tab (3)

Heuristic scores (avg 2.8/4):
  Visibility of status: 3 (good)
  Match between system and real world: 2 (partial)
  Consistency and standards: 2 (partial)
  ...

Cognitive load: 3/8 failures (moderate)
  Visible options at primary decision: 6 (flag)
  Decision points stacked at top: yes (flag)
  Progressive disclosure: absent on advanced pricing toggles

What's working:
  - Clear price hierarchy
  - Strong headline

Priority issues:
  1. Hero uses gradient text on the main price
     Why: AI tell, reduces contrast, hurts scannability
     Fix: solid ink color at one weight heavier
  2. Feature comparison table has 4 nested card levels
     Why: visual noise, unclear hierarchy
     Fix: flatten to a table with zebra striping

Questions to answer:
  - Is the free tier a real product or a funnel?
  - What does a user feel when they land here from an ad vs from search?
```

## Step 4. Fix the findings in order

Do not try to fix everything at once. The report gives you a priority list. Work through it top to bottom.

For each issue:

1. Keep the overlay open in one tab.
2. Make the fix in code.
3. Reload. The overlay re-scans and the label for that rule should disappear.
4. Move to the next.

This loop (fix, reload, verify, next) is the reason the overlay matters. You see your fixes land in real time, and you never ship a "fix" that did not actually satisfy the rule.

## Step 5. Re-run /critique when you are done

After you have worked through the priority list, run `/critique` again. The goal is a clean AI slop verdict and at least a 3.5 average on the heuristics. Cognitive load should be below 2 failures.

If something still fires, fix it or write a suppression comment explaining why the rule does not apply in your context (the detector respects a small set of opt-out pragmas, but use them sparingly).

## What to try next

- `/audit the same page` to catch the implementation issues critique does not cover (accessibility, performance, theming).
- `/polish` if the critique report is clean and you want the last-mile refinement pass.
- `/distill` if critique flagged "too busy" or "cognitive load". Distill removes what should not be there.

## Common issues

- **The overlay shows no findings but critique says there are problems**. The detector catches deterministic patterns. Critique catches judgment calls. They are complementary, not redundant.
- **The LLM assessment and the detector disagree**. That is normal. The LLM is subjective. The detector is deterministic. When they disagree, look at both and make a call.
- **The overlay breaks the page layout**. The overlay runs inside an iframe. Some pages with strict frame-ancestors CSP will not load. Use the Chrome extension in that case (once it ships) or run the detector from the CLI and apply findings manually.
