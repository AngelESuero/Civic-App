-- Storage policies for issue images
create policy "Public can read issue images"
  on storage.objects for select
  using (bucket_id = 'issue-images');

create policy "Verified users can upload issue images"
  on storage.objects for insert
  with check (
    bucket_id = 'issue-images'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.verification_tier in ('light', 'strong')
    )
  );

create policy "Users can delete their images"
  on storage.objects for delete
  using (bucket_id = 'issue-images' and owner = auth.uid());
