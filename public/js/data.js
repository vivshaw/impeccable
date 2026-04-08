// ============================================
// DATA: Skill focus areas, command processes, relationships
// ============================================

// Items that are fully complete and ready for public use
// All others will show "Coming Soon"
export const readySkills = [
  'impeccable'  // Consolidated skill with all design domains
];

export const readyCommands = [
  'normalize'  // First command to be fully completed
];

// Commands marked as beta — shown with a badge in the UI
export const betaCommands = [
  'overdrive'
];

// Consolidated impeccable skill with reference domains
export const skillFocusAreas = {
  'impeccable': [
    { area: 'Typography', detail: 'Scale, rhythm, hierarchy, expression' },
    { area: 'Color & Contrast', detail: 'Accessibility, systems, theming' },
    { area: 'Spatial Design', detail: 'Layout, spacing, composition' },
    { area: 'Responsive', detail: 'Fluid layouts, touch targets' },
    { area: 'Interaction', detail: 'States, feedback, affordances' },
    { area: 'Motion', detail: 'Micro-interactions, transitions' },
    { area: 'UX Writing', detail: 'Clarity, voice, error messages' }
  ]
};

// Guideline counts per dimension (verified from reference files)
export const dimensionGuidelineCounts = {
  'Typography': 33,
  'Color & Contrast': 29,
  'Spatial Design': 27,
  'Motion': 32,
  'Interaction': 36,
  'Responsive': 23,
  'UX Writing': 32
};

// Reference domains within the impeccable skill
export const skillReferenceDomains = [
  'typography',
  'color-and-contrast',
  'spatial-design',
  'responsive-design',
  'interaction-design',
  'motion-design',
  'ux-writing'
];

export const commandProcessSteps = {
  'shape': ['Interview', 'Synthesize', 'Brief', 'Confirm'],
  'impeccable craft': ['Shape', 'Reference', 'Build', 'Iterate'],
  'impeccable': ['Direct', 'Design', 'Build', 'Refine'],
  'onboard': ['Map', 'Design', 'Guide'],
  'overdrive': ['Assess', 'Choose', 'Build', 'Polish'],
  'critique': ['Evaluate', 'Critique', 'Prioritize', 'Suggest'],
  'audit': ['Scan', 'Document', 'Prioritize', 'Recommend'],
  'typeset': ['Assess', 'Select', 'Scale', 'Refine'],
  'arrange': ['Assess', 'Grid', 'Rhythm', 'Balance'],
  'colorize': ['Analyze', 'Strategy', 'Apply', 'Balance'],
  'animate': ['Identify', 'Design', 'Implement', 'Polish'],
  'delight': ['Identify', 'Design', 'Implement'],
  'bolder': ['Analyze', 'Amplify', 'Impact'],
  'quieter': ['Analyze', 'Reduce', 'Refine'],
  'distill': ['Audit', 'Remove', 'Clarify'],
  'clarify': ['Read', 'Simplify', 'Improve', 'Test'],
  'adapt': ['Analyze', 'Adjust', 'Optimize'],
  'normalize': ['Analyze', 'Identify', 'Align', 'Verify'],
  'polish': ['Review', 'Refine', 'Verify'],
  'optimize': ['Profile', 'Identify', 'Improve', 'Measure'],
  'harden': ['Test', 'Handle', 'Wrap', 'Validate'],
  'impeccable teach': ['Explore', 'Interview', 'Synthesize', 'Save'],
  'extract': ['Identify', 'Abstract', 'Document']
};

export const commandCategories = {
  // CREATE - build something new
  'shape': 'create',
  'impeccable craft': 'create',
  'impeccable': 'create',
  'overdrive': 'create',
  // EVALUATE - review and assess
  'critique': 'evaluate',
  'audit': 'evaluate',
  // REFINE - improve existing design
  'typeset': 'refine',
  'arrange': 'refine',
  'colorize': 'refine',
  'animate': 'refine',
  'delight': 'refine',
  'bolder': 'refine',
  'quieter': 'refine',
  'onboard': 'refine',
  // SIMPLIFY - reduce and clarify
  'distill': 'simplify',
  'clarify': 'simplify',
  'adapt': 'simplify',
  // HARDEN - production-ready
  'normalize': 'harden',
  'polish': 'harden',
  'optimize': 'harden',
  'harden': 'harden',
  // SYSTEM - setup and tooling
  'impeccable teach': 'system',
  'extract': 'system'
};

// Skill relationships - now consolidated into impeccable skill
// The impeccable skill contains all domains as reference files
export const skillRelationships = {
  'impeccable': {
    description: 'Comprehensive design intelligence with progressive reference loading',
    referenceDomains: ['typography', 'color-and-contrast', 'spatial-design', 'responsive-design', 'interaction-design', 'motion-design', 'ux-writing']
  }
};

export const commandRelationships = {
  'shape': { flow: 'Create: Plan UX and UI through structured discovery', leadsTo: ['impeccable craft'] },
  'impeccable craft': { flow: 'Create: Full shape-then-build flow with visual iteration' },
  'impeccable': { flow: 'Create: Freeform design with full design intelligence' },
  'onboard': { combinesWith: ['clarify', 'delight'], flow: 'Create: Onboarding flows and empty states' },
  'overdrive': { combinesWith: ['animate', 'delight'], flow: 'Create: Technically extraordinary effects' },
  'critique': { leadsTo: ['polish', 'distill', 'bolder', 'quieter', 'typeset', 'arrange'], flow: 'Evaluate: UX and design review with scoring' },
  'audit': { leadsTo: ['normalize', 'harden', 'optimize', 'adapt', 'clarify'], flow: 'Evaluate: Technical quality audit' },
  'typeset': { combinesWith: ['bolder', 'normalize'], flow: 'Refine: Fix typography and type hierarchy' },
  'arrange': { combinesWith: ['distill', 'adapt'], flow: 'Refine: Fix layout and spacing' },
  'colorize': { combinesWith: ['bolder', 'delight'], flow: 'Refine: Add strategic color' },
  'animate': { combinesWith: ['delight'], flow: 'Refine: Add purposeful motion' },
  'delight': { combinesWith: ['bolder', 'animate'], flow: 'Refine: Add personality and joy' },
  'bolder': { pairs: 'quieter', flow: 'Refine: Amplify timid designs' },
  'quieter': { pairs: 'bolder', flow: 'Refine: Tone down aggressive designs' },
  'distill': { combinesWith: ['quieter', 'normalize'], flow: 'Simplify: Strip to essence' },
  'clarify': { combinesWith: ['normalize', 'adapt'], flow: 'Simplify: Improve UX copy' },
  'adapt': { combinesWith: ['normalize', 'clarify'], flow: 'Simplify: Adapt for different contexts' },
  'normalize': { combinesWith: ['clarify', 'adapt'], flow: 'Harden: Align with design system' },
  'polish': { flow: 'Harden: Final pass before shipping' },
  'optimize': { flow: 'Harden: Performance improvements' },
  'harden': { combinesWith: ['optimize'], flow: 'Harden: Error handling and edge cases' },
  'impeccable teach': { flow: 'System: One-time project design context setup' },
  'extract': { flow: 'System: Create design system components and tokens' }
};

