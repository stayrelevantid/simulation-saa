<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { DarkMode, Navbar, NavBrand, NavUl, NavLi, NavHamburger, Button } from 'flowbite-svelte';

	let { children } = $props();

	let activeUrl = $derived(page.url.pathname);

	const navItems = [
		{ href: '/practice', label: 'Practice' },
		{ href: '/exam', label: 'Mock Exam' },
		{ href: '/results', label: 'Exam History' },
		{ href: '/questions', label: 'Question Bank' },
		{ href: '/bookmarks', label: 'Bookmarks' },
		{ href: '/statistics', label: 'Statistics' },
		{ href: '/ai-generator', label: 'AI Generator' }
	];

	function isActive(href: string): boolean {
		return activeUrl === href || activeUrl.startsWith(href + '/');
	}

	let activeClass = $derived(
		'text-teal-700 bg-teal-050 md:bg-transparent md:text-teal-700 dark:text-teal-300 dark:bg-teal-900/40 md:dark:bg-transparent'
	);
	let nonActiveClass = $derived(
		'text-blue-grey-700 hover:text-teal-700 hover:bg-teal-050 md:hover:bg-transparent dark:text-blue-grey-200 dark:hover:text-teal-300 dark:hover:bg-blue-grey-800 md:dark:hover:bg-transparent'
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>SAA-C03 Practice Lab</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-blue-grey-050 dark:bg-blue-grey-900">
	<Navbar
		class="sticky top-0 z-40 border-b border-blue-grey-100 bg-white dark:border-blue-grey-800 dark:bg-blue-grey-800"
	>
		<NavBrand href="/">
			<span
				class="self-center text-lg font-bold whitespace-nowrap text-teal-800 dark:text-teal-300"
			>
				SAA-C03 Practice Lab
			</span>
		</NavBrand>
		<div class="flex items-center md:order-2">
			<Button href={resolve('/practice')} size="sm" class="hidden sm:inline-flex">
				Start Practice
			</Button>
			<DarkMode />
			<NavHamburger />
		</div>
		<NavUl {activeUrl} classes={{ active: activeClass, nonActive: nonActiveClass }}>
			{#each navItems as item (item.href)}
				{@const active = isActive(item.href)}
				<NavLi href={item.href} activeClass={active ? activeClass : nonActiveClass}>
					{item.label}
				</NavLi>
			{/each}
			<NavLi href={resolve('/practice')} class="sm:hidden">Start Practice</NavLi>
		</NavUl>
	</Navbar>

	<main class="mx-auto w-full max-w-7xl flex-1 px-4 py-5 md:px-6 md:py-6 lg:py-8">
		{@render children()}
	</main>
</div>
