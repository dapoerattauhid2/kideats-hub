-- Insert dummy menu items
INSERT INTO public.menu_items (name, description, price, category, image_url, is_available) 
VALUES
('Nasi Goreng Spesial', 'Nasi goreng dengan telur, ayam, dan sayuran segar', 25000, 'Makanan Utama', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', true),
('Mie Goreng Ayam', 'Mie goreng dengan potongan ayam dan sayuran', 22000, 'Makanan Utama', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400', true),
('Ayam Geprek', 'Ayam crispy dengan sambal geprek dan nasi', 28000, 'Makanan Utama', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400', true),
('Soto Ayam', 'Soto ayam dengan kuah bening dan pelengkap', 20000, 'Makanan Utama', 'https://images.unsplash.com/photo-1547928576-b822bc410e94?w=400', true),
('Ikan Bakar', 'Ikan bakar dengan bumbu khas dan nasi', 30000, 'Makanan Utama', 'https://images.unsplash.com/photo-1580822261290-991b38693d1b?w=400', true),
('Lumpia Goreng', 'Lumpia goreng renyah dengan isian daging dan sayuran', 15000, 'Makanan Utama', 'https://images.unsplash.com/photo-1609501676725-7186f017a4b5?w=400', true),
('Es Teh Manis', 'Teh manis dingin segar', 5000, 'Minuman', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', true),
('Jus Jeruk', 'Jus jeruk segar tanpa pengawet', 10000, 'Minuman', 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', true),
('Jus Mangga', 'Jus mangga manis dan segar', 12000, 'Minuman', 'https://images.unsplash.com/photo-1590080876-453ef2d98b9e?w=400', true),
('Air Mineral Botol', 'Air mineral minum premium 600ml', 3000, 'Minuman', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400', true),
('Pisang Goreng', 'Pisang goreng renyah dengan toping keju', 12000, 'Snack', 'https://images.unsplash.com/photo-1600326145308-d1f1cdd4e1af?w=400', true),
('Roti Bakar Coklat', 'Roti bakar dengan selai coklat premium', 15000, 'Snack', 'https://images.unsplash.com/photo-1484723091739-30a097e8f3d0?w=400', true),
('Perkedel', 'Perkedel goreng gurih', 10000, 'Snack', 'https://images.unsplash.com/photo-1599021497335-d14c5c9e0537?w=400', true),
('Bakso Goreng', 'Bakso goreng dengan saus kental', 18000, 'Snack', 'https://images.unsplash.com/photo-1609874405698-ce64434a84d2?w=400', true),
('Tahu Goreng', 'Tahu goreng dengan saus kacang', 12000, 'Snack', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', true),
('Telur Gulung', 'Telur gulung dengan isian sayuran', 14000, 'Snack', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', true),
('Brownis Coklat', 'Brownis coklat lezat homemade', 20000, 'Snack', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400', true),
('Donat Glaze', 'Donat empuk dengan topping glaze manis', 8000, 'Snack', 'https://images.unsplash.com/photo-1585059075925-c7f43348be38?w=400', true)
ON CONFLICT DO NOTHING;

-- Get menu item IDs for creating test cart items
WITH menu_data AS (
  SELECT id FROM public.menu_items ORDER BY created_at LIMIT 1
)
-- Note: Cart items will be created when users add items through the app
-- This ensures data integrity with user authentication
SELECT 'Dummy menu items inserted successfully' as result;
