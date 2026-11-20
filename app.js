(function () {
  "use strict";

  const data = window.ZuraSite;
  const translations = window.ZuraTranslations;
  const languageSwitcher = document.querySelector(".language-switcher");
  const languageSummary = languageSwitcher.querySelector("summary");
  const languageButtons = languageSwitcher.querySelectorAll("[data-language]");
  const contactLinks = document.querySelectorAll('[data-contact="whatsapp"], [data-contact="review"], [data-tour]');
  const sourceStrings = new Map();
  const translationTargets = [];
  const photoRecords = [];
  const videoRecords = [];
  const languageStorageKey = "zura-language";
  let currentLanguage = "he";

  [
    ["data-i18n", null],
    ["data-i18n-alt", "alt"],
    ["data-i18n-aria-label", "aria-label"],
    ["data-i18n-title", "title"],
    ["data-i18n-content", "content"],
    ["data-i18n-tour", "data-tour"]
  ].forEach(([marker, attribute]) => {
    document.querySelectorAll(`[${marker}]`).forEach((element) => {
      const key = element.getAttribute(marker);
      const source = attribute === null ? element.textContent : element.getAttribute(attribute);
      if (sourceStrings.has(key) && sourceStrings.get(key) !== source) {
        throw new Error(`Conflicting Hebrew source text for translation: ${key}`);
      }
      sourceStrings.set(key, source);
      translationTargets.push({ element, attribute, key });
    });
  });

  function translate(key) {
    const value = currentLanguage === "he" && sourceStrings.has(key)
      ? sourceStrings.get(key)
      : translations[currentLanguage][key];
    if (typeof value !== "string") {
      throw new Error(`Missing ${currentLanguage} translation: ${key}`);
    }
    return value;
  }

  function setLanguage(language) {
    if (!Object.prototype.hasOwnProperty.call(translations, language)) {
      throw new Error(`Unsupported language: ${language}`);
    }
    const selectedButton = Array.from(languageButtons).find((button) => button.dataset.language === language);
    if (!selectedButton) {
      throw new Error(`Missing language selector option: ${language}`);
    }
    currentLanguage = language;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";

    translationTargets.forEach(({ element, attribute, key }) => {
      const value = translate(key);
      if (attribute === null) element.textContent = value;
      else element.setAttribute(attribute, value);
    });

    photoRecords.forEach(({ link, image, id, caption: originalCaption }) => {
      let caption;
      if (originalCaption === undefined) {
        caption = translate("galleryPhoto").replace("{number}", String(id + 1));
      } else if (language === "he") {
        caption = originalCaption;
      } else {
        caption = translations[language].galleryCaptions[id];
        if (typeof caption !== "string") {
          throw new Error(`Missing ${language} gallery caption: ${id}`);
        }
      }
      image.alt = caption;
      link.setAttribute("aria-label", translate("galleryOpen").replace("{caption}", caption));
    });

    videoRecords.forEach(({ video, fallback, number }) => {
      video.setAttribute("aria-label", translate("videoLabel").replace("{number}", String(number)));
      fallback.textContent = translate("videoFallback");
    });

    contactLinks.forEach((link) => {
      let message;
      if (link.dataset.contact === "review") {
        message = translate("whatsappReview");
      } else if (link.dataset.tour === undefined) {
        message = translate("whatsappGeneral");
      } else {
        message = translate("whatsappTour").replace("{tour}", link.dataset.tour);
      }
      link.href = data.whatsappLink(data.phone, message);
    });

    const name = selectedButton.textContent.trim();
    languageButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button === selectedButton));
    });
    const current = languageSwitcher.querySelector(".language-current");
    current.textContent = name;
    current.lang = language;
    current.dir = language === "he" ? "rtl" : "ltr";
    languageSwitcher.querySelector(".language-code").textContent = language.toUpperCase();
    languageSummary.querySelector("use").setAttribute("href", `#flag-${language}`);
    languageSummary.setAttribute("aria-label", `${translate("languageLabel")}: ${name}`);
    languageSwitcher.querySelector(".language-menu").setAttribute("aria-label", translate("languageLabel"));
  }

  function addPhoto(container, id, caption) {
    const figure = document.createElement("figure");
    figure.className = "gallery-item";
    const link = document.createElement("a");
    link.href = `Photos/${encodeURIComponent(data.originalPhotos[id])}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const image = document.createElement("img");
    image.src = `assets/photo-${String(id).padStart(2, "0")}.jpg`;
    image.loading = "lazy";
    image.decoding = "async";
    link.append(image);
    figure.append(link);
    container.append(figure);
    photoRecords.push({ link, image, id, caption });
  }

  const preview = document.getElementById("gallery-preview");
  data.previewPhotos.forEach(({ id, caption }) => addPhoto(preview, id, caption));
  const previewIds = new Set(data.previewPhotos.map(({ id }) => id));
  const remaining = document.getElementById("gallery-more");
  data.originalPhotos.forEach((_, id) => {
    if (!previewIds.has(id)) addPhoto(remaining, id);
  });

  const videoGrid = document.getElementById("video-grid");
  data.videos.forEach((filename, index) => {
    const figure = document.createElement("figure");
    const video = document.createElement("video");
    video.controls = true;
    video.preload = "none";
    video.playsInline = true;
    const source = document.createElement("source");
    source.src = `Videos/${encodeURIComponent(filename)}`;
    source.type = "video/mp4";
    const fallback = document.createElement("a");
    fallback.href = source.src;
    video.append(source, fallback);
    figure.append(video);
    videoGrid.append(figure);
    videoRecords.push({ video, fallback, number: index + 1 });
  });

  document.querySelectorAll(".tour-details").forEach((details) => {
    const content = details.querySelector(":scope > div");
    details.addEventListener("toggle", () => {
      if (!details.open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        content.style.height = "";
        content.style.overflow = "";
        return;
      }

      const targetHeight = content.scrollHeight;
      content.style.height = "0px";
      content.style.overflow = "hidden";
      void content.offsetHeight;
      content.style.height = `${targetHeight}px`;
    });
    content.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "height" || !details.open) return;
      content.style.height = "";
      content.style.overflow = "";
    });
  });

  const reviewList = document.getElementById("review-list");
  data.reviews.forEach((review) => {
    if (!review.name || !review.text) {
      throw new Error("לכל המלצה יש לצרף שם ואת הטקסט המקורי.");
    }
    const card = document.createElement("article");
    card.className = "review-card";
    const quote = document.createElement("blockquote");
    quote.textContent = review.text;
    quote.dir = "auto";
    const author = document.createElement("cite");
    author.textContent = review.name;
    author.dir = "auto";
    card.append(quote, author);
    if (review.trip) {
      const trip = document.createElement("small");
      trip.textContent = review.trip;
      trip.dir = "auto";
      card.append(trip);
    }
    reviewList.append(card);
  });
  document.getElementById("reviews-empty").hidden = data.reviews.length > 0;

  const accessibilityWidget = document.querySelector(".accessibility-widget");
  accessibilityWidget.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && accessibilityWidget.open) {
      accessibilityWidget.open = false;
      accessibilityWidget.querySelector("summary").focus();
    }
  });
  accessibilityWidget.querySelectorAll("[data-accessibility-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.accessibilityAction;
      if (action === "reset") {
        document.body.classList.remove("a11y-large-text", "a11y-high-contrast", "a11y-underline-links");
        accessibilityWidget.querySelectorAll('[aria-pressed="true"]').forEach((pressedButton) => {
          pressedButton.setAttribute("aria-pressed", "false");
        });
        return;
      }

      const className = {
        "large-text": "a11y-large-text",
        "high-contrast": "a11y-high-contrast",
        "underline-links": "a11y-underline-links"
      }[action];
      const enabled = document.body.classList.toggle(className);
      button.setAttribute("aria-pressed", String(enabled));
    });
  });

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const language = button.dataset.language;
      setLanguage(language);
      try {
        window.localStorage.setItem(languageStorageKey, language);
      } catch (error) {
        console.warn("Could not save the language preference.", error);
      }
      languageSwitcher.open = false;
      languageSummary.focus();
    });
  });
  languageSwitcher.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && languageSwitcher.open) {
      languageSwitcher.open = false;
      languageSummary.focus();
    }
  });

  let savedLanguage;
  try {
    savedLanguage = window.localStorage.getItem(languageStorageKey);
  } catch (error) {
    console.warn("Could not read the language preference.", error);
  }
  if (savedLanguage && !Object.prototype.hasOwnProperty.call(translations, savedLanguage)) {
    console.warn(`Ignoring unsupported saved language: ${savedLanguage}`);
    savedLanguage = null;
  }
  setLanguage(savedLanguage || "he");
  languageSwitcher.hidden = false;
})();
