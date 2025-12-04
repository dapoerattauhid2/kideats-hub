import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, Recipient, CartItem, Order, MenuItem, OrderStatus } from '@/types';

interface AppState {
  user: User | null;
  recipients: Recipient[];
  cart: CartItem[];
  orders: Order[];
  menuItems: MenuItem[];
}

interface AppContextType extends AppState {
  // Auth
  login: (user: User) => void;
  logout: () => void;
  
  // Recipients
  addRecipient: (recipient: Omit<Recipient, 'id' | 'userId' | 'createdAt'>) => void;
  updateRecipient: (id: string, data: Partial<Recipient>) => void;
  deleteRecipient: (id: string) => boolean;
  
  // Cart
  addToCart: (menuItem: MenuItem, quantity?: number) => void;
  updateCartQuantity: (menuItemId: string, quantity: number) => void;
  removeFromCart: (menuItemId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  
  // Orders
  createOrder: (recipientId: string, deliveryDate: Date) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getOrdersByStatus: (status: OrderStatus) => Order[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock menu items for demo
const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Nasi Goreng Spesial',
    description: 'Nasi goreng dengan telur, ayam, dan sayuran segar',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
    category: 'Makanan Utama',
    isAvailable: true,
  },
  {
    id: '2',
    name: 'Mie Goreng Ayam',
    description: 'Mie goreng dengan potongan ayam dan sayuran',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
    category: 'Makanan Utama',
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Ayam Geprek',
    description: 'Ayam crispy dengan sambal geprek dan nasi',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400',
    category: 'Makanan Utama',
    isAvailable: true,
  },
  {
    id: '4',
    name: 'Soto Ayam',
    description: 'Soto ayam dengan kuah bening dan pelengkap',
    price: 20000,
    image: 'https://images.unsplash.com/photo-1547928576-b822bc410e94?w=400',
    category: 'Makanan Utama',
    isAvailable: true,
  },
  {
    id: '5',
    name: 'Es Teh Manis',
    description: 'Teh manis dingin segar',
    price: 5000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    category: 'Minuman',
    isAvailable: true,
  },
  {
    id: '6',
    name: 'Jus Jeruk',
    description: 'Jus jeruk segar tanpa pengawet',
    price: 10000,
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400',
    category: 'Minuman',
    isAvailable: true,
  },
  {
    id: '7',
    name: 'Pisang Goreng',
    description: 'Pisang goreng renyah dengan toping keju',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1600326145308-d1f1cdd4e1af?w=400',
    category: 'Snack',
    isAvailable: true,
  },
  {
    id: '8',
    name: 'Roti Bakar Coklat',
    description: 'Roti bakar dengan selai coklat premium',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400',
    category: 'Snack',
    isAvailable: true,
  },
];

// Mock orders for demo
const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    userId: '1',
    recipientId: '1',
    recipientName: 'Ahmad Rizki',
    recipientClass: 'Kelas 3A',
    items: [
      { menuItemId: '1', menuItemName: 'Nasi Goreng Spesial', price: 25000, quantity: 1 },
      { menuItemId: '5', menuItemName: 'Es Teh Manis', price: 5000, quantity: 1 },
    ],
    totalPrice: 30000,
    deliveryDate: new Date(Date.now() + 86400000),
    status: 'paid',
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'ORD-002',
    userId: '1',
    recipientId: '2',
    recipientName: 'Siti Nurhaliza',
    recipientClass: 'Kelas 1B',
    items: [
      { menuItemId: '3', menuItemName: 'Ayam Geprek', price: 28000, quantity: 1 },
      { menuItemId: '6', menuItemName: 'Jus Jeruk', price: 10000, quantity: 1 },
    ],
    totalPrice: 38000,
    deliveryDate: new Date(Date.now() + 172800000),
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: '1', userId: '1', name: 'Ahmad Rizki', class: 'Kelas 3A', createdAt: new Date() },
    { id: '2', userId: '1', name: 'Siti Nurhaliza', class: 'Kelas 1B', createdAt: new Date() },
  ]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [menuItems] = useState<MenuItem[]>(mockMenuItems);

  const login = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCart([]);
  }, []);

  const addRecipient = useCallback((data: Omit<Recipient, 'id' | 'userId' | 'createdAt'>) => {
    const newRecipient: Recipient = {
      ...data,
      id: `rec-${Date.now()}`,
      userId: user?.id || '',
      createdAt: new Date(),
    };
    setRecipients(prev => [...prev, newRecipient]);
  }, [user]);

  const updateRecipient = useCallback((id: string, data: Partial<Recipient>) => {
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  }, []);

  const deleteRecipient = useCallback((id: string): boolean => {
    const hasOrders = orders.some(o => o.recipientId === id);
    if (hasOrders) return false;
    setRecipients(prev => prev.filter(r => r.id !== id));
    return true;
  }, [orders]);

  const addToCart = useCallback((menuItem: MenuItem, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { menuItem, quantity }];
    });
  }, []);

  const updateCartQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.menuItem.id !== menuItemId));
    } else {
      setCart(prev => prev.map(item =>
        item.menuItem.id === menuItemId ? { ...item, quantity } : item
      ));
    }
  }, []);

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart(prev => prev.filter(item => item.menuItem.id !== menuItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  const createOrder = useCallback((recipientId: string, deliveryDate: Date): Order => {
    const recipient = recipients.find(r => r.id === recipientId);
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      userId: user?.id || '',
      recipientId,
      recipientName: recipient?.name || '',
      recipientClass: recipient?.class || '',
      items: cart.map(item => ({
        menuItemId: item.menuItem.id,
        menuItemName: item.menuItem.name,
        price: item.menuItem.price,
        quantity: item.quantity,
      })),
      totalPrice: getCartTotal(),
      deliveryDate,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setOrders(prev => [...prev, newOrder]);
    clearCart();
    return newOrder;
  }, [user, recipients, cart, getCartTotal, clearCart]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status, updatedAt: new Date() } : o
    ));
  }, []);

  const getOrdersByStatus = useCallback((status: OrderStatus) => {
    return orders.filter(o => o.status === status);
  }, [orders]);

  return (
    <AppContext.Provider value={{
      user,
      recipients,
      cart,
      orders,
      menuItems,
      login,
      logout,
      addRecipient,
      updateRecipient,
      deleteRecipient,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      getCartTotal,
      createOrder,
      updateOrderStatus,
      getOrdersByStatus,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
