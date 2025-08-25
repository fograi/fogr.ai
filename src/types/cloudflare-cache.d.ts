export {};
declare global {
	interface CacheStorage {
		/** Cloudflare Workers specific default cache */
		default: Cache;
	}
}
