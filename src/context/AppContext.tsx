import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, Recipient, CartItem, Order, MenuItem, OrderStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';

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
  addRecipient: (recipient: Omit<Recipient, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateRecipient: (id: string, data: Partial<Recipient>) => Promise<void>;
  deleteRecipient: (id: string) => Promise<boolean>;
  
  // Cart
  addToCart: (menuItem: MenuItem, quantity?: number) => Promise<void>;
  updateCartQuantity: (menuItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (menuItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  
  // Menu Items
  loadMenuItems: () => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, data: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  
  // Orders
  createOrder: (recipientId: string, deliveryDate: Date) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  loadOrders: () => Promise<void>;
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
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: Load menu items and setup auth listener
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get current auth session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || 'User',
            phone: session.user.user_metadata?.phone,
            role: 'parent',
            createdAt: new Date(session.user.created_at),
          });
          
          // Load user's cart and recipients
          await Promise.all([
            loadUserCart(session.user.id),
            loadUserRecipients(session.user.id),
            loadMenuItems(),
            loadUserOrders(session.user.id),
          ]);
        } else {
          // Load menu items without user context
          await loadMenuItems();
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 'User',
          phone: session.user.user_metadata?.phone,
          role: 'parent',
          createdAt: new Date(session.user.created_at),
        });
        await Promise.all([
          loadUserCart(session.user.id),
          loadUserRecipients(session.user.id),
          loadUserOrders(session.user.id),
        ]);
      } else {
        setUser(null);
        setCart([]);
        setRecipients([]);
        setOrders([]);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Load menu items from database
  const loadMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true);
      
      if (error) throw error;
      
      if (data) {
        setMenuItems(data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: Number(item.price),
          image: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
          category: item.category,
          isAvailable: item.is_available,
        })));
      }
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  // Load user's cart items
  const loadUserCart = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          menu_item_id,
          menu_items (
            id,
            name,
            description,
            price,
            image_url,
            category,
            is_available
          )
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      if (data) {
        const cartItems: CartItem[] = data.map((item: any) => ({
          menuItem: {
            id: item.menu_items.id,
            name: item.menu_items.name,
            description: item.menu_items.description || '',
            price: Number(item.menu_items.price),
            image: item.menu_items.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
            category: item.menu_items.category,
            isAvailable: item.menu_items.is_available,
          },
          quantity: item.quantity,
        }));
        setCart(cartItems);
      }
    } catch (error) {
      console.error('Failed to load user cart:', error);
    }
  };

  // Load user's recipients
  const loadUserRecipients = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('recipients')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      if (data) {
        setRecipients(data.map(item => ({
          id: item.id,
          userId: item.user_id,
          name: item.name,
          class: item.name, // Using name as class placeholder
          createdAt: new Date(item.created_at),
        })));
      }
    } catch (error) {
      console.error('Failed to load recipients:', error);
    }
  };

  // Load user's orders
  const loadUserOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          recipient_id,
          status,
          total_amount,
          delivery_date,
          created_at,
          updated_at,
          recipients (name),
          order_items (
            id,
            menu_item_id,
            quantity,
            unit_price,
            menu_items (name)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setOrders(data.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          recipientId: item.recipient_id,
          recipientName: item.recipients?.name || 'Unknown',
          recipientClass: 'N/A',
          items: item.order_items.map((oi: any) => ({
            menuItemId: oi.menu_item_id,
            menuItemName: oi.menu_items?.name || 'Unknown',
            price: Number(oi.unit_price),
            quantity: oi.quantity,
          })),
          totalPrice: Number(item.total_amount),
          deliveryDate: new Date(item.delivery_date),
          status: item.status as OrderStatus,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        })));
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const login = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCart([]);
    setRecipients([]);
    setOrders([]);
  }, []);

  const addRecipient = useCallback(async (data: Omit<Recipient, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data: newRecipient, error } = await supabase
        .from('recipients')
        .insert({
          user_id: user.id,
          name: data.name,
          phone: '',
          address: '',
          is_default: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (newRecipient) {
        setRecipients(prev => [...prev, {
          id: newRecipient.id,
          userId: newRecipient.user_id,
          name: newRecipient.name,
          class: newRecipient.name,
          createdAt: new Date(newRecipient.created_at),
        }]);
      }
    } catch (error) {
      console.error('Failed to add recipient:', error);
      throw error;
    }
  }, [user]);

  const updateRecipient = useCallback(async (id: string, data: Partial<Recipient>) => {
    try {
      const { error } = await supabase
        .from('recipients')
        .update({ name: data.name })
        .eq('id', id);
      
      if (error) throw error;
      
      setRecipients(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    } catch (error) {
      console.error('Failed to update recipient:', error);
      throw error;
    }
  }, []);

  const deleteRecipient = useCallback(async (id: string): Promise<boolean> => {
    const hasOrders = orders.some(o => o.recipientId === id);
    if (hasOrders) return false;
    
    try {
      const { error } = await supabase
        .from('recipients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setRecipients(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (error) {
      console.error('Failed to delete recipient:', error);
      return false;
    }
  }, [orders]);

  const addToCart = useCallback(async (menuItem: MenuItem, quantity = 1) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Check if item already in cart
      const existing = cart.find(item => item.menuItem.id === menuItem.id);
      
      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('user_id', user.id)
          .eq('menu_item_id', menuItem.id);
        
        if (error) throw error;
      } else {
        // Insert new cart item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            menu_item_id: menuItem.id,
            quantity,
          });
        
        if (error) throw error;
      }
      
      // Reload cart
      await loadUserCart(user.id);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  }, [user, cart]);

  const updateCartQuantity = useCallback(async (menuItemId: string, quantity: number) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      if (quantity <= 0) {
        // Delete item
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('menu_item_id', menuItemId);
        
        if (error) throw error;
      } else {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('user_id', user.id)
          .eq('menu_item_id', menuItemId);
        
        if (error) throw error;
      }
      
      // Reload cart
      await loadUserCart(user.id);
    } catch (error) {
      console.error('Failed to update cart quantity:', error);
      throw error;
    }
  }, [user]);

  const removeFromCart = useCallback(async (menuItemId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('menu_item_id', menuItemId);
      
      if (error) throw error;
      
      await loadUserCart(user.id);
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  }, [user]);

  const clearCart = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setCart([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  }, [user]);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  const addMenuItem = useCallback(async (item: Omit<MenuItem, 'id'>) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .insert({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image_url: item.image,
          is_available: item.isAvailable,
        });
      
      if (error) throw error;
      
      await loadMenuItems();
    } catch (error) {
      console.error('Failed to add menu item:', error);
      throw error;
    }
  }, []);

  const updateMenuItem = useCallback(async (id: string, data: Partial<MenuItem>) => {
    try {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.description) updateData.description = data.description;
      if (data.price) updateData.price = data.price;
      if (data.category) updateData.category = data.category;
      if (data.image) updateData.image_url = data.image;
      if (data.isAvailable !== undefined) updateData.is_available = data.isAvailable;
      
      const { error } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      await loadMenuItems();
    } catch (error) {
      console.error('Failed to update menu item:', error);
      throw error;
    }
  }, []);

  const deleteMenuItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await loadMenuItems();
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      throw error;
    }
  }, []);

  const createOrder = useCallback(async (recipientId: string, deliveryDate: Date): Promise<Order | null> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const recipient = recipients.find(r => r.id === recipientId);
      if (!recipient) throw new Error('Recipient not found');
      
      const cartTotal = getCartTotal();
      
      // Create order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          recipient_id: recipientId,
          status: 'pending',
          total_amount: cartTotal,
          delivery_date: deliveryDate.toISOString().split('T')[0],
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      for (const item of cart) {
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: newOrder.id,
            menu_item_id: item.menuItem.id,
            quantity: item.quantity,
            unit_price: item.menuItem.price,
            subtotal: item.menuItem.price * item.quantity,
          });
        
        if (itemError) throw itemError;
      }
      
      // Clear cart
      await clearCart();
      
      // Load orders
      await loadUserOrders(user.id);
      
      return {
        id: newOrder.id,
        userId: user.id,
        recipientId,
        recipientName: recipient.name,
        recipientClass: 'N/A',
        items: cart.map(item => ({
          menuItemId: item.menuItem.id,
          menuItemName: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
        })),
        totalPrice: cartTotal,
        deliveryDate,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to create order:', error);
      return null;
    }
  }, [user, recipients, cart, getCartTotal, clearCart]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      
      if (error) throw error;
      
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status, updatedAt: new Date() } : o
      ));
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  }, []);

  const getOrdersByStatus = useCallback((status: OrderStatus) => {
    return orders.filter(o => o.status === status);
  }, [orders]);

  const loadOrders = useCallback(async () => {
    if (user) {
      await loadUserOrders(user.id);
    }
  }, [user]);

  const value: AppContextType = {
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
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    createOrder,
    updateOrderStatus,
    getOrdersByStatus,
    loadMenuItems,
    loadOrders,
  };

  return (
    <AppContext.Provider value={value}>
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
