import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Product, PriceList } from './types/Product';
import { priceListApi } from './services/priceListApi';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import PriceListSelector from './components/PriceListSelector';
import ViewModeSelector from './components/ViewModeSelector';
import SearchBar from './components/SearchBar';
import ProductTable from './components/ProductTable';
import BulkDiscountModal from './components/BulkDiscountModal';
import LoadingModal from './components/LoadingModal';

const App: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'product' | 'variant'>('product');
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [bulkDiscount, setBulkDiscount] = useState<string>('');
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    loadPriceLists();
  }, []);

  const loadPriceLists = async (): Promise<void> => {
    try {
      setLoading(true);
      setLoadingMessage('Cargando listas de precios...');
      setProgress(0);
      const lists = await priceListApi.getPriceLists();
      setPriceLists(lists);
      setError(null);
      toast.success('Listas de precios cargadas correctamente');
    } catch (err) {
      setError('Error al cargar las listas de precios');
      toast.error('Error al cargar las listas de precios');
      console.error(err);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleSearchProducts = async (): Promise<void> => {
    if (!searchTerm.trim()) {
      toast.error('Por favor ingresa un término de búsqueda');
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Buscando productos en Odoo...');
      setProgress(0);
      setError(null);

      const foundProducts = await priceListApi.searchProducts(searchTerm);

      if (foundProducts.length === 0) {
        toast.error(`No se encontraron productos con "${searchTerm}"`);
        setAllProducts([]);
        return;
      }

      setAllProducts(foundProducts);
      setCurrentPage(1);
      setSelectedProducts([]);

      toast.success(`Se encontraron ${foundProducts.length} productos`, {
        duration: 4000,
      });
    } catch (err) {
      toast.error('Error al buscar productos en Odoo');
      console.error(err);
      setAllProducts([]);
    } finally {
      setLoading(false);
      setLoadingMessage('');
      setProgress(0);
    }
  };

  const groupProductsByTemplate = (products: Product[]): Product[] => {
    const grouped = new Map<number, Product>();

    products.forEach(product => {
      const tmplId = product.product_tmpl_id;
      if (!tmplId) return;

      if (!grouped.has(tmplId)) {
        grouped.set(tmplId, {
          ...product,
          id: tmplId,
          variantCount: 1,
          attributes: undefined
        });
      } else {
        const existing = grouped.get(tmplId)!;
        existing.variantCount = (existing.variantCount || 0) + 1;
      }
    });

    return Array.from(grouped.values());
  };

  const products = viewMode === 'product'
    ? groupProductsByTemplate(allProducts)
    : allProducts;

  const filteredProducts = products.filter(product =>
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const toggleSelectAll = (): void => {
    const currentPageIds = currentProducts.map(p => p.id);

    const allCurrentSelected = currentPageIds.every(id =>
      selectedProducts.includes(id)
    );

    if (allCurrentSelected) {
      setSelectedProducts(prev =>
        prev.filter(id => !currentPageIds.includes(id))
      );
    } else {
      setSelectedProducts(prev => {
        const newSelection = [...prev];
        currentPageIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const selectAllProducts = (): void => {
    setSelectedProducts(filteredProducts.map(p => p.id));
    toast.success(`${filteredProducts.length} productos seleccionados`);
  };

  const toggleSelectProduct = (id: number): void => {
    setSelectedProducts((prev: number[]) =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const applyBulkDiscount = (): void => {
    const discount = parseFloat(bulkDiscount);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      toast.error('Por favor ingresa un descuento válido (0-100)');
      return;
    }

    if (viewMode === 'product') {
      setAllProducts((prev: Product[]) =>
        prev.map(product => {
          const isSelected = selectedProducts.some(selId =>
            product.product_tmpl_id === selId
          );
          return isSelected ? { ...product, discount } : product;
        })
      );
    } else {
      setAllProducts((prev: Product[]) =>
        prev.map(product =>
          selectedProducts.includes(product.id)
            ? { ...product, discount }
            : product
        )
      );
    }

    toast.success(`Descuento del ${discount}% aplicado a ${selectedProducts.length} productos`, {
      duration: 4000,
    });

    setShowBulkModal(false);
    setBulkDiscount('');
    setSelectedProducts([]);
  };

  const updateDiscount = (id: number, discount: string): void => {
    const discountValue = parseFloat(discount);
    if (isNaN(discountValue)) return;

    if (viewMode === 'product') {
      setAllProducts((prev: Product[]) =>
        prev.map(product =>
          product.product_tmpl_id === id
            ? { ...product, discount: discountValue }
            : product
        )
      );
    } else {
      setAllProducts((prev: Product[]) =>
        prev.map(product =>
          product.id === id ? { ...product, discount: discountValue } : product
        )
      );
    }
  };

  const handleSaveToOdoo = async (): Promise<void> => {
    if (!selectedPriceList) {
      toast.error('Por favor selecciona una lista de precios primero');
      return;
    }

    const productsWithDiscount = allProducts.filter(p => p.discount > 0);

    if (productsWithDiscount.length === 0) {
      toast.error('No hay productos con descuento para guardar');
      return;
    }

    try {
      setLoading(true);
      setProgress(0);
      setLoadingMessage(`Guardando ${productsWithDiscount.length} productos en Odoo...`);

      const result = await priceListApi.saveToPriceList(
        selectedPriceList.id,
        allProducts,
        viewMode,
        (current, total) => {
          const percentage = Math.round((current / total) * 100);
          setProgress(percentage);
          setLoadingMessage(
            `Guardando productos (Lote ${current} de ${total})`
          );
        }
      );

      setProgress(100);

      toast.success(
        (t) => (
          <div className="flex flex-col gap-2">
            <div className="font-bold text-lg">Guardado exitoso en "{selectedPriceList.name}"</div>
            <div className="text-sm space-y-1">
              <div>• Modo: {viewMode === 'product' ? 'Por Producto' : 'Por Variante'}</div>
              <div>• Productos creados: <span className="font-semibold text-white">{result.created}</span></div>
              <div>• Productos actualizados: <span className="font-semibold text-white">{result.updated}</span></div>
              <div>• Total procesados: <span className="font-semibold">{result.total}</span></div>
            </div>
          </div>
        ),
        {
          duration: 6000,
          style: {
            minWidth: '400px',
          },
        }
      );
      setError(null);
    } catch (err) {
      setError('Error al guardar en Odoo');
      console.error(err);
      alert('Error al guardar en Odoo. Verifica la consola para más detalles.');
    } finally {
      setLoading(false);
      setLoadingMessage('');
      setProgress(0);
    }
  };

  const allCurrentPageSelected = currentProducts.length > 0 &&
    currentProducts.every(p => selectedProducts.includes(p.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            padding: '16px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            style: {
              background: '#10b981',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
        }}
      />

      <LoadingModal
        isOpen={loading}
        message={loadingMessage}
        progress={progress}
      />

      <Header
        selectedPriceList={selectedPriceList}
        onSaveToOdoo={handleSaveToOdoo}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <StatsCards
          products={products}
          selectedCount={selectedProducts.length}
        />

        <PriceListSelector
          priceLists={priceLists}
          selectedPriceList={selectedPriceList}
          onSelect={setSelectedPriceList}
        />

        <ViewModeSelector
          mode={viewMode}
          onChange={setViewMode}
        />

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCount={selectedProducts.length}
          onBulkDiscount={() => setShowBulkModal(true)}
          onSearch={handleSearchProducts}
        />

        {allProducts.length === 0 && !loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-slate-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Busca productos en Odoo
            </h3>
            <p className="text-slate-600">
              Ingresa una referencia o descripción y presiona "Buscar en Odoo"
            </p>
          </div>
        )}

        {allProducts.length > 0 && (
          <ProductTable
            products={currentProducts}
            selectedProducts={selectedProducts}
            allCurrentPageSelected={allCurrentPageSelected}
            totalSelected={selectedProducts.length}
            totalProducts={filteredProducts.length}
            onToggleSelectAll={toggleSelectAll}
            onToggleSelect={toggleSelectProduct}
            onUpdateDiscount={updateDiscount}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalCount={filteredProducts.length}
            startIndex={indexOfFirstItem}
            endIndex={indexOfLastItem}
            onSelectAllProducts={selectAllProducts}
          />
        )}
      </main>

      <BulkDiscountModal
        isOpen={showBulkModal}
        selectedCount={selectedProducts.length}
        bulkDiscount={bulkDiscount}
        onBulkDiscountChange={setBulkDiscount}
        onApply={applyBulkDiscount}
        onClose={() => setShowBulkModal(false)}
      />
    </div>
  );
};

export default App;