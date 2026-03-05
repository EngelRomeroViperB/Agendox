-- ============================================
-- Agendox — Storage Setup
-- Ejecutar en Supabase SQL Editor
-- ============================================
-- ANTES de ejecutar este SQL, crear el bucket manualmente:
-- 1. Ve a Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Nombre: "agendox"
-- 4. Marcar "Public bucket" = ON
-- 5. Click "Create bucket"
-- Luego ejecuta este SQL:

-- Permitir lectura pública de todos los archivos del bucket
CREATE POLICY "public_read_agendox" ON storage.objects
  FOR SELECT USING (bucket_id = 'agendox');

-- Permitir upload a usuarios autenticados
CREATE POLICY "auth_upload_agendox" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agendox' AND auth.role() = 'authenticated'
  );

-- Permitir update a usuarios autenticados (reemplazar imagen)
CREATE POLICY "auth_update_agendox" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'agendox' AND auth.role() = 'authenticated'
  );

-- Permitir delete a usuarios autenticados
CREATE POLICY "auth_delete_agendox" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'agendox' AND auth.role() = 'authenticated'
  );
