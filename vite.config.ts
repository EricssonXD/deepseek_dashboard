import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';


export default defineConfig(({ mode }) => {
	
	const env = loadEnv(mode, process.cwd(), '');
	const allowedHost = env.ALLOWED_HOST;

	return {
		server: {
			allowedHosts: allowedHost ? [allowedHost] : []
		},
		plugins: [
			tailwindcss(),
			sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
}});
