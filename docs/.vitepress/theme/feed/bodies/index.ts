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
