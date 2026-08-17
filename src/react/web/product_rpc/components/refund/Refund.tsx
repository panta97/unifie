import React, { useEffect, useState } from "react";
import { Wrapper } from "../shared/Wrapper";
import { InvoiceSearch } from "./InvoiceSearch";
import { InvoiceTicketPrint } from "./InvoiceTicketPrint";
import { CreditNoteTicketPrint } from "./CreditNoteTicketPrint";
import { RefundLine } from "./RefundLine";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectSelectedRefundForPrint,
  setSelectedRefundForPrint,
} from "../../app/slice/refund/invoiceSlice";

const Refund = () => {
  const [isPaying, setIsPaying] = useState(false);
  const selectedRefundForPrint = useAppSelector(selectSelectedRefundForPrint);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleAfterPrint = () => {
      dispatch(setSelectedRefundForPrint(null));
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [dispatch]);

  return (
    <Wrapper>
      <div className="w-[620px] mx-auto">
        <div className="flex justify-between">
          <InvoiceSearch isPaying={isPaying} setIsPaying={setIsPaying} />
          <RefundLine isPaying={isPaying} />
        </div>
      </div>
      {selectedRefundForPrint ? (
        <CreditNoteTicketPrint />
      ) : (
        <InvoiceTicketPrint />
      )}
    </Wrapper>
  );
};

export default Refund;
