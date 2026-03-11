
-- Create storage bucket for chat file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-uploads', 'chat-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-uploads');

-- Allow anyone to read files (public bucket)
CREATE POLICY "Anyone can read chat uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-uploads');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
