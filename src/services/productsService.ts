import api from './api';

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  resellerPrice?: number;
  inPersonalCatalog?: boolean;
  image: string;
  inventory: number;
  stock: number;
  status: string;
  category: string | null;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProducts {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const fetchMasterCatalog = async (params: Record<string, any> = {}): Promise<PaginatedProducts> => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const fetchPersonalCatalog = async (params: Record<string, any> = {}): Promise<PaginatedProducts> => {
  const response = await api.get('/products/personal', { params });
  return response.data;
};

export const togglePersonalCatalogItem = async (productId: string): Promise<{ added: boolean }> => {
  const response = await api.post('/products/personal/toggle', { productId });
  return response.data;
};
