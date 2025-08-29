import { writable } from 'svelte/store';
export type UserLite = { id: string; email: string | null } | null;
export const user$ = writable<UserLite>(null);
