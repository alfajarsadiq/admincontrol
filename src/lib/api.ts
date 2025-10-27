// File: src/lib/api.ts

import axios from 'axios';
import { toast } from 'sonner';
import {
  NewOrderPayload,
  ConfirmedOrder,
  Company,
  NewCompanyPayload,
  Salesperson,
  LoginPayload,
  AdminProfile,
  NewSalespersonPayload,
} from '@/types'; // These imports will now work

export interface Product {
    _id: string;
    name: string;
    defaultUnits: string;
    createdAt?: string;
}

// ... (api instance and interceptors are unchanged) ...
const api = axios.create({
  baseURL: 'http://192.168.70.163:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (error.response.data?.message === 'Password is incorrect') {
        return Promise.reject(error);
      }
      if (error.response.data?.message?.includes('authorized')) {
          return Promise.reject(error);
      }
      const msg = error.response.data?.msg || "Session expired. Please log in again.";
      toast.error(msg);
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminProfile');
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
      }
    } else if (error.response && error.response.status === 403) {
        const msg = error.response.data?.message || "You are not authorized to perform this action.";
        toast.error(msg);
        return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// ... (loginAdmin, fetchProducts, createProduct, deleteProduct are unchanged) ...
export const loginAdmin = async (loginData: LoginPayload): Promise<AdminProfile> => {
  const { data } = await api.post('/auth/login', loginData);
  return data;
};
export const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await api.get('/products');
  return data.map((item: any) => ({
    _id: item._id,
    name: item.name,
    defaultUnits: item.defaultUnits,
    createdAt: item.createdAt,
  }));
};
export const createProduct = async (name: string, defaultUnits: string): Promise<Product> => {
    const { data } = await api.post('/products', { name, defaultUnits });
    return data;
};
export const deleteProduct = async (productId: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/products/${productId}`);
    return data;
};

// ... (saveOrder, fetchRecentOrders, fetchCompanies, saveCompany, fetchSalespersons, createSalesperson, deleteSalesperson are unchanged) ...
export const saveOrder = async (orderData: NewOrderPayload): Promise<ConfirmedOrder> => {
  const { data } = await api.post('/orders', orderData);
  return data;
};
export const fetchRecentOrders = async (): Promise<ConfirmedOrder[]> => {
  const { data } = await api.get('/orders');
  return data;
};
export const fetchCompanies = async (): Promise<Company[]> => {
  const { data } = await api.get('/companies');
  return data.map((company: any) => ({
    id: company._id,
    name: company.name,
    number: company.number,
    location: company.location,
  }));
};
export const saveCompany = async (companyData: NewCompanyPayload): Promise<Company> => {
  const { data } = await api.post('/companies', companyData);
  return data;
};
export const fetchSalespersons = async (): Promise<Salesperson[]> => {
  const { data } = await api.get('/salespersons');
  return data.map((sp: any) => ({
    id: sp._id,
    name: sp.name,
  }));
};
export const createSalesperson = async (payload: NewSalespersonPayload): Promise<Salesperson> => {
  const { data } = await api.post('/salespersons', payload);
  return {
    id: data._id,
    name: data.name,
  };
};
export const deleteSalesperson = async (salespersonId: string): Promise<{ msg: string }> => {
  const { data } = await api.delete(`/salespersons/${salespersonId}`);
  return data;
};

// ... (fetchTodaysDeliveryLocations, downloadTodaysDeliveriesByLocation, downloadOrdersByDate, deleteOrder, deleteLr are unchanged) ...
export const fetchTodaysDeliveryLocations = async (): Promise<string[]> => {
  const { data } = await api.get('/orders/today/locations');
  return data;
};
export const downloadTodaysDeliveriesByLocation = async (location: string): Promise<Blob> => {
  try {
    const response = await api.get('/orders/download/today', {
      params: { location },
      responseType: 'blob',
    });
    const blob = response.data as Blob;
    if (blob.type === 'application/json') {
      const errorText = await blob.text();
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.message || 'Failed to download file.');
    }
    return blob;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.data?.type === 'application/json') {
        const errorText = await (error.response.data as Blob).text();
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message);
      }
      throw new Error(error.response.data?.message || 'Error downloading report');
    } else {
      throw error;
    }
  }
};
export const downloadOrdersByDate = async (date: string): Promise<Blob> => {
  try {
    const response = await api.get('/orders/download/by-date', {
      params: { date },
      responseType: 'blob',
    });
    const blob = response.data as Blob;
    if (blob.type === 'application/json') {
      const errorText = await blob.text();
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.message || 'Failed to download file.');
    }
    return blob;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.data?.type === 'application/json') {
        const errorText = await (error.response.data as Blob).text();
        const errorData = JSON.parse(errorText);
        console.error('Error downloading report (data):', errorData.message);
        throw new Error(errorData.message);
      }
      console.error('Error downloading report (response):', error.response.data);
      throw new Error(error.response.data?.message || 'Error downloading report');
    } else {
      console.error('Error downloading report (generic):', error);
      throw error;
    }
  }
};
export const deleteOrder = async (orderId: string): Promise<{ msg: string }> => {
  const { data } = await api.delete(`/orders/${orderId}`);
  return data;
};
export const deleteLr = async (lrId: string, password: string): Promise<{ message: string }> => {
  const { data } = await api.delete(`/lrs/${lrId}`, {
    data: { password }
  });
  return data;
};

// --- RENAMED FUNCTION ---
export const deleteOrderForm = async (formId: string): Promise<{ message: string }> => {
  // The API endpoint is still /invoices/, but the function name is clearer
  const { data } = await api.delete(`/invoices/${formId}`);
  return data;
};
// --- END RENAMED ---

export default api;