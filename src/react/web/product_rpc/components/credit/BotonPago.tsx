import React from "react";
import { DollarSign } from "lucide-react";
import { useAppDispatch } from "../../app/hooks";
import { updateInvoiceStatus } from "../../app/slice/refund/formSlice";
import { FetchStatus, fetchResult } from "../../types/fetch";

interface BotonPagoProps {
    creditNoteId: number | null;
    fetchUpdatedInvoice: () => Promise<void>;
}

export const BotonPago: React.FC<BotonPagoProps> = ({ creditNoteId, fetchUpdatedInvoice }) => {
    const dispatch = useAppDispatch();

    const handlePay = async () => {
        if (!creditNoteId) {
            alert("No hay nota de crédito seleccionada");
            return;
        }

        const confirmPayment = window.confirm("¿Está seguro de que desea realizar el pago?");
        if (!confirmPayment) return;

        dispatch(updateInvoiceStatus({ invoiceStatus: FetchStatus.LOADING }));

        const params = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${window.localStorage.getItem("token")}` || "",
            },
            body: JSON.stringify({ credit_note_id: creditNoteId, accion: "pagar" }),
        };

        try {
            const response = await fetch("/api/product-rpc/credit-note/pay", params);
            const json = await response.json();

            if (json.result === fetchResult.SUCCESS) {
                alert("Pago realizado con éxito. ID de Wizard: " + json.wizard_id);
                await fetchUpdatedInvoice();
            } else {
                alert("Error en el pago: " + (json.message || "Respuesta inesperada."));
            }
        } catch (error) {
            console.error("Error en la solicitud de pago:", error);
            alert("Error en el pago: " + error);
        } finally {
            dispatch(updateInvoiceStatus({ invoiceStatus: FetchStatus.IDLE }));
        }
    };

    return (
        <button
            onClick={handlePay}
            className="flex items-center gap-2 rounded bg-green-500 hover:bg-green-600 text-white px-4 py-2 mt-[45px] text-sm font-semibold"
            disabled={!creditNoteId}
        >
            <DollarSign size={20} />
            Pagar
        </button>
    );
};

export default BotonPago;
