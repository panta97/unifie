import { Wrapper } from "../../shared/Wrapper";
import { DatePicker } from "../../shared/datepicker/DatePicker";
import { useState } from "react";
import { getTodayDate } from "../../../utils/utils";
import { useAppDispatch } from "../../../app/hooks";
import { updateReportStatus } from "../../../app/slice/report/reportSlice";
import { fetchResult, FetchStatus } from "../../../types/fetch";
import { NoFocusButton } from "../../shared/NoFocusButton";
import { Select } from "../../shared/Select";
import { CatalogGeneric } from "../../../types/shared";

interface Product {
  id: number;
  name: string;
  qty: number;
}

const categIds: CatalogGeneric[] = [
  { id: 6918, name: "GASEOSAS" },
  { id: 6917, name: "CERVEZAS" },
  { id: 6914, name: "CARTA" },
  { id: 6915, name: "MENU" },
  { id: 6919, name: "CIGARROS" },
  { id: 6916, name: "COCTELES" },
  { id: 6920, name: "JUGOS" },
  { id: 6809, name: "LICORES" },
  { id: 97, name: "TODOS" },
];

export const DKReport = () => {
  const dispatch = useAppDispatch();
  const [date, setDate] = useState(getTodayDate());
  const [products, setProducts] = useState<Product[]>([]);
  const [categId, setCategId] = useState<number>(0);
  const [inventoryDate, setInventoryDate] = useState("");

  const handleCategId = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = Number(e.target.value);
    setCategId(newValue);
  };

  const handleDownload = async () => {
    try {
      dispatch(updateReportStatus({ status: FetchStatus.LOADING }));
      if (categId === 0)
        throw new Error("Debe seleccionar un tipo de producto");
      let categ_ids = [categId];
      if (categId === 97)
        categ_ids = categIds
          .filter((cat) => cat.id !== 97)
          .map((cat) => cat.id);

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          categ_ids,
        }),
      };
      const response = await fetch("/api/product-rpc/report/dk", requestOptions);
      const json = await response.json();
      if (json.result === fetchResult.SUCCESS) {
        const products: Product[] = json.message.products;
        products.sort((a, b) => a.name.localeCompare(b.name));
        setProducts(products);
        setInventoryDate(json.message.date);
      } else throw new Error(json.message);
    } catch (error) {
      alert(error);
    } finally {
      dispatch(updateReportStatus({ status: FetchStatus.IDLE }));
    }
  };

  return (
    <>
      <Wrapper>
        <div className="text-xs">
          <div className="inline-flex flex-col w-40 mr-1">
            <label htmlFor="date_from">Fecha</label>
            <DatePicker
              name={"date"}
              value={date}
              updateDate={(date) => setDate(date)}
            />
          </div>
          <div className="inline-flex flex-col w-48 mr-1">
            <label htmlFor="product_type" className="text-xs">
              Tipo de Producto
            </label>
            <Select
              id={categId}
              handler={handleCategId}
              catalog={categIds}
              name="product_type"
              autoFocus={false}
            />
          </div>
          <div className="flex justify-end pt-2 text-base">
            <NoFocusButton
              onClick={handleDownload}
              className="rounded bg-gray-100 px-2 py-1 cursor-pointer w-24"
            >
              Descargar
            </NoFocusButton>
          </div>
        </div>
      </Wrapper>
      {products.length > 0 && (
        <Wrapper>
          <div className="font-mono text-xs flex justify-center">
            <div className="inline-block border border-gray-200 rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 bg-gray-100">
                    <th className="font-normal p-1 border-r last:border-r-0">
                      {inventoryDate}
                    </th>
                    <th className="font-normal p-1 border-r last:border-r-0">
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((drink) => (
                    <tr key={drink.id} className="border-b last:border-b-0">
                      <td className="p-1 border-r last:border-r-0">
                        {drink.name}
                      </td>
                      <td className="p-1 border-r last:border-r-0 text-center">
                        {drink.qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Wrapper>
      )}
    </>
  );
};
