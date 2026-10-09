import { activity, role, scene } from '../world'
import { entity } from '../samples'
import { linkLabels } from './manifest'

const document = scene.otherApps.signature.object
const link = entity('issued_link', 'issued-link-1', linkLabels.link, null)
const event = (id: string) => entity('access_event', id, linkLabels.event, null)
const data = { recipient_id: role.customer.id, recipient_name: role.customer.label, automation: 'likely', observation: 'fetch' }
export const unverifiedFetch = activity({
  id: 'fetch-unverified', verb: 'fetch', published_at: scene.order.published_at,
  actor: null, object: event('access-1'), target: document, origin: link, context: role.shop,
  data, headline_template: `The link sent to ${data.recipient_name} recorded a fetch of :target (automation suspected)`,
})
export const verifiedFetch = activity({
  id: 'fetch-verified', verb: 'fetch', published_at: scene.question.published_at,
  actor: role.staff, object: event('access-2'), target: document, origin: link, context: role.shop,
  data: { ...data, automation: 'unknown' },
  headline_template: `:actor fetched :target using the link sent to ${data.recipient_name}`,
})
