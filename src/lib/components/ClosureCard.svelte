<script lang="ts">
	import { onMount } from 'svelte';
	import { siteConfig } from '#lib/config.js';
	import { dateLocale } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import Icon from './Icon.svelte';

	// Same states as the countdown strip. closingDate: null -> announced month or "not announced",
	// future -> countdown, past -> "store closed" archive state.
	const target = siteConfig.closingDate ? Date.parse(siteConfig.closingDate) : NaN;
	const hasDate = Number.isFinite(target);

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
			clock: `${pad(Math.floor((total % 86400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
		};
	});
</script>

<aside class="ctr" aria-label={m.closure_label()}>
	{#if closed}
		<div class="k">{m.closure_label()}</div>
		<div class="big" style="font-size:28px;line-height:34px">{m.countdown_closed()}</div>
	{:else if hasDate}
		<div class="k">{m.countdown_closes_in()}</div>
		<div class="big">{m.countdown_days({ days: parts.days })} {parts.clock}</div>
	{:else if monthText}
		<div class="k">{m.closure_label()}</div>
		<div class="big">{monthText}</div>
		<div class="sub">{m.closure_month_note()}</div>
		<div class="tlp">
			<Icon name="info" size="s" />
			<span>{m.closure_date_note()}</span>
		</div>
	{:else}
		<div class="k">{m.closure_label()}</div>
		<div class="big" style="font-size:28px;line-height:34px">{m.countdown_not_announced()}</div>
	{/if}
</aside>
