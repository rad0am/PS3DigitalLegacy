<script lang="ts">
	import SeoMeta from '#lib/components/SeoMeta.svelte';
	import { resolve } from '$app/paths';
	import GameRow from '#lib/components/GameRow.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { formatNumber, numberLocale } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { auth } from '#lib/state/auth.svelte.js';
	import { catalogStore } from '#lib/state/catalog.svelte.js';
	import { list } from '#lib/state/list.svelte.js';
	import { ui } from '#lib/state/ui.svelte.js';

	const PAGE_SIZE = 50;

	let tab = $state<'wishlist' | 'bought'>('wishlist');
	let shown = $state(PAGE_SIZE);
	let fileInput = $state<HTMLInputElement>();

	const catalog = $derived(catalogStore.catalog);

	function itemsWith(status: 'wishlist' | 'bought') {
		if (!catalog) return [];
		return list
			.idsWith(status)
			.map((id) => catalog.byId.get(id))
			.filter((item) => item !== undefined);
	}

	const wanted = $derived(itemsWith('wishlist'));
	const bought = $derived(itemsWith('bought'));
	const current = $derived(tab === 'wishlist' ? wanted : bought);
	const visible = $derived(current.slice(0, shown));

	// Progress counts digital-only games only: DLC and disc games are not part of the goal.
	const total = $derived(catalog?.totals.digitalOnlyGames ?? 0);
	const owned = $derived(bought.filter((item) => item.kind === 'game' && item.digitalOnly).length);
	const dlcTotal = $derived(catalog?.totals.dlc ?? 0);
	const dlcOwned = $derived(bought.filter((item) => item.kind === 'dlc').length);

	function percentOf(owned: number, total: number): string {
		return new Intl.NumberFormat(numberLocale(), { maximumFractionDigits: 1 }).format(
			total > 0 ? (owned / total) * 100 : 0
		);
	}

	$effect(() => {
		void tab;
		shown = PAGE_SIZE;
	});

	function exportList() {
		const blob = new Blob([list.exportJson()], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'ps3-digital-legacy-list.json';
		link.click();
		URL.revokeObjectURL(url);
	}

	async function importList(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (!file) return;
		// An exported list is a few KB; refuse anything unreasonably large.
		const count = file.size <= 2_000_000 ? list.importJson(await file.text()) : null;
		ui.announce(count === null ? m.import_failed() : m.import_done({ count }));
	}
</script>

<SeoMeta title={m.nav_my_list()} />

{#snippet bar(owned: number, total: number, suffix: string, note: string)}
	<div>
		<div class="row-f wrapf" style="margin-bottom:8px">
			<h2 class="h3">{m.list_own({ owned: formatNumber(owned), total: formatNumber(total) })}</h2>
			<span class="muted sm">{suffix}</span>
		</div>
		<div
			class="prog"
			role="progressbar"
			aria-valuenow={owned}
			aria-valuemin="0"
			aria-valuemax={total}
			aria-label="{m.list_own({ owned: formatNumber(owned), total: formatNumber(total) })} {suffix}"
		>
			<i
				style:width="{total > 0 ? (owned / total) * 100 : 0}%"
				style:min-width={owned > 0 ? '12px' : undefined}
			></i>
		</div>
		<p class="muted sm" style="margin-top:8px">{note}</p>
	</div>
{/snippet}

<main class="wrap" id="main">
	<div class="wrap-narrow">
		<div>
			<div class="crumb"><a href={resolve('/')}>{m.crumb_home()}</a> / {m.nav_my_list()}</div>
			<h1 class="h1">{m.nav_my_list()}</h1>
		</div>

		<section class="card card-split" style="display:flex;gap:32px;align-items:center">
			<div class="grow" style="display:flex;flex-direction:column;gap:20px">
				{@render bar(
					owned,
					total,
					m.list_own_suffix(),
					owned === 0
						? m.list_progress_empty()
						: m.list_progress({ percent: percentOf(owned, total), wanted: list.wishlistCount })
				)}
				{@render bar(
					dlcOwned,
					dlcTotal,
					m.list_own_suffix_dlc(),
					dlcOwned === 0
						? m.list_progress_empty_dlc()
						: m.list_progress_dlc({ percent: percentOf(dlcOwned, dlcTotal) })
				)}
			</div>
			<div class="row-f" style="gap:8px">
				<button class="btn" type="button" onclick={exportList}
					><Icon name="download" />{m.list_export()}</button
				>
				<button class="btn" type="button" onclick={() => fileInput?.click()}
					><Icon name="upload" />{m.list_import()}</button
				>
				<input
					bind:this={fileInput}
					type="file"
					accept="application/json,.json"
					class="sr-only"
					tabindex="-1"
					aria-hidden="true"
					onchange={importList}
				/>
			</div>
		</section>

		{#if auth.user}
			<div class="note ok">
				<Icon name="cloud" />
				<div class="grow"><b>{m.list_synced_title()}</b> {m.list_synced_text()}</div>
			</div>
		{:else}
			<div class="note">
				<Icon name="cloud" />
				<div class="grow"><b>{m.list_local_title()}</b> {m.list_local_text()}</div>
				<button
					class="btn btn-sm btn-red"
					type="button"
					style="align-self:center"
					onclick={() => ui.openSignIn()}
				>
					{m.sign_in()}
				</button>
			</div>
		{/if}

		<div class="tabs" role="tablist">
			<button
				type="button"
				role="tab"
				aria-selected={tab === 'wishlist'}
				onclick={() => (tab = 'wishlist')}
			>
				<Icon name="heart" size="s" fill />{m.list_tab_want()}
				<span class="bd bd-want bd-pill">{wanted.length}</span>
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={tab === 'bought'}
				onclick={() => (tab = 'bought')}
			>
				<Icon name="check" size="s" />{m.list_tab_bought()}
				<span class="bd bd-unk bd-pill">{bought.length}</span>
			</button>
		</div>

		{#if !catalog}
			<div class="stack-s" aria-busy="true" aria-label={m.loading()}>
				{#each [0, 1, 2] as n (n)}
					<div class="row">
						<div class="sk" style="width:72px;height:96px;border-radius:8px"></div>
						<div class="col-f">
							<div class="sk" style="height:18px;width:60%"></div>
							<div class="sk" style="height:14px;width:30%"></div>
						</div>
						<div></div>
						<div></div>
					</div>
				{/each}
			</div>
		{:else if current.length === 0}
			<section class="card card-empty" role="tabpanel">
				<div
					style="width:64px;height:64px;border-radius:50%;background:var(--red-t);color:var(--red);display:grid;place-items:center;margin:0 auto 16px"
				>
					<Icon name={tab === 'wishlist' ? 'heart' : 'check'} size="l" />
				</div>
				<h2 class="h3">
					{tab === 'wishlist' ? m.list_empty_want_title() : m.list_empty_bought_title()}
				</h2>
				<p class="muted" style="margin:8px auto 20px;max-width:480px">
					{tab === 'wishlist' ? m.list_empty_want_text() : m.list_empty_bought_text()}
				</p>
				<a class="btn btn-red btn-lg" href={resolve('/')}>{m.list_browse()}</a>
			</section>
		{:else}
			<div class="stack-s" role="tabpanel">
				{#each visible as item (item.id)}
					<GameRow {item} />
				{/each}
			</div>
			{#if current.length > visible.length}
				<div class="more" style="padding-top:8px">
					<p class="muted sm">
						{m.results_showing({
							shown: formatNumber(visible.length),
							total: formatNumber(current.length)
						})}
					</p>
					<button class="btn btn-lg" type="button" onclick={() => (shown += PAGE_SIZE)}>
						{m.show_more({ count: Math.min(PAGE_SIZE, current.length - visible.length) })}
					</button>
				</div>
			{/if}
		{/if}
	</div>
</main>
