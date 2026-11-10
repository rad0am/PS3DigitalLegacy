<script lang="ts">
	import type { StoreStatus } from '#lib/data/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import Icon from './Icon.svelte';

	let {
		status,
		variant = 'row'
	}: {
		status: StoreStatus;
		/** row: short label; short: shortest label (search); long: details page wording */
		variant?: 'row' | 'short' | 'long';
	} = $props();
</script>

{#if status === 'available'}
	<span class="bd bd-ok">
		{#if variant === 'long'}<Icon name="check" size="s" />{/if}
		{variant === 'long' ? m.status_available_long() : m.status_available()}
	</span>
{:else if status === 'delisted'}
	<span class="bd bd-del"><Icon name="alert" size="s" />{m.status_delisted()}</span>
{:else}
	<span class="bd bd-unk">
		{#if variant !== 'short'}<Icon name="info" size="s" />{/if}
		{variant === 'short' ? m.status_unknown_short() : m.status_unknown()}
	</span>
{/if}
