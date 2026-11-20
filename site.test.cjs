const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const data = require("./site-data.js");
const translations = require("./translations.js");

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
  assert.match(html, /<a\b[^>]*data-contact="review"[^>]*>/);
});

test("each language covers the page, media labels and its flag option", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const keys = new Set([...html.matchAll(/data-i18n(?:-(?:content|aria-label|alt|title|tour))?="([^"]+)"/g)]
    .map((match) => match[1]));
  const dynamicKeys = ["languageLabel", "whatsappGeneral", "whatsappTour", "whatsappReview", "galleryPhoto", "galleryOpen", "videoLabel", "videoFallback"];

  for (const language of ["en", "ka", "ru", "he"]) {
    assert.match(html, new RegExp(`<button[^>]*data-language="${language}"[^>]*>[^\\n]*<use href="#flag-${language}"`));
    for (const key of dynamicKeys) {
      assert.equal(typeof translations[language][key], "string", `${language}: ${key}`);
    }
    for (const [key, placeholder] of [["whatsappTour", "{tour}"], ["galleryPhoto", "{number}"], ["galleryOpen", "{caption}"], ["videoLabel", "{number}"]]) {
      assert.ok(translations[language][key].includes(placeholder), `${language}: ${key} needs ${placeholder}`);
    }
    if (language === "he") continue;
    for (const key of keys) {
      assert.ok(typeof translations[language][key] === "string" && translations[language][key].trim(), `${language}: ${key}`);
    }
    for (const { id } of data.previewPhotos) {
      assert.ok(translations[language].galleryCaptions[id], `${language}: photo ${id}`);
    }
  }
});

class MockElement {
  constructor(textContent = "") {
    this.textContent = textContent;
    this.attributes = new Map();
    this.dataset = {};
    this.children = [];
    this.listeners = {};
    this.style = {};
    this.hidden = false;
    this.open = false;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name.startsWith("data-")) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      this.dataset[key] = String(value);
    }
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  append(...children) {
    this.children.push(...children);
  }

  addEventListener(type, listener) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(listener);
  }

  dispatch(type, event = {}) {
    (this.listeners[type] || []).forEach((listener) => listener(event));
  }

  focus() {
    this.focused = true;
  }
}

function languageFixture(storage, siteData = data) {
  const targets = [];
  function target(marker, key, value, attribute) {
    const element = new MockElement(attribute ? "" : value);
    element.setAttribute(marker, key);
    if (attribute) element.setAttribute(attribute, value);
    targets.push(element);
    return element;
  }

  const navigation = target("data-i18n", "navAbout", "נעים להכיר");
  const title = target("data-i18n", "pageTitle", "TRAVEL WITH ZURA | גאורגיה בעברית");
  const meta = target("data-i18n-content", "pageTitle", "TRAVEL WITH ZURA | גאורגיה בעברית", "content");
  const image = target("data-i18n-alt", "heroImageAlt", "נוף בגאורגיה", "alt");
  const accessibilityLabel = target("data-i18n-aria-label", "accessibilityLabel", "אפשרויות נגישות", "aria-label");
  accessibilityLabel.setAttribute("data-i18n-title", "accessibilityLabel");
  accessibilityLabel.setAttribute("title", "אפשרויות נגישות");
  const tourLink = target("data-i18n-tour", "destination3Name", "סוואנתי", "data-tour");
  const contactLink = new MockElement();
  contactLink.setAttribute("data-contact", "whatsapp");
  const reviewLink = new MockElement();
  reviewLink.setAttribute("data-contact", "review");

  const summary = new MockElement();
  const flag = new MockElement();
  summary.querySelector = (selector) => selector === "use" ? flag : null;
  const current = new MockElement("עברית");
  const code = new MockElement("HE");
  const menu = new MockElement();
  const buttons = Object.fromEntries([
    ["en", "English"], ["ka", "ქართული"], ["ru", "Русский"], ["he", "עברית"]
  ].map(([language, name]) => {
    const button = new MockElement(name);
    button.setAttribute("data-language", language);
    return [language, button];
  }));
  const switcher = new MockElement();
  switcher.hidden = true;
  switcher.querySelector = (selector) => ({
    summary, ".language-current": current, ".language-code": code, ".language-menu": menu
  })[selector] || null;
  switcher.querySelectorAll = (selector) => selector === "[data-language]" ? Object.values(buttons) : [];

  const accessibility = new MockElement();
  accessibility.querySelectorAll = () => [];
  const containers = Object.fromEntries(["gallery-preview", "gallery-more", "video-grid", "review-list", "reviews-empty"]
    .map((id) => [id, new MockElement()]));
  const document = {
    documentElement: { lang: "he", dir: "rtl" },
    querySelector(selector) {
      if (selector === ".language-switcher") return switcher;
      if (selector === ".accessibility-widget") return accessibility;
      throw new Error(`Unexpected selector: ${selector}`);
    },
    querySelectorAll(selector) {
      if (selector === '[data-contact="whatsapp"], [data-contact="review"], [data-tour]') return [contactLink, reviewLink, tourLink];
      if (selector === ".tour-details") return [];
      const marker = selector.slice(1, -1);
      return targets.filter((element) => element.getAttribute(marker) !== null);
    },
    getElementById(id) { return containers[id]; },
    createElement() { return new MockElement(); }
  };
  const warnings = [];
  const window = { ZuraSite: siteData, ZuraTranslations: translations, localStorage: storage };
  const script = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
  vm.runInNewContext(script, { document, window, console: { warn: (...args) => warnings.push(args) } });

  return { document, navigation, title, meta, image, accessibilityLabel, tourLink, contactLink, reviewLink, summary, flag, current, code, menu, buttons, switcher, containers, warnings };
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, value); }
  };
}

test("switching languages updates content, direction, media and contact drafts, and restores the preference", () => {
  const storage = memoryStorage();
  const page = languageFixture(storage);
  assert.equal(page.switcher.hidden, false);

  for (const language of ["en", "ka", "ru", "he"]) {
    page.switcher.open = true;
    page.buttons[language].dispatch("click");
    const isHebrew = language === "he";
    assert.equal(page.document.documentElement.lang, language);
    assert.equal(page.document.documentElement.dir, isHebrew ? "rtl" : "ltr");
    assert.equal(page.navigation.textContent, isHebrew ? "נעים להכיר" : translations[language].navAbout);
    assert.equal(page.title.textContent, isHebrew ? "TRAVEL WITH ZURA | גאורגיה בעברית" : translations[language].pageTitle);
    assert.equal(page.meta.getAttribute("content"), page.title.textContent);
    assert.equal(page.image.getAttribute("alt"), isHebrew ? "נוף בגאורגיה" : translations[language].heroImageAlt);
    assert.equal(page.accessibilityLabel.getAttribute("title"), page.accessibilityLabel.getAttribute("aria-label"));
    assert.equal(page.flag.getAttribute("href"), `#flag-${language}`);
    assert.equal(page.buttons[language].getAttribute("aria-pressed"), "true");
    assert.equal(Object.values(page.buttons).filter((button) => button.getAttribute("aria-pressed") === "true").length, 1);
    assert.equal(page.summary.getAttribute("aria-label"), `${translations[language].languageLabel}: ${page.buttons[language].textContent}`);
    assert.equal(page.switcher.open, false);
    assert.equal(page.summary.focused, true);
    assert.equal(storage.getItem("zura-language"), language);

    const previewLink = page.containers["gallery-preview"].children[0].children[0];
    const caption = isHebrew ? data.previewPhotos[0].caption : translations[language].galleryCaptions[data.previewPhotos[0].id];
    assert.equal(previewLink.children[0].alt, caption);
    assert.equal(previewLink.getAttribute("aria-label"), translations[language].galleryOpen.replace("{caption}", caption));
    const otherPhoto = page.containers["gallery-more"].children[0].children[0].children[0];
    assert.equal(otherPhoto.alt, translations[language].galleryPhoto.replace("{number}", "1"));
    const video = page.containers["video-grid"].children[0].children[0];
    assert.equal(video.getAttribute("aria-label"), translations[language].videoLabel.replace("{number}", "1"));
    assert.equal(video.children[1].textContent, translations[language].videoFallback);

    const destination = isHebrew ? "סוואנתי" : translations[language].destination3Name;
    assert.equal(new URL(page.tourLink.href).searchParams.get("text"), translations[language].whatsappTour.replace("{tour}", destination));
    assert.equal(new URL(page.contactLink.href).searchParams.get("text"), translations[language].whatsappGeneral);
    assert.equal(new URL(page.reviewLink.href).searchParams.get("text"), translations[language].whatsappReview);
  }

  page.buttons.ru.dispatch("click");
  const restored = languageFixture(storage);
  assert.equal(restored.document.documentElement.lang, "ru");
  assert.equal(restored.navigation.textContent, translations.ru.navAbout);
  restored.switcher.open = true;
  restored.switcher.dispatch("keydown", { key: "Escape" });
  assert.equal(restored.switcher.open, false);
  assert.equal(restored.summary.focused, true);
});

test("language switching still works when browser storage is unavailable", () => {
  const storage = {
    getItem() { throw new Error("storage blocked"); },
    setItem() { throw new Error("storage blocked"); }
  };
  const page = languageFixture(storage);
  assert.equal(page.document.documentElement.lang, "he");
  page.buttons.en.dispatch("click");
  assert.equal(page.document.documentElement.lang, "en");
  assert.equal(page.navigation.textContent, translations.en.navAbout);
  assert.equal(page.warnings.length, 2);
});

test("original review text keeps its own direction when the page language changes", () => {
  const review = { name: "מטיילת", text: "חוויה נהדרת", trip: "קזבגי" };
  const page = languageFixture(memoryStorage(), { ...data, reviews: [review] });
  page.buttons.en.dispatch("click");
  const [quote, author, trip] = page.containers["review-list"].children[0].children;
  assert.equal(quote.textContent, review.text);
  assert.equal(author.textContent, review.name);
  assert.equal(trip.textContent, review.trip);
  assert.deepEqual([quote.dir, author.dir, trip.dir], ["auto", "auto", "auto"]);
  assert.equal(page.containers["reviews-empty"].hidden, true);
});
