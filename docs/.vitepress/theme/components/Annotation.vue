<script setup lang="ts">
/**
 * Docs-only editorial chrome for the kit's `annotations` slot: a callout with a
 * notch pointing up at the node it explains, so it reads as a tutorial overlay
 * pinned to that activity rather than as part of the feed.
 *
 * Deliberately unlike the surrounding UI — tinted surface, mono tab, notch. An
 * annotation that looked like a feed affordance would teach readers that the
 * package renders it, and it renders nothing of the kind.
 *
 * The tone is off-brand on purpose. Amber is the product's voice — links, hero,
 * logo — so an amber annotation reads as part of what is being demonstrated, and
 * at this density turns the page yellow. The narrator gets a different colour.
 *
 * Holds no knowledge of what it wraps, so it can carry a slot mapping, a payload
 * dump or a curation trace equally.
 */
withDefaults(defineProps<{ label?: string; tone?: string }>(), {
  label: 'Anatomy',
  tone: 'slate',
})
</script>

<template>
  <aside class="sf-annotation" :class="`sf-annotation--${tone}`">
    <p class="sf-annotation__tab">{{ label }}</p>
    <slot />
  </aside>
</template>

<style scoped>
.sf-annotation {
  position: relative;
  margin: 14px 0 2px;
  border: 1px solid var(--sf-anno-border);
  border-radius: 8px;
  background: var(--sf-anno-bg);
  padding: 9px 12px 10px;
}

/* Tones. The tab colour clears 4.5:1 on its own surface in both schemes — the
   tab is the only text the annotation owns, and it is small and uppercase, which
   is the combination that punishes a decorative colour choice. */
.sf-annotation--slate {
  --sf-anno-bg: #f1f5f9;
  --sf-anno-border: rgba(51, 65, 85, 0.26);
  --sf-anno-tab: #334155;
}

.dark .sf-annotation--slate {
  --sf-anno-bg: #1a2130;
  --sf-anno-border: rgba(148, 163, 184, 0.3);
  --sf-anno-tab: #cbd5e1;
}

.sf-annotation--blue {
  --sf-anno-bg: #eff6ff;
  --sf-anno-border: rgba(29, 78, 216, 0.28);
  --sf-anno-tab: #1d4ed8;
}

.dark .sf-annotation--blue {
  --sf-anno-bg: #131c33;
  --sf-anno-border: rgba(147, 197, 253, 0.3);
  --sf-anno-tab: #93c5fd;
}

.sf-annotation--teal {
  --sf-anno-bg: #f0fdfa;
  --sf-anno-border: rgba(15, 118, 110, 0.28);
  --sf-anno-tab: #0f766e;
}

.dark .sf-annotation--teal {
  --sf-anno-bg: #0f2320;
  --sf-anno-border: rgba(94, 234, 212, 0.28);
  --sf-anno-tab: #5eead4;
}

.sf-annotation--violet {
  --sf-anno-bg: #f5f3ff;
  --sf-anno-border: rgba(109, 40, 217, 0.28);
  --sf-anno-tab: #6d28d9;
}

.dark .sf-annotation--violet {
  --sf-anno-bg: #1d1833;
  --sf-anno-border: rgba(196, 181, 253, 0.3);
  --sf-anno-tab: #c4b5fd;
}

.sf-annotation--amber {
  --sf-anno-bg: #fffbeb;
  --sf-anno-border: rgba(180, 83, 9, 0.34);
  --sf-anno-tab: #92400e;
}

.dark .sf-annotation--amber {
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
