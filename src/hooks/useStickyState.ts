import { useEffect, useRef, useState } from 'react';

/**
 * Hook que persiste um estado em localStorage com chave dinâmica.
 * Restaura ao montar e ao retornar de outra aba (visibilitychange).
 */
export function useStickyState<T>(key: string | null, initial: T) {
  const [state, setState] = useState<T>(() => {
    if (!key || typeof window === 'undefined') return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const lastKey = useRef<string | null>(key);

  // Persiste a cada mudança
  useEffect(() => {
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* quota cheia: ignora */
    }
  }, [key, state]);

  // Re-hidrata ao trocar de aba (caso outra aba tenha alterado)
  useEffect(() => {
    if (!key) return;
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const raw = localStorage.getItem(key);
        if (raw) setState(JSON.parse(raw) as T);
      } catch {
        /* ignora */
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [key]);

  // Quando a chave muda (ex.: troca de projeto), recarrega
  useEffect(() => {
    if (key === lastKey.current) return;
    lastKey.current = key;
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw) as T);
    } catch {
      /* ignora */
    }
  }, [key]);

  return [state, setState] as const;
}
