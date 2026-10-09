import { activity, role, scene } from '../world'
import { entity } from '../samples'
import { menuNames } from './manifest'

const menu = entity('menu', 'menu-rename', menuNames.to, '/menus/menu-rename')
const party = (id: string, label: string) => entity('storyfeed.party', id, label, null)
const shared = {
  verb: 'rename', published_at: scene.order.published_at, actor: role.staff,
  object: menu, glyph: 'pencil',
}
export const valuesBefore = activity({ ...shared, id: 'rename-before',
  context: party('name-before', menuNames.from), target: party('name-after', menuNames.to),
  headline_template: ':actor renamed :context to :target',
})
export const valuesAfter = activity({ ...shared, id: 'rename-after',
  data: menuNames, headline_template: `:actor renamed ${menuNames.from} to ${menuNames.to}`,
})
