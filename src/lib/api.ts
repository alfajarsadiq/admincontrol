// File: src/lib/api.ts (Consolidated and Corrected)

import axios from 'axios';
import { toast } from 'sonner';
// NOTE: Assuming these types are defined in '@/types'
import {
  NewOrderPayload,
  ConfirmedOrder,
  Company,
  NewCompanyPayload,
  Salesperson,
  LoginPayload,
  AdminProfile,
  NewSalespersonPayload,
  User, 
  NewUserPayload, 
  // 🔥 NEW IMPORT: ReportRecord type
  ReportRecord, 
} from '@/types'; 

export interface Product {
    _id: string;
    name: string;
    defaultUnits: string;
    createdAt?: string;
}

// Type definitions from recent updates
export interface UpdateOrderPayload {
    salespersonName: string; 
    salespersonPassword: string; 
    updatedItems: { itemId: string; qty: number }[];
    companyName?: string;
    deliveryDate?: string;
}

export interface OrderStatusDetails {
    orderId: string;
    companyName: string;
    salesperson: string;
    createdAt: string; 
    deliveryDate: string;
    status: string;
}

interface ConfirmationPayload {
    orderId: string;
    salesperson: string;
    password: string;
}

interface DispatchConfirmationPayload extends ConfirmationPayload {
    driverName: string;
    vehicleName: string;
}

interface ConfirmationResponse {
    msg: string;
    orderId: string;
    status: string;
}

export interface DispatchConfirmationResponse extends ConfirmationResponse {
    driverName: string;
    vehicleName: string;
    dispatchedAt: Date;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔥 FIX: Request Interceptor to add the auth token to every request
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

// 🔥 FIX: Response Interceptor to handle 401 (Unauthorized) errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      
      // Check for specific password error from backend (do not redirect for this)
      if (error.response.data?.msg?.includes('Invalid password')) {
        return Promise.reject(new Error(error.response.data.msg)); 
      }
      
      // Global 401 handling: Clear token and redirect to login
      const msg = error.response.data?.msg || "Session expired. Please log in again.";
      toast.error(msg);
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminProfile');
      
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
      }
    } else if (error.response && error.response.data?.msg) {
        // Catch other errors (400, 500) with a custom message
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

// --- USERS ---
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

// NEW FUNCTION: Update Order
export const updateOrder = async ({ orderId, payload }: { orderId: string; payload: UpdateOrderPayload }): Promise<{ msg: string; order: ConfirmedOrder }> => {
    const { data } = await api.patch(`/orders/${orderId}`, payload);
    return data;
};

// NEW FUNCTION: Fetch Order Status
export const fetchOrderStatus = async (orderId: string): Promise<OrderStatusDetails> => {
    const { data } = await api.get(`/orders/status/${orderId}`);
    return data;
};

// NEW FUNCTION: Confirm Delivery (PUT /api/orders/confirm-delivery)
export const confirmDelivery = async (payload: ConfirmationPayload): Promise<ConfirmationResponse> => {
    const { data } = await api.put(`/orders/confirm-delivery`, payload);
    return data;
};

// NEW FUNCTION: Confirm Dispatch (PUT /api/orders/confirm-dispatch)
export const confirmDispatch = async (payload: DispatchConfirmationPayload): Promise<DispatchConfirmationResponse> => {
    const { data } = await api.put(`/orders/confirm-dispatch`, payload);
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
    data: { password }
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

// NEW FUNCTION: Fetch delivery locations by date
export const fetchDeliveryLocationsByDate = async (date: string): Promise<string[]> => {
  const { data } = await api.get('/orders/locations/by-date', {
    params: { date },
  });
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

// UPDATED FUNCTION: Now accepts 'date' AND 'location'
export const downloadOrdersByDate = async (date: string, location: string): Promise<Blob> => {
  try {
    const response = await api.get('/orders/download/by-date', {
      params: { date, location }, 
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

// 🔥 NEW FUNCTION: Download Orders by Status
export const downloadOrdersByStatus = async (status: string): Promise<Blob> => {
  try {
    const response = await api.get('/orders/export', {
      params: { status },
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
      // Handle server-side error messages returned as JSON
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

// 🔥 NEW FUNCTION: Trigger Manual Report Generation (POST /api/reports/send-manual)
export const sendManualReport = async (startDate: string, endDate: string): Promise<{ message: string; recordId: string }> => {
    try {
        const { data } = await api.post('/reports/send-manual', { startDate, endDate });
        return data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            // Re-throw with the specific 403 error message from the backend (authMiddleware)
            if (error.response.status === 403) {
                 // Ensure the response message is extracted if available
                 const serverMsg = error.response.data?.msg || "Error: Not authorized. Please log in as an administrator.";
                 throw new Error(serverMsg);
            }
             // Re-throw the original server message
             throw new Error(error.response.data?.msg || `Request failed with status code ${error.response.status}`);
        }
        throw new Error("An unexpected error occurred.");
    }
};

// 🔥 NEW FUNCTION: Fetch Report History (GET /api/reports/history)
export const fetchReportHistory = async (): Promise<ReportRecord[]> => {
    const { data } = await api.get('/reports/history');
    return data;
};

export default api;
