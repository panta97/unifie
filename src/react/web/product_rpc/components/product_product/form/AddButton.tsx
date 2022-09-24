import { batch } from "react-redux";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  addProduct,
  updateSelectedProduct,
} from "../../../app/slice/product/productListSlice";
import {
  selectProduct,
  reset as resetProduct,
} from "../../../app/slice/product/productSlice";
import { ProductProductForm } from "../../../types/product";

export const AddButton = () => {
  const product = useAppSelector(selectProduct);
  const dispatch = useAppDispatch();

  const handleSaveNewProduct = () => {
    batch(() => {
      dispatch(addProduct({ product: product }));
      dispatch(resetProduct());
    });
  };

  const handleUpdateProduct = (product: ProductProductForm) => {
    batch(() => {
      dispatch(updateSelectedProduct({ product }));
      dispatch(resetProduct());
    });
  };

  return (
    <button
      className="rounded bg-gray-100 px-2 py-1 cursor-pointer w-24"
      onClick={(e) => {
        product.is_in_list
          ? handleUpdateProduct(product)
          : handleSaveNewProduct();
        e.currentTarget.blur();
      }}
    >
      {product.is_in_list ? "Actualizar" : "Agregar"}
    </button>
  );
};
