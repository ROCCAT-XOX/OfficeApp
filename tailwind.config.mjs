/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			// Farben und Schrift aus dem LeadLift Design System (tokens/colors.css, typography.css)
			colors: {
				ll: {
					bg: '#0B0D0F',
					surface: '#111316',
					raised: '#181B20',
					card: '#151820',
					accent: '#4DB8FF',
					'accent-bright': '#7DD3FC',
					'accent-deep': '#1E6FBA',
					success: '#22C55E',
					warn: '#F59E0B',
				},
			},
			fontFamily: {
				sans: ['Georama', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
			},
		},
	},
	plugins: [],
}
