import type { FeedNode, FeedSingularRole } from './types';
import { messages } from './messages';

/** Fixed order; only tokens in the headline actually drawn consume roles. */
export const metaRoles = ['instrument', 'origin', 'result', 'context', 'location', 'generator'] as const;

export function leftoverRoles(node: FeedNode, templates: (string | null | undefined)[]) {
    const tokens = new Set(templates.flatMap(template => template?.match(/:[a-z_]+/g) ?? []));
    return metaRoles.filter(role => !tokens.has(`:${role}`) && !tokens.has(`:${role}s`))
        .flatMap(role => {
            const entities = node[role] ? [node[role]!] : node.kind === 'group' ? node.sample[`${role}s`] ?? [] : [];
            const total = node.kind === 'group' ? node.distinct[`${role}s`] ?? entities.length : entities.length;
            return entities.length ? [{ role: role as FeedSingularRole, word: messages[role], entities, overflow: Math.max(0, total - entities.length) }] : [];
        });
}
