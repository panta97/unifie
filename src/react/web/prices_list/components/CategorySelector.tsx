import React, { useState, useMemo } from 'react';
import { Tag, Search } from 'lucide-react';
import { Category } from '../types/Product';

interface CategorySelectorProps {
    categories: Category[];
    selectedCategory: Category | null;
    onSelect: (category: Category) => void;
    onSearch: () => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
    categories,
    selectedCategory,
    onSelect,
    onSearch
}) => {
    const [searchTerm, setSearchTerm] = useState<string>('');

    const filteredCategories = useMemo(() => {
        if (!searchTerm.trim()) {
            return [];
        }
        return categories.filter(cat =>
            cat.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [categories, searchTerm]);

    const handleSelectCategory = (category: Category) => {
        onSelect(category);
        setSearchTerm('');
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && selectedCategory) {
            onSearch();
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Tag className="text-purple-600" size={24} />
                <h2 className="text-lg font-bold text-slate-900">Buscar por Categoría</h2>
            </div>

            <p className="text-sm text-slate-600 mb-4">
                Busca y selecciona una categoría para aplicar descuentos a todos sus productos
            </p>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar categoría (ej: DAMA, HOMBRE, CALZADO...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                />
            </div>

            {searchTerm.trim() && (
                <div className="mb-4">
                    {filteredCategories.length > 0 ? (
                        <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                            <div className="p-2 bg-slate-50 border-b border-slate-200">
                                <p className="text-xs font-semibold text-slate-600 uppercase">
                                    {filteredCategories.length} {filteredCategories.length === 1 ? 'categoría encontrada' : 'categorías encontradas'}
                                </p>
                            </div>
                            {filteredCategories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleSelectCategory(category)}
                                    className={`w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-slate-100 last:border-b-0 ${selectedCategory?.id === category.id ? 'bg-purple-100 font-semibold' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Tag className="text-purple-600" size={16} />
                                        <span className="text-sm text-slate-900">{category.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="border border-slate-200 rounded-lg p-6 text-center">
                            <p className="text-sm text-slate-500">
                                No se encontraron categorías con "{searchTerm}"
                            </p>
                        </div>
                    )}
                </div>
            )}

            {selectedCategory && (
                <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-purple-700 uppercase mb-1">
                                Categoría seleccionada
                            </p>
                            <div className="flex items-center gap-2">
                                <Tag className="text-purple-600" size={18} />
                                <p className="text-sm font-bold text-purple-900">
                                    {selectedCategory.name}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                onSelect(null as any);
                                setSearchTerm('');
                            }}
                            className="text-purple-600 hover:text-purple-800 text-sm font-semibold"
                        >
                            Cambiar
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={onSearch}
                disabled={!selectedCategory}
                className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
                {selectedCategory
                    ? `Buscar Productos en "${selectedCategory.name}"`
                    : 'Selecciona una categoría primero'
                }
            </button>
        </div>
    );
};

export default CategorySelector;