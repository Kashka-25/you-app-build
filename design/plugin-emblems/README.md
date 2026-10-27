# Plugin emblems

Every optional extra (plugin) in YOU gets its own emblem in the house style,
so it sits with the side-menu emblems (Cassidy, Oct 27):

- a thin gold ring, open only behind the four-point gold star at the top,
  with a gold bead above the star and one below the ring;
- sage watercolour laurel sweeping up from the bottom on both sides, with
  gold buds at the tips;
- one soft, painted picture in the middle that says what the extra is for.

Files go in `web-next/public/images/icons/` as `<name>.png` (128px, menus and
lists) and `<name>@4x.png` (512px, headers and cards), and the plugin's entry
in `web-next/src/lib/plugins.js` names it with `icon: "<name>"`.

`projects-emblem.py` drew YOUr Projects (an open folder with a seedling).
Change the middle picture and reuse the ring, star and laurel for the next
one. Check it beside the others with a preview like
`projects-emblem-preview.png`, on light and dark, at 30px and 120px.
