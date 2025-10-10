import React from 'react';
import { X } from 'lucide-react';

interface BulkDiscountModalProps {
    isOpen: boolean;
    selectedCount: number;
    bulkDiscount: string;
    onBulkDiscountChange: (value: string) => void;
    onApply: () => void;
    onClose: () => void;
}

const BulkDiscountModal: React.FC<BulkDiscountModalProps> = ({
    isOpen,
    selectedCount,
    bulkDiscount,
    onBulkDiscountChange,
    onApply,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Aplicar Descuento Masivo</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-sm text-slate-600 mb-4">
                        Se aplicará el descuento a {selectedCount} producto(s) seleccionado(s)
                    </p>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Porcentaje de descuento
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={bulkDiscount}
                            onChange={(e) => onBulkDiscountChange(e.target.value)}
                            placeholder="Ej: 20"
                            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <span className="text-2xl font-bold text-slate-600">%</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors font-medium text-slate-700"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onApply}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                    >
                        Aplicar Descuento
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkDiscountModal;