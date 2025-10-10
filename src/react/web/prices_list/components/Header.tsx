import React from 'react';
import { Save } from 'lucide-react';
import { PriceList } from '../types/Product';

interface HeaderProps {
    selectedPriceList: PriceList | null;
    onSaveToOdoo: () => void;
}

const Header: React.FC<HeaderProps> = ({ selectedPriceList, onSaveToOdoo }) => {
    return (
        <header className="bg-white shadow-sm border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Sistema de Lista de Precios</h1>
                        <p className="text-sm text-slate-600 mt-1">Gestión de descuentos masivos</p>
                    </div>
                    <button
                        onClick={onSaveToOdoo}
                        disabled={!selectedPriceList}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        <span>Guardar</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;