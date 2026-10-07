export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  imageUrl?: string;
  description?: string;
  dietary?: 'veg' | 'non-veg';
  isPopular?: boolean;
}

export type OrderStatus = 'New' | 'Preparing' | 'Ready' | 'Served' | 'Cancelled';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialRequest?: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: number;
}
