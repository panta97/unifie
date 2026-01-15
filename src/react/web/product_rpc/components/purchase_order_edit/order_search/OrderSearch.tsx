import React, { useState } from "react";
import { purchaseOrderApi } from "../../../services/purchaseOrderApi";

interface OrderSearchProps {
  onOrderFound: (orderId: number, orderName: string, orderState: string) => void;
}

export const OrderSearch: React.FC<OrderSearchProps> = ({ onOrderFound }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Ingresa un número de orden");
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await purchaseOrderApi.searchByName(searchTerm.trim());

      if (response.result === "SUCCESS" && response.order) {
        const order = response.order;

        // Verificar si la orden es editable
        if (order.state === "draft" || order.state === "sent") {
          onOrderFound(order.id, order.name, order.state);
          setSearchTerm("");
          setError(null);
        } else {
          setError(
            `La orden "${order.name}" está en estado "${order.state}" y no puede editarse. Solo se pueden editar órdenes en estado Borrador (draft) o Enviada (sent).`
          );
        }
      } else {
        setError(response.message || `No se encontró la orden "${searchTerm}"`);
      }
    } catch (err) {
      setError("Error al buscar la orden");
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        Buscar Orden de Compra
      </h2>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la Orden
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ej: P03788"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={searching}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !searchTerm.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {searching ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-500">
        💡 Solo puedes editar órdenes en estado <strong>Borrador</strong> o{" "}
        <strong>Enviada</strong>
      </p>
    </div>
  );
};
