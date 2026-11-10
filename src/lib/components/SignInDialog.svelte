<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { PROVIDERS, auth } from '#lib/state/auth.svelte.js';
	import { ui } from '#lib/state/ui.svelte.js';
	import Icon from './Icon.svelte';
	import Modal from './Modal.svelte';

	// Close once the sign-in succeeded.
	$effect(() => {
		if (auth.user) ui.signInOpen = false;
	});

	// Warm up Firebase Auth while the dialog is open, so the tap can open the pop-up immediately.
	$effect(() => {
		if (ui.signInOpen) void auth.preload();
	});

	$effect(() => {
		if (!ui.signInOpen) auth.error = null;
	});

	const errors = $derived({
		popup_blocked: m.sign_in_error_popup(),
		exists: m.sign_in_error_exists(),
		network: m.sign_in_error_network(),
		generic: m.sign_in_error_generic()
	});
</script>

<Modal bind:open={ui.signInOpen} label={m.sign_in()} width={480} top={150} sheetOnMobile>
	<div class="modal" style="padding:32px">
		<div class="grab only-mobile" style="margin-bottom:0"></div>
		<div class="row-f" style="margin-bottom:8px">
			<h2 class="h2">{m.sign_in()}</h2>
			<button
				class="btn btn-icon right"
				type="button"
				style="border:0"
				aria-label={m.close()}
				onclick={() => (ui.signInOpen = false)}
			>
				<Icon name="x" />
			</button>
		</div>
		<p style="font-size:15px;line-height:24px;margin-bottom:20px">{m.sign_in_intro()}</p>

		<div class="stack" role="group" aria-label={m.sign_in_providers()}>
			{#each PROVIDERS as provider (provider.id)}
				<button
					class="gbtn"
					type="button"
					disabled={!provider.enabled || auth.busy}
					onclick={() => void auth.signIn(provider.id)}
				>
					<span class="gm" aria-hidden="true">{provider.mark}</span>
					{m.sign_in_with({ provider: provider.name })}
					{#if !provider.enabled}<span class="xs muted">{m.sign_in_soon()}</span>{/if}
				</button>
			{/each}
		</div>

		{#if auth.error}
			<p class="errmsg" role="alert"><Icon name="alert" size="s" />{errors[auth.error]}</p>
		{/if}

		<ul class="checks">
			<li><Icon name="check" /><span>{m.sign_in_merge()}</span></li>
			<li><Icon name="lock" /><span>{m.sign_in_private()}</span></li>
		</ul>
		<div class="note">
			<Icon name="cloud" />
			<div>{m.sign_in_optional()}</div>
		</div>
		<div class="row-f" style="margin-top:20px;justify-content:center">
			<button
				class="link sm"
				type="button"
				style="font-weight:500"
				onclick={() => (ui.signInOpen = false)}
			>
				{m.sign_in_not_now()}
			</button>
		</div>
	</div>
</Modal>
