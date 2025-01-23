import { PUBLIC_API_URL } from '$env/static/public';

// ================= API Constants =================
export const BASE_URL = PUBLIC_API_URL;
export const API_BASE_URL = `${BASE_URL}/api/v1/`;

// ================= LocalStorage Keys =================
export const AUTH_TOKEN = 'serviceapp-token';
export const USER_KEY = 'serviceapp-user';

// ================= Defaults =================
export const NON_PANEL_ROUTES = ['login', 'register', 'forgot-password', 'reset-password'];