<script lang="ts">
	import { coverUrl } from '#lib/config.js';
	import { m } from '#lib/paraglide/messages.js';
	import Icon from './Icon.svelte';

	let { cover, size = 'cover_big' }: { cover: string | null; size?: 'cover_small' | 'cover_big' } =
		$props();

	let failed = $state(false);
</script>

<!-- Covers load lazily from IGDB; a neutral placeholder shows when there is none or it fails. -->
{#if failed}
	<div class="cover er" role="img" aria-label={m.cover_unavailable()}>
		<Icon name="image" size="l" />
	</div>
{:else}
	<div class="cover" aria-hidden="true">
		{#if cover}
			<img
				src={coverUrl(cover, size)}
				alt=""
				loading="lazy"
				decoding="async"
				referrerpolicy="no-referrer"
				onerror={() => (failed = true)}
			/>
		{:else}
			<Icon name="image" size="l" />
		{/if}
	</div>
{/if}
