TRAVEL WITH ZURA - Hebrew website

Preview
Open index.html in a browser. No installation, server or build is required.
The website uses local files and works without an internet connection, except
for WhatsApp actions.

Content
The Hebrew biography and winter routes are based on AboutMySelf.txt and
Trip_Route_Information.txt. Destination names come from Destinations.txt.
The text files are source material, not live data feeds: changing them alone
does not update the website. Edit the corresponding sections in index.html.
Languages: Hebrew, Russian and Georgian, confirmed by the owner.
Hebrew text uses a consistent system sans-serif font (Segoe UI, then Arial),
without external font requests.

Contact
The public number is +995 591 62 55 00.
site-data.js provides whatsappLink to build WhatsApp links with an optional
per-tour message. app.js applies these links in one pass.
When changing the number, update site-data.js and the fallback links in
index.html so contact also works without JavaScript.
WhatsApp links open a draft; they do not automatically send a message.

Reviews
No reviews or ratings have been invented. To publish genuine, approved
reviews, add objects to the reviews array in site-data.js:
{ name: "Public author name", text: "Actual review", trip: "Optional trip" }
The empty-state message disappears when reviews are added.
There is no online submission form or database.

Media
Original photos, business images and videos are preserved.
assets contains resized JPEGs for faster browsing; full-size photos are linked
from the gallery. All 73 supplied photos and 11 videos are included.
Photo and video filenames use the shared mediaFiles helper in site-data.js.
Keep the groups in filename order so photo IDs match the optimized assets.
Gallery photos have no visible captions; descriptions remain as accessible
image text and full-size link labels.
The Borjomi card uses a forest-riding photo as an activity illustration.
The Diamond Bridge card explicitly labels its canyon photo as illustrative.
Confirm permission to publish identifiable people and media before going live.
Videos only download when the visitor chooses to play them.

Publishing
Upload index.html, styles.css, site-data.js, app.js, favicon.svg,
assets, Photos and Videos together, preserving their names.
No hosting or domain has been configured. Review prices, inclusions, seasonal
availability and media permissions with the guide before public launch.
Add absolute social-sharing image and canonical URLs after choosing a domain.

Checks
Run: node --check app.js
Run: node --test site.test.cjs
