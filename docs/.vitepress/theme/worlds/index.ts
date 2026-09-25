import type { WorldPack } from './contract'
import strangerThings from './stranger-things'

/** Every world pack, by the name the config selects it with. */
export const PACKS: Record<string, WorldPack> = {
  [strangerThings.name]: strangerThings,
}
