const KEY = 'dbc.bestChain.v1';

type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

function parseBest(value: string | null): number {
  if (!value || !/^(0|[1-9][0-9]*)$/.test(value)) return 0;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

export function createBestStore(storage?: StoragePort) {
  let memoryBest = 0;
  function readBest(): number {
    try {
      memoryBest = Math.max(memoryBest, parseBest(storage?.getItem(KEY) ?? null));
    } catch {
      // Private browsing and restrictive policies may block Web Storage.
    }
    return memoryBest;
  }
  function recordBest(chain: number): number {
    if (!Number.isSafeInteger(chain) || chain < 0) return readBest();
    const best = Math.max(readBest(), chain);
    memoryBest = best;
    try {
      storage?.setItem(KEY, String(best));
    } catch {
      // The in-memory score remains available for this page session.
    }
    return best;
  }
  return { readBest, recordBest };
}
