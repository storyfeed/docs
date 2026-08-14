import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue';
import type { Ref } from 'vue';

/**
 * Injection key for a fixed "now", as a millisecond timestamp.
 *
 * Provide it when the surrounding page is prerendered and the sample data is
 * static: without it a build-time render bakes "2h ago" into the HTML and the
 * phrase drifts further from the truth every day the page is not rebuilt.
 * With it, the rendered text is stable and honest about the reference point.
 */
export const FEED_NOW = Symbol('feedNow');

/**
 * Self-refreshing relative timestamp with a tiered cadence: every second
 * under a minute, every minute under an hour, hourly under a day, then a
 * static absolute date.
 *
 * SSR-safe. No timer is started until mount, so a server or prerender pass
 * produces one deterministic string and never leaves a handle open.
 */
export function useRelativeTime(iso: Ref<string>) {
    const pinned = inject<number | null>(FEED_NOW, null);
    const now = ref(pinned ?? Date.now());
    let timer: ReturnType<typeof setTimeout> | null = null;

    function schedule(): void {
        const age = now.value - new Date(iso.value).getTime();
        const delay =
            age < 60_000
                ? 1_000
                : age < 3_600_000
                  ? 60_000
                  : age < 86_400_000
                    ? 3_600_000
                    : null;

        if (delay === null) {
            return;
        }

        timer = setTimeout(() => {
            now.value = Date.now();
            schedule();
        }, delay);
    }

    onMounted(() => {
        if (pinned === null) {
            schedule();
        }
    });

    onBeforeUnmount(() => {
        if (timer) {
            clearTimeout(timer);
        }
    });

    const label = computed<string>(() => {
        const date = new Date(iso.value);
        const seconds = Math.max(
            0,
            Math.floor((now.value - date.getTime()) / 1000),
        );

        if (seconds < 45) {
            return 'just now';
        }

        if (seconds < 3_600) {
            return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
        }

        if (seconds < 86_400) {
            return `${Math.floor(seconds / 3_600)}h ago`;
        }

        if (seconds < 604_800) {
            return `${Math.floor(seconds / 86_400)}d ago`;
        }

        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    });

    const full = computed<string>(() =>
        new Date(iso.value).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }),
    );

    return { label, full };
}

export interface FeedDay {
    label: string;
    items: { published_at: string }[];
}

/**
 * Bucket a sorted stream into renderable day groups
 * (Today / Yesterday / weekday within a week / full date).
 */
export function useFeedDays<T extends { published_at: string }>(
    items: Ref<T[]>,
) {
    const pinned = inject<number | null>(FEED_NOW, null);

    return computed(() => {
        const days: { label: string; items: T[] }[] = [];
        let currentKey: string | null = null;

        for (const item of items.value) {
            const date = new Date(item.published_at);
            const key = date.toDateString();

            if (key !== currentKey) {
                currentKey = key;
                days.push({ label: dayLabel(date, pinned), items: [] });
            }

            days[days.length - 1]!.items.push(item);
        }

        return days;
    });
}

function dayLabel(date: Date, pinned: number | null): string {
    const today = new Date(pinned ?? Date.now());
    const startOfDay = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diffDays = Math.round(
        (startOfDay(today) - startOfDay(date)) / 86_400_000,
    );

    if (diffDays === 0) {
        return 'Today';
    }

    if (diffDays === 1) {
        return 'Yesterday';
    }

    if (diffDays < 7) {
        return date.toLocaleDateString(undefined, { weekday: 'long' });
    }

    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}
