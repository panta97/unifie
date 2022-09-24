import { ProductAttributeValue } from "../../../types/catalogs";
import {
  AttributeDefaultCodeForm,
  AttributeForm,
  AttributeListPrice,
} from "../../../types/product";

export const cartesianDC = (attrs: AttributeForm[]) => {
  const r: AttributeDefaultCodeForm[] = [];
  const max = attrs.length - 1;
  const helper = (arr: Partial<ProductAttributeValue>[], i: number) => {
    for (let j = 0, l = attrs[i].attr_vals.length; j < l; j++) {
      const a = arr.slice(0); // clone arr
      a.push(attrs[i].attr_vals[j]);
      if (i === max) r.push({ attr_val_ids: a, default_code: "" });
      else helper(a, i + 1);
    }
  };
  helper([], 0);
  return r;
};

export const cartesianLP = (attrs: AttributeForm[], defaultPrice: number) => {
  const r: AttributeListPrice[] = [];
  const max = attrs.length - 1;
  const helper = (arr: Partial<ProductAttributeValue>[], i: number) => {
    for (let j = 0, l = attrs[i].attr_vals.length; j < l; j++) {
      const a = arr.slice(0); // clone arr
      a.push(attrs[i].attr_vals[j]);
      if (i === max) r.push({ attr_val_ids: a, list_price: defaultPrice });
      else helper(a, i + 1);
    }
  };
  helper([], 0);
  return r;
};
