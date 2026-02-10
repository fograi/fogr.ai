import fs from 'fs';
import path from 'path';

const DEFAULT_SOURCE = 'src/lib/utils/mythologise.ts';
const DEFAULT_USER_COUNTS = [10_000, 50_000, 100_000, 1_000_000];
const DEFAULT_TAG_CHARS = [4, 6, 8, 12];
const DEFAULT_TARGET_PROBABILITY = 0.01; // 1%
const SHA256_DIGEST_BYTES = 32;
const TAG_SOURCE_OFFSET_BYTES = 2;
const MIN_TAG_CHARS = 2;
const MAX_TAG_CHARS = Math.floor(((SHA256_DIGEST_BYTES - TAG_SOURCE_OFFSET_BYTES) * 8) / 5);

function parseArgs(argv) {
	const opts = {
		source: DEFAULT_SOURCE,
		users: DEFAULT_USER_COUNTS,
		tagChars: DEFAULT_TAG_CHARS,
		targetProbability: DEFAULT_TARGET_PROBABILITY,
		json: false
	};

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--source') {
			const value = argv[++i];
			if (!value) throw new Error('--source requires a value.');
			opts.source = value;
			continue;
		}
		if (arg === '--users') {
			const value = argv[++i];
			if (!value) throw new Error('--users requires a comma-separated list.');
			opts.users = parseNumberList(value, '--users');
			continue;
		}
		if (arg === '--tag-chars') {
			const value = argv[++i];
			if (!value) throw new Error('--tag-chars requires a comma-separated list.');
			opts.tagChars = parseNumberList(value, '--tag-chars').map((n) => {
				if (!Number.isInteger(n) || n < MIN_TAG_CHARS || n > MAX_TAG_CHARS) {
					throw new Error(`--tag-chars values must be integers between ${MIN_TAG_CHARS} and ${MAX_TAG_CHARS}.`);
				}
				return n;
			});
			continue;
		}
		if (arg === '--target-prob') {
			const value = argv[++i];
			if (!value) throw new Error('--target-prob requires a numeric value.');
			const parsed = Number(value);
			if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= 1) {
				throw new Error('--target-prob must be a decimal between 0 and 1 (exclusive).');
			}
			opts.targetProbability = parsed;
			continue;
		}
		if (arg === '--json') {
			opts.json = true;
			continue;
		}
		if (arg === '--help' || arg === '-h') {
			printHelp();
			process.exit(0);
		}
		throw new Error(`Unknown argument: ${arg}`);
	}

	return opts;
}

function parseNumberList(value, label) {
	const parsed = value
		.split(',')
		.map((part) => Number(part.trim()))
		.filter((n) => Number.isFinite(n));

	if (parsed.length === 0) {
		throw new Error(`${label} requires at least one valid number.`);
	}
	return parsed;
}

function printHelp() {
	console.log(`Usage: node scripts/mythologise-collision-report.mjs [options]

Options:
  --source <path>       Path to mythologise.ts (default: ${DEFAULT_SOURCE})
  --users <list>        Comma-separated user counts (default: ${DEFAULT_USER_COUNTS.join(',')})
  --tag-chars <list>    Comma-separated tag lengths (default: ${DEFAULT_TAG_CHARS.join(',')})
  --target-prob <p>     Target max collision probability (0 < p < 1, default: ${DEFAULT_TARGET_PROBABILITY})
  --json                Print machine-readable JSON
  --help, -h            Show this help
`);
}

function extractCounts(sourceText) {
	const nounArray = extractArrayBody(sourceText, 'NOUNS');
	const adjectiveArray = extractArrayBody(sourceText, 'ADJ');

	const nounMatches = [...nounArray.matchAll(/\bw\s*:\s*['"`]/g)];
	const adjectiveMatches = [...adjectiveArray.matchAll(/\blemma\s*:\s*['"`]/g)];

	return {
		nouns: nounMatches.length,
		adjectives: adjectiveMatches.length
	};
}

function extractArrayBody(sourceText, constantName) {
	const exportIndex = sourceText.indexOf(`export const ${constantName}`);
	if (exportIndex === -1) {
		throw new Error(`Could not find export const ${constantName} in source file.`);
	}

	const assignmentIndex = sourceText.indexOf('=', exportIndex);
	if (assignmentIndex === -1) {
		throw new Error(`Could not find assignment for ${constantName}.`);
	}

	const arrayStart = sourceText.indexOf('[', assignmentIndex);
	if (arrayStart === -1) {
		throw new Error(`Could not find array start for ${constantName}.`);
	}

	let depth = 0;
	let inSingle = false;
	let inDouble = false;
	let inTemplate = false;
	let inLineComment = false;
	let inBlockComment = false;
	let escaped = false;

	for (let i = arrayStart; i < sourceText.length; i++) {
		const ch = sourceText[i];
		const next = sourceText[i + 1];

		if (inLineComment) {
			if (ch === '\n') inLineComment = false;
			continue;
		}
		if (inBlockComment) {
			if (ch === '*' && next === '/') {
				inBlockComment = false;
				i += 1;
			}
			continue;
		}

		if (inSingle) {
			if (!escaped && ch === "'") inSingle = false;
			escaped = ch === '\\' && !escaped;
			continue;
		}
		if (inDouble) {
			if (!escaped && ch === '"') inDouble = false;
			escaped = ch === '\\' && !escaped;
			continue;
		}
		if (inTemplate) {
			if (!escaped && ch === '`') inTemplate = false;
			escaped = ch === '\\' && !escaped;
			continue;
		}

		if (ch === '/' && next === '/') {
			inLineComment = true;
			i += 1;
			continue;
		}
		if (ch === '/' && next === '*') {
			inBlockComment = true;
			i += 1;
			continue;
		}

		if (ch === "'") {
			inSingle = true;
			escaped = false;
			continue;
		}
		if (ch === '"') {
			inDouble = true;
			escaped = false;
			continue;
		}
		if (ch === '`') {
			inTemplate = true;
			escaped = false;
			continue;
		}

		if (ch === '[') {
			depth += 1;
			continue;
		}
		if (ch === ']') {
			depth -= 1;
			if (depth === 0) {
				return sourceText.slice(arrayStart + 1, i);
			}
		}
	}

	throw new Error(`Could not find array end for ${constantName}.`);
}

function birthdayStats(spaceSize, nUsers) {
	// lambda is the expected number of colliding pairs.
	const lambda = (nUsers * (nUsers - 1)) / (2 * spaceSize);
	// P(at least one collision) = 1 - exp(-lambda); expm1 improves stability for tiny lambda.
	const pAtLeastOne = -Math.expm1(-lambda);
	return { lambda, pAtLeastOne };
}

function findMinimumTagChars({ combos, users, targetProbability }) {
	for (let tagChars = MIN_TAG_CHARS; tagChars <= MAX_TAG_CHARS; tagChars++) {
		const spaceSize = combos * 32 ** tagChars;
		const { pAtLeastOne } = birthdayStats(spaceSize, users);
		if (pAtLeastOne <= targetProbability) {
			return tagChars;
		}
	}
	return null;
}

function formatPercent(value) {
	return `${(value * 100).toFixed(6)}%`;
}

function formatNumber(value, decimals = 6) {
	return Number(value).toFixed(decimals);
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	const sourcePath = path.resolve(options.source);
	const sourceText = fs.readFileSync(sourcePath, 'utf8');
	const { nouns, adjectives } = extractCounts(sourceText);
	if (nouns === 0 || adjectives === 0) {
		throw new Error(
			`Parsed invalid counts from source (nouns=${nouns}, adjectives=${adjectives}). ` +
				'Check NOUNS/ADJ array shape and parser assumptions.'
		);
	}
	const combos = nouns * adjectives;

	const rows = [];
	for (const tagChars of options.tagChars) {
		const spaceSize = combos * 32 ** tagChars;
		const entropyBits = Math.log2(spaceSize);
		for (const users of options.users) {
			const stats = birthdayStats(spaceSize, users);
			rows.push({
				tagChars,
				users,
				spaceSize,
				entropyBits,
				expectedCollidingPairs: stats.lambda,
				pAtLeastOneCollision: stats.pAtLeastOne
			});
		}
	}

	const recommendations = options.users.map((users) => ({
		users,
		minTagChars: findMinimumTagChars({
			combos,
			users,
			targetProbability: options.targetProbability
		})
	}));

	if (options.json) {
		console.log(
			JSON.stringify(
				{
					sourcePath,
					counts: { nouns, adjectives, combinations: combos },
					targetProbability: options.targetProbability,
					rows,
					recommendations
				},
				null,
				2
			)
		);
		return;
	}

	console.log('mythologise collision report');
	console.log(`source: ${sourcePath}`);
	console.log(`nouns: ${nouns}`);
	console.log(`adjectives: ${adjectives}`);
	console.log(`noun/adjective combinations: ${combos}`);
	console.log(`target max collision probability: ${formatPercent(options.targetProbability)}`);
	console.log('');
	console.log(
		[
			'tagChars'.padEnd(8),
			'users'.padEnd(10),
			'spaceSize'.padEnd(18),
			'entropyBits'.padEnd(12),
			'p(at least one)'.padEnd(18),
			'expected pairs'
		].join(' ')
	);

	for (const row of rows) {
		console.log(
			[
				String(row.tagChars).padEnd(8),
				String(row.users).padEnd(10),
				String(row.spaceSize).padEnd(18),
				formatNumber(row.entropyBits, 2).padEnd(12),
				formatPercent(row.pAtLeastOneCollision).padEnd(18),
				formatNumber(row.expectedCollidingPairs)
			].join(' ')
		);
	}

	console.log('');
	console.log('recommended minimum tagChars by user count:');
	for (const rec of recommendations) {
		const value = rec.minTagChars === null ? 'not found' : String(rec.minTagChars);
		console.log(`  users=${rec.users}: ${value}`);
	}
}

try {
	main();
} catch (error) {
	console.error((error && error.message) || error);
	process.exit(1);
}
