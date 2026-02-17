import React, { useState } from "react";
import type { Employee } from "../types";
import { verifyOTP } from "../utils/api";

interface LockScreenProps {
  managers: Employee[];
  onAuthenticated: (token: string, employee: Employee) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  managers,
  onAuthenticated,
}) => {
  const [selectedManagerId, setSelectedManagerId] = useState<number | "">("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedManagerId) {
      setError("Seleccione un gerente");
      return;
    }
    if (!otpCode || otpCode.length !== 6) {
      setError("Ingrese un codigo OTP de 6 digitos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await verifyOTP(Number(selectedManagerId), otpCode);
      sessionStorage.setItem("otp_token", result.token);
      onAuthenticated(result.token, result.employee);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error de verificacion"
      );
      setOtpCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            Control de Cierre POS
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Ingrese su codigo OTP para acceder
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Gerente
            </label>
            <select
              value={selectedManagerId}
              onChange={(e) =>
                setSelectedManagerId(
                  e.target.value ? Number(e.target.value) : ""
                )
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Seleccionar gerente...</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Codigo OTP
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="w-full px-3 py-3 border border-slate-300 rounded-lg text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedManagerId || otpCode.length !== 6}
            className="w-full py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verificando..." : "Acceder"}
          </button>
        </form>
      </div>
    </div>
  );
};
