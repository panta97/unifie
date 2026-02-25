import type { Employee } from "../types";

// Mock employees data
export const mockCashiers: Employee[] = [
    { id: 1, first_name: "Juan", last_name: "Pérez" },
    { id: 2, first_name: "María", last_name: "García" },
    { id: 3, first_name: "Carlos", last_name: "López" },
];

export const mockManagers: Employee[] = [
    { id: 10, first_name: "Isabel", last_name: "Márquez" },
    { id: 11, first_name: "Antonio", last_name: "Silva" },
    { id: 12, first_name: "Rosa", last_name: "Fernández" },
];

// Mock session data (amounts in cents)
export const mockSessionData = {
    sessionId: 12345,
    sessionName: "Cierre de Día - Turno Tarde",
    posName: "KDOSH POS 1",
    startAt: "2024-01-15 09:00:00",
    stopAt: "2024-01-15 18:00:00",
    isSessionClosed: true,
    balanceStart: 20000, // 200.00 in cents
    odooCash: 150000, // 1500.00
    odooCard: 80000, // 800.00
    odooCreditNote: 5000, // 50.00
    posCash: 0, // Will be calculated
    posCard: 0, // Will be calculated
    profitTotal: 0,
    balanceStartNextDay: 0,
};
