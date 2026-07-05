export interface User {
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'customer';
  phone: string;
  createdAt: string;
}

export interface Store {
  storeId: string;
  ownerId: string;
  storeName: string;
  address: string;
  paymentUpiId: string;
  subscriptionStatus: 'active' | 'expired' | 'none';
  createdAt: string;
}

export interface Product {
  productId: string;
  storeId: string;
  ownerId: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  stockQty: number;
  taxPercent: number;
  discountPercent: number;
  imageUrl: string;
  qrCodeValue: string;
  qrCodeUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface QrCode {
  qrId: string;
  productId: string;
  storeId: string;
  qrValue: string;
  qrImageUrl: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface Cart {
  cartId: string;
  customerId: string;
  storeId: string;
  status: 'active' | 'completed';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  cartItemId: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  lineTotal: number;
  // Included populated helper fields for the UI
  productName?: string;
  productSku?: string;
  productImage?: string;
}

export interface Order {
  orderId: string;
  cartId: string;
  customerId: string;
  storeId: string;
  ownerId: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'success' | 'failed';
  orderStatus: 'completed' | 'cancelled';
  createdAt: string;
}

export interface OrderItem {
  orderItemId: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  lineTotal: number;
  productName?: string;
}

export interface Payment {
  paymentId: string;
  orderId: string;
  customerId: string;
  storeId: string;
  ownerId: string;
  paymentMethod: string;
  transactionId: string;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  paidAt: string;
}

export interface Subscription {
  subscriptionId: string;
  ownerId: string;
  planName: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'none';
  autoRenew: boolean;
}

export interface StoreSettings {
  storeId: string;
  lowStockThreshold: number;
  currency: string;
  businessGstNo?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
}
