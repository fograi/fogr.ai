import { describe, it, expect } from 'vitest';
import { generateSearchName } from './search-name';

describe('generateSearchName', () => {
	it('generates "Category in County" when both category and county are provided', () => {
		const result = generateSearchName({ category: 'Bicycles', countyName: 'Dublin' });
		expect(result).toBe('Bicycles in Dublin');
	});

	it('generates category-only name when no county is provided', () => {
		const result = generateSearchName({ category: 'Electronics' });
		expect(result).toBe('Electronics');
	});

	it('generates county-only name as "All listings in County" when no category', () => {
		const result = generateSearchName({ countyName: 'Cork' });
		expect(result).toBe('All listings in Cork');
	});

	it('generates "All listings" when no filters are provided', () => {
		const result = generateSearchName({});
		expect(result).toBe('All listings');
	});

	it('generates "All listings" when all filter values are null', () => {
		const result = generateSearchName({ category: null, countyName: null, query: null });
		expect(result).toBe('All listings');
	});

	it('includes quoted query when category and query are provided', () => {
		const result = generateSearchName({ category: 'Bikes', query: 'road bike' });
		expect(result).toBe('Bikes "road bike"');
	});

	it('includes query and county when both are provided without category', () => {
		const result = generateSearchName({ query: 'vintage', countyName: 'Galway' });
		expect(result).toBe('"vintage" in Galway');
	});

	it('combines all three filters: category, query, and county', () => {
		const result = generateSearchName({
			category: 'Furniture',
			query: 'oak table',
			countyName: 'Limerick'
		});
		expect(result).toBe('Furniture "oak table" in Limerick');
	});
});
