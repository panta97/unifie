export interface Product {
    id: number;
    product_tmpl_id?: number;
    reference: string;
    description: string;
    currentPrice: number;
    discount: number;
    category: string;
    category_id?: number;
    attributes?: string;
    variantCount?: number;
}

export interface PriceList {
    id: number;
    name: string;
    currency: string;
}

export interface Category {
    id: number;
    name: string;
}