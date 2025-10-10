import React from 'react';
import { Package, Layers } from 'lucide-react';

interface ViewModeSelectorProps {
    mode: 'product' | 'variant';
    onChange: (mode: 'product' | 'variant') => void;
}

const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({ mode, onChange }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Modo de Visualización</h3>
                    <p className="text-sm text-slate-600">
                        Elige cómo aplicar los descuentos: a nivel de producto o por cada variante
                    </p>
                </div>

                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => onChange('product')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-md transition-all font-medium text-sm ${mode === 'product'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <Package size={18} />
                        Por Producto
                    </button>
                    <button
                        onClick={() => onChange('variant')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-md transition-all font-medium text-sm ${mode === 'variant'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        <Layers size={18} />
                        Por Variante
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
        </div>
    );
};

export default ViewModeSelector;