<script lang="ts">
	let { name, size, fill = false }: { name: string; size?: 's' | 'l'; fill?: boolean } = $props();
</script>

<svg
	class="ic"
	class:ic-s={size === 's'}
	class:ic-l={size === 'l'}
	style:fill={fill ? 'currentColor' : undefined}
	aria-hidden="true"
	focusable="false"
>
	<use href="#{name}" />
</svg>
