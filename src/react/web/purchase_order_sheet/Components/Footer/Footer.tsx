import { IOrderDetailsGrouped } from "../../logic/rowHandler";

interface FooterProps {
  order_details: IOrderDetailsGrouped;
}

export const Footer = ({ order_details }: FooterProps) => {
  return (
    <div>
      Página {order_details.page} de {order_details.totalPages}
    </div>
  );
};
