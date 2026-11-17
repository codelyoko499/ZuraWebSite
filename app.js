(function () {
  "use strict";

  const data = window.ZuraSite;
  document.querySelectorAll('[data-contact="whatsapp"], [data-tour]').forEach((link) => {
    const message = link.dataset.tour === undefined
      ? undefined
      : `שלום זורה, אשמח לקבל פרטים על ${link.dataset.tour}. התאריכים שלנו: … מספר מטיילים: …`;
    link.href = data.whatsappLink(data.phone, message);
  });

  function addPhoto(container, id, caption) {
    const figure = document.createElement("figure");
    figure.className = "gallery-item";
    const link = document.createElement("a");
    link.href = `Photos/${encodeURIComponent(data.originalPhotos[id])}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `${caption} — פתיחת התמונה בגודל מלא בלשונית חדשה`);
    const image = document.createElement("img");
    image.src = `assets/photo-${String(id).padStart(2, "0")}.jpg`;
    image.alt = caption;
    image.loading = "lazy";
    image.decoding = "async";
    link.append(image);
    figure.append(link);
    container.append(figure);
  }

  const preview = document.getElementById("gallery-preview");
  data.previewPhotos.forEach(({ id, caption }) => addPhoto(preview, id, caption));
  const previewIds = new Set(data.previewPhotos.map(({ id }) => id));
  const remaining = document.getElementById("gallery-more");
  data.originalPhotos.forEach((_, id) => {
    if (!previewIds.has(id)) addPhoto(remaining, id, `מהאלבום של זורה · תמונה ${id + 1}`);
  });

  const videoGrid = document.getElementById("video-grid");
  data.videos.forEach((filename, index) => {
    const figure = document.createElement("figure");
    const video = document.createElement("video");
    video.controls = true;
    video.preload = "none";
    video.playsInline = true;
    video.setAttribute("aria-label", `סרטון מהטיולים ${index + 1}`);
    const source = document.createElement("source");
    source.src = `Videos/${encodeURIComponent(filename)}`;
    source.type = "video/mp4";
    const fallback = document.createElement("a");
    fallback.href = source.src;
    fallback.textContent = "הדפדפן אינו תומך בנגן. ניתן לפתוח את קובץ הסרטון ישירות.";
    video.append(source, fallback);
    figure.append(video);
    videoGrid.append(figure);
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
    const author = document.createElement("cite");
    author.textContent = review.name;
    card.append(quote, author);
    if (review.trip) {
      const trip = document.createElement("small");
      trip.textContent = review.trip;
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
})();
