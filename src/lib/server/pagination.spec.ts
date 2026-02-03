import { describe, it, expect } from 'vitest';
import { getPagination } from './pagination';

describe('getPagination', () => {
	it('uses defaults when params are missing', () => {
		const params = new URLSearchParams();
		const { page, limit, from, to } = getPagination(params, 24, 100);
		expect(page).toBe(1);
		expect(limit).toBe(24);
		expect(from).toBe(0);
		expect(to).toBe(23);
	});

	it('clamps page and limit to valid ranges', () => {
		const params = new URLSearchParams({ page: '0', limit: '500' });
		const { page, limit } = getPagination(params, 24, 100);
		expect(page).toBe(1);
		expect(limit).toBe(100);
	});

	it('calculates from/to for a valid page', () => {
		const params = new URLSearchParams({ page: '3', limit: '10' });
		const { from, to } = getPagination(params, 24, 100);
		expect(from).toBe(20);
		expect(to).toBe(29);
	});
});
