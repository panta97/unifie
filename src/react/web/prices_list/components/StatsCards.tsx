import React from 'react';
import { Filter, Percent, Check } from 'lucide-react';
import { Product } from '../types/Product';

interface StatsCardsProps {
    products: Product[];
    selectedCount: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({ products, selectedCount }) => {
    const productsWithDiscount = products.filter(p => p.discount > 0).length;

    const averageDiscount = products.length > 0
        ? (products.reduce((acc, p) => acc + (p.discount || 0), 0) / products.length).toFixed(1)
        : '0.0';

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-600">Total Productos</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{products.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Filter className="text-blue-600" size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-600">Con Descuento</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{productsWithDiscount}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Percent className="text-green-600" size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-600">Seleccionados</p>
                        <p className="text-2xl font-bold text-purple-600 mt-1">{selectedCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Check className="text-purple-600" size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-600">Descuento Promedio</p>
                        <p className="text-2xl font-bold text-orange-600 mt-1">
                            {averageDiscount}%
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Percent className="text-orange-600" size={24} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsCards;