import type { Component } from 'vue'
import KeyValue from './KeyValue.vue'
import Excerpt from './Excerpt.vue'
import Change from './Change.vue'
import FileAttachment from './FileAttachment.vue'
import Prose from './Prose.vue'
import ItemList from './ItemList.vue'
import MediaObject from './MediaObject.vue'

/**
 * The body forms this kit draws, by the name a row carries.
 *
 * The map is the whole mechanism: a renderer finds `$body` inside the app's
 * own `data`, looks the name up here, and draws nothing when it does not
 * recognise it — the same rule the read path applies to an unknown verb. The
 * names are core's vocabulary (`Storyfeed\Body`), matched EXACTLY, so the
 * casing is part of the name.
 */
const FORMS: Record<string, Component> = {
    'Storyfeed/Body/KeyValue': KeyValue,
    'Storyfeed/Body/Excerpt': Excerpt,
    'Storyfeed/Body/Change': Change,
    'Storyfeed/Body/FileAttachment': FileAttachment,
    // Stored rows retain the old token.
    'Storyfeed/Body/File': FileAttachment,
    'Storyfeed/Body/Prose': Prose,
    'Storyfeed/Body/ItemList': ItemList,
    'Storyfeed/Body/MediaObject': MediaObject,
}

export type ResolvedDetail = { component: Component; payload: Record<string, any> }

/**
 * Walk a `data` map and return the details it carries, in the order found.
 *
 * A detail sits ALONGSIDE the app's own keys rather than at a key core owns,
 * so finding one means walking. Details never nest, so the walk stops at the
 * first one on a branch; the depth bound matches core's own `details` check.
 */
export function formsIn(data: unknown, depth = 4): ResolvedDetail[] {
    if (depth < 0 || data === null || typeof data !== 'object') return []

    const map = data as Record<string, any>
    const name = map.$body

    if (typeof name === 'string') {
        const component = FORMS[name]

        return component ? [{ component, payload: map }] : []
    }

    return Object.values(map).flatMap((value) => formsIn(value, depth - 1))
}

/**
 * The forms in an entity's `body` slot, in the order the payload carries them.
 *
 * Unlike {@link formsIn} there is no walking: `body` is core's slot and holds
 * a list of forms, so a renderer reads it rather than searching for it. An
 * unrecognised name still draws nothing, which is the same rule and the same
 * reason.
 */
export function resolve(body: unknown): ResolvedDetail[] {
    if (!Array.isArray(body)) return []

    return body.flatMap((form) => {
        const component = FORMS[(form ?? {})['$body']]

        return component ? [{ component, payload: form }] : []
    })
}
