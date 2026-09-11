import { array, number, object } from "yup";

const lineSchema = object().shape({
  price_unit_refund: number().moreThan(0, "Precio debe ser mayor a cero"),
  price_subtotal_refund: number().moreThan(0, "Precio debe ser mayor a cero"),
});

export const linesSchema = array(lineSchema);
