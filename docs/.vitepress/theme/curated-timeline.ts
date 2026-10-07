import { activity, entity } from './samples'
import { scene } from './world'

// A curated product-history entry; its object owns the source card.
export const curatedMilestone = activity({
  id: 'curated-milestone',
  verb: 'unveil',
  published_at: scene.order.published_at,
  headline_template: ':actor unveiled :object at :target',
  actor: entity('storyfeed.party', 'jasper', 'Jasper', null),
  object: entity('App\\Models\\Milestone', '1', 'Storyfeed', null, {
    data: { preview_url: 'https://docs.storyfeed.dev/og-image.jpg' },
    media: { icon: null, preview: { src: 'https://docs.storyfeed.dev/og-image.jpg',
      mediaType: null, width: null, height: null, alt: null }, image: null, url: null, files: [] },
    body: [{ $body: 'Storyfeed/Body/MediaObject', $v: 2,
      subject: { label: 'Storyfeed Documentation', href: 'https://docs.storyfeed.dev' },
      content: 'The activity feed pattern for Laravel.',
      image: 'preview', files: [], footnote: null }],
  }),
  target: entity('storyfeed.party', 'gpug', 'GPUG', null),
})
