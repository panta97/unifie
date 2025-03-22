import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { clamp } from "lodash";
import { CreditDetails, InvoiceSummary } from "../../../types/refund";
import { RootState } from "../../store";

const initialState: CreditDetails = {
  id: 0,
  has_refund: false,
  journal: "",
  number: "",
  create_date: "",
  date_invoice: "",
  journal_sunat_type: "",
  amount_untaxed: 0,
  amount_total: 0,
  payments: [],
  user: "",
  currency: "",
  partner: {
    id: 0,
    name: "",
    doc_number: "",
    odoo_link: "",
  },
  lines: [],
  refund_invoices: [],
  stock_moves: [],
};

export const invoiceItemSlice = createSlice({
  name: "invoice",
  initialState,
  reducers: {
    replaceInvoice: (
      state,
      { payload: { invoice } }: PayloadAction<{ invoice: InvoiceDetails }>
    ) => {
      state.id = invoice.id;
      state.has_refund = invoice.has_refund;
      state.journal = invoice.journal;
      state.number = invoice.number;
      state.create_date = invoice.create_date;
      state.date_invoice = invoice.date_invoice;
      state.journal_sunat_type = invoice.journal_sunat_type;
      state.amount_untaxed = invoice.amount_untaxed;
      state.amount_total = invoice.amount_total;
      state.payments = invoice.payments;
      state.user = invoice.user;
      state.currency = invoice.currency;
      state.partner = invoice.partner;
      state.lines = invoice.lines;
      state.refund_invoices = invoice.refund_invoices;
      state.stock_moves = invoice.stock_moves;
    },
    updateRefund: (
      state,
      {
        payload: { lineId, qty },
      }: PayloadAction<{ lineId: number; qty: number }>
    ) => {
      // const discount = Math.abs(
      //   state.lines.reduce(
      //     (acc, line) =>
      //       (acc += line.price_subtotal < 0 ? line.price_subtotal : 0),
      //     0
      //   )
      // );
      // const totalNoDiscount = state.amount_total + discount;

      for (let i = 0; i < state.lines.length; i++) {
        if (state.lines[i].id === lineId) {
          const line = state.lines[i];
          const newQtyRefund = clamp(line.qty_refund + qty, 0, line.quantity);
          line.qty_refund = newQtyRefund;
          if (line.qty_refund === 0) {
            line.price_unit_refund = 0;
            line.price_subtotal_refund = 0;
            continue;
          }

          // const priceUnit =
          //   line.discount > 0
          //     ? line.price_subtotal / line.quantity
          //     : line.price_unit;
          // const discountUnit = (priceUnit / totalNoDiscount) * discount;
          // const priceSubtotalDiscounted =
          //   (5 *
          //     Math.round(
          //       (((priceUnit - discountUnit) * line.qty_refund) / 5) * 10
          //     )) /
          //   10;
          const price_unit_real = line.price_subtotal / line.quantity;
          line.price_unit_refund = price_unit_real;
          line.price_subtotal_refund = price_unit_real * line.qty_refund;
        }
      }

      // APPLY DISCOUNT CORRECTION
      // const totalQty = state.lines
      //   .filter((line) => line.quantity > 0)
      //   .reduce((curr, line) => (curr += line.quantity), 0);
      // const totalQtyRefund = state.lines.reduce(
      //   (curr, line) => (curr += line.qty_refund),
      //   0
      // );
      // if (totalQty === totalQtyRefund) {
      //   const total = state.lines.reduce(
      //     (curr, line) => (curr += line.price_subtotal),
      //     0
      //   );
      //   const totalRefund = state.lines.reduce(
      //     (curr, line) => (curr += line.price_subtotal_refund),
      //     0
      //   );
      //   if (total !== totalRefund) {
      //     const diff = total - totalRefund;
      //     const greatestLine = state.lines.reduce(
      //       (curr, line, idx) => {
      //         if (line.price_subtotal > curr.price_subtotal) {
      //           curr.price_subtotal = line.price_subtotal;
      //           curr.index = idx;
      //         }
      //         return curr;
      //       },
      //       { price_subtotal: 0, index: 0 }
      //     );
      //     const stateLine = state.lines[greatestLine.index];
      //     stateLine.price_subtotal_refund += diff;
      //     stateLine.price_unit_refund =
      //       stateLine.price_subtotal_refund / stateLine.qty_refund;
      //   }
      // }
    },
    updateRefundManual: (
      state,
      {
        payload: { lineId, priceSubtotalRefund, remove = false },
      }: PayloadAction<{ lineId: number; priceSubtotalRefund: number; remove?: boolean }>
    ) => {
      for (let i = 0; i < state.lines.length; i++) {
        const line = state.lines[i];
        if (line.id === lineId) {
          if (remove) {
            line.qty_refund = 0;
            line.price_subtotal_refund = 0;
            line.price_unit_refund = 0;
          } else {
            line.price_subtotal_refund = priceSubtotalRefund;
            line.price_unit_refund = priceSubtotalRefund / line.qty_refund;
          }
          break;
        }
      }
    },
    updateRefundResult: (
      state,
      {
        payload: { refund_invoice, stock_move },
      }: PayloadAction<{
        refund_invoice: InvoiceSummary;
        stock_move: InvoiceSummary;
      }>
    ) => {
      state.has_refund = true;
      state.refund_invoices.push(refund_invoice);
      state.stock_moves.push(stock_move);
    },
    updateRefundEditing: (
      state,
      {
        payload: { lineId, isEditing },
      }: PayloadAction<{ lineId: number; isEditing: boolean }>
    ) => {
      // if lineId is 0 all editing lines will be set to false
      for (let i = 0; i < state.lines.length; i++) {
        const line = state.lines[i];
        if (line.id === lineId) line.is_editing_refund = isEditing;
        else line.is_editing_refund = false;
      }
    },
  },
});

export const {
  replaceInvoice,
  updateRefund,
  updateRefundManual,
  updateRefundResult,
  updateRefundEditing,
} = invoiceItemSlice.actions;

export const selectInvoiceItem = (state: RootState) => state.refund.invoice;

export default invoiceItemSlice.reducer;
