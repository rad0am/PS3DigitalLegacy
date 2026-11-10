<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { sync } from '#lib/state/sync.svelte.js';
	import Icon from './Icon.svelte';
</script>

{#if sync.state === 'syncing'}
	<span class="sync sync-ing" role="status"><Icon name="sync" size="s" />{m.sync_syncing()}</span>
{:else if sync.state === 'synced'}
	<span class="sync sync-ok" role="status"><Icon name="check" size="s" />{m.sync_synced()}</span>
{:else if sync.state === 'merged'}
	<span class="sync sync-mg" role="status"><Icon name="merge" size="s" />{m.sync_merged()}</span>
{:else if sync.state === 'offline'}
	<span class="sync sync-off" role="status"><Icon name="cloud" size="s" />{m.sync_offline()}</span>
{:else if sync.state === 'error'}
	<span class="sync sync-off" role="status"><Icon name="alert" size="s" />{m.sync_error()}</span>
{/if}
