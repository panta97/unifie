import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectDiscount,
  updateDiscountedPrice,
  updatePrice,
} from "../../app/slice/discount/discountSlice";
import NumberInputBlank from "../input/NumberInputBlank";

export const Discount = () => {
  const dis = useAppSelector(selectDiscount);

  const dispatch = useAppDispatch();

  return (
    <div>
      <table className="border-collapse border border-black w-[400px]">
        <thead>
          <tr>
            <th className="border border-black px-2 w-1/3">PRECIO</th>
            <th className="border border-black px-2 w-1/3">P. DESCUENTO</th>
            <th className="border border-black px-2 w-1/3">PORCENTAJE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-2">
              <NumberInputBlank
                min={0}
                className="w-full"
                value={dis.price}
                onChange={(e) =>
                  dispatch(updatePrice({ price: Number(e.target.value) }))
                }
              />
            </td>
            <td className="border border-black px-2">
              <NumberInputBlank
                min={0}
                className="w-full"
                value={dis.discountedPrice}
                onChange={(e) =>
                  dispatch(
                    updateDiscountedPrice({
                      discountedPrice: Number(e.target.value),
                    })
                  )
                }
              />
            </td>
            <td className="border border-black px-2">
              {`${(dis.percentage * 100).toFixed(4)}%`}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
