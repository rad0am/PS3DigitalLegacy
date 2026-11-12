<script lang="ts">
	import { resolve } from '$app/paths';
	import BmcButton from '#lib/components/BmcButton.svelte';
	import ClosureCard from '#lib/components/ClosureCard.svelte';
	import GameCard from '#lib/components/GameCard.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PickRow from '#lib/components/PickRow.svelte';
	import SeoMeta from '#lib/components/SeoMeta.svelte';
	import { issueUrl } from '#lib/config.js';
	import { daySeed, pickDaily } from '#lib/data/daily.js';
	import { formatNumber } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import { auth } from '#lib/state/auth.svelte.js';
	import { catalogStore } from '#lib/state/catalog.svelte.js';
	import { list } from '#lib/state/list.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const PLATINUM_COUNT = 4;
	const PICKS_COUNT = 6;

	const catalog = $derived(catalogStore.catalog);

	// ---- your progress (same rules as My list: digital-only games, and all DLC) ----
	const bought = $derived(
		catalog
			? list
					.idsWith('bought')
					.map((id) => catalog.byId.get(id))
					.filter((item) => item !== undefined)
			: []
	);
	const owned = $derived(bought.filter((item) => item.kind === 'game' && item.digitalOnly).length);
	const dlcOwned = $derived(bought.filter((item) => item.kind === 'dlc').length);

	const stats = $derived(data.stats);
	const progress = $derived([
		{ label: m.home_progress_games(), count: owned, total: stats.games, showWanted: true },
		{ label: m.home_progress_dlc(), count: dlcOwned, total: stats.dlc, showWanted: false }
	]);

	// ---- picks of the day: random, the same for everyone, new ones every day (UTC) ----
	// Only games that can be bought now and have a cover. Sections use different salts and the
	// picks section skips the platinum games, so a game never shows up twice.
	const seed = daySeed();
	const candidates = $derived(
		catalog
			? catalog.items
					.slice(0, catalog.gameCount)
					.filter((item) => item.digitalOnly && item.status === 'available' && item.cover)
			: []
	);
	const platinum = $derived(
		pickDaily(
			candidates.filter((item) => item.hasPlatinum),
			(item) => item.id,
			PLATINUM_COUNT,
			seed,
			1
		)
	);
	const picks = $derived.by(() => {
		const taken = new Set(platinum.map((item) => item.id));
		return pickDaily(
			candidates.filter((item) => !taken.has(item.id)),
			(item) => item.id,
			PICKS_COUNT,
			seed,
			2
		);
	});

	function genreHref(name: string): string {
		const params = new URLSearchParams({ genre: name });
		return `${resolve('/games')}?${params.toString()}`;
	}
</script>

<SeoMeta description={m.meta_home_description()} />

<main id="main">
	<section class="hero" aria-labelledby="home-title">
		<div class="hero-in">
			<div>
				<span class="eyebrow"><Icon name="clock" size="s" />{m.home_eyebrow()}</span>
				<h1 id="home-title">
					{m.home_title_before()}<em>{m.home_title_em()}</em>{m.home_title_after()}
				</h1>
				<p class="lead">
					{m.home_lead({ games: formatNumber(stats.games), dlc: formatNumber(stats.dlc) })}
				</p>
				<div class="cta">
					<a class="btn btn-wh btn-xl" href={resolve('/catalog')}
						><Icon name="grid" />{m.home_cta_browse()}</a
					>
					<a class="btn btn-gh btn-xl" href={resolve('/my-list')}
						><Icon name="heart" />{m.home_cta_list()}</a
					>
				</div>
			</div>
			<ClosureCard />
		</div>
		<svg class="hwave" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true">
			<path
				d="M0 20c25-26 50-26 75 0s50 26 75 0 50-26 75 0 50 26 75 0 50-26 75 0 50 26 75 0 50-26 75 0 50 26 75 0"
			/>
		</svg>
	</section>

	<div class="wrap" style="padding-top:0">
		<div class="stats">
			<div class="stat"><b>{formatNumber(stats.games)}</b><span>{m.home_stat_games()}</span></div>
			<div class="stat"><b>{formatNumber(stats.dlc)}</b><span>{m.home_stat_dlc()}</span></div>
			<div class="stat">
				<b>{formatNumber(stats.available)}</b><span>{m.home_stat_available()}</span>
			</div>
			<div class="stat">
				<b>{formatNumber(stats.platinum)}</b><span>{m.home_stat_platinum()}</span>
			</div>
		</div>

		<section class="sec" aria-labelledby="home-progress">
			<div class="card pcard">
				<div class="row-f wrapf" style="gap:12px">
					<h2 class="h2" id="home-progress">{m.home_progress_title()}</h2>
					<span class="bd bd-sky"
						>{auth.user ? m.home_progress_account() : m.home_progress_device()}</span
					>
					<a class="btn btn-out btn-sm btn-open" style="margin-left:auto" href={resolve('/my-list')}
						>{m.home_cta_list()}</a
					>
				</div>
				<div class="two" style="gap:32px;margin-top:4px">
					{#each progress as row (row.label)}
						<div>
							<div class="prog-l">
								<span><b>{row.label}</b></span>
								<span>
									{m.home_progress_own({
										owned: formatNumber(row.count),
										total: formatNumber(row.total)
									})}
									{#if row.showWanted && list.wishlistCount > 0}
										· {m.home_progress_wanted({ wanted: formatNumber(list.wishlistCount) })}
									{/if}
								</span>
							</div>
							<div
								class="prog"
								role="progressbar"
								aria-label={row.label}
								aria-valuemin="0"
								aria-valuemax={row.total}
								aria-valuenow={row.count}
							>
								<i
									style:width="{row.total > 0 ? (row.count / row.total) * 100 : 0}%"
									style:min-width={row.count > 0 ? '12px' : undefined}
								></i>
							</div>
						</div>
					{/each}
				</div>
				{#if !auth.user}
					<p class="muted sm" style="margin-top:14px">{m.home_progress_hint()}</p>
				{/if}
			</div>
		</section>

		<section class="sec" aria-labelledby="home-picks">
			<div class="sec-h">
				<h2 class="h2" id="home-picks">{m.home_picks_title()}</h2>
				<a href={resolve('/catalog')}>{m.home_browse_all()}<Icon name="arrow" size="s" /></a>
			</div>
			<p class="sec-s">{m.home_picks_text()}</p>
			<div class="card">
				<div class="picks">
					{#if picks.length > 0}
						{#each picks as item (item.id)}
							<PickRow {item} />
						{/each}
					{:else}
						{#each { length: PICKS_COUNT }, index (index)}
							<div class="rk" aria-hidden="true">
								<div class="sk" style="width:48px;height:64px"></div>
								<div class="rk-b"><div class="sk" style="height:18px;width:60%"></div></div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</section>

		<section class="sec" aria-labelledby="home-plat">
			<div class="sec-h">
				<h2 class="h2" id="home-plat">{m.home_plat_title()}</h2>
				<a href={resolve('/games')}>{m.home_plat_link()}<Icon name="arrow" size="s" /></a>
			</div>
			<p class="sec-s">{m.home_plat_text()}</p>
			<div class="gcards4">
				{#if platinum.length > 0}
					{#each platinum as item (item.id)}
						<GameCard {item} />
					{/each}
				{:else}
					{#each { length: PLATINUM_COUNT }, index (index)}
						<div class="gcard" aria-hidden="true">
							<div class="sk" style="height:200px"></div>
							<div class="sk" style="height:20px;width:70%"></div>
							<div class="sk" style="height:16px;width:40%"></div>
						</div>
					{/each}
				{/if}
			</div>
		</section>

		<section class="sec" aria-labelledby="home-genres">
			<h2 class="h2" id="home-genres" style="margin-bottom:12px">{m.home_genre_title()}</h2>
			<div class="pills">
				{#each data.genres as genre (genre.name)}
					<a class="pill" href={genreHref(genre.name)}
						>{genre.name}<span class="muted xs">{formatNumber(genre.count)}</span></a
					>
				{/each}
			</div>
		</section>

		<section class="sec" aria-labelledby="home-status">
			<h2 class="h2" id="home-status" style="margin-bottom:6px">{m.home_status_title()}</h2>
			<p class="sec-s">{m.home_status_text()}</p>
			<div class="stt">
				<div class="card">
					<span class="bd bd-ok">{m.status_available()}</span>
					<div>
						<b>{formatNumber(stats.available)}</b><span class="muted sm"
							>{m.home_status_available_text()}</span
						>
					</div>
				</div>
				<div class="card">
					<span class="bd bd-del">{m.status_delisted()}</span>
					<div>
						<b>{formatNumber(stats.delisted)}</b><span class="muted sm"
							>{m.home_status_delisted_text()}</span
						>
					</div>
				</div>
				<div class="card">
					<span class="bd bd-unk">{m.status_unknown_short()}</span>
					<div>
						<b>{formatNumber(stats.unknown)}</b><span class="muted sm"
							>{m.home_status_unknown_text()}</span
						>
					</div>
				</div>
			</div>
		</section>

		<section class="sec" aria-labelledby="home-how">
			<h2 class="h2" id="home-how" style="margin-bottom:16px">{m.home_how_title()}</h2>
			<div class="how">
				<div class="card">
					<div class="n" aria-hidden="true">1</div>
					<h3 class="h4">{m.home_how_find()}</h3>
					<p class="muted" style="margin-top:4px">{m.home_how_find_text()}</p>
				</div>
				<div class="card">
					<div class="n" aria-hidden="true">2</div>
					<h3 class="h4">{m.home_how_save()}</h3>
					<p class="muted" style="margin-top:4px">{m.home_how_save_text()}</p>
				</div>
				<div class="card">
					<div class="n" aria-hidden="true">3</div>
					<h3 class="h4">{m.home_how_sync()}</h3>
					<p class="muted" style="margin-top:4px">{m.home_how_sync_text()}</p>
				</div>
			</div>
		</section>

		<section class="sec band">
			<div class="card">
				<h2 class="h3">{m.about_help_title()}</h2>
				<p class="muted" style="margin:6px 0 16px">{m.home_help_text()}</p>
				<div class="row-f wrapf">
					<a
						class="btn btn-out"
						href={issueUrl('missing-game')}
						target="_blank"
						rel="external noopener noreferrer">{m.report_missing_game()}</a
					>
					<a
						class="btn btn-quiet"
						href={issueUrl('bug')}
						target="_blank"
						rel="external noopener noreferrer">{m.report_bug()}</a
					>
				</div>
			</div>
			<div class="card">
				<h2 class="h3">{m.about_support_title()}</h2>
				<p class="muted" style="margin:6px 0 16px">{m.home_support_text()}</p>
				<BmcButton />
			</div>
		</section>
	</div>
</main>
