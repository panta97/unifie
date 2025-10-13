import { Product, PriceList, Category } from '../types/Product';

const API_BASE_URL = '/api/prices-list';

function getCookie(name: string): string | null {
    let cookieValue: string | null = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function getCSRFToken(): string {
    return getCookie('csrftoken') || '';
}

export const priceListApi = {
    async getPriceLists(): Promise<PriceList[]> {
        const response = await fetch(`${API_BASE_URL}/pricelists/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Error al obtener listas de precios');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error desconocido');
        }

        return data.data;
    },

    async searchProducts(reference: string): Promise<Product[]> {
        const response = await fetch(`${API_BASE_URL}/products/search/?reference=${encodeURIComponent(reference)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Error al buscar productos');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error desconocido');
        }

        return data.data;
    },

    async getCategories(): Promise<Category[]> {
        const response = await fetch(`${API_BASE_URL}/categories/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Error al obtener categorías');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error desconocido');
        }

        return data.data;
    },

    async searchProductsByCategory(categoryId: number): Promise<Product[]> {
        const response = await fetch(
            `${API_BASE_URL}/products/by-category/?category_id=${categoryId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            }
        );

        if (!response.ok) {
            throw new Error('Error al buscar productos por categoría');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error desconocido');
        }

        return data.data;
    },

    async saveToPriceList(
        pricelistId: number,
        products: Product[],
        applyMode: 'product' | 'variant' | 'category' = 'product',
        onProgress?: (current: number, total: number) => void
    ): Promise<{ created: number; updated: number; total: number }> {
        const productsWithDiscount = products.filter(p => p.discount > 0);

        if (productsWithDiscount.length === 0) {
            throw new Error('No hay productos con descuento');
        }

        const csrfToken = getCSRFToken();

        const batchSize = 10;
        const totalBatches = Math.ceil(productsWithDiscount.length / batchSize);

        let totalCreated = 0;
        let totalUpdated = 0;

        for (let i = 0; i < productsWithDiscount.length; i += batchSize) {
            const batch = productsWithDiscount.slice(i, i + batchSize);
            const currentBatch = Math.floor(i / batchSize) + 1;

            if (onProgress) {
                onProgress(currentBatch, totalBatches);
            }

            const response = await fetch(`${API_BASE_URL}/save/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                credentials: 'include',
                body: JSON.stringify({
                    pricelistId,
                    products: batch,
                    applyMode,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error en lote ${currentBatch}/${totalBatches}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Error desconocido');
            }

            totalCreated += data.created || 0;
            totalUpdated += data.updated || 0;
        }

        return {
            created: totalCreated,
            updated: totalUpdated,
            total: productsWithDiscount.length
        };
    },
};