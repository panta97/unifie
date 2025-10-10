import React from 'react';
import { ChevronDown, Tag } from 'lucide-react';
import { PriceList } from '../types/Product';

interface PriceListSelectorProps {
    priceLists: PriceList[];
    selectedPriceList: PriceList | null;
    onSelect: (priceList: PriceList) => void;
}

const PriceListSelector: React.FC<PriceListSelectorProps> = ({
    priceLists,
    selectedPriceList,
    onSelect
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
                <Tag className="text-blue-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Lista de Precios (Destino)</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
                Selecciona la lista de precios de Odoo donde se aplicarán los descuentos
            </p>
            <div className="relative">
                <select
                    value={selectedPriceList?.id || ''}
                    onChange={(e) => {
                        const selected = priceLists.find(pl => pl.id === parseInt(e.target.value));
                        if (selected) onSelect(selected);
                    }}
                    className="w-full appearance-none px-4 py-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-slate-900 font-medium cursor-pointer"
                >
                    <option value="" disabled>Selecciona una lista de precios...</option>
                    {priceLists.map((priceList) => (
                        <option key={priceList.id} value={priceList.id}>
                            {priceList.name} ({priceList.currency})
                        </option>
                    ))}
                </select>
                <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={20}
                />
            </div>
            {selectedPriceList && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">Lista seleccionada:</span> {selectedPriceList.name}
                    </p>
                </div>
            )}
        </div>
    );
};

export default PriceListSelector;