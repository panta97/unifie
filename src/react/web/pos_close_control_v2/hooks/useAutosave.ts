import { useEffect, useRef, useState, useCallback } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutosaveOptions {
    debounceMs?: number;
    onSave: () => Promise<void>;
    enabled: boolean;
}

export function useAutosave({
    debounceMs = 2000,
    onSave,
    enabled,
}: UseAutosaveOptions) {
    const [status, setStatus] = useState<AutosaveStatus>("idle");
    const timeoutRef = useRef<number | null>(null);
    const saveInProgressRef = useRef(false);

    const triggerAutosave = useCallback(() => {
        if (!enabled) return;

        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set a new timeout
        timeoutRef.current = setTimeout(async () => {
            // Prevent concurrent saves
            if (saveInProgressRef.current) return;

            try {
                saveInProgressRef.current = true;
                setStatus("saving");
                await onSave();
                setStatus("saved");

                // Reset to idle after 2 seconds
                setTimeout(() => {
                    setStatus("idle");
                }, 2000);
            } catch (error) {
                console.error("Autosave error:", error);
                setStatus("error");

                // Reset to idle after 5 seconds
                setTimeout(() => {
                    setStatus("idle");
                }, 5000);
            } finally {
                saveInProgressRef.current = false;
            }
        }, debounceMs);
    }, [debounceMs, onSave, enabled]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        status,
        triggerAutosave,
    };
}
