import React from 'react';
import { useAppSelector } from "../../app/hooks";

export const DiscountInvoices = () => {
  const discountInvoices = useAppSelector((root) => root.pos.discounts);

  return (
    <div>
      <table className="border-collapse border border-black">
        <thead>
          <tr>
            <th className="px-2 border-collapse border border-black">
              FACTURA
            </th>
            <th className="px-2 border-collapse border border-black">
              PRODUCTO
            </th>
            <th className="px-2 border-collapse border border-black">
              DESCUENTO
            </th>
          </tr>
        </thead>
        <tbody>
          {discountInvoices.map((discount, index) => (
            <tr key={index}>
              <td className="px-2 border-collapse border border-black text-right underline">
                <a
                  href={discount.odooLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {discount.invoiceNumber}
                </a>
              </td>
              <td className="px-2 border-collapse border border-black text-right">
                {discount.productDesc}
              </td>
              <td className="px-2 border-collapse border border-black text-right">
                {discount.discount.toFixed(2)} %
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
