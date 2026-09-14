/**
 * ── The manifest ─────────────────────────────────────────────────────────────
 *
 * Every name and every piece of text the documentation's examples use. This is
 * the only file to edit to recast them: change a value here and every page that
 * shows it follows.
 *
 * Plain strings, nothing computed. Ids are assigned from position, so a key is
 * all a page ever refers to.
 *
 * Two things worth knowing:
 *
 * - Keys are HANDLES, never names: `designer`, `reviewer`, `report`, `main`. A
 *   page imports a part in the story, so renaming a person or a file is one
 *   value here and no page changes. The cast was once keyed by first name, and
 *   a recast meant a search across the site; that is why the keys are what
 *   they are.
 * - These are not a copy of the demo app's payloads. The person type here is
 *   `user` where the app emits its own model's alias, and comment labels are not
 *   truncated the way the app truncates them. Regenerating any of this from real
 *   app JSON means translating it, not pasting it.
 * - Prose is out of reach. Where a page names someone in a sentence rather than
 *   in data — the anatomy walkthrough does, following one person's uploads — that
 *   sentence needs editing by hand.
 */

/** People. Rendered as `user` entities linking to /users/{id}. */
export const USERS = {
  owner:  'Jasper Tey',
  commenter: 'Bruce Wayne',
  editor: 'Sally Nguyen',
  lead:   'Marcus Webb',
  designer: 'Nancy Wheeler',
  producer: 'Deja Williams',
  reviewer: 'Priya Raman',
  illustrator: 'Aiko Tanaka',
  approver: 'Tomás Rivera',
}

/** Projects — the usual container an activity happens in. */
export const PROJECTS = {
  other:             'Port Migration',
  main:              'Password Crackdown',
  third:             'Metaverse Pivot',
  created:           'Bird Removal',
  fourth:            'Verification Tiers',
}

/** Clients, one level above a project. */
export const CLIENTS = {
  main:  'Chirp',
}

/** Files. The label is the filename, which is what a real snapshot stores. */
export const DOCUMENTS = {
  report:                'annual-report-v3.fig',
  styleTile:              'style-tile-rev-a.sketch',
  pricing:               'pricing-table-final.docx',
  signage:               'signage-plan-rev-b.fig',
  signageCopy:           'signage-plan-client-copy.fig',
  wireframes:            'wireframes-wip.sketch',
  motionTest:            'motion-test-rev-b.docx',
  motionTestCopy:        'motion-test-client-copy.pdf',
  heroDesktop:           'hero-desktop-rev-b.docx',
  heroMobile:             'hero-mobile-rev-a.fig',
  tokens:                'colour-tokens-v1.fig',
  tokensFinal:           'colour-tokens-final-2.sketch',
  proofSheet:            'proof-sheet-final-2.png',
  wordmark:              'wordmark-v3.png',
  expenses:              'expense-report-q3.pdf',
  thread:                'the spacing scale thread',
}

/** Tasks. The label is the task title. */
export const TASKS = {
  storyboard:              'Storyboard the icon library',
  simplify:                'Simplify the wordmark',
  altText:                 'Rebuild the alt text',
  kerningMotion:           'Kerning pass on the motion tests',
  kerningPricing:          'Kerning pass on the pricing table',
  audit:                   'Audit the colour tokens',
  rewriteHero:             'Rewrite the hero images',
  rewritePrint:            'Rewrite the print specimen',
  redraw:                  'Redraw the signage mock-ups',
}

/** Parties: named participants with no model in the app. */
export const PARTIES = {
  service: 'Concur Web Service',
}

/** Comment bodies. A comment has no name, so its label is its text —
 * truncated to 80 characters the way the demo app's Comment::toFeed() does. */
export const COMMENTS = {
  first:      'The mobile breakpoint eats the caption — the older version handled this better. Can we go back to the two-line treatment?',
  second:     'Second page still overflows on the print stylesheet.',
}
