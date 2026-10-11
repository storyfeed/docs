/*
 * Every URL a page has left, and where it went. The site is static, so each
 * old URL gets a small page at build time (config.ts, buildEnd) that sends the
 * reader on, anchor included. A move adds a line here; a line never goes.
 */
export const REDIRECTS: Record<string, string> = {
  // 2026-10-10: slugs follow page titles.
  '/guide/usage-examples': '/guide/what-you-can-build',
  '/basics/recording': '/basics/recording-activities',
  '/basics/stories': '/basics/story-classes',
  '/basics/verbs': '/basics/activity-verbs',
  '/basics/reading': '/basics/retrieving-feeds',
  '/ui/installation': '/ui/installing-the-kits',
  '/ui/customizing': '/ui/customizing-the-kits',
  '/ui/reference/blade': '/ui/reference/blade-components',
  '/ui/reference/vue': '/ui/reference/vue-components',
  '/ui/reference/react': '/ui/reference/react-components',
  '/ui/reference/options': '/ui/reference/pages-rails-and-styles',
  '/deeper/parties': '/deeper/parties-and-anonymous-actors',
  '/deeper/events': '/deeper/publishing-from-events',
  '/deeper/context': '/deeper/containers-and-context',
  '/deeper/queues': '/deeper/queued-publishing',
  '/deeper/grouping-periods': '/deeper/live-burst-windows',
  '/deeper/resolving-bodies': '/deeper/resolving-bodies-when-retrieved',
  '/deeper/body': '/deeper/custom-body-types',
  '/deeper/diagnosing': '/deeper/diagnosing-your-feed',
  '/deeper/healing': '/deeper/healing-a-feed',
  '/cookbook/read-the-fields-back': '/cookbook/composing-a-coherent-activity',
  '/cookbook/activities-about-deletions': '/cookbook/recording-deletions',
  '/cookbook/email-lifecycle-events': '/cookbook/recording-email-lifecycle-events',
  '/cookbook/an-authoriser-who-is-not-an-actor': '/cookbook/recording-an-authoriser',
  '/cookbook/grouped-headlines': '/cookbook/headlines-for-grouped-activities',
  '/cookbook/naming-group-members': '/cookbook/naming-group-members-from-activity-data',
  '/cookbook/computed-values': '/cookbook/computed-values-in-the-feed',
  '/reference/doctor': '/reference/doctor-checks',
  '/reference/feedable': '/reference/feedable-api',
  '/reference/feed-item': '/reference/feed-item-api',
  '/reference/verbs': '/reference/verb-vocabulary',
  '/reference/payload': '/reference/payload-contract',
  '/reference/storage': '/reference/storage-architecture',

  // 2026-10-11: Custom Rendering renamed.
  '/ui/custom-rendering': '/ui/building-your-own-components',
  '/deeper/story-middleware-and-batching': '/deeper/story-middleware',
  '/cookbook/choosing-what-not-to-record': '/cookbook/choosing-when-to-publish#choosing-events-to-record',
  '/cookbook/recording-signed-link-access': '/cookbook/activities-without-an-actor#a-link-sent-to-someone',
  '/cookbook/repeating-activities': '/deeper/keeping-the-latest-activity#choosing-every-occurrence-or-the-latest',

  // Earlier moves.
  '/basics/headlines': '/basics/the-feed-file',
  '/deeper/details': '/deeper/custom-body-types',
  '/deeper/grammar': '/deeper/aggregation#registering-a-group-headline',
  '/deeper/nested-containers': '/deeper/distant-relations',
  '/deeper/stories': '/basics/story-classes',
  '/cookbook/verbs-and-grammar-together': '/basics/story-classes',
}

/** The page left at an old URL: noindex, canonical, a meta refresh, and a script that keeps the anchor. */
export const redirectPage = (to: string, title: string) => {
  const [path, hash = ''] = to.split('#')
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  return `<!doctype html>
<meta charset="utf-8">
<title>${escape(title)}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="https://docs.storyfeed.dev${path}">
<meta http-equiv="refresh" content="0; url=${escape(to)}">
<script>location.replace(${JSON.stringify(path)} + (location.hash || ${JSON.stringify(hash ? '#' + hash : '')}))</script>
<a href="${escape(to)}">${escape(title)}</a>
`
}
