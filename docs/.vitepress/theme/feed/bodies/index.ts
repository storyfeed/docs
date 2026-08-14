import type { Component } from 'vue';
import Note from './Note.vue';

/**
 * Backend-named body components (`entity.component`). The registry keeps the
 * renderer domain-free: unknown names simply render no body.
 */
const BODIES: Record<string, Component> = {
    Note,
};

export function resolveBody(name: string | null | undefined): Component | null {
    return name ? (BODIES[name] ?? null) : null;
}
