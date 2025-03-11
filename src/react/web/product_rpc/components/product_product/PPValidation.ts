import { array, number, object, string } from "yup";

const catalogAttrSchema = object({
  id: number().positive("Debe seleccionar un atributo").required(),
  name: string().required(),
});
const catalogAttrValSchema = object({
  id: number().required(),
  name: string().required(),
  attribute_id: number().required(),
});

const attrSchema = object({
  attr: catalogAttrSchema,
  attr_vals: array(catalogAttrValSchema)
    .min(1, "Debe elegir al menos un valor de atributo")
    .required(),
});

const attrDefaultCode = object({
  attr_val_ids: array(catalogAttrValSchema).required(),
  default_code: string().trim().required("Referencia interna vacía"),
});

const attrListPrice = object({
  attr_val_ids: array(catalogAttrValSchema).required(),
  list_price: number()
    .positive("Precio Venta debe ser positivo")
    .min(1)
    .required(),
});

const productSchema = object({
  name: string().trim().required("Nombre de producto vacío"),
  list_price: number()
    .positive("Precio Venta debe ser positivo")
    .min(1)
    .required(),
  default_code: string().optional(),
  // weight: number()
  //   .positive()
  //   .min(0.0001, "Peso en kg debe ser positivo")
  //   .required(),
  category_line_id: number().positive("Debe seleccionar una categoría principal").required(),
  category_family_id: number()
    .positive("Debe seleccinar una categoría 1")
    .optional(),
  category_brand_id: number().optional(),
  category_last_id: number().optional(),
  pos_categ_ids: number()
    .positive("Debe seleccionar una Categoría POS")
    .required(),
  attrs: array(attrSchema).min(0).required(),
  attr_default_code: array(attrDefaultCode).min(0).required(),
  attr_list_price: array(attrListPrice).min(0).required(),
});

export const productsSchema = array(productSchema)
  .min(1, "Debe crear al menos un producto")
  .required();
