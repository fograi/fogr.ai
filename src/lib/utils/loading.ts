export type CompressionStage =
	| 'idle'
	| 'validating'
	| 'decoding'
	| 'resizing'
	| 'encoding'
	| 'finalizing'
	| 'complete';

const COMPRESSION_STAGE_PROGRESS: Record<CompressionStage, number> = {
	idle: 0,
	validating: 10,
	decoding: 28,
	resizing: 56,
	encoding: 82,
	finalizing: 94,
	complete: 100
};

const COMPRESSION_STAGE_LABEL: Record<CompressionStage, string> = {
	idle: 'Waiting for image selection.',
	validating: 'Checking image format.',
	decoding: 'Decoding image.',
	resizing: 'Resizing image.',
	encoding: 'Encoding optimized image.',
	finalizing: 'Finalizing image.',
	complete: 'Image ready.'
};

export type ExportStage = 'idle' | 'preparing' | 'collecting' | 'finalizing' | 'complete';

const EXPORT_STAGE_TARGETS: Record<ExportStage, number> = {
	idle: 0,
	preparing: 14,
	collecting: 62,
	finalizing: 88,
	complete: 100
};

export function clampPercent(value: number) {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(100, Math.round(value)));
}

export function getCompressionStageProgress(stage: CompressionStage) {
	return COMPRESSION_STAGE_PROGRESS[stage];
}

export function getCompressionStageLabel(stage: CompressionStage) {
	return COMPRESSION_STAGE_LABEL[stage];
}

export function getExportStageTarget(stage: ExportStage) {
	return EXPORT_STAGE_TARGETS[stage];
}

export function stepTowardPercent(current: number, target: number, maxStep = 4) {
	const safeCurrent = clampPercent(current);
	const safeTarget = clampPercent(target);
	if (safeCurrent === safeTarget) return safeCurrent;
	const step = Math.max(1, Math.abs(Math.floor(maxStep)));
	if (safeCurrent < safeTarget) {
		return Math.min(safeTarget, safeCurrent + step);
	}
	return Math.max(safeTarget, safeCurrent - step);
}
