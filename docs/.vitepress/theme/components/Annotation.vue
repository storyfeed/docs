<script setup lang="ts">
/**
 * Docs-only editorial chrome for the kit's `annotations` slot: a callout with a
 * notch pointing up at the node it explains, so it reads as a tutorial overlay
 * pinned to that activity rather than as part of the feed.
 *
 * Deliberately unlike the surrounding UI — tinted surface, mono tab, amber rule.
 * An annotation that looked like a feed affordance would teach readers that the
 * package renders it, and it renders nothing of the kind.
 *
 * Holds no knowledge of what it wraps, so it can carry a slot mapping, a payload
 * dump or a curation trace equally.
 */
withDefaults(defineProps<{ label?: string }>(), { label: 'Anatomy' })
</script>

<template>
  <aside class="sf-annotation">
    <p class="sf-annotation__tab">{{ label }}</p>
    <slot />
  </aside>
</template>

<style scoped>
.sf-annotation {
  --sf-anno-bg: #fffbeb;
  --sf-anno-border: rgba(180, 83, 9, 0.34);
  --sf-anno-tab: #92400e;

  position: relative;
  margin: 14px 0 2px;
  border: 1px solid var(--sf-anno-border);
  border-radius: 8px;
  background: var(--sf-anno-bg);
  padding: 9px 12px 10px;
}

.dark .sf-annotation {
  --sf-anno-bg: #241d10;
  --sf-anno-border: rgba(251, 191, 36, 0.3);
  --sf-anno-tab: #fbbf24;
}

/* The notch: a border-coloured triangle with a slightly smaller fill triangle
   over it, which is the only way to give a 1px-bordered box a pointed edge.
   Offset to sit under the avatar gutter, so it points at the headline. */
.sf-annotation::before,
.sf-annotation::after {
  content: '';
  position: absolute;
  left: 17px;
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
}

.sf-annotation::before {
  top: -8px;
  border-bottom: 8px solid var(--sf-anno-border);
}

.sf-annotation::after {
  top: -7px;
  border-bottom: 8px solid var(--sf-anno-bg);
}

.sf-annotation__tab {
  margin: 0 0 6px;
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--sf-anno-tab);
}

/* VitePress styles bare <p> inside .vp-doc; the tab is chrome, not prose. */
.vp-doc .sf-annotation__tab {
  line-height: 1.3;
}
</style>
