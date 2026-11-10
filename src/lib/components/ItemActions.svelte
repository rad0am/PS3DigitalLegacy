<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { list } from '#lib/state/list.svelte.js';
	import Icon from './Icon.svelte';

	let { id, title }: { id: string; title: string } = $props();

	const status = $derived(list.statusOf(id));
</script>

<div class="acts">
	<button
		class="ib heart"
		type="button"
		aria-pressed={status === 'wishlist'}
		title={status === 'wishlist' ? m.action_want_remove_short() : m.action_want_add_short()}
		aria-label={status === 'wishlist'
			? m.action_want_remove({ title })
			: m.action_want_add({ title })}
		onclick={() => list.toggleWishlist(id)}
	>
		<Icon name="heart" />
	</button>
	<button
		class="ib check"
		type="button"
		aria-pressed={status === 'bought'}
		title={status === 'bought' ? m.action_bought_unmark_short() : m.action_bought_mark_short()}
		aria-label={status === 'bought'
			? m.action_bought_unmark({ title })
			: m.action_bought_mark({ title })}
		onclick={() => list.toggleBought(id)}
	>
		<Icon name="check" />
	</button>
</div>
