export type ModerationClient = {
	flagged: boolean;
	loading: boolean;
	check(text: string, timeoutMs?: number): Promise<boolean>;
	destroy(): void;
	postLive(text: string): void; // debounced typing case
};

export function createModerationClient(): ModerationClient {
	let worker: Worker | null = null;
	let flagged = false;
	let loading = false;
	const pending = new Map<string, (flagged: boolean) => void>();

	function ensureWorker() {
		if (worker || typeof window === 'undefined') return;
		worker = new Worker(new URL('$lib/workers/moderation.worker.ts', import.meta.url), {
			type: 'module'
		});
		worker.onmessage = (ev: MessageEvent<{ id?: string; flagged: boolean }>) => {
			const { id, flagged: f } = ev.data || { id: undefined, flagged: false };
			if (!id) {
				// treat as live
				flagged = f;
				loading = false;
				return;
			}
			const resolve = pending.get(id);
			if (resolve) {
				pending.delete(id);
				resolve(f);
			}
		};
		worker.onerror = () => {
			worker?.terminate();
			worker = null;
		};
	}

	function nextId() {
		return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
	}

	async function check(text: string, timeoutMs = 1500) {
		ensureWorker();
		if (!worker) return false; // fail-open to server
		const id = nextId();
		return await new Promise<boolean>((resolve) => {
			const timer = setTimeout(() => {
				pending.delete(id);
				resolve(false);
			}, timeoutMs);
			pending.set(id, (f) => {
				clearTimeout(timer);
				resolve(f);
			});
			worker!.postMessage({ id, text });
		});
	}

	function postLive(text: string) {
		ensureWorker();
		if (!worker) return;
		loading = true;
		worker.postMessage({ id: 'live', text });
	}

	function destroy() {
		worker?.terminate();
		worker = null;
		pending.clear();
	}

	return {
		get flagged() {
			return flagged;
		},
		get loading() {
			return loading;
		},
		check,
		postLive,
		destroy
	};
}
