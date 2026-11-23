import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { watchCompletionHistory } from '@/data/tasks';
import type { DateRange } from '@/domain/tasks/balance';
import type { Completion } from '@/domain/tasks/types';

type HistoryState = {
  key: string;
  entries: Completion[];
  loading: boolean;
  fromCache: boolean;
  error: boolean;
};
const EMPTY: Completion[] = [];

/** Se desconecta al salir y nunca muestra resultados de otro hogar o periodo. */
export function useCompletionHistory(hid: string, range: DateRange | null) {
  const from = range?.from;
  const to = range?.to;
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([hid, from, to, attempt]);
  const [state, setState] = useState<HistoryState>();
  useFocusEffect(
    useCallback(() => {
      if (!hid || (from && to && from > to)) return;
      let active = true;
      const stop = watchCompletionHistory(
        hid,
        from && to ? { from, to } : null,
        (entries, fromCache) => {
          if (active) setState({ key, entries, fromCache, loading: false, error: false });
        },
        () => {
          if (active)
            setState((previous) => ({
              key,
              entries: previous?.key === key ? previous.entries : EMPTY,
              fromCache: true,
              loading: false,
              error: true,
            }));
        },
      );
      return () => {
        active = false;
        stop();
      };
    }, [hid, from, to, key]),
  );
  return {
    ...(state?.key === key
      ? state
      : { entries: EMPTY, fromCache: false, loading: true, error: false }),
    retry: () => setAttempt((value) => value + 1),
  };
}
