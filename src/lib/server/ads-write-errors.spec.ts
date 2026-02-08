import { describe, expect, it } from 'vitest';
import { classifyAdWriteError } from './ads-write-errors';

describe('classifyAdWriteError', () => {
	it('maps numeric overflow to a clear 400 message', () => {
		const result = classifyAdWriteError({
			code: '22003',
			message: 'value is out of range for type integer'
		});

		expect(result.status).toBe(400);
		expect(result.reason).toBe('numeric_out_of_range');
		expect(result.message).toContain('too large');
	});

	it('maps invalid format to 400', () => {
		const result = classifyAdWriteError({
			code: '22P02',
			message: 'invalid input syntax for type integer'
		});

		expect(result.status).toBe(400);
		expect(result.reason).toBe('invalid_value_format');
	});

	it('maps constraint violation to 400', () => {
		const result = classifyAdWriteError({
			code: '23514',
			message: 'new row violates check constraint'
		});

		expect(result.status).toBe(400);
		expect(result.reason).toBe('check_constraint');
	});

	it('maps permission failures to 403', () => {
		const result = classifyAdWriteError({
			code: '42501',
			message: 'new row violates row-level security policy'
		});

		expect(result.status).toBe(403);
		expect(result.reason).toBe('permission_denied');
	});

	it('maps foreign key violations to 400', () => {
		const result = classifyAdWriteError({
			code: '23503',
			message: 'insert or update on table violates foreign key constraint'
		});

		expect(result.status).toBe(400);
		expect(result.reason).toBe('foreign_key_constraint');
	});

	it('includes db code for unclassified database errors', () => {
		const result = classifyAdWriteError({
			code: 'P0001',
			message: 'raise exception'
		});

		expect(result.status).toBe(500);
		expect(result.reason).toBe('unknown_db_code');
		expect(result.message).toContain('(P0001)');
	});

	it('falls back to generic 500 message for unknown errors', () => {
		const result = classifyAdWriteError({
			message: 'internal error'
		});

		expect(result.status).toBe(500);
		expect(result.reason).toBe('unknown');
	});
});
