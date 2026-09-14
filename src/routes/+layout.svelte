<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { DarkMode, Navbar, NavBrand, NavUl, NavLi } from 'flowbite-svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>SAA-C03 Practice Lab</title>
</svelte:head>

<Navbar>
	<NavBrand href="/">SAA-C03 Practice Lab</NavBrand>
	<div class="flex items-center md:order-2">
		<DarkMode />
	</div>
	<NavUl>
		<NavLi href="/practice">Practice</NavLi>
		<NavLi href="/exam">Mock Exam</NavLi>
		<NavLi href="/results">Exam History</NavLi>
		<NavLi href="/questions">Question Bank</NavLi>
		<NavLi href="/bookmarks">Bookmarks</NavLi>
		<NavLi href="/statistics">Statistics</NavLi>
		<NavLi href="/ai-generator">AI Generator</NavLi>
	</NavUl>
</Navbar>

<main class="container mx-auto p-4">
	{@render children()}
</main>
