import React from 'react';
import { Catalog } from "../../types";

interface TypistProps {
  store: Catalog[];
  updateStore: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const Typist = ({ store, updateStore }: TypistProps) => {
  return (
    <div className="no-print px-12 mx-8 mt-2">
      <div className="font-mono">
        <label>DIGITADOR: </label>
        <select className="uppercase" onChange={updateStore}>
          {store.map((data) => (
            <option key={`typist-${data.id}`} value={data.id}>
              {data.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
