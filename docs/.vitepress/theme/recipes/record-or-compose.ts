import { activity, role, scene } from '../world'

// A menu item's price history, composed from the app's own price_changes
// rows: verbless entries whose price is replaced into the headline.
const hour = 3_600_000
const at = (hours: number) => new Date(Date.parse(scene.order.published_at) - hours * hour).toISOString().replace(/\.(\d{3})Z$/, '.$1000Z')
const change = (id: string, price: string, hours: number) => activity({
  id: `price-${id}`, verb: null, glyph: null, published_at: at(hours), data: null,
  headline_template: `:actor changed the price of :object to ${price}`,
  actor: role.staff, object: { ...role.product, body: null },
})

export const priceHistory = [
  change('3', '$4.50', 2),
  change('2', '$4.25', 30),
  change('1', '$3.95', 200),
]
