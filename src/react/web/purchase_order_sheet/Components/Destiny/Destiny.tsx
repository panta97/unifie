import { stores } from "../../logic/stores";
import { Catalog } from "../../types";

interface DestinyProps {
  store: Catalog;
  updateStore: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const Destiny = ({ store, updateStore }: DestinyProps) => {
  return (
    <div className="no-print px-12 mx-8 mt-2">
      <div className="font-mono">
        <label>DESTINO: </label>
        <select className="uppercase" value={store.id} onChange={updateStore}>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
