// src/types.ts

// --- ORDER PAGE TYPES ---
export interface Item {
  id: string; 
  name: string;
}

export interface OrderItem {
  id: number; 
  itemId: string; 
  name: string;
  qty: number;
}

export interface NewOrderPayload {
  salesperson: string;
  salespersonPassword: string;
  companyName: string;
  companyNumber: string;
  currentDate: string;
  deliveryDate: string;
  deliveryLocation: string;
  items: {
    itemId: string;
    qty: number;
  }[];
}

export interface ConfirmedOrder {
  orderId: string;
  salesperson: string;
  companyName: string;
  companyNumber: string;
  currentDate: string;
  deliveryDate: string;
  deliveryLocation: string;
  items: { 
    id: string; 
    name: string; 
    qty: number;
  }[];
}

// --- COMPANY TYPES ---
export interface Company {
  id: string; 
  name: string;
  number: string;
  location: string;
}

export interface NewCompanyPayload {
  name: string;
  number: string;
  location: string;
}

// --- SALESPERSON TYPES ---
export interface Salesperson {
  id: string;
  name: string;
}

export interface NewSalespersonPayload {
  name: string;
  password: string;
}

// --- AUTH TYPES ---
export interface LoginPayload {
  email: string;
  password?: string;
}

export interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  logo?: string;
  role?: string;
  token: string;
}

// --- ORDER FORM (INVOICE) TYPES ---
export interface IAddedItem {
  id: number;
  no: number;
  name: string;
  qty: string;
  units: string;
  originalUnits: string;
}

export interface IRecentOrderForm {
  _id: string;
  formId: string; // Renamed from invoiceId
  companyName: string;
  formDate: string; // Renamed from invoiceDate
  items: IAddedItem[];
  createdAt: string;
}