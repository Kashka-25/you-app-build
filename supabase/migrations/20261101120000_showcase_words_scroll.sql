-- Featured words can carry their own image from YOUrigin (Cassidy, Nov 1),
-- and the artist chooses whether YOU shows the words on the painted scroll
-- (easier to read over a busy image) or straight on the image.
--
-- words_scroll is how the piece is shown, not what it is, so changing it
-- doesn't send the piece back for review (showcase_works_guard only watches
-- the content columns). A new image does, through image_path as before.
-- Words pieces could already hold an image_path; nothing else changes.

alter table public.showcase_works
  add column if not exists words_scroll boolean not null default true;

comment on column public.showcase_works.words_scroll is
  'Words pieces with an image: true shows the words on YOU''s scroll over the image, false straight on the image.';
