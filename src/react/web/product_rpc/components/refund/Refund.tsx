import React, { useState } from "react";
import { Wrapper } from "../shared/Wrapper";
import { InvoiceSearch } from "./InvoiceSearch";
import { InvoiceTicketPrint } from "./InvoiceTicketPrint";
import { RefundLine } from "./RefundLine";

const Refund = () => {
  const [isPaying, setIsPaying] = useState(false);

  return (
    <Wrapper>
      <div className="w-[620px] mx-auto">
        <div className="flex justify-between">
          <InvoiceSearch isPaying={isPaying} setIsPaying={setIsPaying} />
          <RefundLine isPaying={isPaying} />
        </div>
      </div>
      <InvoiceTicketPrint />
    </Wrapper>
  );
};

export default Refund;
