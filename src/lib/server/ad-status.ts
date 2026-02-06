export type StatusChangeResult =
	| { ok: true }
	| { ok: false; reason: 'invalid-target' | 'immutable-current' | 'reactivation-not-allowed' | 'expired' };

const ALLOWED_TARGETS = new Set(['active', 'sold', 'archived']);
const MUTABLE_STATUSES = new Set(['active', 'sold', 'archived']);
const ALLOWED_TRANSITIONS: Record<string, Set<string>> = {
	active: new Set(['sold', 'archived']),
	sold: new Set(['active', 'archived']),
	archived: new Set(['active'])
};

type StatusChangeInput = {
	currentStatus: string;
	nextStatus: string;
	expiresAt?: string | null;
	now?: string;
};

export function validateAdStatusChange({
	currentStatus,
	nextStatus,
	expiresAt,
	now = new Date().toISOString()
}: StatusChangeInput): StatusChangeResult {
	if (!ALLOWED_TARGETS.has(nextStatus)) {
		return { ok: false, reason: 'invalid-target' };
	}
	if (!MUTABLE_STATUSES.has(currentStatus)) {
		return { ok: false, reason: 'immutable-current' };
	}
	if (!ALLOWED_TRANSITIONS[currentStatus]?.has(nextStatus)) {
		return { ok: false, reason: 'invalid-target' };
	}
	if (nextStatus === 'active') {
		if (!['sold', 'archived'].includes(currentStatus)) {
			return { ok: false, reason: 'reactivation-not-allowed' };
		}
		if (expiresAt && expiresAt <= now) {
			return { ok: false, reason: 'expired' };
		}
	}
	return { ok: true };
}
