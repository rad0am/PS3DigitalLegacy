<script lang="ts">
	import { resolve } from '$app/paths';
	import { issueUrl, siteConfig } from '#lib/config.js';
	import { m } from '#lib/paraglide/messages.js';
</script>

<footer class="foot">
	<div>
		<a class="logo" href={resolve('/')}><b>PS3</b><i>Digital Legacy</i></a>
		<p>{m.footer_disclaimer()}</p>
	</div>
	<div>
		<h4>{m.footer_explore()}</h4>
		<p>
			<a href={resolve('/catalog')}>{m.nav_catalog()}</a><br />
			<a href={resolve('/my-list')}>{m.nav_my_list()}</a><br />
			<a href={resolve('/about')}>{m.nav_about()}</a>
		</p>
	</div>
	<div>
		<h4>{m.footer_data()}</h4>
		<p>
			{m.footer_data_text_before()}
			<a href={siteConfig.igdbUrl} target="_blank" rel="external noopener noreferrer">IGDB</a
			>{m.footer_data_text_middle()}
			<a href={siteConfig.psnProfilesUrl} target="_blank" rel="external noopener noreferrer"
				>PSNProfiles</a
			>{m.footer_data_text_after()}
		</p>
	</div>
	<div>
		<h4>{m.footer_project()}</h4>
		<p>
			<a href={siteConfig.repoUrl} target="_blank" rel="external noopener noreferrer"
				>{m.footer_github()}</a
			><br />
			<a href={issueUrl('missing-game')} target="_blank" rel="external noopener noreferrer"
				>{m.report_missing_game()}</a
			><br />
			<a href={issueUrl('bug')} target="_blank" rel="external noopener noreferrer"
				>{m.report_bug()}</a
			><br />
			<a href={siteConfig.coffeeUrl} target="_blank" rel="external noopener noreferrer"
				>{m.coffee()}</a
			>
		</p>
	</div>
</footer>
