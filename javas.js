const JSONBIN_BIN_ID = "6a7788e6da38895dfecade0c";
const JSONBIN_API_KEY =
  "$2a$10$fY2eFq1ygOH8/EP5JNVb2uYZJo3AKthhYj.jDiDAlpS3jiYwhKDmS";

const defaultImages = {
  "Stiker Photo": [],
  "T-Shirt": [],
  Mug: [],
  "Hat/Pen": [],
  Epoxy: [],
  "Wall Art": [],
};

const baseServices = [
  { name: "Stiker Photo", emoji: "🖼️" },
  { name: "T-Shirt", emoji: "👕" },
  { name: "Mug", emoji: "☕" },
  { name: "Hat/Pen", emoji: "🖊️" },
  { name: "Epoxy", emoji: "✨" },
  { name: "Wall Art", emoji: "🎨" },
];

let globalDB = {
  jabaa_gallery: {},
  jabaa_hidden_services: [],
  jabaa_custom_products: [],
  jabaa_size_prices: {},
  jabaa_deleted_defaults: {},
};

async function fetchCloudDB() {
  try {
    const res = await fetch(
      `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest?t=${Date.now()}`,
      {
        headers: { "X-Master-Key": JSONBIN_API_KEY },
        cache: "no-store",
      },
    );
    const json = await res.json();
    if (json && json.record) {
      globalDB = json.record;
    }
  } catch (e) {
    console.error("Failed to load cloud DB, using defaults", e);
  }
}

function getActiveServices() {
  const customProducts = globalDB.jabaa_custom_products || [];
  const hiddenServices = globalDB.jabaa_hidden_services || [];
  const all = [...baseServices, ...customProducts];
  return all.filter((s) => !hiddenServices.includes(s.name));
}

function renderServicesList(services) {
  const grid = document.getElementById("servicesGrid");
  const select = document.getElementById("itemSelect");

  if (!grid || !select) return;

  grid.innerHTML = "";
  select.innerHTML = "";

  services.forEach((s) => {
    const card = document.createElement("div");
    card.className =
      "cursor-pointer bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm hover:border-blue-500 transition hover:-translate-y-1 text-center";
    card.onclick = () => openGallery(s.name);
    card.innerHTML = `
      <div class="text-4xl sm:text-5xl mb-4 sm:mb-6">${s.emoji}</div>
      <h4 class="text-lg sm:text-xl font-bold mb-2 text-white">${s.name}</h4>
    `;
    grid.appendChild(card);

    const opt = document.createElement("option");
    opt.value = s.name;
    opt.innerText = s.name;
    select.appendChild(opt);
  });

  updateFormFields();
}

async function initApp() {
  // 1. Render immediately using local base services so mobile screen is never blank
  renderServicesList(baseServices);

  // 2. Fetch cloud data in background and re-render with custom products/hidden filters
  await fetchCloudDB();
  renderServicesList(getActiveServices());
}

function updateFormFields() {
  const selectElement = document.getElementById("itemSelect");
  if (!selectElement) return;

  const item = selectElement.value;
  const container = document.getElementById("dynamicFields");
  if (!container) return;

  container.innerHTML = "";

  const savedSizePrices = globalDB.jabaa_size_prices || {};
  const customSizes = savedSizePrices[item] || {};

  if (item !== "Wall Art") {
    container.innerHTML += `<input type="number" id="orderQuantity" placeholder="Quantity" class="w-full p-4 rounded-xl mb-4 border bg-slate-800 border-slate-700 text-white outline-none text-sm">`;
  }

  let defaultSizes = {};
  if (item === "Stiker Photo") {
    defaultSizes = {
      "20*30": "300 Birr",
      "40*50": "600 Birr",
      "50*70": "800 Birr",
      "50*80": "1000 Birr"
    };
  } else if (item === "Epoxy") {
    defaultSizes = {
      "20*30": "800 Birr",
      "30*40": "1400 Birr",
      "40*50": "1800 Birr",
      "50*70": "2300 Birr",
      "50*80": "2600 Birr"
    };
  }

  const finalSizes = { ...defaultSizes, ...customSizes };
  const hasSizes = Object.keys(finalSizes).length > 0;

  if (hasSizes) {
    let optionsHTML = "";
    for (const [size, price] of Object.entries(finalSizes)) {
      optionsHTML += `<option value="${size} (${price})">${size} (${price})</option>`;
    }
    container.innerHTML += `
      <select id="sizeSelect" class="w-full p-4 rounded-xl mb-4 border bg-slate-800 border-slate-700 text-white outline-none text-sm">
        ${optionsHTML}
      </select>`;
  } else if (item === "T-Shirt") {
    container.innerHTML += `
      <input type="text" id="tSize" placeholder="Size (e.g. S, M, L...)" class="w-full p-4 rounded-xl mb-4 border bg-slate-800 border-slate-700 text-white outline-none text-sm">
      <select id="tColor" class="w-full p-4 rounded-xl mb-4 border bg-slate-800 border-slate-700 text-white outline-none text-sm">
          <option value="Green">Green</option><option value="White">White</option><option value="Black">Black</option><option value="Red">Red</option><option value="Gray">Gray</option><option value="Blue">Blue</option><option value="Yellow">Yellow</option><option value="Burgundy">Burgundy</option>
      </select>
      <select id="tStyle" class="w-full p-4 rounded-xl mb-4 border bg-slate-800 border-slate-700 text-white outline-none text-sm">
          <option value="Short Sleeve">Short Sleeve</option><option value="Long Sleeve">Long Sleeve</option>
      </select>`;
  } else {
    container.innerHTML += `<input type="text" id="sizeDetails" placeholder="Size/Details" class="w-full p-4 rounded-xl mb-4 border bg-slate-800 border-slate-700 text-white outline-none text-sm">`;
  }
}

async function openGallery(service) {
  await fetchCloudDB();

  document.getElementById("modalTitle").innerText = service + " Samples";
  const container = document.getElementById("modalContent");
  container.innerHTML = "";

  const cloudGallery = globalDB.jabaa_gallery || {};
  const images = cloudGallery[service] || [];

  if (images.length === 0) {
    container.innerHTML =
      '<p class="text-slate-500 text-center col-span-full py-6">No samples uploaded for this service yet.</p>';
  } else {
    images.forEach((url) => {
      const div = document.createElement("div");
      div.className =
        "gallery-item relative group rounded-xl overflow-hidden shadow-md cursor-pointer h-40 bg-slate-800";
      div.onclick = () => openImageModal(url);
      div.innerHTML = `
      <img src="${url}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onerror="this.src='https://placehold.co/200x200/1e293b/ffffff?text=Image+Error'">
    `;
      container.appendChild(div);
    });
  }

  document.getElementById("galleryModal").classList.add("active");
}

function closeGallery() {
  document.getElementById("galleryModal").classList.remove("active");
}

function openImageModal(url) {
  const modalImg = document.getElementById("fullSizeImg");
  const downloadBtn = document.getElementById("downloadBtn");
  
  modalImg.src = url;
  
  // Update the download link source
  if (downloadBtn) {
    downloadBtn.href = url;
    // Optional: force attribute if cross-origin allows attachment download
    downloadBtn.setAttribute("download", "jabaa-printing-sample.jpg");
  }

  document.getElementById("imageModal").classList.add("active");
}
function downloadCurrentImage() {
  const modalImg = document.getElementById("fullSizeImg");
  let url = modalImg ? modalImg.src : "";
  
  if (!url) return;

  // Automatically inject Cloudinary's direct download flag into the URL
  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    url = url.replace("/upload/", "/upload/fl_attachment/");
  }

  // Create a direct download link
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "jabaa-printing-sample.jpg");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
function sendOrder() {
  const item = document.getElementById("itemSelect").value;
  const note = document.getElementById("orderNote").value;
  const qty = document.getElementById("orderQuantity");
  const size =
    document.getElementById("sizeSelect") ||
    document.getElementById("sizeDetails") ||
    document.getElementById("tSize");
  const error = document.getElementById("validationError");

  if ((qty && !qty.value) || (size && !size.value)) {
    if (error) error.style.display = "block";
    return;
  } else {
    if (error) error.style.display = "none";
  }

  let message = `Hi Jabaa Printing and Advert! I'd like to order:\n- Item: ${item}`;
  if (qty && qty.value) message += `\n- Quantity: ${qty.value}`;
  if (size && size.value) message += `\n- Details: ${size.value}`;

  if (item === "T-Shirt" && document.getElementById("tColor")) {
    message += `\n- Color: ${document.getElementById("tColor").value}`;
    if (document.getElementById("tStyle"))
      message += `\n- Style: ${document.getElementById("tStyle").value}`;
  }
  if (note && note.value) message += `\n- Notes: ${note.value}`;

  const telegramUrl = `https://t.me/Grace7PR?text=${encodeURIComponent(message)}`;

  const link = document.createElement("a");
  link.href = telegramUrl;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Auto-initialize when the webpage finishes loading
window.addEventListener("DOMContentLoaded", () => {
  initApp();
});
