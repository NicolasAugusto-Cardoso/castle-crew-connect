import { useState, useEffect, useRef } from 'react';

/**
 * Hook que persiste estado em localStorage e o restaura ao trocar de aba
 * (visibilitychange) ou refresh acidental.
 *
 * Útil para formulários longos: se o usuário troca de aba enquanto preenche,
 * o React não desmonta o componente, mas como uma garantia extra também
 * salvamos snapshots no storage e os recuperamos quando a aba volta a ficar visível.
 */
export function useStickyState<T>(key: string, initialValue: T) {
  const storageKey = `sticky:${key}`;

  const readFromStorage = (): T => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  };

  const [value, setValue] = useState<T>(readFromStorage);
  const valueRef = useRef(value);
  valueRef.current = value;

  // Persistir a cada mudança
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // storage cheio / indisponível — ignora
    }
  }, [storageKey, value]);

  // Recarrega o valor quando a aba volta a ficar visível
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') {
        // Garantir snapshot mais recente antes de sair da aba
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(valueRef.current));
        } catch {
          /* ignore */
        }
        return;
      }
      // Voltou à aba: se o storage tem valor mais recente (outra tab), reconcilia
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw === null) return;
        const stored = JSON.parse(raw) as T;
        if (JSON.stringify(stored) !== JSON.stringify(valueRef.current)) {
          setValue(stored);
        }
      } catch {
        /* ignore */
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleVisibility);
    };
  }, [storageKey]);

  const clear = () => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setValue(initialValue);
  };

  return [value, setValue, clear] as const;
}
