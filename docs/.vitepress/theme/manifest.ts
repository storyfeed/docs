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
 * - Rename a person and you will want to rename their key too. Both live on the
 *   same line, so it is one edit, but a page importing `who.ines` will keep
 *   working and keep saying `ines` until you do.
 * - Prose is out of reach. Where a page names someone in a sentence rather than
 *   in data — the anatomy walkthrough does, following one person's uploads — that
 *   sentence needs editing by hand.
 */

/** People. Rendered as `user` entities linking to /users/{id}. */
export const USERS = {
  jasper: 'Jasper Tey',
  bob:    'Bob Callahan',
  sally:  'Sally Nguyen',
  marcus: 'Marcus Webb',
  ines:   'Ines Duarte',
  deja:   'Deja Williams',
  priya:  'Priya Raman',
  aiko:   'Aiko Tanaka',
  tomas:  'Tomás Rivera',
}

/** Projects — the usual container an activity happens in. */
export const PROJECTS = {
  portMigration:     'Port Migration',
  passwordCrackdown: 'Password Crackdown',
  metaversePivot:    'Metaverse Pivot',
  birdRemoval:       'Bird Removal',
  verificationTiers: 'Verification Tiers',
}

/** Clients, one level above a project. */
export const CLIENTS = {
  chirp: 'Chirp',
}

/** Files. The label is the filename, which is what a real snapshot stores. */
export const DOCUMENTS = {
  annualReportV3:        'annual-report-v3.fig',
  styleTileRevA:          'style-tile-rev-a.sketch',
  pricingTableFinal:     'pricing-table-final.docx',
  signagePlanRevB:       'signage-plan-rev-b.fig',
  signagePlanClientCopy: 'signage-plan-client-copy.fig',
  wireframesWip:         'wireframes-wip.sketch',
  motionTestRevB:        'motion-test-rev-b.docx',
  motionTestClientCopy:  'motion-test-client-copy.pdf',
  heroDesktopRevB:       'hero-desktop-rev-b.docx',
  heroMobileRevA:         'hero-mobile-rev-a.fig',
  colourTokensV1:        'colour-tokens-v1.fig',
  colourTokensFinal2:    'colour-tokens-final-2.sketch',
  proofSheetFinal2:      'proof-sheet-final-2.png',
  wordmarkV3:            'wordmark-v3.png',
  expenseReportQ3:       'expense-report-q3.pdf',
  spacingScaleThread:    'the spacing scale thread',
}

/** Tasks. The label is the task title. */
export const TASKS = {
  storyboardIconLibrary:   'Storyboard the icon library',
  simplifyWordmark:        'Simplify the wordmark',
  rebuildAltText:          'Rebuild the alt text',
  kerningPassMotionTests:  'Kerning pass on the motion tests',
  kerningPassPricingTable: 'Kerning pass on the pricing table',
  auditColourTokens:       'Audit the colour tokens',
  rewriteHeroImages:       'Rewrite the hero images',
  rewritePrintSpecimen:    'Rewrite the print specimen',
  redrawSignageMockUps:    'Redraw the signage mock-ups',
}

/** Comment bodies. A comment has no name, so its label is its text —
 * truncated to 80 characters the way the demo app's Comment::toFeed() does. */
export const COMMENTS = {
  breakpoint: 'The mobile breakpoint eats the caption — the older version handled this better. Can we go back to the two-line treatment?',
  overflow:   'Second page still overflows on the print stylesheet.',
}
