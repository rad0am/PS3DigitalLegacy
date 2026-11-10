<script lang="ts">
	import SeoMeta from '#lib/components/SeoMeta.svelte';
	import { resolve } from '$app/paths';
	import BmcButton from '#lib/components/BmcButton.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { issueUrl, siteConfig } from '#lib/config.js';
	import { formatNumber } from '#lib/i18n.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<SeoMeta title={m.nav_about()} />

<main class="wrap" id="main">
	<div class="wrap-about">
		<div>
			<div class="crumb"><a href={resolve('/')}>{m.crumb_home()}</a> / {m.nav_about()}</div>
			<h1 class="h1 h1-xl">{m.about_title()}</h1>
			<svg
				viewBox="0 0 240 12"
				width="240"
				height="12"
				fill="none"
				stroke="#4fc3f0"
				stroke-width="2.4"
				stroke-linecap="round"
				style="margin-top:10px"
				aria-hidden="true"
			>
				<path d="M2 6c10-8 20-8 30 0s20 8 30 0 20-8 30 0 20 8 30 0 20-8 30 0 20 8 30 0 20-8 26-2" />
			</svg>
		</div>

		<section class="card prose prose-l">
			<h2 class="h2" style="margin-bottom:12px">{m.about_what_title()}</h2>
			<p>{m.about_what_1()}</p>
			<p>{m.about_what_2({ games: formatNumber(data.games), dlc: formatNumber(data.dlc) })}</p>
		</section>

		<div class="note warn">
			<Icon name="info" />
			<div><b>{m.about_disclaimer_title()}</b> {m.about_disclaimer_text()}</div>
		</div>

		<div class="grid-2">
			<section class="card">
				<h2 class="h3" style="margin-bottom:8px">{m.about_sources_title()}</h2>
				<p style="margin-bottom:12px">{m.about_sources_text()}</p>
				<div class="row-f wrapf">
					<a
						class="btn btn-sm"
						href={siteConfig.igdbUrl}
						target="_blank"
						rel="external noopener noreferrer">IGDB<Icon name="ext" size="s" /></a
					>
					<a
						class="btn btn-sm"
						href={siteConfig.psnProfilesUrl}
						target="_blank"
						rel="external noopener noreferrer">PSNProfiles<Icon name="ext" size="s" /></a
					>
					<a
						class="btn btn-sm"
						href={siteConfig.repoUrl}
						target="_blank"
						rel="external noopener noreferrer">{m.footer_github()}<Icon name="ext" size="s" /></a
					>
				</div>
			</section>
			<section class="card">
				<h2 class="h3" style="margin-bottom:8px">{m.about_platinum_title()}</h2>
				<p>{m.about_platinum_text()}</p>
			</section>
		</div>

		<section class="card">
			<h2 class="h2" style="margin-bottom:12px">{m.about_digital_title()}</h2>
			<div class="grid-3">
				<div class="col-f" style="gap:6px">
					<span class="bd bd-dig" style="font-size:14px"
						><Icon name="check" size="s" />{m.badge_digital_only()}</span
					>
					<p>{m.about_digital_only()}</p>
				</div>
				<div class="col-f" style="gap:6px">
					<span class="bd bd-unk" style="font-size:14px;align-self:flex-start"
						>{m.badge_disc_release()}</span
					>
					<p>{m.about_digital_disc()}</p>
				</div>
				<div class="col-f" style="gap:6px">
					<span class="bd bd-sky" style="font-size:14px;align-self:flex-start">{m.badge_dlc()}</span
					>
					<p>{m.about_digital_dlc()}</p>
				</div>
			</div>
		</section>

		<section class="card prose prose-l">
			<h2 class="h2" style="margin-bottom:6px">{m.about_help_title()}</h2>
			<p style="margin-bottom:16px">{m.about_help_text()}</p>
			<div class="row-f wrapf">
				<a
					class="btn"
					href={issueUrl('missing-game')}
					target="_blank"
					rel="external noopener noreferrer"
					>{m.report_missing_game()}<Icon name="ext" size="s" /></a
				>
				<a
					class="btn"
					href={issueUrl('remove-game')}
					target="_blank"
					rel="external noopener noreferrer">{m.report_remove_game()}<Icon name="ext" size="s" /></a
				>
				<a
					class="btn btn-out"
					href={issueUrl('bug')}
					target="_blank"
					rel="external noopener noreferrer">{m.report_bug()}<Icon name="ext" size="s" /></a
				>
			</div>
		</section>

		<section class="card card-split" style="display:flex;align-items:center;gap:24px">
			<div class="grow prose prose-l">
				<h2 class="h2" style="margin-bottom:6px">{m.about_support_title()}</h2>
				<p>{m.about_support_text()}</p>
			</div>
			<BmcButton size="lg" />
		</section>
	</div>
</main>
