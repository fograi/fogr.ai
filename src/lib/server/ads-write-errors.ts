type DbWriteErrorLike = {
	code?: string | null;
	message?: string | null;
	details?: string | null;
	hint?: string | null;
};

export type ClassifiedAdWriteError = {
	message: string;
	status: number;
	reason: string;
};

const DEFAULT_AD_WRITE_ERROR: ClassifiedAdWriteError = {
	message: 'We could not save your ad due to a database error. Try again.',
	status: 500,
	reason: 'unknown'
};

export function classifyAdWriteError(error: DbWriteErrorLike | null | undefined): ClassifiedAdWriteError {
	if (!error) return DEFAULT_AD_WRITE_ERROR;

	const combined = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();

	if (error.code === '22003' || combined.includes('out of range')) {
		return {
			message:
				'A numeric value is too large to save (for example price or minimum offer). Lower it and try again.',
			status: 400,
			reason: 'numeric_out_of_range'
		};
	}

	if (error.code === '22P02' || combined.includes('invalid input syntax')) {
		return {
			message: 'One of the values has an invalid format. Check price and offer fields and try again.',
			status: 400,
			reason: 'invalid_value_format'
		};
	}

	if (error.code === '23514') {
		return {
			message: 'Some ad values failed server validation. Review the form values and try again.',
			status: 400,
			reason: 'check_constraint'
		};
	}

	if (error.code === '23502') {
		return {
			message: 'A required field was missing while saving your ad. Review the form and try again.',
			status: 400,
			reason: 'not_null_constraint'
		};
	}

	if (error.code === '23505') {
		return {
			message: 'This ad could not be saved due to a duplicate record conflict. Try again.',
			status: 409,
			reason: 'unique_constraint'
		};
	}

	if (error.code === '23503') {
		return {
			message: 'A related account or record was not found while saving your ad. Refresh and try again.',
			status: 400,
			reason: 'foreign_key_constraint'
		};
	}

	if (error.code === '42501' || combined.includes('row-level security')) {
		return {
			message: 'Permission checks blocked this save. Sign out and back in, then try again.',
			status: 403,
			reason: 'permission_denied'
		};
	}

	if (error.code) {
		return {
			message: `We could not save your ad due to a database write error (${error.code}). Try again.`,
			status: 500,
			reason: 'unknown_db_code'
		};
	}

	return DEFAULT_AD_WRITE_ERROR;
}
