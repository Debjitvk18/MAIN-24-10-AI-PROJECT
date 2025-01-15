import { goto } from '$app/navigation';
import { AUTH_TOKEN, USER_KEY } from '$lib/constants/constants';
import { UserService } from '$lib/services/user-service';
import { writable } from 'svelte/store';

export const isLoggedIn = writable(false);
export const user = writable(null);

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 */

export function checkAuth() {
	const token = localStorage.getItem(AUTH_TOKEN);
	if (token) {
		getUserDetails();
		isLoggedIn.set(!!token);
	}
}

/**
 * @param {string} token
 */
export async function login(token) {
	const userService = new UserService();
	localStorage.setItem(AUTH_TOKEN, token);
	goto('/dashboard');
	isLoggedIn.set(true);
	const user = await userService.getProfile();
	if (user.success) {
		await getUserData();
	} else {
		logout();
	}
}

export async function getUserData() {
	const userService = new UserService();
	const user = await userService.getProfile();
	if (user.success) {
		localStorage.setItem(USER_KEY, JSON.stringify(user.member));
		getUserDetails();
	} else {
		logout();
	}
}

export function logout() {
	localStorage.removeItem(AUTH_TOKEN);
	localStorage.removeItem(USER_KEY);
	isLoggedIn.set(false);
	user.set(null);
	goto('/');
}

/**
 * Get the logged-in user's details from local storage
 * @returns {object | null} The user details or null if not available
 */
export function getUserDetails() {
	const userData = localStorage.getItem(USER_KEY);
	user.set(userData ? JSON.parse(userData) : null);
	return userData ? JSON.parse(userData) : null;
}
