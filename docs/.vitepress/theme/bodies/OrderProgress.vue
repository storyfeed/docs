<script setup lang="ts">
defineProps<{ title: string; steps: string[]; current: string; pickup: string }>();
</script>

<template>
    <section class="sf-order-progress [padding:16px] [border:1px_solid_var(--vp-c-divider)] [border-radius:10px] [background:var(--vp-c-bg-soft)] [font-size:13px] [&_p]:[margin:2px_0_16px] [&_p]:[color:var(--vp-c-text-2)] [&_p]:[font-size:12px] [&_ol]:flex [&_ol]:[margin:0] [&_ol]:[padding:0] [&_ol]:[list-style:none] [&_li]:relative [&_li]:flex [&_li]:[flex:1] [&_li]:flex-col [&_li]:items-center [&_li]:[gap:6px] [&_li]:[margin:0] [&_li]:[color:var(--vp-c-text-2)] [&_li]:[font-size:12px] [&_li:not(:last-child)::after]:absolute [&_li:not(:last-child)::after]:[top:13px] [&_li:not(:last-child)::after]:[left:calc(50%_+_18px)] [&_li:not(:last-child)::after]:[width:calc(100%_-_36px)] [&_li:not(:last-child)::after]:[height:2px] [&_li:not(:last-child)::after]:[background:var(--vp-c-divider)] [&_li:not(:last-child)::after]:[content:''] [&_li.is-complete::after]:[background:var(--vp-c-brand-1)] [&_.is-complete_.sf-order-progress\_\_marker]:[color:var(--vp-c-brand-1)] [&_.is-complete_.sf-order-progress\_\_marker]:[border-color:var(--vp-c-brand-1)] [&_li[aria-current='step']]:[color:var(--vp-c-text-1)] [&_li[aria-current='step']]:[font-weight:700] [&_[aria-current='step']_.sf-order-progress\_\_marker]:[color:var(--vp-c-bg)] [&_[aria-current='step']_.sf-order-progress\_\_marker]:[border-color:var(--vp-c-brand-1)] [&_[aria-current='step']_.sf-order-progress\_\_marker]:[background:var(--vp-c-brand-1)]" :aria-label="`${title} pickup progress`">
        <strong>{{ title }}</strong>
        <p>Pickup at {{ pickup }}</p>
        <ol>
            <li v-for="(step, index) in steps" :key="step"
                :aria-current="step === current ? 'step' : undefined"
                :class="{ 'is-complete': index < steps.indexOf(current) }">
                <span class="sf-order-progress__marker grid [place-items:center] [width:28px] [height:28px] [border:1px_solid_var(--vp-c-divider)] [border-radius:50%] [font-weight:600]" aria-hidden="true">
                    {{ index < steps.indexOf(current) ? '✓' : index + 1 }}
                </span>
                <span>{{ step }}</span>
            </li>
        </ol>
    </section>
</template>
