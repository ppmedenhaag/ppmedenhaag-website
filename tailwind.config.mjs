/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				'ppme-blue': {
					'50': '#f0f6ff',
					'100': '#e1edfd',
					'200': '#bcdafb',
					'300': '#81bef8',
					'400': '#3e9df2',
					'500': '#157fe2',
					'600': '#0863c1',
					'700': '#08509f',
					'800': '#0b4481',
					'900': '#0f396b',
					'950': '#0a2547',
				},
			}
		},
	},
	plugins: [require('@tailwindcss/forms'),],
}
