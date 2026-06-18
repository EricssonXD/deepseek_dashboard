<script lang="ts">
	let {
		onFiles,
		hasData = false
	}: {
		onFiles: (files: FileList) => void;
		hasData: boolean;
	} = $props();

	let dragging = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		if (e.dataTransfer?.files) onFiles(e.dataTransfer.files);
	}

	function handleChange() {
		if (fileInput?.files) {
			onFiles(fileInput.files);
			fileInput.value = '';
		}
	}
</script>

<div
	class="mx-6 mt-6 cursor-pointer rounded-lg border-2 border-dashed border-border px-6 py-10 text-center transition-colors hover:border-primary hover:bg-muted/50 {dragging ? 'border-primary bg-muted/50' : ''}"
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
	<div class="text-4xl">📦</div>
	<p class="mt-2 text-sm text-muted-foreground">Drop zip files here or click to upload</p>
	<input
		type="file"
		bind:this={fileInput}
		accept=".zip"
		multiple
		class="hidden"
		onchange={handleChange}
	/>
</div>
