/**
 * Convert cents (integer) to decimal for display
 * Example: 1050 -> 10.50
 */
export const toDisplay = (cents: number): number => {
    return cents / 100;
};

/**
 * Convert decimal to cents (integer) for storage
 * Example: 10.50 -> 1050
 */
export const toStorage = (decimal: number): number => {
    return Math.round(decimal * 100);
};

/**
 * Format amount as currency (Soles)
 * Example: 1050 (cents) -> "S/. 10.50"
 */
export const formatCurrency = (cents: number): string => {
    const decimal = toDisplay(cents);
    return `S/. ${decimal.toFixed(2)}`;
};

/**
 * Format date for display
 * Example: "2024-01-15 14:30:00" -> "15/01/2024 14:30:00"
 */
export const formatDate = (dateString: string): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Get end state label in Spanish
 */
export const getEndStateLabel = (state: "stable" | "extra" | "missing"): string => {
    const labels = {
        stable: "Estable",
        extra: "Extra",
        missing: "Faltante",
    };
    return labels[state];
};

/**
 * Get difference state message (Extra/Faltante)
 */
export const getDifferenceLabel = (difference: number): string => {
    if (difference === 0) return "Estable";
    if (difference > 0) return "Extra";
    return "Faltante";
};
