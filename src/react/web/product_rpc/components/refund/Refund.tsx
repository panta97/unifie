import React from "react";
import { Wrapper } from "../shared/Wrapper";
import { InvoiceSearch } from "./InvoiceSearch";
import { InvoiceTicketPrint } from "./InvoiceTicketPrint";
import { RefundLine } from "./RefundLine";

const Refund = () => {
  return (
    <Wrapper>
      <div className="w-[620px] mx-auto">
        <div className="flex justify-between">
          <InvoiceSearch />
          <RefundLine />
        </div>
      </div>
      <InvoiceTicketPrint />
    </Wrapper>
  );
};

export default Refund;
