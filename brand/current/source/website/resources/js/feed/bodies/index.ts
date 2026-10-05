import type { Component } from 'vue';
import Note from './Note.vue';

/**
 * The app's own components, by the name a `Storyfeed/Body/Component` body
 * carries. The registry keeps the renderer domain-free: an unknown name
 * renders no body.
 */
const BODIES: Record<string, Component> = {
    Note,
};

export function resolveBody(name: string | null | undefined): Component | null {
    return name ? (BODIES[name] ?? null) : null;
}

/**
 * The name of the first `Storyfeed/Body/Component` in an entity's `body` slot.
 * `body` is core's slot and holds a list of forms, so it is read, not searched.
 */
export function componentName(body: unknown): string | null {
    if (!Array.isArray(body)) {
        return null;
    }

    const form = body.find(
        (candidate) =>
            candidate?.['$body'] === 'Storyfeed/Body/Component' &&
            typeof candidate.name === 'string',
    );

    return form ? form.name : null;
}
