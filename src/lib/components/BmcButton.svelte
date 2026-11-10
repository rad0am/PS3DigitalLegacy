<script lang="ts">
	import { siteConfig } from '#lib/config.js';

	let { size = 'md', block = false }: { size?: 'md' | 'lg'; block?: boolean } = $props();
</script>

<!-- Looks like the official Buy Me a Coffee button, but it is a plain link: no third-party script.
     The name is the brand's and is not translated. -->
<a
	class="bmc"
	class:bmc-lg={size === 'lg'}
	class:bmc-block={block}
	href={siteConfig.coffeeUrl}
	target="_blank"
	rel="external noopener noreferrer"
>
	<svg class="bmc-cup" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
		<ellipse cx="14" cy="26" rx="11" ry="3" fill="#fff" />
		<path d="M5 12h19v7a8 8 0 0 1-8 8h-3a8 8 0 0 1-8-8z" fill="#fff" />
		<path d="M24 14h2.5a3.5 3.5 0 0 1 0 7H23" fill="none" stroke="#fff" stroke-width="2.6" />
		<ellipse cx="14.5" cy="12.5" rx="9.5" ry="3.2" fill="#fff" />
		<ellipse cx="14.5" cy="12.7" rx="7.2" ry="2.1" fill="#c98b94" />
	</svg>
	<span>Buy me a coffee</span>
</a>
