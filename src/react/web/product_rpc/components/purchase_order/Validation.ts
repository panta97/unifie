import { array, number, object } from "yup";

const productItemSchema = object().shape(
  {
    qty: number().when("price", {
      is: (price: number) => price > 0,
      then: number()
        .integer("Cantidad debe ser un numero natural")
        .positive("Cantidad debe ser mayor a cero"),
      // otherwise: number().equals([0]),
    }),
    price: number().when("qty", {
      is: (qty: number) => qty > 0,
      then: number().positive("Precio debe ser mayor a cero"),
      // otherwise: number().equals([0]),
    }),
  },
  [["price", "qty"]]
);

const productRowSchema = object({
  product_items: array(productItemSchema).min(1),
});

export const orderItemSchema = object({
  product_matrix: array(productRowSchema).min(1).required(),
}).test(
  "at least one",
  "Debe rellenar al menos un precio y una cantidad",
  (oiSchema) => {
    if (!oiSchema.product_matrix) return false;
    for (const productRow of oiSchema.product_matrix) {
      if (!productRow.product_items) return false;
      for (const productItem of productRow.product_items) {
        if (productItem.qty! > 0 && productItem.price! > 0) return true;
      }
    }
    return false;
  }
);

export const orderDetailsSchema = object({
  partner_id: number().positive("Debe seleccionar un Proveedor").required(),
});

export const orderListSchema = array(orderItemSchema)
  .min(1, "Debe agregar al menos un Producto")
  .required();
