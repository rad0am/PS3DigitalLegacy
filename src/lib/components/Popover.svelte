<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		trigger,
		children,
		align = 'right',
		sheetOnMobile = false,
		block = false,
		width,
		label
	}: {
		open: boolean;
		/** receives props to spread on the toggle button */
		trigger: Snippet<
			[{ onclick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'dialog' }]
		>;
		children: Snippet;
		align?: 'left' | 'right';
		/** becomes a bottom sheet on touch layouts */
		sheetOnMobile?: boolean;
		/** fill the width of the parent instead of the width of the trigger */
		block?: boolean;
		width?: number;
		label: string;
	} = $props();

	let root = $state<HTMLElement>();

	function onWindowClick(event: MouseEvent) {
		if (open && root && !root.contains(event.target as Node)) open = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') {
			open = false;
			root?.querySelector<HTMLElement>('[aria-haspopup]')?.focus();
		}
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKeydown} />

<div class="popwrap" class:popwrap-block={block} bind:this={root}>
	{@render trigger({
		onclick: () => (open = !open),
		'aria-expanded': open,
		'aria-haspopup': 'dialog'
	})}
	{#if open}
		<div class="pop-ov" class:on={sheetOnMobile} aria-hidden="true"></div>
		<div
			class="pop {align === 'right' ? 'pop-r' : 'pop-l'}"
			class:sheet-pop={sheetOnMobile}
			role="dialog"
			aria-label={label}
			style:width={width ? `${width}px` : undefined}
		>
			{@render children()}
		</div>
	{/if}
</div>
