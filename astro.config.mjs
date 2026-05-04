// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://candelahq.github.io',
	base: '/candela-docs',
	integrations: [
		starlight({
			title: 'Candela',
			logo: {
				src: './src/assets/logo.png',
			},
			favicon: '/favicon.ico',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/candelahq/candela' },
			],
			customCss: ['./src/styles/custom.css'],
			head: [
				{
					tag: 'link',
					attrs: {
						rel: 'preconnect',
						href: 'https://fonts.googleapis.com',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'preconnect',
						href: 'https://fonts.gstatic.com',
						crossorigin: '',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
					},
				},
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Overview', slug: 'getting-started/overview' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quick Start', slug: 'getting-started/quickstart' },
					],
				},
				{
					label: 'Components',
					items: [
						{ label: 'candela-local', slug: 'components/candela-local' },
						{ label: 'candela-server', slug: 'components/candela-server' },
						{ label: 'candela-sidecar', slug: 'components/candela-sidecar' },
						{ label: 'candela-desktop', slug: 'components/candela-desktop' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'ADK Integration', slug: 'guides/adk-integration' },
						{ label: 'OpenTelemetry', slug: 'guides/opentelemetry' },
					],
				},
				{
					label: 'Architecture',
					items: [
						{ label: 'Storage & CQRS', slug: 'architecture/storage' },
						{ label: 'Deployment', slug: 'architecture/deployment' },
					],
				},
				{
					label: 'API Reference',
					items: [
						{ label: 'Proxy Routes', slug: 'api/proxy-routes' },
					],
				},
			],
		}),
	],
});
