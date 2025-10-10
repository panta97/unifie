import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Product } from '../types/Product';

interface ProductTableProps {
    products: Product[];
    selectedProducts: number[];
    allCurrentPageSelected: boolean;
    totalSelected: number;
    totalProducts: number;
    onToggleSelectAll: () => void;
    onToggleSelect: (id: number) => void;
    onUpdateDiscount: (id: number, discount: string) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalCount: number;
    startIndex: number;
    endIndex: number;
    onSelectAllProducts: () => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
    products,
    selectedProducts,
    totalSelected,
    totalProducts,
    onToggleSelectAll,
    onToggleSelect,
    onUpdateDiscount,
    currentPage,
    totalPages,
    onPageChange,
    totalCount,
    startIndex,
    endIndex,
    onSelectAllProducts
}) => {
    const calculateFinalPrice = (price: number, discount: number): string => {
        return (price - (price * discount / 100)).toFixed(2);
    };

    const getPageNumbers = (): (number | string)[] => {
        const pages: (number | string)[] = [];
        const showPages = 5;

        if (totalPages <= showPages + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= showPages; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - (showPages - 1); i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const currentPageIds = products.map(p => p.id);
    const allCurrentPageSelected = currentPageIds.length > 0 &&
        currentPageIds.every(id => selectedProducts.includes(id));
    const someButNotAllSelected = totalSelected > 0 && totalSelected < totalProducts;
    const showSelectAllBanner = allCurrentPageSelected && someButNotAllSelected;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {showSelectAllBanner && (
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-900">
                            {totalSelected} {totalSelected === 1 ? 'producto seleccionado' : 'productos seleccionados'}
                        </p>
                        <button
                            onClick={onSelectAllProducts}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                            Seleccionar todos los {totalProducts} productos
                        </button>
                    </div>
                </div>
            )}

            {totalSelected === totalProducts && totalProducts > 0 && (
                <div className="bg-green-50 border-b border-green-200 px-6 py-3">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium text-green-900">
                            ✓ Todos los {totalProducts} productos están seleccionados
                        </p>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-left">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={allCurrentPageSelected}
                                        onChange={onToggleSelectAll}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                        title={`Seleccionar ${products.length} productos de esta página`}
                                    />
                                    {totalSelected > 0 && (
                                        <span className="text-xs font-medium text-blue-600">
                                            ({totalSelected})
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Referencia
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Descripción
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Precio Base
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Descuento %
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Precio Final
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {products.map((product) => (
                            <tr
                                key={product.id}
                                className={`hover:bg-slate-50 transition-colors ${selectedProducts.includes(product.id) ? 'bg-blue-50' : ''
                                    }`}
                            >
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.includes(product.id)}
                                        onChange={() => onToggleSelect(product.id)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {product.reference}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-slate-900 font-medium">{product.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-slate-500">{product.category}</p>
                                        {product.attributes && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <p className="text-xs text-purple-600 font-medium">{product.attributes}</p>
                                            </>
                                        )}
                                        {product.variantCount && product.variantCount > 1 && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-xs text-green-600 font-medium">
                                                    {product.variantCount} variantes
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-semibold text-slate-900">
                                        S/ {product.currentPrice.toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={product.discount}
                                            onChange={(e) => onUpdateDiscount(product.id, e.target.value)}
                                            className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                        <span className="text-slate-600 text-sm">%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-green-600">
                                            S/ {calculateFinalPrice(product.currentPrice, product.discount)}
                                        </span>
                                        {product.discount > 0 && (
                                            <span className="text-xs text-slate-500">
                                                Ahorro: S/ {(product.currentPrice * product.discount / 100).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-slate-600 text-center sm:text-left">
                        Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                        <span className="font-medium">{Math.min(endIndex, totalCount)}</span> de{' '}
                        <span className="font-medium">{totalCount}</span> productos
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1}
                            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Primera página"
                        >
                            <ChevronsLeft size={18} className="text-slate-700" />
                        </button>

                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Anterior"
                        >
                            <ChevronLeft size={18} className="text-slate-700" />
                        </button>

                        <div className="hidden sm:flex gap-1">
                            {getPageNumbers().map((page, index) => (
                                <React.Fragment key={index}>
                                    {page === '...' ? (
                                        <span className="px-3 py-2 text-slate-500">...</span>
                                    ) : (
                                        <button
                                            onClick={() => onPageChange(page as number)}
                                            className={`min-w-[40px] px-3 py-2 rounded-lg transition-colors text-sm font-medium ${currentPage === page
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="flex sm:hidden items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">
                                {currentPage} / {totalPages}
                            </span>
                        </div>

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Siguiente"
                        >
                            <ChevronRight size={18} className="text-slate-700" />
                        </button>

                        <button
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Última página"
                        >
                            <ChevronsRight size={18} className="text-slate-700" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductTable;