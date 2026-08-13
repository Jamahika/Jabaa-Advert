const JSONBIN_BIN_ID = "6a7788e6da38895dfecade0c";
const JSONBIN_API_KEY =
  "$2a$10$fY2eFq1ygOH8/EP5JNVb2uYZJo3AKthhYj.jDiDAlpS3jiYwhKDmS";
const CLOUDINARY_CLOUD_NAME = "jayczq68";
const CLOUDINARY_UPLOAD_PRESET = "Jabaa_Advert";

const baseServices = [
  { name: "Stiker Photo", emoji: "🖼️" },
  { name: "T-Shirt", emoji: "👕" },
  { name: "Mug", emoji: "☕" },
  { name: "Hat/Pen", emoji: "🖊️" },
  { name: "Epoxy", emoji: "✨" },
  { name: "Wall Art", emoji: "🎨" },
];

const availableEmojis = [
  "🖼️",
  "👕",
  "☕",
  "🖊️",
  "✨",
  "🎨",
  "🚩",
  "📜",
  "🧢",
  "🎒",
  "🎁",
  "📌",
  "🏷️",
  "💼",
  "💡",
  "⭐",
  "🔮",
  "📐",
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
      `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`,
      {
        headers: { "X-Master-Key": JSONBIN_API_KEY },
      },
    );
    const json = await res.json();
    if (json.record) {
      globalDB = json.record;
    }
  } catch (e) {
    console.error("Failed to load cloud DB", e);
  }
}

async function saveCloudDB() {
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_API_KEY,
      },
      body: JSON.stringify(globalDB),
    });
  } catch (e) {
    console.error("Failed to save cloud DB", e);
  }
}

window.onload = async function () {
  const grid = document.getElementById("emojiPickerGrid");
  if (grid) {
    availableEmojis.forEach((emoji, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerText = emoji;
      btn.className = `emoji-btn text-2xl p-2 rounded-lg border border-transparent flex items-center justify-center ${index === 0 ? "selected" : ""}`;
      btn.onclick = () => {
        document
          .querySelectorAll(".emoji-btn")
          .forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        document.getElementById("selectedEmoji").value = emoji;
      };
      grid.appendChild(btn);
    });
  }
  await fetchCloudDB();
};

function getAllServices() {
  const customProducts = globalDB.jabaa_custom_products || [];
  const hiddenServices = globalDB.jabaa_hidden_services || [];
  const all = [...baseServices, ...customProducts];
  return all.filter((s) => !hiddenServices.includes(s.name));
}

function updateAdminDropdowns() {
  const services = getAllServices();

  [
    "priceItemSelect",
    "galleryCategory",
    "deleteServiceSelect",
    "manageImageCatSelect",
  ].forEach((id) => {
    const sel = document.getElementById(id);
    if (sel) {
      sel.innerHTML = "";
      services.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.name;
        opt.innerText = s.name;
        sel.appendChild(opt);
      });
    }
  });
  loadImagesForDeletion();
}

async function handleLogin() {
  const user = document.getElementById("adminUser").value.trim();
  const pass = document.getElementById("adminPass").value.trim();

  if (user === "admin" && pass === "jabaa2026") {
    await fetchCloudDB();
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("dashboardSection").classList.remove("hidden");
    document.getElementById("logoutBtn").classList.remove("hidden");
    updateAdminDropdowns();
    alert("✅ Login Successful & Cloud Synced!");
  } else {
    alert("❌ Invalid username or password (use admin / jabaa2026)");
  }
}

function handleLogout() {
  document.getElementById("dashboardSection").classList.add("hidden");
  document.getElementById("logoutBtn").classList.add("hidden");
  document.getElementById("loginSection").classList.remove("hidden");
  document.getElementById("adminUser").value = "";
  document.getElementById("adminPass").value = "";
}

async function saveSizePriceUpdate() {
  const item = document.getElementById("priceItemSelect").value;
  const size = document.getElementById("priceSizeInput").value.trim();
  const price = document.getElementById("newPriceInput").value.trim();

  if (!size || !price) {
    alert("⚠️ Please enter both the size name and the new price.");
    return;
  }

  if (!globalDB.jabaa_size_prices) globalDB.jabaa_size_prices = {};
  if (!globalDB.jabaa_size_prices[item])
    globalDB.jabaa_size_prices[item] = {};

  globalDB.jabaa_size_prices[item][size] = price;
  await saveCloudDB();

  document.getElementById("priceSizeInput").value = "";
  document.getElementById("newPriceInput").value = "";
  alert(`✅ SUCCESS! Size price saved to cloud.`);
}

async function saveGalleryPhoto() {
  const catSelect = document.getElementById("galleryCategory");
  const fileInput = document.getElementById("imageFileInput");

  if (!catSelect || !fileInput) {
    alert("❌ Error: Missing category dropdown or file input element.");
    return;
  }

  const cat = catSelect.value;

  if (!fileInput.files || fileInput.files.length === 0) {
    alert("⚠️ Please choose an image file first.");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  alert("⏳ Uploading to Cloudinary cloud... Please wait.");

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );
    const data = await response.json();

    if (data.secure_url) {
      const imageUrl = data.secure_url;
      if (!globalDB.jabaa_gallery) globalDB.jabaa_gallery = {};
      if (!globalDB.jabaa_gallery[cat]) globalDB.jabaa_gallery[cat] = [];
      globalDB.jabaa_gallery[cat].push(imageUrl);

      await saveCloudDB();
      fileInput.value = "";
      if (typeof loadImagesForDeletion === "function") {
        loadImagesForDeletion();
      }
      alert(`✅ SUCCESS! Photo uploaded to cloud and synced for "${cat}".`);
    } else {
      alert(
        "❌ Cloudinary Error: " +
          (data.error?.message || JSON.stringify(data)),
      );
    }
  } catch (err) {
    console.error("Network Exception:", err);
    alert("❌ Network Error connecting to Cloudinary. Check console.");
  }
}

async function addNewProduct() {
  const nameInput = document.getElementById("newProdName");
  const emojiInput = document.getElementById("selectedEmoji");
  const name = nameInput.value.trim();
  const emoji = emojiInput ? emojiInput.value : "📦";

  if (!name) {
    alert("⚠️ Please enter a product name.");
    return;
  }

  if (!globalDB.jabaa_custom_products)
    globalDB.jabaa_custom_products = [];
  if (
    globalDB.jabaa_custom_products.some(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    ) ||
    baseServices.some((s) => s.name.toLowerCase() === name.toLowerCase())
  ) {
    alert("⚠️ A service with this name already exists.");
    return;
  }

  globalDB.jabaa_custom_products.push({ name, emoji });
  await saveCloudDB();

  nameInput.value = "";
  updateAdminDropdowns();
  alert(`✅ SUCCESS! New product published to cloud.`);
}

async function deleteService() {
  const select = document.getElementById("deleteServiceSelect");
  if (!select || !select.value) return;
  const targetService = select.value;

  if (!confirm(`Stop working with "${targetService}"?`)) return;

  if (!globalDB.jabaa_hidden_services)
    globalDB.jabaa_hidden_services = [];
  if (!globalDB.jabaa_hidden_services.includes(targetService)) {
    globalDB.jabaa_hidden_services.push(targetService);
    await saveCloudDB();
  }

  updateAdminDropdowns();
  alert(`✅ SUCCESS! Service hidden globally.`);
}

const defaultImagesMap = {
  "Stiker Photo": [],
  "T-Shirt": [],
  Mug: [],
  "Hat/Pen": [],
  Epoxy: [],
  "Wall Art": [],
};

function loadImagesForDeletion() {
  const catSelect = document.getElementById("manageImageCatSelect");
  const grid = document.getElementById("adminImageGrid");
  if (!catSelect || !grid) return;

  const cat = catSelect.value;
  grid.innerHTML = "";

  const defaultList = defaultImagesMap[cat] || [];
  const deletedDefaults = globalDB.jabaa_deleted_defaults || {};
  const filteredDefaults = defaultList.filter(
    (img) =>
      !(deletedDefaults[cat] && deletedDefaults[cat].includes(img)),
  );

  const adminList = (globalDB.jabaa_gallery || {})[cat] || [];

  const allImages = [
    ...filteredDefaults.map((url) => ({ type: "default", path: url })),
    ...adminList.map((url, index) => ({
      type: "admin",
      path: url,
      index: index,
    })),
  ];

  if (allImages.length === 0) {
    grid.innerHTML =
      '<p class="text-xs text-slate-500 col-span-full text-center py-4">No images.</p>';
    return;
  }

  allImages.forEach((imgObj) => {
    const card = document.createElement("div");
    card.className =
      "relative aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-800 group";
    card.innerHTML = `
      <img src="${imgObj.path}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/150x150/1e293b/ffffff?text=Image'">
      <button type="button" onclick="deleteSpecificImage('${cat}', '${imgObj.type}', ${imgObj.type === "admin" ? imgObj.index : "'" + imgObj.path + "'"})" class="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-1">
        🗑️ Delete
      </button>
    `;
    grid.appendChild(card);
  });
}

async function deleteSpecificImage(cat, type, identifier) {
  if (!confirm("Are you sure you want to delete this image globally?"))
    return;

  if (type === "admin") {
    if (globalDB.jabaa_gallery && globalDB.jabaa_gallery[cat]) {
      globalDB.jabaa_gallery[cat].splice(identifier, 1);
    }
  } else if (type === "default") {
    if (!globalDB.jabaa_deleted_defaults)
      globalDB.jabaa_deleted_defaults = {};
    if (!globalDB.jabaa_deleted_defaults[cat])
      globalDB.jabaa_deleted_defaults[cat] = [];
    globalDB.jabaa_deleted_defaults[cat].push(identifier);
  }

  await saveCloudDB();
  loadImagesForDeletion();
  alert("✅ Image deleted globally across all devices!");
}
