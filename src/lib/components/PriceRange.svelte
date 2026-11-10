<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let {
		bound,
		min,
		max,
		onchange
	}: {
		/** upper end of the slider (highest price in the selected currency) */
		bound: number;
		min: number | null;
		max: number | null;
		/** null means "no limit" on that side */
		onchange: (min: number | null, max: number | null) => void;
	} = $props();

	const lo = $derived(min ?? 0);
	const hi = $derived(max ?? bound);
	const span = $derived(Math.max(bound, 1));

	function emit(nextLo: number, nextHi: number) {
		const a = Math.min(nextLo, nextHi);
		const b = Math.max(nextLo, nextHi);
		onchange(a <= 0 ? null : a, b >= bound ? null : b);
	}

	function parse(value: string): number | null {
		if (value.trim() === '') return null;
		const parsed = Number(value);
		return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
	}
</script>

<div class="rng" aria-hidden="false">
	<i style:left="{(lo / span) * 100}%" style:right="{100 - (hi / span) * 100}%"></i>
	<input
		type="range"
		min="0"
		max={bound}
		step="1"
		value={lo}
		aria-label={m.filter_price_min()}
		oninput={(event) => emit(Number(event.currentTarget.value), hi)}
	/>
	<input
		type="range"
		min="0"
		max={bound}
		step="1"
		value={hi}
		aria-label={m.filter_price_max()}
		oninput={(event) => emit(lo, Number(event.currentTarget.value))}
	/>
</div>
<div class="mm">
	<input
		class="inp inp-s"
		type="number"
		min="0"
		inputmode="decimal"
		value={min ?? ''}
		placeholder="0"
		aria-label={m.filter_price_min()}
		onchange={(event) => {
			const next = parse(event.currentTarget.value);
			onchange(next, max);
		}}
	/>
	<span class="muted">{m.filter_price_to()}</span>
	<input
		class="inp inp-s"
		type="number"
		min="0"
		inputmode="decimal"
		value={max ?? ''}
		placeholder={String(bound)}
		aria-label={m.filter_price_max()}
		onchange={(event) => {
			const next = parse(event.currentTarget.value);
			onchange(min, next);
		}}
	/>
</div>
