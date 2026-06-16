export const DRAFT_STORAGE_KEY = 'is-estimator-draft-v1';

export function serializeEstimatorDraft(state) {
  return JSON.stringify({
    version: 1,
    draft: state,
  });
}

export function saveEstimatorDraft(state, storage = getDefaultStorage()) {
  if (!storage?.setItem) return null;
  const serialized = serializeEstimatorDraft(state);
  storage.setItem(DRAFT_STORAGE_KEY, serialized);
  return serialized;
}

export function loadEstimatorDraft(storage = getDefaultStorage()) {
  if (!storage?.getItem) return null;
  const raw = storage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !parsed?.draft) return null;
    return parsed.draft;
  } catch (_error) {
    return null;
  }
}

export function clearEstimatorDraft(storage = getDefaultStorage()) {
  if (!storage?.removeItem) return;
  storage.removeItem(DRAFT_STORAGE_KEY);
}

function getDefaultStorage() {
  try {
    return globalThis?.localStorage;
  } catch (_error) {
    return null;
  }
}
