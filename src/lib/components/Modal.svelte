<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		label,
		variant = 'center',
		width,
		top,
		sheetOnMobile = false,
		children
	}: {
		open: boolean;
		label: string;
		variant?: 'center' | 'sheet' | 'drawer';
		/** width of the centered dialog in px */
		width?: number;
		/** distance from the top of the centered dialog in px */
		top?: number;
		/** on touch layouts the centered dialog becomes a bottom sheet */
		sheetOnMobile?: boolean;
		children: Snippet;
	} = $props();

	let dialog = $state<HTMLDialogElement>();

	// A native <dialog> gives focus trapping, Escape to close and the top layer for free.
	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	class="dlg dlg-{variant}"
	data-sheet={sheetOnMobile ? 'mobile' : undefined}
	aria-label={label}
	style:--dlg-w={width ? `${width}px` : undefined}
	style:--dlg-top={top !== undefined ? `${top}px` : undefined}
	onclose={() => (open = false)}
	onclick={(event) => {
		if (event.target === dialog) open = false;
	}}
>
	{#if open}
		{@render children()}
	{/if}
</dialog>
