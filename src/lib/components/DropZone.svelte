<script lang="ts">
	let {
		onFiles,
		hasData = false,
		existingZipNames = []
	}: {
		onFiles: (files: FileList) => void;
		hasData: boolean;
		existingZipNames?: string[];
	} = $props();

	let dragging = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();
	let duplicateWarning: string | null = $state(null);

	function checkDuplicates(files: FileList): string[] {
		const dupes: string[] = [];
		for (const file of files) {
			const base = file.name.replace(/\.zip$/i, '');
			if (existingZipNames.includes(base)) {
				dupes.push(file.name);
			}
		}
		return dupes;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		if (e.dataTransfer?.files) {
			const dupes = checkDuplicates(e.dataTransfer.files);
			if (dupes.length > 0) {
				duplicateWarning = `Already loaded: ${dupes.join(', ')}. Data will be added again.`;
			} else {
				duplicateWarning = null;
			}
			onFiles(e.dataTransfer.files);
		}
	}

	function handleChange() {
		if (fileInput?.files) {
			const dupes = checkDuplicates(fileInput.files);
			if (dupes.length > 0) {
				duplicateWarning = `Already loaded: ${dupes.join(', ')}. Data will be added again.`;
			} else {
				duplicateWarning = null;
			}
			onFiles(fileInput.files);
			fileInput.value = '';
		}
	}
</script>

<div
	class="mx-6 mt-6 cursor-pointer rounded-lg border-2 border-dashed border-border px-6 py-10 text-center transition-colors hover:border-primary hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none {dragging ? 'border-primary bg-muted/50' : ''}"
	role="button"
	tabindex="0"
	onclick={() => fileInput?.click()}
	ondragover={(e) => {
		e.preventDefault();
		dragging = true;
	}}
	ondragleave={() => {
		dragging = false;
	}}
	ondrop={handleDrop}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') fileInput?.click();
	}}
>
	<svg
		class="mx-auto mb-2 size-10 text-muted-foreground"
		xmlns="http://www.w3.org/2000/svg"
		fill="none" viewBox="0 0 24 24"
		stroke-width="1"
		stroke="currentColor"
		aria-hidden="true"
	>
		<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
	</svg>
	<p class="mt-2 text-sm text-muted-foreground">
		Drop zip files here or click to upload
	</p>
	{#if duplicateWarning}
		<p class="mt-2 text-xs text-destructive">{duplicateWarning}</p>
	{/if}
	<input
		type="file"
		bind:this={fileInput}
		accept=".zip"
		multiple
		class="hidden"
		onchange={handleChange}
	/>
</div>
