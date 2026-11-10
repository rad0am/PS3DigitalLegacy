<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Icon from './Icon.svelte';
	import Modal from './Modal.svelte';

	let {
		open = $bindable(false),
		images,
		index = $bindable(0)
	}: { open: boolean; images: string[]; index: number } = $props();

	let failed = $state<Record<string, boolean>>({});
	let startX: number | null = null;

	// IGDB serves the same screenshot in several sizes; the viewer uses the large one.
	const large = (url: string) => url.replace(/\/t_[a-z0-9_]+\//, '/t_1080p/');

	function go(step: number) {
		if (images.length === 0) return;
		index = (index + step + images.length) % images.length;
	}

	function onKeydown(event: KeyboardEvent) {
		if (!open) return;
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			go(-1);
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			go(1);
		}
	}

	function onPointerUp(event: PointerEvent) {
		if (startX === null) return;
		const delta = event.clientX - startX;
		startX = null;
		if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
	}

	const current = $derived(images[index]);
</script>

<svelte:window onkeydown={onKeydown} />

<Modal bind:open label={m.lightbox_label()} variant="full">
	<div class="lb">
		<div class="lb-bar">
			<span class="lb-count" aria-live="polite">{index + 1} / {images.length}</span>
			<button class="lb-btn" type="button" aria-label={m.close()} onclick={() => (open = false)}>
				<Icon name="x" />
			</button>
		</div>

		<div
			class="lb-stage"
			role="presentation"
			onpointerdown={(event) => (startX = event.clientX)}
			onpointerup={onPointerUp}
			onpointercancel={() => (startX = null)}
		>
			{#if current}
				{#if failed[current]}
					<div class="lb-fail"><Icon name="image" size="l" /></div>
				{:else}
					{#key current}
						<img
							src={large(current)}
							alt=""
							referrerpolicy="no-referrer"
							draggable="false"
							onerror={() => (failed[current] = true)}
						/>
					{/key}
				{/if}
			{/if}
		</div>

		{#if images.length > 1}
			<button
				class="lb-btn lb-prev"
				type="button"
				aria-label={m.lightbox_prev()}
				onclick={() => go(-1)}
			>
				<Icon name="chev" />
			</button>
			<button
				class="lb-btn lb-next"
				type="button"
				aria-label={m.lightbox_next()}
				onclick={() => go(1)}
			>
				<Icon name="chev" />
			</button>
		{/if}
	</div>
</Modal>
