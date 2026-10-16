import { useCallback } from 'react';

export default function useOnceMessage(storageKey: string | null) {
  const readSeenIds = useCallback((): string[] => {
    if (!storageKey) return [];

    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];

    try {
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  }, [storageKey]);

  const hasSeen = useCallback((id: string) => readSeenIds().includes(id), [readSeenIds]);

  const markSeen = useCallback((id: string) => {
    if (!storageKey) return;

    const seenIds = readSeenIds();
    if (seenIds.includes(id)) return;

    window.localStorage.setItem(storageKey, JSON.stringify([...seenIds, id]));
  }, [readSeenIds, storageKey]);

  const showOnceMessage = useCallback((id: string, show: () => void) => {
    if (hasSeen(id)) return false;
    markSeen(id);
    show();
    return true;
  }, [hasSeen, markSeen]);

  return { markSeen, showOnceMessage };
}
