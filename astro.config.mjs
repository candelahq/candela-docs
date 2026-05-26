// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: process.env.SITE_URL || 'https://candelahq.github.io',
	base: process.env.SITE_BASE || '/candela-docs',
	integrations: [
		starlight({
			title: 'Candela',
			logo: {
				src: './src/assets/logo.png',
			},
			favicon: '/favicon.png',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/candelahq/candela' },
				{ icon: 'external', label: 'Website', href: 'https://www.candelahq.com' },
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
						{ label: 'Authentication', slug: 'getting-started/authentication', badge: { text: 'New', variant: 'success' } },
					],
				},
				{
					label: 'Components',
					items: [
						{ label: 'candela', slug: 'components/candela' },
						{ label: 'candela-server', slug: 'components/candela-server' },
						{ label: 'candela-sidecar', slug: 'components/candela-sidecar' },
						{ label: 'candela-desktop', slug: 'components/candela-desktop' },
					],
				},
				{
					label: 'Governance',
					items: [
						{ label: 'Overview', slug: 'governance/overview' },
						{ label: 'Budget Enforcement', slug: 'governance/budgets' },
						{ label: 'Model Access Control', slug: 'governance/model-access' },
						{ label: 'Audit & Compliance', slug: 'governance/audit-compliance' },
						{ label: 'Tenant Isolation', slug: 'governance/multitenancy' },
						{ label: 'eBPF Enforcement', slug: 'governance/ebpf-enforcement', badge: { text: 'New', variant: 'success' } },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'ADK Integration', slug: 'guides/adk-integration' },
						{ label: 'OpenTelemetry', slug: 'guides/opentelemetry' },
						{ label: 'Budgets & Cost Control', slug: 'guides/budgets' },
						{ label: 'Pricing', slug: 'guides/pricing' },
						{ label: 'Prompt Caching', slug: 'guides/prompt-caching', badge: { text: 'New', variant: 'success' } },
						{ label: 'System Prompt Caching', slug: 'guides/system-prompt-caching', badge: { text: 'New', variant: 'success' } },
						{ label: 'Enrichment SDKs', slug: 'guides/enrichment-sdks' },
						{ label: 'Multitenancy', slug: 'guides/multitenancy' },
						{
							label: 'IDE Integration',
							items: [
								{ label: 'Overview', slug: 'guides/ide/overview' },
								{ label: 'VS Code Extension', slug: 'guides/ide/vscode' },
								{ label: 'OpenCode', slug: 'guides/ide/opencode' },
								{ label: 'Zed', slug: 'guides/ide/zed' },
								{ label: 'Cline / Continue', slug: 'guides/ide/cline' },
								{ label: 'JetBrains', slug: 'guides/ide/jetbrains', badge: { text: 'New', variant: 'success' } },
								{ label: 'Claude Code', slug: 'guides/ide/claude-code' },
								{ label: 'Cursor / Windsurf', slug: 'guides/ide/cursor' },
							],
						},
					],
				},
				{
					label: 'Architecture',
					items: [
						{ label: 'Storage & CQRS', slug: 'architecture/storage' },
						{ label: 'Deployment', slug: 'architecture/deployment' },
						{ label: 'Security & Auth', slug: 'architecture/security' },
						{ label: 'Operations', slug: 'architecture/operations' },
					],
				},
				{
					label: 'API Reference',
					items: [
						{ label: 'Proxy Routes', slug: 'api/proxy-routes' },
						{ label: 'ConnectRPC Services', slug: 'api/connectrpc' },
					],
				},
			],
		}),
	],
});
