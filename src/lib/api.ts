// File: src/lib/api.ts (Updated)

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
  IRecentOrderForm,
  User, 
  NewUserPayload, 
  OrderItem, // Import OrderItem to use in UpdatePayload
} from '@/types'; 

export interface Product {
    _id: string;
    name: string;
    defaultUnits: string;
    createdAt?: string;
}

// 🔥 NEW TYPE DEFINITION: Payload for Order Update
export interface UpdateOrderPayload {
    salespersonName: string; // Used to find and authenticate the salesperson
    salespersonPassword: string; // Password for verification
    updatedItems: { itemId: string; qty: number }[]; // Array of product IDs and quantities
    companyName?: string;
    deliveryDate?: string;
}

// 櫨 NEW TYPE DEFINITION for Order Status
export interface OrderStatusDetails {
    orderId: string;
    companyName: string;
    salesperson: string;
    createdAt: string; // Order Date
    deliveryDate: string;
    status: string;
}

// 櫨 NEW TYPE FOR DELIVERY CONFIRMATION PAYLOAD
interface DeliveryConfirmationPayload {
    orderId: string;
    salesperson: string;
    password: string;
}

// 櫨 NEW TYPE FOR DELIVERY CONFIRMATION RESPONSE
interface DeliveryConfirmationResponse {
    msg: string;
    orderId: string;
    status: string;
}

// Use the VITE environment variable for the base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the auth token to every request
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

// Interceptor to handle 401 (Unauthorized) errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle auth errors
    if (error.response && error.response.status === 401) {
      
      // Check for specific password error from backend
      if (error.response.data?.msg?.includes('Invalid password')) {
        // We reject the error with a plain Error object so tanstack-query catches it
        // and we can show a specific toast in the mutation's onError handler.
        return Promise.reject(new Error(error.response.data.msg)); 
      }
      
      const msg = error.response.data?.msg || "Session expired. Please log in again.";
      toast.error(msg);
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminProfile');
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
      }
    } else if (error.response && error.response.status === 403) {
        const msg = error.response.data?.msg || "You are not authorized to perform this action."; // Use error.response.data.msg if available
        toast.error(msg);
        return Promise.reject(new Error(msg));
    } else if (error.response && error.response.data?.msg) {
        // This catches general 400/500 errors with a custom message
        return Promise.reject(new Error(error.response.data.msg));
    }
    return Promise.reject(error);
  }
);

// --- AUTH ---
export const loginAdmin = async (loginData: LoginPayload): Promise<AdminProfile> => {
  const { data } = await api.post('/auth/login', loginData);
  return data;
};

// --- USERS (NEW) ---
export const fetchUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/users');
  return data;
};

export const createUser = async (payload: NewUserPayload): Promise<User> => {
  const { data } = await api.post('/users', payload);
  return data;
};

export const deleteUser = async (userId: string): Promise<{ message: string }> => {
  const { data } = await api.delete(`/users/${userId}`);
  return data;
};

export const updateUser = async (userId: string, payload: Partial<NewUserPayload>): Promise<User> => {
  const { data } = await api.put(`/users/${userId}`, payload);
  return data;
};

// --- PRODUCTS ---
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

// --- ORDERS ---
export const saveOrder = async (orderData: NewOrderPayload): Promise<ConfirmedOrder> => {
  const { data } = await api.post('/orders', orderData);
  return data;
};

export const fetchRecentOrders = async (): Promise<ConfirmedOrder[]> => {
  const { data } = await api.get('/orders');
  return data;
};

export const deleteOrder = async (orderId: string): Promise<{ msg: string }> => {
  const { data } = await api.delete(`/orders/${orderId}`);
  return data;
};

// 🔥 NEW FUNCTION: Update Order
export const updateOrder = async ({ orderId, payload }: { orderId: string; payload: UpdateOrderPayload }): Promise<{ msg: string; order: ConfirmedOrder }> => {
    const { data } = await api.patch(`/orders/${orderId}`, payload);
    return data;
};

// 櫨 NEW FUNCTION: Fetch Order Status
export const fetchOrderStatus = async (orderId: string): Promise<OrderStatusDetails> => {
    const { data } = await api.get(`/orders/status/${orderId}`);
    return data;
};

// 櫨 NEW FUNCTION: Confirm Delivery (PUT /api/orders/confirm-delivery)
export const confirmDelivery = async (payload: DeliveryConfirmationPayload): Promise<DeliveryConfirmationResponse> => {
    const { data } = await api.put(`/orders/confirm-delivery`, payload);
    return data;
};


// --- COMPANIES ---
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

// --- SALESPERSONS ---
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

// --- LR FORMS ---
export const deleteLr = async (lrId: string, password: string): Promise<{ message: string }> => {
  const { data } = await api.delete(`/lrs/${lrId}`, {
    data: { password } // Send password in the request body
  });
  return data;
};

// --- ORDER FORMS (INVOICES) ---
export const deleteOrderForm = async (formId: string): Promise<{ message: string }> => {
  const { data } = await api.delete(`/invoices/${formId}`);
  return data;
};

// --- DOWNLOADS ---
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
    // Check if the server returned a JSON error instead of a file
    if (blob.type === 'application/json') {
      const errorText = await blob.text();
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.message || 'Failed to download file.');
    }
    return blob;
  } catch (error) {
    // Handle network or other errors
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
    // Check for JSON error
    if (blob.type === 'application/json') {
      const errorText = await blob.text();
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.message || 'Failed to download file.');
    }
    return blob;
  } catch (error) {
    // Handle network or other errors
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

export default api;
