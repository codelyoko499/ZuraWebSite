(function (root) {
  "use strict";

  const phone = "+995 591 62 55 00";
  function whatsappLink(number, message = "שלום זורה, אשמח לקבל פרטים על טיול בגאורגיה.") {
    if (typeof number !== "string" || !/^\+[1-9][\d ]{6,18}$/.test(number)) {
      throw new Error("יש להזין מספר טלפון בינלאומי תקין עם קידומת מדינה.");
    }
    const digits = number.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      throw new Error("מספר הטלפון חייב להכיל בין 7 ל־15 ספרות.");
    }
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }

  function mediaFiles(type, extension, groups) {
    return groups.flatMap(([time, count]) => {
      const name = `WhatsApp ${type} 2026-11-16 at ${time}`;
      return [
        ...Array.from({ length: count }, (_, i) => `${name} (${i + 1}).${extension}`),
        `${name}.${extension}`
      ];
    });
  }

  const originalPhotos = mediaFiles("Image", "jpeg", [
    ["05.10.54", 3], ["05.10.55", 6], ["05.10.56", 5],
    ["05.10.57", 6], ["05.10.58", 5], ["05.10.59", 5],
    ["05.11.00", 5], ["05.11.01", 5], ["05.11.03", 1],
    ["05.11.05", 1], ["05.11.11", 2], ["05.11.12", 3],
    ["05.11.15", 2], ["05.11.16", 5], ["05.11.17", 4]
  ]);
  const previewPhotos = [
    { id: 29, caption: "כפרים בין ההרים" },
    { id: 19, caption: "ביחד בקניון" },
    { id: 36, caption: "אגם על רקע ההרים" },
    { id: 62, caption: "הצבעים של השוק" },
    { id: 12, caption: "הדרך היא חלק מהטיול" },
    { id: 54, caption: "חיוכים מהדרך" },
    { id: 47, caption: "יוצאים אל הטבע" },
    { id: 26, caption: "סיפורים באבן" },
    { id: 18, caption: "מים וירוק" },
    { id: 39, caption: "פריחה מול הפסגות" },
    { id: 43, caption: "בדרכי השטח" },
    { id: 58, caption: "רגעים משותפים" }
  ];
  const videos = mediaFiles("Video", "mp4", [
    ["05.11.13", 1], ["05.11.14", 6], ["05.11.15", 1]
  ]);

  // Only add genuine reviews with the author's permission to publish.
  const reviews = [];
  const data = { phone, whatsappLink, originalPhotos, previewPhotos, videos, reviews };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = data;
  } else {
    root.ZuraSite = data;
  }
})(typeof window === "undefined" ? globalThis : window);
