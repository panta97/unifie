import React from 'react';
import { AddButton } from "./AddButton";
import { AttributeTable } from "./AttributeTable";
import { DefaultCodeTable } from "./DefaultCodeTable";
import { CategoryLineField } from "./fields/CategoryLineField";
import { CategoryFamilyField } from "./fields/CategoryFamilyField";
import { CategoryBrandField } from "./fields/CategoryBrandField";
import { CategoryLastField } from "./fields/CategoryLastField";
import { NameField } from "./fields/NameField";
import { PosCategoryField } from "./fields/PosCategoryField";
import { PriceField } from "./fields/PriceField";
import { DefaultCodeField } from "./fields/DefaultCodeField";
import { Wrapper } from "../../shared/Wrapper";
import { ListPriceTable } from "./ListPriceTable";
import { WeightField } from './fields/WeightField';

export const PPForm = () => {
  return (
    <Wrapper>
      <div>
        <div className="mb-1">
          <NameField />
        </div>
        <div className="mb-2">
          <CategoryLineField />
          <CategoryFamilyField />
          <CategoryBrandField />
          <CategoryLastField />
          <PosCategoryField />
          <PriceField />
          <DefaultCodeField />
          <WeightField/>
        </div>
        <div className="mb-2">
          <AttributeTable />
        </div>
        <div className="text-xs mb-2">
          <DefaultCodeTable />
        </div>
        <div className="text-xs mb-2">
          <ListPriceTable />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <AddButton />
      </div>
    </Wrapper>
  );
};
