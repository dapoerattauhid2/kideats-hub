import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  User,
  CreditCard,
  RefreshCw,
  Download,
  Clock,
  Package,
} from 'lucide-react';

export default function OrderDetailPage() {
  const { id: orderId } = useParams();
  const { orders, updateOrderStatus, menuItems, addToCart } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();

  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <h2 className="text-2xl font-bold mb-4">Pesanan Tidak Ditemukan</h2>
        <Link to="/dashboard/orders">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Riwayat Order
          </Button>
        </Link>
      </div>
    );
  }

  const handlePay = () => {
    setTimeout(() => {
      updateOrderStatus(order.id, 'paid');
      toast({
        title: 'Pembayaran Berhasil',
        description: 'Status pesanan telah diubah menjadi Lunas',
      });
    }, 1000);
  };

  const handleReorder = () => {
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

  const handleDownloadInvoice = () => {
    toast({
      title: 'Invoice Diunduh',
      description: 'File invoice sedang diproses',
    });
  };

  const getStatusConfig = (status: typeof order.status) => {
    const configs = {
      paid: { variant: 'paid' as const, label: 'Lunas', color: 'text-success' },
      pending: { variant: 'pending' as const, label: 'Menunggu Pembayaran', color: 'text-warning' },
      failed: { variant: 'failed' as const, label: 'Gagal', color: 'text-destructive' },
      expired: { variant: 'expired' as const, label: 'Expired', color: 'text-muted-foreground' },
    };
    return configs[status];
  };

  const statusConfig = getStatusConfig(order.status);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/orders')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-bold">{order.id}</h1>
            <Badge variant={statusConfig.variant} className="text-sm">
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Dibuat {format(new Date(order.createdAt), 'd MMMM yyyy, HH:mm', { locale: id })}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recipient & Date */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Penerima</p>
                  <p className="font-bold text-lg">{order.recipientName}</p>
                  <p className="text-sm text-muted-foreground">{order.recipientClass}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Penerimaan</p>
                  <p className="font-bold text-lg">
                    {format(new Date(order.deliveryDate), 'EEEE, d MMMM yyyy', { locale: id })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Daftar Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted"
                  >
                    <div>
                      <p className="font-semibold">{item.menuItemName}</p>
                      <p className="text-sm text-muted-foreground">
                        Rp {item.price.toLocaleString('id-ID')} x {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary & Actions */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>Rp {order.totalPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={statusConfig.color}>{statusConfig.label}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">Rp {order.totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                {order.status === 'pending' && (
                  <Button variant="hero" size="lg" className="w-full" onClick={handlePay}>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Bayar Sekarang
                  </Button>
                )}

                {(order.status === 'expired' || order.status === 'failed') && (
                  <Button variant="default" size="lg" className="w-full" onClick={handleReorder}>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Pesan Ulang
                  </Button>
                )}

                {order.status === 'paid' && (
                  <Button variant="outline" size="lg" className="w-full" onClick={handleDownloadInvoice}>
                    <Download className="w-5 h-5 mr-2" />
                    Download Invoice
                  </Button>
                )}
              </div>

              {order.status === 'pending' && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 text-warning text-sm">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>
                    Segera lakukan pembayaran sebelum pesanan expired
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
