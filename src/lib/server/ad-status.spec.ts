import { describe, expect, it } from 'vitest';
import { validateAdStatusChange } from './ad-status';

describe('validateAdStatusChange', () => {
	it('allows active -> sold', () => {
		expect(
			validateAdStatusChange({ currentStatus: 'active', nextStatus: 'sold' })
		).toEqual({ ok: true });
	});

	it('allows active -> archived', () => {
		expect(
			validateAdStatusChange({ currentStatus: 'active', nextStatus: 'archived' })
		).toEqual({ ok: true });
	});

	it('allows sold -> active when not expired', () => {
		expect(
			validateAdStatusChange({
				currentStatus: 'sold',
				nextStatus: 'active',
				expiresAt: new Date(Date.now() + 1000 * 60).toISOString()
			})
		).toEqual({ ok: true });
	});

	it('blocks sold -> active when expired', () => {
		expect(
			validateAdStatusChange({
				currentStatus: 'sold',
				nextStatus: 'active',
				expiresAt: new Date(Date.now() - 1000 * 60).toISOString()
			})
		).toEqual({ ok: false, reason: 'expired' });
	});

	it('blocks pending -> sold', () => {
		expect(
			validateAdStatusChange({ currentStatus: 'pending', nextStatus: 'sold' })
		).toEqual({ ok: false, reason: 'immutable-current' });
	});

	it('blocks invalid target status', () => {
		expect(
			validateAdStatusChange({ currentStatus: 'active', nextStatus: 'rejected' })
		).toEqual({ ok: false, reason: 'invalid-target' });
	});
});
