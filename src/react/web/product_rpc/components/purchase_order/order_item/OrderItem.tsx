import { Wrapper } from "../../shared/Wrapper";
import { AddButton } from "./AddButton";
import { OrderItemSearch } from "./search/OrderItemSearch";
import { OrderItemTable } from "./OrderItemTable";

export const OrderItem = () => {
  return (
    <Wrapper>
      <OrderItemSearch />
      <OrderItemTable />
      <AddButton />
    </Wrapper>
  );
};
