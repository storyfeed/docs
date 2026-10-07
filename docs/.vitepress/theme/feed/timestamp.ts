import { messages } from './messages';

/** Calendar rungs use the same local timezone as the absolute hover label. */
export function formatTimestamp(iso: string, now: number, locale?: string): string {
    const date = new Date(iso);
    const today = new Date(now);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const clock = date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
    if (date.toDateString() === today.toDateString()) {
        const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
        if (seconds < 45) return 'just now';
        const minutes = Math.max(1, Math.floor(seconds / 60));
        return new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(
            seconds < 3600 ? -minutes : -Math.floor(seconds / 3600),
            seconds < 3600 ? 'minute' : 'hour',
        );
    }
    if (date.toDateString() === yesterday.toDateString()) return `${messages.yesterday}, ${clock}`;
    const month = date.toLocaleDateString(locale, { month: 'short' });
    const day = `${date.getDate()} ${month}`;
    return date.getFullYear() === today.getFullYear()
        ? `${date.toLocaleDateString(locale, { weekday: 'short' })} ${day}, ${clock}`
        : `${day} ${date.getFullYear()}, ${clock}`;
}
