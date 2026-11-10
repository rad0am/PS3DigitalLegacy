<script lang="ts">
	import SeoMeta from '#lib/components/SeoMeta.svelte';
	import { resolve } from '$app/paths';
	import Cover from '#lib/components/Cover.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Lightbox from '#lib/components/Lightbox.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { issueUrl } from '#lib/config.js';
	import { formatAmount, formatPrice, lookupInList, resolvePrice } from '#lib/currency/price.js';
	import { formatDate, formatList, numberLocale, releaseYear } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { list } from '#lib/state/list.svelte.js';
	import { settings } from '#lib/state/settings.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const game = $derived(data.game);
	const status = $derived(list.statusOf(game.id));
	const locale = $derived(numberLocale());

	const PRICES_SHOWN = 6;
	const SHOTS_SHOWN = 4;
	let allPrices = $state(false);
	let allShots = $state(false);
	let lightboxOpen = $state(false);
	let lightboxIndex = $state(0);
	let failedShots = $state<Record<string, boolean>>({});

	// Notes in the data are free text; a few known shapes get neutral wording, the rest is shown as is.
	const DISC_NOTE = 'Also released on PS3 disc in: ';
	const priceNotes = $derived(game.notes.filter((note) => /store prices? (is|are) for/.test(note)));
	const discCollections = $derived(
		game.notes
			.filter((note) => note.startsWith(DISC_NOTE))
			.map((note) => note.slice(DISC_NOTE.length))
	);
	const laterDisc = $derived(game.notes.includes('laterPhysicalRelease'));
	const otherNotes = $derived(
		game.notes.filter(
			(note) =>
				!priceNotes.includes(note) && !note.startsWith(DISC_NOTE) && note !== 'laterPhysicalRelease'
		)
	);

	// Selected currency first, then USD and EUR, then the rest alphabetically.
	const priceRows = $derived.by(() => {
		const selected = settings.currency;
		const rank = (currency: string) =>
			currency === selected ? 0 : currency === 'USD' ? 1 : currency === 'EUR' ? 2 : 3;
		return [...game.prices].sort(
			(a, b) => rank(a.currency) - rank(b.currency) || a.currency.localeCompare(b.currency)
		);
	});
	const hasSelectedPrice = $derived(
		game.prices.some((price) => price.currency === settings.currency)
	);
	const visiblePrices = $derived(allPrices ? priceRows : priceRows.slice(0, PRICES_SHOWN));

	const year = $derived(releaseYear(game.releaseDate));
	const subtitle = $derived([game.developers[0], year].filter(Boolean).join(' · '));
	const shots = $derived(allShots ? game.screenshots : game.screenshots.slice(0, SHOTS_SHOWN));
	const showPsn = $derived(
		game.psnprofilesUrl !== null && (game.hasPlatinum || game.trophiesSupported)
	);
	const reportTitle = $derived(`[Fix] ${game.title}`);

	function dlcPrice(prices: { currency: string; amount: number }[]) {
		return resolvePrice(lookupInList(prices), settings.currency);
	}
</script>

<SeoMeta
	title={game.title}
	description={game.description?.slice(0, 160) ?? m.app_tagline()}
	type="article"
/>

<main class="wrap" id="main">
	<div class="crumb">
		<a href={resolve('/')}>{m.nav_catalog()}</a> /
		<a href={resolve('/games')}>{m.nav_games()}</a> / {game.title}
	</div>

	<div class="game-cols">
		<div class="game-side">
			<Cover cover={game.cover} />
			<button
				class="btn btn-lg btn-blk heart"
				type="button"
				aria-pressed={status === 'wishlist'}
				onclick={() => list.toggleWishlist(game.id)}
			>
				<Icon name="heart" />{status === 'wishlist'
					? m.action_want_remove_short()
					: m.action_want_add_short()}
			</button>
			<button
				class="btn btn-lg btn-blk"
				class:btn-ok={status === 'bought'}
				type="button"
				aria-pressed={status === 'bought'}
				onclick={() => list.toggleBought(game.id)}
			>
				<Icon name="check" />{status === 'bought' ? m.badge_bought() : m.action_bought_mark_short()}
			</button>
			{#if showPsn && game.psnprofilesUrl}
				<a
					class="btn btn-blk"
					class:btn-red={game.hasPlatinum}
					class:btn-xl={game.hasPlatinum}
					class:btn-lg={!game.hasPlatinum}
					href={game.psnprofilesUrl}
					target="_blank"
					rel="external noopener noreferrer"
					aria-label={game.hasPlatinum ? m.psn_platinum_aria() : m.psn_trophies_aria()}
				>
					<Icon name="trophy" />{game.hasPlatinum ? m.psn_platinum() : m.psn_trophies()}<Icon
						name="ext"
						size="s"
					/>
				</a>
				<p class="xs muted">{m.psn_note()}</p>
			{/if}
		</div>

		<div class="game-main">
			<div>
				<div class="row-f wrapf" style="margin-bottom:8px">
					<StatusBadge status={game.storeStatus} variant="long" />
					{#if game.digitalOnly}
						<span class="bd bd-dig"><Icon name="check" size="s" />{m.badge_digital_only()}</span>
					{:else}
						<span class="bd bd-unk">{m.badge_disc_release()}</span>
					{/if}
					{#if game.hasPlatinum}
						<span class="bd bd-gold"><Icon name="trophy" size="s" />{m.badge_platinum_long()}</span>
					{/if}
					{#if status === 'bought'}
						<span class="bd bd-bt"><Icon name="check" size="s" />{m.badge_bought()}</span>
					{:else if status === 'wishlist'}
						<span class="bd bd-want"><Icon name="heart" size="s" fill />{m.badge_want()}</span>
					{/if}
				</div>
				<h1 class="h1 h1-xl">{game.title}</h1>
				{#if subtitle}<p class="muted" style="margin-top:4px;font-size:16px">{subtitle}</p>{/if}
			</div>

			<div class="card">
				<dl class="kv">
					{#if game.developers.length}<dt>{m.detail_developers()}</dt>
						<dd>{formatList(game.developers)}</dd>{/if}
					{#if game.publishers.length}<dt>{m.detail_publishers()}</dt>
						<dd>{formatList(game.publishers)}</dd>{/if}
					{#if game.releaseDate}<dt>{m.detail_release()}</dt>
						<dd>{formatDate(game.releaseDate)}</dd>{/if}
					{#if game.genres.length}<dt>{m.detail_genres()}</dt>
						<dd>{game.genres.join(', ')}</dd>{/if}
					{#if game.playerPerspectives.length}<dt>{m.detail_perspectives()}</dt>
						<dd>{game.playerPerspectives.join(', ')}</dd>{/if}
					<dt>{m.detail_platform()}</dt>
					<dd><span class="bd bd-plat">{game.platform}</span></dd>
					{#if game.regions.length}<dt>{m.detail_regions()}</dt>
						<dd class="tags">
							{#each game.regions as region (region)}<span class="tag">{region}</span>{/each}
						</dd>{/if}
					{#if game.trophiesSupported}<dt>{m.detail_trophies()}</dt>
						<dd>
							{game.hasPlatinum ? m.detail_trophies_platinum() : m.detail_trophies_supported()}
						</dd>{/if}
				</dl>
			</div>

			{#if !game.digitalOnly}
				<div class="note warn">
					<Icon name="info" />
					<div><b>{game.dlc.length > 0 ? m.note_disc_with_dlc() : m.note_disc()}</b></div>
				</div>
			{/if}
			{#if laterDisc}
				<div class="note warn">
					<Icon name="info" />
					<div>{m.note_later_disc()}</div>
				</div>
			{/if}
			{#each discCollections as name (name)}
				<div class="note warn">
					<Icon name="info" />
					<div>{m.note_disc_collection({ name })}</div>
				</div>
			{/each}
			{#each otherNotes as note (note)}
				<div class="note">
					<Icon name="info" />
					<div>{note}</div>
				</div>
			{/each}

			{#if game.description}
				<section>
					<h2 class="h3" style="margin-bottom:8px">{m.detail_description()}</h2>
					<p style="max-width:760px;font-size:15px;line-height:24px;white-space:pre-line">
						{game.description}
					</p>
				</section>
			{/if}

			{#if game.screenshots.length}
				<section>
					<h2 class="h3" style="margin-bottom:12px">{m.detail_screenshots()}</h2>
					<div class="shots">
						{#each shots as src (src)}
							<button
								class="shot"
								type="button"
								aria-label={m.detail_screenshot_open({
									n: game.screenshots.indexOf(src) + 1,
									total: game.screenshots.length
								})}
								onclick={() => {
									lightboxIndex = game.screenshots.indexOf(src);
									lightboxOpen = true;
								}}
							>
								{#if failedShots[src]}
									<Icon name="image" size="l" />
								{:else}
									<img
										{src}
										alt=""
										loading="lazy"
										decoding="async"
										referrerpolicy="no-referrer"
										onerror={() => (failedShots[src] = true)}
									/>
								{/if}
							</button>
						{/each}
					</div>
					{#if game.screenshots.length > SHOTS_SHOWN}
						<button
							class="link sm"
							type="button"
							style="margin-top:12px"
							onclick={() => (allShots = !allShots)}
						>
							{allShots
								? m.detail_show_fewer()
								: m.detail_screenshots_all({ count: game.screenshots.length })}
						</button>
					{/if}
				</section>
			{/if}

			<section class="card">
				<div class="row-f wrapf" style="margin-bottom:12px">
					<h2 class="h3">{m.detail_prices()}</h2>
					<span class="muted sm right">{m.detail_prices_note()}</span>
				</div>
				{#if game.prices.length === 0}
					<p class="muted">
						{game.digitalOnly ? m.price_unavailable() : m.detail_no_price_disc()}
					</p>
				{:else}
					{#if !hasSelectedPrice}
						<p class="muted sm" style="margin-bottom:8px">
							{m.detail_no_price_in({ currency: settings.currency })}
						</p>
					{/if}
					<div class="pt">
						{#each visiblePrices as price (price.currency)}
							<div class:sel={price.currency === settings.currency}>
								<span
									>{price.currency}{price.currency === settings.currency
										? ` ${m.detail_selected()}`
										: ''}</span
								>
								<span>{formatAmount(price.amount, price.currency, locale)}</span>
							</div>
						{/each}
					</div>
					{#if priceRows.length > PRICES_SHOWN}
						<button
							class="link sm"
							type="button"
							style="margin-top:12px"
							onclick={() => (allPrices = !allPrices)}
						>
							{allPrices ? m.detail_show_fewer() : m.detail_prices_all({ count: priceRows.length })}
						</button>
					{/if}
				{/if}
				{#if priceNotes.length}
					<ul class="xs muted" style="margin:12px 0 0;padding-left:18px">
						{#each priceNotes as note (note)}<li>{note}</li>{/each}
					</ul>
				{/if}
			</section>

			{#if game.dlc.length}
				<section class="card" id="dlc">
					<div class="row-f" style="margin-bottom:4px">
						<h2 class="h3">{m.badge_dlc()}</h2>
						<span class="muted sm">{m.detail_dlc_count({ count: game.dlc.length })}</span>
					</div>
					{#each game.dlc as dlc (dlc.id)}
						{@const dlcStatus = list.statusOf(dlc.id)}
						{@const price = dlcPrice(dlc.prices)}
						<div class="drow" class:bought={dlcStatus === 'bought'}>
							<div class="dn grow">
								<div class="h4">{dlc.name}</div>
								<div class="meta row-f" style="gap:6px;flex-wrap:wrap">
									{#if dlc.trophies && dlc.trophies > 0}
										<Icon name="trophy" size="s" />{m.dlc_adds_trophies()}
										{#if game.psnprofilesUrl}
											· <a
												class="link"
												href={game.psnprofilesUrl}
												target="_blank"
												rel="external noopener noreferrer"
												style="font-weight:500">{m.dlc_check_psn()}</a
											>
										{/if}
									{:else}
										{m.dlc_no_trophies()}
									{/if}
								</div>
							</div>
							{#if dlcStatus === 'bought'}
								<span class="bd bd-bt mini-bt"
									><Icon name="check" size="s" />{m.badge_bought()}</span
								>
							{/if}
							<div class="price" class:na={!price} style="width:110px">
								{#if price}
									{formatPrice(price, locale)}
									{#if price.fallback}<small
											>{m.price_fallback({
												selected: settings.currency,
												shown: price.currency
											})}</small
										>{/if}
								{:else}
									{m.price_unavailable()}
								{/if}
							</div>
							<div class="acts">
								<button
									class="ib heart"
									type="button"
									aria-pressed={dlcStatus === 'wishlist'}
									aria-label={dlcStatus === 'wishlist'
										? m.action_want_remove({ title: dlc.name })
										: m.action_want_add({ title: dlc.name })}
									onclick={() => list.toggleWishlist(dlc.id)}><Icon name="heart" /></button
								>
								<button
									class="ib check"
									type="button"
									aria-pressed={dlcStatus === 'bought'}
									aria-label={dlcStatus === 'bought'
										? m.action_bought_unmark({ title: dlc.name })
										: m.action_bought_mark({ title: dlc.name })}
									onclick={() => list.toggleBought(dlc.id)}><Icon name="check" /></button
								>
							</div>
						</div>
					{/each}
				</section>
			{/if}

			<section class="card row-f card-split" style="gap:16px">
				<Icon name="info" />
				<div class="grow">
					<h2 class="h4">{m.report_problem_title()}</h2>
					<p class="muted sm">{m.report_problem_text()}</p>
				</div>
				<a
					class="btn btn-out btn-sm"
					href={issueUrl('remove-game', reportTitle)}
					target="_blank"
					rel="external noopener noreferrer"
					aria-label={m.report_problem_aria({ title: game.title })}
				>
					{m.report_problem()}<Icon name="ext" size="s" />
				</a>
			</section>

			<p class="muted sm">{m.detail_footnote()}</p>
		</div>
	</div>
</main>

<Lightbox bind:open={lightboxOpen} bind:index={lightboxIndex} images={game.screenshots} />
