/** Which overlay is open. Kept in one place so any component can open the search or sign-in dialog. */
class Ui {
	searchOpen = $state(false);
	signInOpen = $state(false);
	menuOpen = $state(false);
	filtersOpen = $state(false);
	/** last announcement for the polite live region (e.g. "Imported 5 entries") */
	notice = $state<string | null>(null);

	openSearch(): void {
		this.menuOpen = false;
		this.searchOpen = true;
	}

	openSignIn(): void {
		this.menuOpen = false;
		this.signInOpen = true;
	}

	announce(message: string): void {
		this.notice = message;
		setTimeout(() => {
			if (this.notice === message) this.notice = null;
		}, 6000);
	}
}

export const ui = new Ui();
