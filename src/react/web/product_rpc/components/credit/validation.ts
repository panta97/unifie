import { array, number, object } from "yup";

const lineSchema = object().shape({
  price_unit_refund: number().min(1, "Precio debe ser mayor a cero"),
  price_subtotal_refund: number().min(1, "Precio debe ser mayor a cero"),
});

export const linesSchema = array(lineSchema);
