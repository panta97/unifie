import { HEADER_HEIGHT } from "../../logic/constants";
import { IOrderDetailsGrouped } from "../../logic/rowHandler";
import { Catalog } from "../../types";

interface HeaderProps {
  order_details: IOrderDetailsGrouped;
  totalQty: number;
  store: Catalog;
}

const getFirstName = (fullName: string) => {
  const nameWords = fullName.split(" ");
  if (nameWords.length > 2) return `${nameWords[0]} ${nameWords[1]}`;
  return fullName;
};

export const Header = ({ order_details, totalQty, store }: HeaderProps) => {
  return (
    <div className="border-b border-black border-dashed mb-2">
      <h2 className="text-lg font-semibold">
        <span>{order_details.name}</span>
        &nbsp;|&nbsp;
        <span>{order_details.datetime}</span>
      </h2>
      {order_details.page === 1 && (
        <div className="uppercase">
          <div
            className="w-1/2 inline-block pr-2"
            style={{ height: `${HEADER_HEIGHT}px` }}
          >
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="text-right font-semibold">Digitador: </td>
                  <td>{getFirstName(order_details.username)}</td>
                </tr>
                <tr>
                  <td className="text-right font-semibold">Almacenero(s):</td>
                  <td className="border-b border-black"></td>
                </tr>
                <tr>
                  <td className="text-right font-semibold">Inicio: </td>
                  <td>
                    &nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;
                  </td>
                </tr>
                <tr>
                  <td className="text-right font-semibold">Fin: </td>
                  <td>
                    &nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            className="w-1/2 inline-block pl-2"
            style={{ height: `${HEADER_HEIGHT}px` }}
          >
            <table>
              <tbody>
                <tr>
                  <td colSpan={2} className="leading-[14px] break-all">
                    {order_details.partner_name}
                  </td>
                </tr>
                <tr>
                  <td className="w-[150px] text-right font-semibold">
                    Factura:
                  </td>
                  <td>{order_details.partner_ref}</td>
                </tr>
                <tr>
                  <td className="w-[150px] text-right font-semibold">
                    Cantidad Total:
                  </td>
                  <td>{totalQty}</td>
                </tr>
                <tr>
                  <td className="w-[150px] text-right font-semibold">
                    Destino:
                  </td>
                  <td>{store.name}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
