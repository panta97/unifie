import React, { useState } from "react";
import { purchaseOrderApi } from "../../services/purchaseOrderApi";
import {
  lotsApi,
  Picking,
  LotsConfig,
  PickingMove,
} from "../../services/lotsApi";
import { Svg } from "../shared/Svg";

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
  interface QueuedPicking {
    id: number;
    name: string;
    moves: PickingMove[];
    config: LotsConfig;
    poName: string;
    poId: number;
  }

  const [queuedPickings, setQueuedPickings] = useState<QueuedPicking[]>([]);
  const [processingQueue, setProcessingQueue] = useState(false);
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
        const queuedIds = queuedPickings.map((q) => q.id);
        const availablePickings = response.pickings.filter(
          (p) => !queuedIds.includes(p.id),
        );

        setPickings(availablePickings);

        const initialConfigs: { [pickingId: number]: LotsConfig } = {};
        availablePickings.forEach((picking) => {
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

  const handleAddToQueue = (pickingId: number) => {
    setError(null);
    setSuccessMessage(null);

    const config = lotsConfigs[pickingId];
    for (const productId in config) {
      for (const lot of config[productId]) {
        if (!lot.lot_name.trim()) {
          setError("Todos los lotes deben tener un nombre");
          return;
        }
        if (lot.quantity <= 0) {
          setError("La cantidad debe ser mayor a 0");
          return;
        }
      }
    }

    const picking = pickings.find((p) => p.id === pickingId);
    if (!picking || !poData) return;

    const newQueuedPicking: QueuedPicking = {
      id: picking.id,
      name: picking.name,
      moves: picking.moves,
      config: config,
      poName: poData.name,
      poId: poData.id,
    };

    setQueuedPickings((prev) => [...prev, newQueuedPicking]);

    setPickings((prev) => prev.filter((p) => p.id !== pickingId));

    setLotsConfigs((prev) => {
      const { [pickingId]: _, ...rest } = prev;
      return rest;
    });

    setSuccessMessage("Agregado a la cola de pendientes");
  };

  const handleEditQueue = (queued: QueuedPicking) => {
    setQueuedPickings((prev) => prev.filter((p) => p.id !== queued.id));

    setSearchTerm(queued.poName);
    setPoData({ id: queued.poId, name: queued.poName });

    setPickings((prev) => {
      if (prev.find((p) => p.id === queued.id)) return prev;
      const restoredPicking: Picking = {
        id: queued.id,
        name: queued.name,
        moves: queued.moves,
      };
      return [...prev, restoredPicking];
    });

    setLotsConfigs((prev) => ({
      ...prev,
      [queued.id]: queued.config,
    }));
  };

  const handleDeleteQueue = (pickingId: number) => {
    setQueuedPickings((prev) => prev.filter((p) => p.id !== pickingId));
  };

  const handleProcessAll = async () => {
    if (queuedPickings.length === 0) return;
    setProcessingQueue(true);
    setError(null);
    setSuccessMessage(null);

    let successCount = 0;
    let errors: string[] = [];

    try {
      for (const queued of queuedPickings) {
        const response = await lotsApi.generateLots(queued.id, queued.config);
        if (response.result === "SUCCESS") {
          successCount++;
        } else {
          errors.push(`Error en recepción ${queued.name}: ${response.message}`);
        }
      }

      if (errors.length > 0) {
        setError(`Procesado con errores: ${errors.join(". ")}`);
      }

      if (successCount > 0) {
        setSuccessMessage(
          `Se procesaron ${successCount} recepciones exitosamente.`,
        );

        if (errors.length === 0) {
          setQueuedPickings([]);
          setPickings([]);
        }
      }
    } catch (err: any) {
      setError("Error crítico al procesar la cola: " + err.message);
    } finally {
      setProcessingQueue(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";

    const isoString = dateString.includes(" ")
      ? dateString.replace(" ", "T") + "Z"
      : dateString;
    const date = new Date(isoString);

    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatDateForState = (dateString: string) => {
    if (!dateString) return "";

    const localDateTime = dateString + "T23:59:59";
    const date = new Date(localDateTime);
    if (isNaN(date.getTime())) return "";

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
                onClick={() => handleAddToQueue(picking.id)}
                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 font-medium transition-colors text-sm"
              >
                Agregar
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
                    <th className="text-left border-r last:border-r-0 font-normal p-1 w-1/12">
                      Lotes
                    </th>
                    <th className="text-left border-r last:border-r-0 font-normal p-1 w-4/12">
                      Fecha de vencimiento
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
                      <td className="text-left border-r font-normal p-1">
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
                                  className="flex gap-1.5 items-center h-8"
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
                      <td className="text-left border-r last:border-r-0 font-normal p-1">
                        {move.tracking !== "none" && (
                          <div className="flex flex-col gap-1.5">
                            {lotsConfigs[picking.id]?.[move.product_id]?.map(
                              (lot, idx) => (
                                <div
                                  key={idx}
                                  className="flex gap-1.5 items-center h-8"
                                >
                                  <input
                                    type="date"
                                    className="px-1 py-0.5 border border-gray-200 rounded w-auto"
                                    value={formatDateForInput(
                                      lot.expiration_date || "",
                                    )}
                                    onChange={(e) =>
                                      handleLotChange(
                                        picking.id,
                                        move.product_id,
                                        idx,
                                        "expiration_date",
                                        formatDateForState(e.target.value),
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
                            <div className="h-4" />
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

      {queuedPickings.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-300">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Lotes en Cola (Pendiente de Procesar)
          </h2>
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Orden / Recepción</th>
                  <th className="px-4 py-2 text-left">Resumen de Lotes</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {queuedPickings.map((queue) => {
                  return (
                    <tr key={queue.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{queue.poName}</div>
                        <div className="text-xs text-gray-500">
                          {queue.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {queue.moves.map((move) => {
                            const lots = queue.config[move.product_id];
                            if (!lots || lots.length === 0) return null;
                            return (
                              <div key={move.product_id} className="text-xs">
                                <span className="font-medium">
                                  {move.product_name}:
                                </span>{" "}
                                {lots.map((l) => `${l.lot_name}`).join(", ")}
                                <span className="text-gray-500 ml-1">
                                  ({lots.length} lotes)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <span
                            title="Editar"
                            className="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                          >
                            <Svg.PencilAlt
                              className="h-5 w-5 text-gray-500 hover:text-blue-600"
                              onClick={() => handleEditQueue(queue)}
                            />
                          </span>
                          <span
                            title="Eliminar"
                            className="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                          >
                            <Svg.Trash
                              className="h-5 w-5 text-gray-500 hover:text-red-600"
                              onClick={() => handleDeleteQueue(queue.id)}
                            />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleProcessAll}
                disabled={processingQueue}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 font-medium transition-colors shadow-sm flex items-center gap-2"
              >
                {processingQueue ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Procesando...
                  </>
                ) : (
                  "Procesar Todos los Lotes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lots;
