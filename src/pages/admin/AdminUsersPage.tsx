import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, Mail, ShoppingBag, Key, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock users data
const mockUsers = [
  {
    id: '1',
    name: 'Budi Santoso',
    email: 'budi@email.com',
    phone: '081234567890',
    recipientCount: 2,
    orderCount: 15,
    totalSpent: 450000,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Siti Rahayu',
    email: 'siti@email.com',
    phone: '081234567891',
    recipientCount: 1,
    orderCount: 8,
    totalSpent: 240000,
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'Ahmad Wijaya',
    email: 'ahmad@email.com',
    phone: '081234567892',
    recipientCount: 3,
    orderCount: 22,
    totalSpent: 660000,
    createdAt: new Date('2024-01-05'),
  },
  {
    id: '4',
    name: 'Dewi Lestari',
    email: 'dewi@email.com',
    phone: '081234567893',
    recipientCount: 1,
    orderCount: 5,
    totalSpent: 150000,
    createdAt: new Date('2024-03-10'),
  },
];

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleResetPassword = (userName: string) => {
    toast({
      title: 'Reset Password',
      description: `Link reset password telah dikirim ke ${userName}`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Daftar User</h1>
        <p className="text-muted-foreground mt-1">Kelola semua pengguna terdaftar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total User</p>
                <p className="text-2xl font-bold">{mockUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Order</p>
                <p className="text-2xl font-bold">
                  {mockUsers.reduce((sum, u) => sum + u.orderCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Cari user..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">User</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Kontak</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Penerima</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Order</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Total Belanja</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-bold text-primary">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Bergabung {user.createdAt.toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {user.email}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{user.phone}</p>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="secondary">{user.recipientCount} anak</Badge>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium">{user.orderCount}</span> order
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-primary">
                        Rp {user.totalSpent.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleResetPassword(user.name)}>
                            <Key className="w-4 h-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">User tidak ditemukan</h3>
              <p className="text-muted-foreground">
                Coba ubah kata kunci pencarian
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
