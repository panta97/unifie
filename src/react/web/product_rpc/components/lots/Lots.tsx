import React, { useState } from "react";
import { purchaseOrderApi } from "../../services/purchaseOrderApi";
import { lotsApi, Picking, LotsConfig } from "../../services/lotsApi";

export const Lots: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poData, setPoData] = useState<{ id: number; name: string } | null>(
    null,
  );
  const [pickings, setPickings] = useState<Picking[]>([]);
  const [loadingPickings, setLoadingPickings] = useState(false);
  const [lotsConfigs, setLotsConfigs] = useState<{
    [pickingId: number]: LotsConfig;
  }>({});
  const [generating, setGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Ingresa un número de orden");
      return;
    }

    setSearching(true);
    setError(null);
    setPoData(null);
    setPickings([]);
    setSuccessMessage(null);

    try {
      const response = await purchaseOrderApi.searchByName(searchTerm.trim());

      if (response.result === "SUCCESS" && response.order) {
        const order = response.order;
        setPoData({ id: order.id, name: order.name });
        fetchPickings(order.id);
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

  const fetchPickings = async (poId: number) => {
    setLoadingPickings(true);
    try {
      const response = await lotsApi.getPendingPickings(poId);
      if (response.result === "SUCCESS" && response.pickings) {
        setPickings(response.pickings);

        // Initialize lot configs for each picking
        const initialConfigs: { [pickingId: number]: LotsConfig } = {};
        response.pickings.forEach((picking) => {
          const config: LotsConfig = {};
          picking.moves.forEach((move) => {
            if (move.tracking !== "none") {
              if (move.existing_lots && move.existing_lots.length > 0) {
                config[move.product_id] = move.existing_lots.map((lot) => ({
                  lot_name: lot.lot_name,
                  quantity: lot.quantity,
                  expiration_date: lot.expiration_date || "",
                }));
              } else {
                config[move.product_id] = [
                  {
                    lot_name: "",
                    quantity: move.product_uom_qty,
                    expiration_date: "",
                  },
                ];
              }
            }
          });
          initialConfigs[picking.id] = config;
        });
        setLotsConfigs(initialConfigs);
      } else {
        setError(
          response.message || "No se encontraron recepciones pendientes",
        );
      }
    } catch (err) {
      setError("Error al obtener recepciones");
    } finally {
      setLoadingPickings(false);
    }
  };

  const handleLotChange = (
    pickingId: number,
    productId: number,
    index: number,
    field: string,
    value: any,
  ) => {
    setLotsConfigs((prev) => {
      const newPickingConfig = { ...prev[pickingId] };
      const newProductConfig = [...newPickingConfig[productId]];
      newProductConfig[index] = { ...newProductConfig[index], [field]: value };
      newPickingConfig[productId] = newProductConfig;
      return { ...prev, [pickingId]: newPickingConfig };
    });
  };

  const addLotRow = (pickingId: number, productId: number) => {
    setLotsConfigs((prev) => {
      const newPickingConfig = { ...prev[pickingId] };
      newPickingConfig[productId] = [
        ...newPickingConfig[productId],
        { lot_name: "", quantity: 0 },
      ];
      return { ...prev, [pickingId]: newPickingConfig };
    });
  };

  const removeLotRow = (
    pickingId: number,
    productId: number,
    index: number,
  ) => {
    setLotsConfigs((prev) => {
      const newPickingConfig = { ...prev[pickingId] };
      newPickingConfig[productId] = newPickingConfig[productId].filter(
        (_, i) => i !== index,
      );
      return { ...prev, [pickingId]: newPickingConfig };
    });
  };

  const handleGenerateLots = async (pickingId: number) => {
    setGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const config = lotsConfigs[pickingId];
      for (const productId in config) {
        for (const lot of config[productId]) {
          if (!lot.lot_name.trim()) {
            setError("Todos los lotes deben tener un nombre");
            setGenerating(false);
            return;
          }
          if (lot.quantity <= 0) {
            setError("La cantidad debe ser mayor a 0");
            setGenerating(false);
            return;
          }
        }
      }

      const response = await lotsApi.generateLots(pickingId, config);
      if (response.result === "SUCCESS") {
        setSuccessMessage(`Lotes generados exitosamente para la recepción`);
        if (poData) fetchPickings(poData.id);
      } else {
        setError(response.message || "Error al generar lotes");
      }
    } catch (err) {
      setError("Error al generar lotes");
    } finally {
      setGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        Gestión de Lotes
      </h1>

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
              placeholder="Ej: P03773"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={searching}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchTerm.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
          >
            {searching ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center gap-2">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-center gap-2">
          <span className="font-bold">Éxito:</span> {successMessage}
        </div>
      )}

      {loadingPickings ? (
        <div className="flex justify-center p-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : poData && pickings.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-yellow-800 text-center">
          No hay recepciones pendientes para la orden{" "}
          <strong>{poData.name}</strong>.
        </div>
      ) : (
        pickings.map((picking) => (
          <div key={picking.id} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  {picking.name}
                </div>
                <div className="text-xs text-gray-500">ID: {picking.id}</div>
              </div>
              <button
                onClick={() => handleGenerateLots(picking.id)}
                disabled={generating}
                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 font-medium transition-colors text-sm"
              >
                {generating ? "Generando..." : "Asignar Lotes"}
              </button>
            </div>

            <div className="text-xs border border-gray-200 mb-2 overflow-hidden rounded-md font-mono">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100 text-gray-500">
                    <th className="text-left border-r last:border-r-0 font-normal p-1 w-6/12">
                      Producto
                    </th>
                    <th className="text-left border-r last:border-r-0 font-normal p-1 w-1/12">
                      Cantidad
                    </th>
                    <th className="text-left border-r last:border-r-0 font-normal p-1 w-1/12">
                      Tracking
                    </th>
                    <th className="text-left border-r last:border-r-0 font-normal p-1 w-4/12">
                      Lotes
                    </th>
                  </tr>
                </thead>
                <tbody className="border-b-2 border-gray-200 last:border-0">
                  {picking.moves.map((move) => (
                    <tr
                      key={move.id}
                      className="border-b last:border-b-0 border-gray-200 text-gray-700"
                    >
                      <td className="text-left border-r font-normal p-1">
                        <div>{move.product_name}</div>
                        <div className="text-gray-400">
                          ID: {move.product_id}
                        </div>
                      </td>
                      <td className="text-left border-r font-normal p-1">
                        {move.product_uom_qty}
                      </td>
                      <td className="text-left border-r font-normal p-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            move.tracking === "none"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {move.tracking.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-left border-r last:border-r-0 font-normal p-1">
                        {move.tracking === "none" ? (
                          <span className="text-gray-400">
                            No requiere lotes
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {lotsConfigs[picking.id]?.[move.product_id]?.map(
                              (lot, idx) => (
                                <div
                                  key={idx}
                                  className="flex gap-1.5 items-center"
                                >
                                  <input
                                    type="text"
                                    placeholder="Nombre Lote"
                                    className="px-1 py-0.5 border border-gray-200 rounded w-44"
                                    value={lot.lot_name}
                                    onChange={(e) =>
                                      handleLotChange(
                                        picking.id,
                                        move.product_id,
                                        idx,
                                        "lot_name",
                                        e.target.value,
                                      )
                                    }
                                  />
                                  <input
                                    type="number"
                                    placeholder="Cant"
                                    className="px-1 py-0.5 border border-gray-200 rounded w-20"
                                    value={lot.quantity}
                                    onChange={(e) =>
                                      handleLotChange(
                                        picking.id,
                                        move.product_id,
                                        idx,
                                        "quantity",
                                        parseFloat(e.target.value),
                                      )
                                    }
                                  />
                                  <input
                                    type="text"
                                    placeholder="Vencimiento (Opcional)"
                                    className="px-1 py-0.5 border border-gray-200 rounded w-44"
                                    value={lot.expiration_date || ""}
                                    onChange={(e) =>
                                      handleLotChange(
                                        picking.id,
                                        move.product_id,
                                        idx,
                                        "expiration_date",
                                        e.target.value,
                                      )
                                    }
                                  />
                                  {lotsConfigs[picking.id][move.product_id]
                                    .length > 1 && (
                                    <button
                                      onClick={() =>
                                        removeLotRow(
                                          picking.id,
                                          move.product_id,
                                          idx,
                                        )
                                      }
                                      className="text-red-500 hover:text-red-700 px-1"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ),
                            )}
                            <button
                              onClick={() =>
                                addLotRow(picking.id, move.product_id)
                              }
                              className="text-blue-600 hover:underline font-medium text-left"
                            >
                              + Añadir otro lote
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Lots;
