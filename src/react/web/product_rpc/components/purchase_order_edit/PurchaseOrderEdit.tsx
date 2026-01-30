import React, { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectPartnerCatalog,
  updateOrderAll,
} from "../../app/slice/order/catalogSlice";
import {
  selectFormOrderState,
  selectFormOrderStatus,
  updateOrderFormState,
} from "../../app/slice/order/formSlice";
import {
  updatePartner,
  updatePartnerRef,
  updateTax,
  updateCompany,
  resetOrderDetails,
  updateHelperProps,
} from "../../app/slice/order/orderDetailsSlice";
import {
  addItem,
  resetOrderList,
} from "../../app/slice/order/orderListSlice";
import { ProductFormState } from "../../types/product";
import { Loader } from "../shared/Loader";
import { OrderDetails } from "../purchase_order/order_details/OrderDetails";
import { OrderItem } from "../purchase_order/order_item/OrderItem";
import { OrderList } from "../purchase_order/order_list/OrderList";
import { OrderSearch } from "./order_search/OrderSearch";
import { EditOrderName } from "./EditOrderName";
import { getCatalogs } from "../purchase_order/shared";
import { purchaseOrderApi } from "../../services/purchaseOrderApi";

const PurchaseOrderEdit = () => {
  const formState = useAppSelector(selectFormOrderState);
  const formStatus = useAppSelector(selectFormOrderStatus);
  const catalog = useAppSelector(selectPartnerCatalog);
  const dispatch = useAppDispatch();

  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [editingOrderName, setEditingOrderName] = useState<string>("");
  const [incomingPickingCount, setIncomingPickingCount] = useState<number>(0);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const downloadCatalogs = useCallback(async () => {
    const isCatalogEmpty = catalog.length === 0;
    if (isCatalogEmpty) {
      const catalogData = await getCatalogs();
      dispatch(updateOrderAll({ catalogs: catalogData }));
    }
  }, [catalog, dispatch]);

  useEffect(() => {
    downloadCatalogs();
  }, []);

  const handleOrderFound = async (
    orderId: number,
    orderName: string,
    orderState: string
  ) => {
    setLoadingOrder(true);
    setLoadError(null);

    try {
      const response = await purchaseOrderApi.getForEdit(orderId);

      if (response.result === "SUCCESS" && response.order) {
        const { order_details, order_items } = response.order;

        // Set editing state
        setEditingOrderId(order_details.po_id);
        setEditingOrderName(order_details.name);
        setIncomingPickingCount(order_details.incoming_picking_count || 0);

        // Find partner name from catalog
        const partner = catalog.find((p) => p.id === order_details.partner_id);
        const partnerName = partner ? partner.name : "";

        // Update order details in Redux
        dispatch(
          updatePartner({
            partnerId: order_details.partner_id,
            partnerName: partnerName,
          })
        );
        dispatch(
          updatePartnerRef({
            partnerRef: order_details.partner_ref,
          })
        );
        dispatch(
          updateTax({
            isTaxed: order_details.tax,
          })
        );
        dispatch(
          updateCompany({
            company_id: order_details.company_id,
          })
        );

        // Set odoo_id and odoo_link
        dispatch(
          updateHelperProps({
            odooId: order_details.po_id,
            odooLink: `${window.location.origin}/odoo/purchase/${order_details.po_id}`,
          })
        );

        // Reset and populate order list
        dispatch(resetOrderList());
        order_items.forEach((item: any) => {
          dispatch(addItem({ orderItem: item }));
        });

        // Set form state to DRAF to allow editing
        dispatch(updateOrderFormState({ formState: ProductFormState.DRAF }));

        setLoadError(null);
      } else {
        setLoadError(response.message || "Error al cargar la orden");
      }
    } catch (error) {
      console.error("Error loading order:", error);
      setLoadError("Error al cargar la orden");
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleCancelEdit = () => {
    if (
      confirm("¿Deseas cancelar la edición? Se perderán los cambios no guardados.")
    ) {
      setEditingOrderId(null);
      setEditingOrderName("");
      dispatch(resetOrderList());
      dispatch(resetOrderDetails());
      dispatch(updateOrderFormState({ formState: ProductFormState.DRAF }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Editar Orden de Compra
      </h1>

      {/* Search Section */}
      {!editingOrderId && (
        <OrderSearch onOrderFound={handleOrderFound} />
      )}

      {/* Edit Mode - Show order name with Odoo link */}
      {editingOrderId && (
        <div className="mb-6">
          <EditOrderName orderName={editingOrderName} orderId={editingOrderId} />
          
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors"
            >
              ← Cancelar y buscar otra orden
            </button>

            {incomingPickingCount > 0 && (
              <button
                onClick={() => console.log("Reception button clicked")}
                className="flex items-center px-4 py-2 bg-gray-100 rounded shadow-sm hover:bg-gray-200 transition-colors"
                title="Recepciones"
              >
                <div className="mr-2 relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-700"
                  >
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {incomingPickingCount}
                  </span>
                </div>
                <div className="font-medium text-gray-700 text-sm">Recepción</div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loadingOrder && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center mb-6">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-blue-700 font-medium">Cargando orden...</p>
        </div>
      )}

      {/* Error State */}
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">
            <strong>Error:</strong> {loadError}
          </p>
        </div>
      )}

      {/* Order Form - Only show when editing */}
      {editingOrderId && !loadingOrder && (
        <div className="space-y-6">
          <OrderDetails />
          {formState === ProductFormState.DRAF && (
            <>
              <OrderItem />
            </>
          )}
          <OrderList editMode={true} currentOrderId={editingOrderId} />
        </div>
      )}

      <Loader fetchStatus={formStatus} portal={true} />
    </div>
  );
};

export default PurchaseOrderEdit;
