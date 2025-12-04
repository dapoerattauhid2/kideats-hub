import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  BarChart3,
  TrendingUp,
  Download,
  DollarSign,
  ShoppingBag,
  Users,
} from 'lucide-react';

export default function AdminReportsPage() {
  const { orders } = useApp();
  const [period, setPeriod] = useState('week');

  const paidOrders = orders.filter(o => o.status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalOrders = paidOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate menu statistics
  const menuStats: Record<string, { count: number, revenue: number }> = {};
  paidOrders.forEach(order => {
    order.items.forEach(item => {
      if (!menuStats[item.menuItemName]) {
        menuStats[item.menuItemName] = { count: 0, revenue: 0 };
      }
      menuStats[item.menuItemName].count += item.quantity;
      menuStats[item.menuItemName].revenue += item.price * item.quantity;
    });
  });

  const sortedMenuStats = Object.entries(menuStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  // Daily breakdown for the last 7 days
  const dailyStats = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayOrders = paidOrders.filter(o => 
      new Date(o.createdAt).toDateString() === date.toDateString()
    );
    return {
      date,
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + o.totalPrice, 0),
    };
  });

  const maxRevenue = Math.max(...dailyStats.map(d => d.revenue), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Laporan</h1>
          <p className="text-muted-foreground mt-1">Analisis performa penjualan</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="week">Minggu Ini</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-5 h-5 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-success/10 flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">Total Pendapatan</p>
            <p className="text-xl lg:text-2xl font-bold text-foreground">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Total Order</p>
            <p className="text-xl lg:text-2xl font-bold text-foreground">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-secondary" />
            </div>
            <p className="text-sm text-muted-foreground">Rata-rata Order</p>
            <p className="text-xl lg:text-2xl font-bold text-foreground">
              Rp {averageOrderValue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 lg:w-6 lg:h-6 text-warning" />
            </div>
            <p className="text-sm text-muted-foreground">Pending Order</p>
            <p className="text-xl lg:text-2xl font-bold text-foreground">
              {orders.filter(o => o.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              Pendapatan 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dailyStats.map((day, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 text-sm text-muted-foreground">
                    {format(day.date, 'EEE', { locale: id })}
                  </div>
                  <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="h-full gradient-secondary rounded-lg transition-all duration-500"
                      style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <div className="w-28 text-right text-sm font-medium">
                    Rp {day.revenue.toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Menu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Menu Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedMenuStats.length > 0 ? (
              <div className="space-y-4">
                {sortedMenuStats.map(([name, stats], index) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-sm text-muted-foreground">
                          {stats.count} porsi terjual
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-success">
                      Rp {stats.revenue.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Belum ada data penjualan</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
