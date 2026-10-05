-- Several photos per memory (a carousel), in the order the Seeker chose.
-- photo_paths holds every photo's storage path; photo_path stays as the
-- cover (the first photo), kept in step by the app, so everything that
-- shows a single photo keeps working unchanged.
alter table public.life_moments
  add column if not exists photo_paths text[] not null default '{}';

update public.life_moments
  set photo_paths = array[photo_path]
  where photo_path is not null and cardinality(photo_paths) = 0;

-- Memory photos are converted on the device to WebP (or JPEG) at most
-- 1600px before upload, so a few hundred KB each. The bucket now refuses
-- anything else: an unconverted camera original can't fill the storage.
update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array['image/webp', 'image/jpeg']
  where id = 'life-moments';
