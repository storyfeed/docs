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
  <aside class="sf-annotation relative [margin:14px_0_2px] [border:1px_solid_var(--sf-anno-border)] [border-radius:8px] [background:var(--sf-anno-bg)] [padding:9px_12px_10px] [&.sf-annotation--slate]:[--sf-anno-bg:#f1f5f9] [&.sf-annotation--slate]:[--sf-anno-border:rgba(51,_65,_85,_0.26)] [&.sf-annotation--slate]:[--sf-anno-tab:#334155] dark:[&.sf-annotation--slate]:[--sf-anno-bg:#1a2130] dark:[&.sf-annotation--slate]:[--sf-anno-border:rgba(148,_163,_184,_0.3)] dark:[&.sf-annotation--slate]:[--sf-anno-tab:#cbd5e1] [&.sf-annotation--blue]:[--sf-anno-bg:#eff6ff] [&.sf-annotation--blue]:[--sf-anno-border:rgba(29,_78,_216,_0.28)] [&.sf-annotation--blue]:[--sf-anno-tab:#1d4ed8] dark:[&.sf-annotation--blue]:[--sf-anno-bg:#131c33] dark:[&.sf-annotation--blue]:[--sf-anno-border:rgba(147,_197,_253,_0.3)] dark:[&.sf-annotation--blue]:[--sf-anno-tab:#93c5fd] [&.sf-annotation--teal]:[--sf-anno-bg:#f0fdfa] [&.sf-annotation--teal]:[--sf-anno-border:rgba(15,_118,_110,_0.28)] [&.sf-annotation--teal]:[--sf-anno-tab:#0f766e] dark:[&.sf-annotation--teal]:[--sf-anno-bg:#0f2320] dark:[&.sf-annotation--teal]:[--sf-anno-border:rgba(94,_234,_212,_0.28)] dark:[&.sf-annotation--teal]:[--sf-anno-tab:#5eead4] [&.sf-annotation--violet]:[--sf-anno-bg:#f5f3ff] [&.sf-annotation--violet]:[--sf-anno-border:rgba(109,_40,_217,_0.28)] [&.sf-annotation--violet]:[--sf-anno-tab:#6d28d9] dark:[&.sf-annotation--violet]:[--sf-anno-bg:#1d1833] dark:[&.sf-annotation--violet]:[--sf-anno-border:rgba(196,_181,_253,_0.3)] dark:[&.sf-annotation--violet]:[--sf-anno-tab:#c4b5fd] [&.sf-annotation--amber]:[--sf-anno-bg:#fffbeb] [&.sf-annotation--amber]:[--sf-anno-border:rgba(180,_83,_9,_0.34)] [&.sf-annotation--amber]:[--sf-anno-tab:#92400e] dark:[&.sf-annotation--amber]:[--sf-anno-bg:#241d10] dark:[&.sf-annotation--amber]:[--sf-anno-border:rgba(251,_191,_36,_0.3)] dark:[&.sf-annotation--amber]:[--sf-anno-tab:#fbbf24] [&::before]:[content:''] [&::before]:absolute [&::before]:[left:17px] [&::before]:[width:0] [&::before]:[height:0] [&::before]:[border-left:7px_solid_transparent] [&::before]:[border-right:7px_solid_transparent] [&::after]:[content:''] [&::after]:absolute [&::after]:[left:17px] [&::after]:[width:0] [&::after]:[height:0] [&::after]:[border-left:7px_solid_transparent] [&::after]:[border-right:7px_solid_transparent] [&::before]:[top:-8px] [&::before]:[border-bottom:8px_solid_var(--sf-anno-border)] [&::after]:[top:-7px] [&::after]:[border-bottom:8px_solid_var(--sf-anno-bg)]" :class="`sf-annotation--${tone}`">
    <p class="sf-annotation__tab [margin:0_0_6px] [font-family:var(--vp-font-family-mono)] [font-size:10px] [font-weight:600] [letter-spacing:0.09em] [text-transform:uppercase] [color:var(--sf-anno-tab)] [line-height:1.3]">{{ label }}</p>
    <slot />
  </aside>
</template>
