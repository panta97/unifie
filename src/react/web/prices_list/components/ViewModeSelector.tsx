import React from 'react';
import { Package, Layers, Tag } from 'lucide-react';

interface ViewModeSelectorProps {
    mode: 'product' | 'variant' | 'category';
    onChange: (mode: 'product' | 'variant' | 'category') => void;
}

const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({ mode, onChange }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">Modo de Visualización</h3>
                    <p className="text-xs sm:text-sm text-slate-600">
                        Elige cómo aplicar los descuentos: a nivel de producto o por cada variante
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row bg-slate-100 rounded-lg p-1 gap-1 sm:gap-0">
                    <button
                        onClick={() => onChange('product')}
                        className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-md transition-all font-medium text-xs sm:text-sm whitespace-nowrap ${mode === 'product'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <Package size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span>Por Producto</span>
                    </button>
                    <button
                        onClick={() => onChange('variant')}
                        className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-md transition-all font-medium text-xs sm:text-sm whitespace-nowrap ${mode === 'variant'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <Layers size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span>Por Variante</span>
                    </button>
                    <button
                        onClick={() => onChange('category')}
                        className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-md transition-all font-medium text-xs sm:text-sm whitespace-nowrap ${mode === 'category'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <Tag size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span>Por Categoría</span>
                    </button>
                </div>
            </div>

            {mode === 'product' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">Por Producto:</span> Se agrupan las variantes y el descuento se aplica a todas las variantes del producto.
                    </p>
                </div>
            )}

            {mode === 'variant' && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800">
                        <span className="font-semibold">Por Variante:</span> Cada variante se muestra individualmente con sus atributos y puedes aplicar descuentos específicos.
                    </p>
                </div>
            )}

            {mode === 'category' && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800">
                        <span className="font-semibold">Por Categoría:</span> Cada categoría será mostrado individualmente y categorizarlos por sus subcategorias.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ViewModeSelector;