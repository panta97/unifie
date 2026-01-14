import React from "react";

interface EditOrderNameProps {
  orderName: string;
  orderId: number;
}

export const EditOrderName: React.FC<EditOrderNameProps> = ({
  orderName,
  orderId,
}) => {
  // Construir el link de Odoo
  const odooLink = `https://kdoshstore-dev-26661588.dev.odoo.com/web#id=${orderId}&model=purchase.order&view_type=form`;

  return (
    <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-blue-600 font-medium">Editando Orden</p>
          <p className="text-lg font-bold text-blue-900">{orderName}</p>
        </div>
        <a
          href={odooLink}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Ver en Odoo →
        </a>
      </div>
    </div>
  );
};
