import React from 'react';
import { Search, Percent } from 'lucide-react';

interface SearchBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedCount: number;
    onBulkDiscount: () => void;
    onSearch?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    searchTerm,
    onSearchChange,
    selectedCount,
    onBulkDiscount,
    onSearch
}) => {
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch();
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por referencia o descripción..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    {onSearch && (
                        <button
                            onClick={onSearch}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors"
                        >
                            Buscar en Odoo
                        </button>
                    )}
                </div>
                <button
                    onClick={onBulkDiscount}
                    disabled={selectedCount === 0}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    <Percent size={20} />
                    Aplicar Descuento Masivo ({selectedCount})
                </button>
            </div>
        </div>
    );
};

export default SearchBar;