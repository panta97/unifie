import React from "react";
import { Wrapper } from "../shared/Wrapper";
import { InvoiceSearch } from "./InvoiceSearch";
import { RefundLine } from "./RefundLine";

const Credit = () => {
  return (
    <Wrapper>
      <div className="w-[620px] mx-auto">
        <div className="flex justify-between">
          <InvoiceSearch />
          <RefundLine />
        </div>
      </div>
    </Wrapper>
  );
};

export default Credit;
