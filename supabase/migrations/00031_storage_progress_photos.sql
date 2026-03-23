-- Private bucket for progress photos; path layout: {user_id}/{filename}

INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "progress_photos_select_own" ON storage.objects;
DROP POLICY IF EXISTS "progress_photos_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "progress_photos_update_own" ON storage.objects;
DROP POLICY IF EXISTS "progress_photos_delete_own" ON storage.objects;

CREATE POLICY "progress_photos_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "progress_photos_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "progress_photos_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "progress_photos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );
