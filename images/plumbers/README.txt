Plumber profile photos go here.

THE CODE IS ALREADY WIRED UP — as of this update, buildPlumberCard() and
viewPlumberProfile() in js/script.js automatically show a real photo if
one exists at the path below, and automatically fall back to the plain
initials avatar if it doesn't (or fails to load). You don't need to
change any code — just add the image files with these exact names:

  thabo-mokoena.jpg
  kabelo-maseko.jpg
  sipho-nkosi.jpg
  mpho-baloyi.jpg
  lucky-makhubele.jpg
  thabang-molefe.jpg

Tips for the images themselves:
- Roughly square (e.g. 500x500px or similar) works best — they're
  displayed cropped to fill a fixed-size box (object-fit: cover), so an
  extreme rectangle will get cropped oddly.
- Keep each file under ~300-400KB so the site stays fast to load.
- .jpg is expected by the filenames above; if you use .png or .webp
  instead, update the extension in each plumber's imagePath — it's set
  in TWO places that must match: kasilink-backend's KasiLink.java
  (server-side, used if the frontend fetches live data) and
  kasilink-frontend's js/script.js FALLBACK_PLUMBERS array (used if the
  backend can't be reached).

Where these photos appear: anywhere a plumber card or profile is shown —
the homepage search results, the "Meet our plumbers" grid on
Products/Services, and the View Profile popup. There's nothing to add to
index.html itself; the homepage already renders whatever photo data it
gets back, the same as every other page.
