import type { Component } from 'vue'
import Fields from './Fields.vue'
import Excerpt from './Excerpt.vue'
import Change from './Change.vue'
import File from './File.vue'
import Markdown from './Markdown.vue'
import MediaObject from './MediaObject.vue'

/**
 * The detail forms this kit draws, by the name a row carries.
 *
 * The map is the whole mechanism: a renderer finds `$detail` inside the app's
 * own `data`, looks the name up here, and draws nothing when it does not
 * recognise it — the same rule the read path applies to an unknown verb. The
 * names are core's vocabulary (`Storyfeed\Detail`), matched EXACTLY, so the
 * casing is part of the name.
 */
const FORMS: Record<string, Component> = {
    'Storyfeed/Detail/Fields': Fields,
    'Storyfeed/Detail/Excerpt': Excerpt,
    'Storyfeed/Detail/Change': Change,
    'Storyfeed/Detail/File': File,
    'Storyfeed/Detail/Markdown': Markdown,
    'Storyfeed/Detail/MediaObject': MediaObject,
}

export type ResolvedDetail = { component: Component; payload: Record<string, any> }

/**
 * Walk a `data` map and return the details it carries, in the order found.
 *
 * A detail sits ALONGSIDE the app's own keys rather than at a key core owns,
 * so finding one means walking. Details never nest, so the walk stops at the
 * first one on a branch; the depth bound matches core's own `details` check.
 */
export function detailsIn(data: unknown, depth = 4): ResolvedDetail[] {
    if (depth < 0 || data === null || typeof data !== 'object') return []

    const map = data as Record<string, any>
    const name = map.$detail

    if (typeof name === 'string') {
        const component = FORMS[name]

        return component ? [{ component, payload: map }] : []
    }

    return Object.values(map).flatMap((value) => detailsIn(value, depth - 1))
}
