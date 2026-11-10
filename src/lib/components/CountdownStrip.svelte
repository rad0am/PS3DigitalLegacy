<script lang="ts">
	import { onMount } from 'svelte';
	import { siteConfig } from '#lib/config.js';
	import { dateLocale } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import Icon from './Icon.svelte';

	// closingDate: null -> "not announced", future -> countdown, past -> "store closed" archive state.
	const target = siteConfig.closingDate ? Date.parse(siteConfig.closingDate) : NaN;
	const hasDate = Number.isFinite(target);

	// Month-only announcement (no exact day yet), e.g. "July 2027".
	const monthText = $derived.by(() => {
		const month = siteConfig.closingMonth;
		if (!month) return null;
		const date = new Date(`${month}-01T00:00:00Z`);
		if (Number.isNaN(date.getTime())) return null;
		return new Intl.DateTimeFormat(dateLocale(), {
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(date);
	});

	let now = $state(Date.now());

	onMount(() => {
		if (!hasDate) return;
		const timer = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(timer);
	});

	const remaining = $derived(hasDate ? target - now : 0);
	const closed = $derived(hasDate && remaining <= 0);

	const parts = $derived.by(() => {
		const total = Math.max(0, Math.floor(remaining / 1000));
		const pad = (n: number) => String(n).padStart(2, '0');
		return {
			days: Math.floor(total / 86400),
			hm: `${pad(Math.floor((total % 86400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}`,
			seconds: pad(total % 60)
		};
	});
</script>

{#if !hasDate && monthText}
	<div class="strip st-on">
		<Icon name="clock" />
		<span>{m.countdown_month({ month: monthText })}</span>
	</div>
{:else if !hasDate}
	<div class="strip st-na">
		<Icon name="info" />
		<span>{m.countdown_not_announced()}</span>
	</div>
{:else if closed}
	<div class="strip st-off">
		<Icon name="info" />
		<span>{m.countdown_closed()}</span>
	</div>
{:else}
	<div class="strip st-on">
		<Icon name="clock" />
		<span>{m.countdown_closes_in()}</span>
		<span class="t"
			>{m.countdown_days({ days: parts.days })}
			{parts.hm}<span class="secs">:{parts.seconds}</span></span
		>
	</div>
{/if}
