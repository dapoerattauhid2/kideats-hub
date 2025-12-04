import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useMidtrans } from '@/hooks/useMidtrans';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  History,
  CreditCard,
  Calendar,
  User,
  ChevronRight,
  Filter,
  ShoppingCart,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';

export default function OrdersPage() {
  const { orders, updateOrderStatus, loadOrders, addToCart, menuItems } = useApp();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isReady: isMidtransReady, pay } = useMidtrans();
  
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [isPayingMultiple, setIsPayingMultiple] = useState(false);

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  const pendingOrders = filteredOrders.filter(o => o.status === 'pending');

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    setSelectedOrders(prev =>
      checked ? [...prev, orderId] : prev.filter(id => id !== orderId)
    );
  };

  const handlePayOrder = async (order: Order) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Anda harus login terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    setPayingOrderId(order.id);

    try {
      // Create Midtrans transaction
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          order_id: order.id,
          gross_amount: order.totalPrice,
          customer_name: user.user_metadata?.full_name || user.email || 'Customer',
          customer_email: user.email || '',
          items: order.items.map(item => ({
            id: item.menuItemId,
            name: item.menuItemName,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      });

      if (paymentError) {
        console.error('Payment creation error:', paymentError);
        throw new Error('Gagal membuat transaksi pembayaran');
      }

      if (!paymentData?.token) {
        throw new Error('Token pembayaran tidak ditemukan');
      }

      // Open Midtrans Snap popup
      pay(paymentData.token, {
        onSuccess: async (result) => {
          console.log('Payment success:', result);
          toast({
            title: 'Pembayaran Berhasil',
            description: 'Pesanan Anda telah dibayar',
          });
          await loadOrders();
        },
        onPending: async (result) => {
          console.log('Payment pending:', result);
          toast({
            title: 'Menunggu Pembayaran',
            description: 'Silakan selesaikan pembayaran Anda',
          });
          await loadOrders();
        },
        onError: (result) => {
          console.error('Payment error:', result);
          toast({
            title: 'Pembayaran Gagal',
            description: 'Terjadi kesalahan saat memproses pembayaran',
            variant: 'destructive',
          });
        },
        onClose: () => {
          toast({
            title: 'Pembayaran Dibatalkan',
            description: 'Anda dapat melanjutkan pembayaran kapan saja',
          });
        },
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal memproses pembayaran',
        variant: 'destructive',
      });
    } finally {
      setPayingOrderId(null);
    }
  };

  const handlePayMultiple = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: 'Pilih Order',
        description: 'Pilih minimal satu order untuk dibayar',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Error',
        description: 'Anda harus login terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    setIsPayingMultiple(true);

    try {
      // Calculate total and collect all items
      const selectedOrderData = orders.filter(o => selectedOrders.includes(o.id));
      const totalAmount = selectedOrderData.reduce((sum, o) => sum + o.totalPrice, 0);
      const allItems = selectedOrderData.flatMap(o => o.items);
      
      // Create a batch order ID
      const batchOrderId = `BATCH-${Date.now()}`;

      // Create Midtrans transaction for batch payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          order_id: batchOrderId,
          gross_amount: totalAmount,
          customer_name: user.user_metadata?.full_name || user.email || 'Customer',
          customer_email: user.email || '',
          items: allItems.map(item => ({
            id: item.menuItemId,
            name: item.menuItemName,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      });

      if (paymentError) {
        console.error('Payment creation error:', paymentError);
        throw new Error('Gagal membuat transaksi pembayaran');
      }

      if (!paymentData?.token) {
        throw new Error('Token pembayaran tidak ditemukan');
      }

      // Open Midtrans Snap popup
      pay(paymentData.token, {
        onSuccess: async (result) => {
          console.log('Batch payment success:', result);
          // Update all selected orders to paid
          for (const orderId of selectedOrders) {
            await updateOrderStatus(orderId, 'paid');
          }
          toast({
            title: 'Pembayaran Berhasil',
            description: `${selectedOrders.length} pesanan berhasil dibayar`,
          });
          setSelectedOrders([]);
          await loadOrders();
        },
        onPending: async (result) => {
          console.log('Batch payment pending:', result);
          toast({
            title: 'Menunggu Pembayaran',
            description: 'Silakan selesaikan pembayaran Anda',
          });
        },
        onError: (result) => {
          console.error('Batch payment error:', result);
          toast({
            title: 'Pembayaran Gagal',
            description: 'Terjadi kesalahan saat memproses pembayaran',
            variant: 'destructive',
          });
        },
        onClose: () => {
          toast({
            title: 'Pembayaran Dibatalkan',
            description: 'Anda dapat melanjutkan pembayaran kapan saja',
          });
        },
      });
    } catch (error) {
      console.error('Batch payment error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal memproses pembayaran',
        variant: 'destructive',
      });
    } finally {
      setIsPayingMultiple(false);
    }
  };

  const handleReorder = (order: Order) => {
    order.items.forEach(item => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      if (menuItem) {
        addToCart(menuItem, item.quantity);
      }
    });
    toast({
      title: 'Item Ditambahkan',
      description: 'Item dari pesanan sebelumnya telah ditambahkan ke keranjang',
    });
    navigate('/dashboard/checkout');
  };

  const getStatusBadge = (status: OrderStatus) => {
    const variants: Record<OrderStatus, { variant: 'paid' | 'pending' | 'failed' | 'expired', label: string }> = {
      paid: { variant: 'paid', label: 'Lunas' },
      pending: { variant: 'pending', label: 'Pending' },
      failed: { variant: 'failed', label: 'Gagal' },
      expired: { variant: 'expired', label: 'Expired' },
    };
    return variants[status];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Riwayat Order</h1>
          <p className="text-muted-foreground mt-1">Kelola semua pesanan Anda</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
              <SelectItem value="failed">Gagal</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Payment */}
      {pendingOrders.length > 0 && (
        <Card variant="bordered" className="border-warning/50 bg-warning/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Bayar Beberapa Order Sekaligus</p>
              <p className="text-sm text-muted-foreground">
                Pilih order pending yang ingin dibayar bersamaan
              </p>
            </div>
            <Button
              variant="warning"
              onClick={handlePayMultiple}
              disabled={selectedOrders.length === 0 || isPayingMultiple || !isMidtransReady}
            >
              {isPayingMultiple ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Bayar {selectedOrders.length > 0 ? `(${selectedOrders.length})` : ''}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusBadge(order.status);
            const isPaying = payingOrderId === order.id;
            
            return (
              <Card key={order.id} variant="interactive">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-start gap-4">
                    {order.status === 'pending' && (
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">
                            {order.id.substring(0, 8)}...
                          </span>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          Rp {order.totalPrice.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{order.recipientName}</span>
                          {order.recipientClass !== 'N/A' && (
                            <span className="text-muted-foreground">({order.recipientClass})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {format(new Date(order.deliveryDate), 'EEEE, d MMMM yyyy', { locale: id })}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-4">
                        {order.items.map((item, index) => (
                          <span key={index} className="bg-muted px-2 py-1 rounded">
                            {item.menuItemName} x{item.quantity}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {order.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => handlePayOrder(order)}
                            disabled={isPaying || !isMidtransReady}
                          >
                            {isPaying ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Memproses...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 mr-1" />
                                Bayar Sekarang
                              </>
                            )}
                          </Button>
                        )}
                        {(order.status === 'expired' || order.status === 'failed') && (
                          <Button size="sm" variant="outline" onClick={() => handleReorder(order)}>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Pesan Ulang
                          </Button>
                        )}
                        <Link to={`/dashboard/orders/${order.id}`}>
                          <Button size="sm" variant="ghost">
                            Detail
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <History className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Belum Ada Pesanan</h3>
            <p className="text-muted-foreground text-center mb-6">
              {statusFilter === 'all'
                ? 'Anda belum memiliki pesanan apapun'
                : `Tidak ada pesanan dengan status ${statusFilter}`}
            </p>
            <Link to="/dashboard/menu">
              <Button variant="hero">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Mulai Pesan
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
