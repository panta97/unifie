import { useEffect, useRef, useCallback } from "react";

interface UseInactivityTimerOptions {
  timeoutMs: number;
  onTimeout: () => void;
  enabled: boolean;
}

export function useInactivityTimer({
  timeoutMs,
  onTimeout,
  enabled,
}: UseInactivityTimerOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ] as const;

    const handleActivity = () => resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, resetTimer]);
}
