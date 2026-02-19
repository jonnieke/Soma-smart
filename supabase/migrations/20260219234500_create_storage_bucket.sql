-- Create a storage bucket for assignments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignments', 'assignments', true) ON CONFLICT (id) DO NOTHING;
-- Policy to allow authenticated users to upload to assignments bucket
CREATE POLICY "Authenticated users can upload assignments" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'assignments'
        AND auth.role() = 'authenticated'
    );
-- Policy to allow authenticated users to update their own assignments
CREATE POLICY "Users can update own assignments" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'assignments'
        AND auth.uid() = owner
    );
-- Policy to allow public read access to assignments (or restricted to authenticated)
-- For now, public read is easier for playback.
CREATE POLICY "Public read access for assignments" ON storage.objects FOR
SELECT USING (bucket_id = 'assignments');