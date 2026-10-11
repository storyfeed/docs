import { activity, role, scene } from '../world'

const document = scene.otherApps.signature.object
// An anonymous fetch through the link sent to the customer: the recipient is
// the target, so involving() finds it, and nobody is the actor.
export const linkFetch = activity({
  id: 'fetch-link', verb: 'fetch', published_at: scene.order.published_at,
  actor: null, object: document, target: role.customer,
  data: { prefetch: true },
  headline_template: ':object was fetched through the link sent to :target',
})
