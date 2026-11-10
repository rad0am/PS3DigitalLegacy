<script lang="ts">
	import { regionsOf, type Item } from '#lib/data/catalog.js';
	import { m } from '#lib/paraglide/messages.js';
	import Icon from './Icon.svelte';
	import StatusBadge from './StatusBadge.svelte';

	let { item }: { item: Item } = $props();
</script>

<div class="tags">
	<span class="bd bd-plat">{item.platform}</span>
	{#if item.kind === 'dlc'}
		<span class="bd bd-sky">{m.badge_dlc()}</span>
	{/if}
	{#each regionsOf(item.regions) as region (region)}
		<span class="tag">{region}</span>
	{/each}
	{#if item.kind === 'game'}
		{#if item.digitalOnly}
			<span class="bd bd-dig"><Icon name="check" size="s" />{m.badge_digital_only()}</span>
		{:else}
			<span class="bd bd-unk">{m.badge_disc_release()}</span>
		{/if}
	{/if}
	<StatusBadge status={item.status} />
	{#if item.kind === 'game' && item.dlcCount > 0}
		<span class="bd bd-sky">
			{item.digitalOnly
				? m.badge_dlc_count({ count: item.dlcCount })
				: m.badge_dlc_digital({ count: item.dlcCount })}
		</span>
	{/if}
	{#if item.hasPlatinum}
		<span class="bd bd-gold"><Icon name="trophy" size="s" />{m.badge_platinum()}</span>
	{:else if item.kind === 'dlc' && item.dlcTrophies > 0}
		<span class="bd bd-gold"><Icon name="trophy" size="s" />{m.badge_trophies()}</span>
	{/if}
</div>
