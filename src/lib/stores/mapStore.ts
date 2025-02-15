// src/lib/stores/mapStore.ts
import { writable } from 'svelte/store';

// Store to notify map refresh
export const refreshMapTrigger = writable(false);