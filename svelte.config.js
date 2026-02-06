import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Opsi untuk Vercel
			runtime: 'nodejs20.x', // atau 'nodejs18.x'
			regions: ['sin1'] // Singapore region (lebih dekat ke Jagoan Hosting Indonesia)
		})
	}
};

export default config;