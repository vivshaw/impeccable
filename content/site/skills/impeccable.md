---
tagline: "The design intelligence behind every other skill."
---

## When to use it

`/impeccable` is the foundation. It teaches your AI harness how to design, period. Every other command in this pack leans on it for design principles, anti-patterns, typography, color, and layout guidance.

Call `/impeccable` directly when you want freeform design with the full guidebook loaded. Call `/impeccable craft` for a shape-then-build flow with visual iteration. Call `/impeccable teach` once per project to set up design context.

## How it works

Most AI-generated UIs fail the same way: generic fonts, purple gradients, card grids on card grids, glassmorphism everywhere. `/impeccable` gives your AI a strong point of view. It loads an opinionated design handbook plus a long list of anti-patterns, then pushes the model to commit to a specific aesthetic direction before writing a single line of code.

The skill has a **Context Gathering Protocol** built in. It will not design anything until it knows who uses the product, what they're trying to do, and how the interface should feel. If no context exists yet, it asks you to run `/impeccable teach` first. This is deliberate: design without context produces slop, and slop is the whole problem this pack exists to solve.

## Try it

From a clean project, run once:

```
/impeccable teach
```

Answer the discovery questions. The skill writes a `.impeccable.md` file with your brand, audience, and aesthetic direction. Every future skill call reads it automatically.

Then build something:

```
/impeccable build me a pricing page for a developer tool
```

You should get a page that commits to one clear aesthetic direction, uses non-default fonts, avoids the AI color palette, and has a real point of view.

## Pitfalls

- **Skipping `/impeccable teach`.** Without a `.impeccable.md` file, the skill has to ask you context questions mid-flight. Faster to set it up once.
- **Treating it like a style guide.** It is an opinionated design partner, not a linter. The defaults exist to raise the floor, not to overrule your judgment. If you have a real reason to push back (brand guideline, accessibility constraint, user research that says otherwise), push back and explain why. The skill will work with you. What produces worse output is ignoring the opinion without a reason.
- **Expecting it to fix existing code.** For that, reach for `/polish`, `/distill`, or `/critique` instead. `/impeccable` is for creation.
