import { fontFamily } from 'tailwindcss/defaultTheme';
import type { Config } from 'tailwindcss';

const config: Config = {
	darkMode: ['class'],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	safelist: ['dark'],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			zIndex: {
				100: 100
			},
			colors: {
				border: 'hsl(var(--border) / <alpha-value>)',
				input: 'hsl(var(--input) / <alpha-value>)',
				ring: 'hsl(var(--ring) / <alpha-value>)',
				background: 'hsl(var(--background) / <alpha-value>)',
				foreground: 'hsl(var(--foreground) / <alpha-value>)',
				primary: {
					DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
					foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
					50: 'hsl(var(--primary-50) / <alpha-value>)',
					100: 'hsl(var(--primary-100) / <alpha-value>)',
					200: 'hsl(var(--primary-200) / <alpha-value>)',
					300: 'hsl(var(--primary-300) / <alpha-value>)',
					400: 'hsl(var(--primary-400) / <alpha-value>)',
					500: 'hsl(var(--primary-500) / <alpha-value>)',
					600: 'hsl(var(--primary-600) / <alpha-value>)',
					700: 'hsl(var(--primary-700) / <alpha-value>)',
					800: 'hsl(var(--primary-800) / <alpha-value>)',
					900: 'hsl(var(--primary-900) / <alpha-value>)',
					950: 'hsl(var(--primary-950) / <alpha-value>)'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
					foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
					50: 'hsl(var(--secondary-50) / <alpha-value>)',
					100: 'hsl(var(--secondary-100) / <alpha-value>)',
					200: 'hsl(var(--secondary-200) / <alpha-value>)',
					300: 'hsl(var(--secondary-300) / <alpha-value>)',
					400: 'hsl(var(--secondary-400) / <alpha-value>)',
					500: 'hsl(var(--secondary-500) / <alpha-value>)',
					600: 'hsl(var(--secondary-600) / <alpha-value>)',
					700: 'hsl(var(--secondary-700) / <alpha-value>)',
					800: 'hsl(var(--secondary-800) / <alpha-value>)',
					900: 'hsl(var(--secondary-900) / <alpha-value>)',
					950: 'hsl(var(--secondary-950) / <alpha-value>)'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
					foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
					50: 'hsl(var(--destructive-50) / <alpha-value>)',
					100: 'hsl(var(--destructive-100) / <alpha-value>)',
					200: 'hsl(var(--destructive-200) / <alpha-value>)',
					300: 'hsl(var(--destructive-300) / <alpha-value>)',
					400: 'hsl(var(--destructive-400) / <alpha-value>)',
					500: 'hsl(var(--destructive-500) / <alpha-value>)',
					600: 'hsl(var(--destructive-600) / <alpha-value>)',
					700: 'hsl(var(--destructive-700) / <alpha-value>)',
					800: 'hsl(var(--destructive-800) / <alpha-value>)',
					900: 'hsl(var(--destructive-900) / <alpha-value>)',
					950: 'hsl(var(--destructive-950) / <alpha-value>)'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
					foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
					50: 'hsl(var(--muted-50) / <alpha-value>)',
					100: 'hsl(var(--muted-100) / <alpha-value>)',
					200: 'hsl(var(--muted-200) / <alpha-value>)',
					300: 'hsl(var(--muted-300) / <alpha-value>)',
					400: 'hsl(var(--muted-400) / <alpha-value>)',
					500: 'hsl(var(--muted-500) / <alpha-value>)',
					600: 'hsl(var(--muted-600) / <alpha-value>)',
					700: 'hsl(var(--muted-700) / <alpha-value>)',
					800: 'hsl(var(--muted-800) / <alpha-value>)',
					900: 'hsl(var(--muted-900) / <alpha-value>)',
					950: 'hsl(var(--muted-950) / <alpha-value>)'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
					foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
					50: 'hsl(var(--accent-50) / <alpha-value>)',
					100: 'hsl(var(--accent-100) / <alpha-value>)',
					200: 'hsl(var(--accent-200) / <alpha-value>)',
					300: 'hsl(var(--accent-300) / <alpha-value>)',
					400: 'hsl(var(--accent-400) / <alpha-value>)',
					500: 'hsl(var(--accent-500) / <alpha-value>)',
					600: 'hsl(var(--accent-600) / <alpha-value>)',
					700: 'hsl(var(--accent-700) / <alpha-value>)',
					800: 'hsl(var(--accent-800) / <alpha-value>)',
					900: 'hsl(var(--accent-900) / <alpha-value>)',
					950: 'hsl(var(--accent-950) / <alpha-value>)'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
					foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
					50: 'hsl(var(--popover-50) / <alpha-value>)',
					100: 'hsl(var(--popover-100) / <alpha-value>)',
					200: 'hsl(var(--popover-200) / <alpha-value>)',
					300: 'hsl(var(--popover-300) / <alpha-value>)',
					400: 'hsl(var(--popover-400) / <alpha-value>)',
					500: 'hsl(var(--popover-500) / <alpha-value>)',
					600: 'hsl(var(--popover-600) / <alpha-value>)',
					700: 'hsl(var(--popover-700) / <alpha-value>)',
					800: 'hsl(var(--popover-800) / <alpha-value>)',
					900: 'hsl(var(--popover-900) / <alpha-value>)',
					950: 'hsl(var(--popover-950) / <alpha-value>)'
				},
				card: {
					DEFAULT: 'hsl(var(--card) / <alpha-value>)',
					foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
					50: 'hsl(var(--card-50) / <alpha-value>)',
					100: 'hsl(var(--card-100) / <alpha-value>)',
					200: 'hsl(var(--card-200) / <alpha-value>)',
					300: 'hsl(var(--card-300) / <alpha-value>)',
					400: 'hsl(var(--card-400) / <alpha-value>)',
					500: 'hsl(var(--card-500) / <alpha-value>)',
					600: 'hsl(var(--card-600) / <alpha-value>)',
					700: 'hsl(var(--card-700) / <alpha-value>)',
					800: 'hsl(var(--card-800) / <alpha-value>)',
					900: 'hsl(var(--card-900) / <alpha-value>)',
					950: 'hsl(var(--card-950) / <alpha-value>)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: [...fontFamily.sans]
			}
		}
	}
};

export default config;
