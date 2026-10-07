<script setup lang="ts">
defineProps<{ title: string; steps: string[]; current: string; pickup: string }>();
</script>

<template>
    <section class="sf-order-progress" :aria-label="`${title} pickup progress`">
        <strong>{{ title }}</strong>
        <p>Pickup at {{ pickup }}</p>
        <ol>
            <li v-for="(step, index) in steps" :key="step"
                :aria-current="step === current ? 'step' : undefined"
                :class="{ 'is-complete': index < steps.indexOf(current) }">
                <span class="sf-order-progress__marker" aria-hidden="true">
                    {{ index < steps.indexOf(current) ? '✓' : index + 1 }}
                </span>
                <span>{{ step }}</span>
            </li>
        </ol>
    </section>
</template>

<style scoped>
.sf-order-progress {
    padding: 16px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 10px;
    background: var(--vp-c-bg-soft);
    font-size: 13px;
}
.sf-order-progress p {
    margin: 2px 0 16px;
    color: var(--vp-c-text-2);
    font-size: 12px;
}
.sf-order-progress ol {
    display: flex;
    margin: 0;
    padding: 0;
    list-style: none;
}
.sf-order-progress li {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--vp-c-text-2);
    font-size: 12px;
}
.sf-order-progress li:not(:last-child)::after {
    position: absolute;
    top: 13px;
    left: calc(50% + 18px);
    width: calc(100% - 36px);
    height: 2px;
    background: var(--vp-c-divider);
    content: '';
}
.sf-order-progress li.is-complete::after {
    background: var(--vp-c-brand-1);
}
.sf-order-progress__marker {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 50%;
    font-weight: 600;
}
.sf-order-progress .is-complete .sf-order-progress__marker {
    color: var(--vp-c-brand-1);
    border-color: var(--vp-c-brand-1);
}
.sf-order-progress li[aria-current="step"] {
    color: var(--vp-c-text-1);
    font-weight: 700;
}
.sf-order-progress [aria-current="step"] .sf-order-progress__marker {
    color: var(--vp-c-bg);
    border-color: var(--vp-c-brand-1);
    background: var(--vp-c-brand-1);
}
</style>
