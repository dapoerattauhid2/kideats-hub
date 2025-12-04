import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChefHat, Plus, Edit, Trash2, Search, ImagePlus } from 'lucide-react';
import { MenuItem } from '@/types';

export default function AdminMenuPage() {
  const { menuItems } = useApp();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [localMenuItems, setLocalMenuItems] = useState(menuItems);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    isAvailable: true,
  });

  const categories = [...new Set(localMenuItems.map(item => item.category))];

  const filteredItems = localMenuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: 'Error',
        description: 'Semua field wajib harus diisi',
        variant: 'destructive',
      });
      return;
    }
    
    const newItem: MenuItem = {
      id: `menu-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      price: parseInt(formData.price),
      category: formData.category,
      image: formData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      isAvailable: formData.isAvailable,
    };
    
    setLocalMenuItems(prev => [...prev, newItem]);
    toast({
      title: 'Menu Ditambahkan',
      description: `${formData.name} berhasil ditambahkan ke daftar menu`,
    });
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleUpdate = () => {
    if (!editingItem) return;
    
    setLocalMenuItems(prev => prev.map(item =>
      item.id === editingItem.id
        ? {
            ...item,
            name: formData.name,
            description: formData.description,
            price: parseInt(formData.price),
            category: formData.category,
            image: formData.image,
            isAvailable: formData.isAvailable,
          }
        : item
    ));
    
    toast({
      title: 'Menu Diperbarui',
      description: `${formData.name} berhasil diperbarui`,
    });
    resetForm();
    setEditingItem(null);
  };

  const handleDelete = (id: string, name: string) => {
    setLocalMenuItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: 'Menu Dihapus',
      description: `${name} berhasil dihapus dari daftar menu`,
    });
  };

  const handleToggleAvailability = (id: string) => {
    setLocalMenuItems(prev => prev.map(item =>
      item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
    ));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image: '',
      isAvailable: true,
    });
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image: item.image,
      isAvailable: item.isAvailable,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Kelola Menu</h1>
          <p className="text-muted-foreground mt-1">Tambah, edit, atau hapus menu makanan</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={resetForm}>
              <Plus className="w-5 h-5 mr-2" />
              Tambah Menu
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tambah Menu Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi menu yang akan ditambahkan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Menu</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Nasi Goreng Spesial"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Deskripsi singkat menu"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga (Rp)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="25000"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Makanan Utama">Makanan Utama</SelectItem>
                      <SelectItem value="Minuman">Minuman</SelectItem>
                      <SelectItem value="Snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">URL Gambar</Label>
                <div className="flex gap-2">
                  <Input
                    id="image"
                    placeholder="https://..."
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  />
                  <Button variant="outline" size="icon">
                    <ImagePlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="available">Tersedia</Label>
                <Switch
                  id="available"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAdd}>Tambah Menu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Cari menu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Menu Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className={!item.isAvailable ? 'opacity-60' : ''}>
            <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              {!item.isAvailable && (
                <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                  <Badge variant="destructive">Tidak Tersedia</Badge>
                </div>
              )}
              <Badge className="absolute top-3 left-3" variant="secondary">
                {item.category}
              </Badge>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-1">{item.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {item.description}
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-primary">
                  Rp {item.price.toLocaleString('id-ID')}
                </span>
                <Switch
                  checked={item.isAvailable}
                  onCheckedChange={() => handleToggleAvailability(item.id)}
                />
              </div>
              <div className="flex gap-2">
                <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => {
                  if (!open) setEditingItem(null);
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(item)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Edit Menu</DialogTitle>
                      <DialogDescription>
                        Perbarui informasi menu
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Nama Menu</Label>
                        <Input
                          id="edit-name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-description">Deskripsi</Label>
                        <Textarea
                          id="edit-description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-price">Harga (Rp)</Label>
                          <Input
                            id="edit-price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-category">Kategori</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Makanan Utama">Makanan Utama</SelectItem>
                              <SelectItem value="Minuman">Minuman</SelectItem>
                              <SelectItem value="Snack">Snack</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-image">URL Gambar</Label>
                        <Input
                          id="edit-image"
                          value={formData.image}
                          onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditingItem(null)}>
                        Batal
                      </Button>
                      <Button onClick={handleUpdate}>Simpan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(item.id, item.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Menu tidak ditemukan</h3>
          <p className="text-muted-foreground">
            Coba ubah kata kunci pencarian
          </p>
        </div>
      )}
    </div>
  );
}
