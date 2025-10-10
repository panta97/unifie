export interface Product {
    id: number;
    product_tmpl_id?: number;
    reference: string;
    description: string;
    currentPrice: number;
    discount: number;
    category: string;
    attributes?: string;
    variantCount?: number;
}

export interface PriceList {
    id: number;
    name: string;
    currency: string;
}