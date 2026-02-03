/// <reference lib="webworker" />
import filter from 'leo-profanity';
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';
import { bannedWords } from '$lib/banned-words';

filter.add(bannedWords.filter((w) => typeof w === 'string'));
const obscenity = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers
});

self.addEventListener('message', (e: MessageEvent<string | { id?: string; text?: string }>) => {
	const payload = e.data;
	const isObj = typeof payload === 'object' && payload !== null;

	// Accept string or { id, text }
	const id =
		(isObj && typeof payload.id === 'string' && payload.id) ||
		(typeof payload === 'string' ? 'live' : 'unknown');

	let text: string =
		typeof payload === 'string'
			? payload
			: isObj && typeof payload.text === 'string'
				? payload.text
				: String(isObj ? (payload.text ?? '') : '');

	try {
		text = text.normalize('NFKC');
	} catch {
		/* empty */
	}

	let flagged = false;
	try {
		if (text && text.trim().length > 0) {
			flagged = filter.check(text) || obscenity.hasMatch(text);
		}
	} catch {
		try {
			flagged = !!text && obscenity.hasMatch(text);
		} catch {
			flagged = false;
		}
	}

	// ALWAYS include id so the submit promise can resolve
	(self as unknown as Worker).postMessage({ id, flagged });
});
