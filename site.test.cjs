const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const data = require("./site-data.js");

test("WhatsApp uses international digits and preserves the Hebrew tour message", () => {
  const message = "שלום זורה, אשמח לטייל בקאחתי & קזבגי";
  const url = new URL(data.whatsappLink(data.phone, message));
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, "/995591625500");
  assert.equal(url.searchParams.get("text"), message);
  assert.ok(new URL(data.whatsappLink(data.phone)).searchParams.get("text"));
});

test("invalid contact details fail explicitly instead of producing broken links", () => {
  for (const phone of ["####", "", "591625500", "+000000000", "+995 invalid", "+1234567890123456", null]) {
    assert.throws(() => data.whatsappLink(phone));
  }
});

test("the gallery and video manifests preserve file order and cover every supplied file once", () => {
  const photos = fs.readdirSync(path.join(__dirname, "Photos")).filter((file) => /\.jpeg$/i.test(file));
  const videos = fs.readdirSync(path.join(__dirname, "Videos")).filter((file) => /\.mp4$/i.test(file));
  assert.deepEqual(data.originalPhotos, photos.sort());
  assert.deepEqual(data.videos, videos.sort());
  assert.equal(new Set(data.previewPhotos.map(({ id }) => id)).size, data.previewPhotos.length);
  data.previewPhotos.forEach(({ id }) => assert.ok(data.originalPhotos[id]));
  data.originalPhotos.forEach((_, id) => {
    assert.ok(fs.statSync(path.join(__dirname, "assets", `photo-${String(id).padStart(2, "0")}.jpg`)).size > 0);
  });
});

test("the Hebrew page has intact local assets, section links and no placeholder contact links", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  assert.match(html, /<html lang="he" dir="rtl">/);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), `Missing section ${id}`);
  for (const [, file] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (!/^(https?:|tel:)/.test(file)) assert.ok(fs.existsSync(path.join(__dirname, file)), `Missing ${file}`);
  }
  for (const [, url] of html.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)) {
    assert.equal(new URL(url).pathname, "/995591625500");
  }
});
