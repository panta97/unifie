import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  deleteSelectedProduct,
  duplicateSelectedProduct,
  selectProducts,
} from "../../../app/slice/product/productListSlice";
import {
  replaceProduct,
  selectProductId,
} from "../../../app/slice/product/productSlice";
import { ProductProductForm } from "../../../types/product";
import { Svg } from "../../shared/Svg";

export const Table = () => {
  const products = useAppSelector(selectProducts);
  const productId = useAppSelector(selectProductId);
  const dispatch = useAppDispatch();

  const handleEditProduct = (product: ProductProductForm) => {
    dispatch(replaceProduct({ product }));
  };
  const handleDuplicateProduct = (productId: number) => {
    dispatch(duplicateSelectedProduct({ productId }));
  };
  const handleDeleteProduct = (productId: number) => {
    dispatch(deleteSelectedProduct({ productId }));
  };

  return (
    <div className="overflow-x-scroll border border-gray-200 rounded-md">
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-500 bg-gray-100">
            <th className="font-normal p-1">Nombre</th>
            <th className="font-normal p-1">Categoría</th>
            <th className="font-normal p-1">Categoría POS</th>
            <th className="font-normal p-1">Precio</th>
            <th className="font-normal p-1">Atributos</th>
            <th className="font-normal p-1">Referencia Interna</th>
            <th className="font-normal p-1 text-center" colSpan={3}>
              -
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="even:bg-gray-100">
              <td className="p-1">
                {product.name + " "}
                {product.id === productId && (
                  <span className="rounded px-1 mr-0.5 mt-0.5 bg-emerald-400 text-white inline-block">
                    Editando
                  </span>
                )}
              </td>
              <td className="p-1">{`${product.category_line_name} / ${product.category_family_name} / ${product.category_brand_name}`}</td>
              <td className="p-1">{product.pos_categ_name}</td>
              <td className="p-1">
                {product.attr_list_price.length > 0 ? (
                  product.attr_list_price.map((attr, idx) => (
                    <span
                      className="rounded px-1 mr-0.5 mt-0.5 bg-gray-200 inline-block whitespace-pre-wrap"
                      style={{ fontSize: "10px" }}
                      key={idx}
                    >
                      {`${attr.attr_val_ids.reduce(
                        (acc, curr) => (acc += curr.name),
                        ""
                      )} : ${attr.list_price.toFixed(2)}`}
                    </span>
                  ))
                ) : (
                  <span>{product.list_price.toFixed(2)}</span>
                )}
              </td>
              <td className="p-1">
                <div className="flex items-start flex-wrap">
                  {product.attrs.map((attr) => {
                    return attr.attr_vals.map((attrVal) => (
                      <span
                        className="rounded px-1 mr-0.5 mt-0.5 bg-gray-200 inline-block whitespace-pre-wrap"
                        style={{ fontSize: "10px" }}
                        key={attrVal.id}
                      >
                        {attrVal.name}
                      </span>
                    ));
                  })}
                </div>
              </td>
              <td className="p-1">
                <div className="flex items-start flex-wrap">
                  {product.attr_default_code.length > 0 ? (
                    product.attr_default_code.map((attr, idx) => (
                      <span
                        className="rounded px-1 mr-0.5 mt-0.5 bg-gray-200 inline-block whitespace-pre-wrap"
                        style={{ fontSize: "10px" }}
                        key={idx}
                      >
                        {`${attr.attr_val_ids.reduce(
                          (acc, curr) => (acc += curr.name),
                          ""
                        )} : ${attr.default_code}`}
                      </span>
                    ))
                  ) : (
                    <span>{product.default_code}</span>
                  )}
                </div>
              </td>
              {product.odoo_link ? (
                <td className="p-1" colSpan={3}>
                  <div className="flex justify-center">
                    <a
                      className="inline-flex items-center rounded px-1 bg-blue-400 text-white cursor-pointer"
                      title="Odoo link"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={product.odoo_link}
                    >
                      <span className="mr-0.5">Creado</span>
                      <Svg.ExternalLink className="h-5 w-5" />
                    </a>
                  </div>
                </td>
              ) : (
                <>
                  <td className="p-1">
                    <span title="Editar">
                      <Svg.PencilAlt
                        className="h-5 w-5 mx-auto cursor-pointer"
                        onClick={() => handleEditProduct(product)}
                      />
                    </span>
                  </td>
                  <td className="p-1">
                    <span title="Duplicar">
                      <Svg.Duplicate
                        className="h-5 w-5 mx-auto cursor-pointer"
                        onClick={() => handleDuplicateProduct(product.id)}
                      />
                    </span>
                  </td>
                  <td className="p-1">
                    <span title="Eliminar">
                      <Svg.Trash
                        className="h-5 w-5 mx-auto cursor-pointer"
                        onClick={() => handleDeleteProduct(product.id)}
                      />
                    </span>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
