import { Wrapper } from "../../shared/Wrapper";
import { CreateButton } from "./CreateButton";
import { Table } from "./Table";

export const PPList = () => {
  return (
    <Wrapper>
      <div className="text-xs mb-2">
        <Table />
      </div>
      <div className="flex justify-end pt-2">
        <CreateButton />
      </div>
    </Wrapper>
  );
};
