import React, { useState } from "react";
import { MoveLine, MoveLineDiscount } from "./types/moveLine";
import useCopyToClipboard from "../shared/hooks/useCopyToClipboard";

const PRODUCT_DISC_ID = 2;

interface MoveLineDiscountView extends MoveLineDiscount {
  copyText: string;
}

function App() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [moveLinesDisc, setMoveLinesDisc] = useState<MoveLineDiscountView[]>(
    []
  );
  const [, setDiscCopy] = useCopyToClipboard();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await fetch(
      `/api/miscellaneous/move-lines/${invoiceNumber}`
    );
    const jsonResult = await result.json();
    // setMoveLines(jsonResult.move_lines as MoveLine[]);
    setMoveLinesDisc(getMoveLinesDisc(jsonResult.move_lines as MoveLine[]));
  };

  const getMoveLinesDisc = (moveLines: MoveLine[]) => {
    if (moveLines.length === 0) return [];
    const discountAll =
      moveLines.find((l) => l.product_id === PRODUCT_DISC_ID)!.price_total * -1;

    const moveLinesProducts = moveLines.filter(
      (l) => l.product_id !== PRODUCT_DISC_ID
    );

    const priceTotalAll = moveLinesProducts.reduce(
      (acc, curr) => (acc += curr.price_total),
      0
    );
    const moveLinesDiscount = moveLinesProducts.map(
      (l): MoveLineDiscountView => {
        return {
          ...l,
          copyText: "copy",
          discount:
            ((l.price_total / priceTotalAll) * discountAll) / l.price_total,
        };
      }
    );
    return moveLinesDiscount;
  };

  const handleCopy = (moveLineDiscView: MoveLineDiscountView) => {
    setDiscCopy((moveLineDiscView.discount * 100).toFixed(4));
    setMoveLinesDisc((prev) => {
      return prev.map((l) => {
        if (l.id === moveLineDiscView.id) {
          l.copyText = "copied";
        }
        return l;
      });
    });

    setTimeout(() => {
      setMoveLinesDisc((prev) => {
        return prev.map((l) => {
          if (l.id === moveLineDiscView.id) {
            l.copyText = "copy";
          }
          return l;
        });
      });
    }, 5000);
  };

  return (
    <div>
      <div className="flex flex-col items-center">
        <form
          className="m-4 flex flex-col w-[250px] gap-2 border-b pb-2"
          onSubmit={handleSubmit}
        >
          <label>Número Boleta:</label>
          <input
            type="text"
            className="border"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
          <button className="border w-1/2 mx-auto">Buscar</button>
        </form>
        <div>
          <table>
            <thead>
              <tr>
                <th className="border p-1">Producto</th>
                <th className="border p-1">Cantidad</th>
                <th className="border p-1">Precio</th>
                <th className="border p-1">Desc. %</th>
                <th className="border p-1">Precio Total</th>
              </tr>
            </thead>
            <tbody>
              {moveLinesDisc.map((l) => (
                <tr key={l.id}>
                  <td className="border p-1">{l.name}</td>
                  <td className="border p-1">{l.quantity}</td>
                  <td className="border p-1">{l.price_unit}</td>
                  <td className="border p-1">
                    {(l.discount * 100).toFixed(4)} -{" "}
                    <button
                      className="text-blue-700 font-bold outline-none"
                      onClick={() => handleCopy(l)}
                    >
                      {l.copyText}
                    </button>
                  </td>
                  <td className="border p-1">{l.price_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
