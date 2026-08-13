/* =====================================================
   திருக்குறள் தமிழ் விளக்கம் - script.js
   Vanilla JavaScript | Fetch API | No frameworks

   DATA SOURCE:
   This app fetches Thirukkural dataset from the Flask
   backend running on localhost:5000. The backend caches
   data fetched from the official GitHub repository
   (tk120404/thirukkural).

   API Endpoints:
     1) GET /api/kural/<number> -> specific kural with chapter info
     2) GET /api/random-kural   -> random kural with chapter info
   ===================================================== */

// ---------- Constants ----------
const FLASK_API_URL = "http://localhost:5000/api";

const MIN_KURAL_NO = 1;
const MAX_KURAL_NO = 1330;
const THEME_STORAGE_KEY = "thirukkural-theme";

// ---------- DOM References ----------
const kuralNumberInput = document.getElementById("kuralNumberInput");
const searchBtn = document.getElementById("searchBtn");
const randomBtn = document.getElementById("randomBtn");
const messageBox = document.getElementById("messageBox");
const loadingSpinner = document.getElementById("loadingSpinner");
const resultCard = document.getElementById("resultCard");

const kuralNumberEl = document.getElementById("kuralNumber");
const kuralLine1El = document.getElementById("kuralLine1");
const kuralLine2El = document.getElementById("kuralLine2");
const kuralExplanationEl = document.getElementById("kuralExplanation");
const kuralChapterEl = document.getElementById("kuralChapter");
const kuralSectionEl = document.getElementById("kuralSection");

const copyBtn = document.getElementById("copyBtn");
const copyToast = document.getElementById("copyToast");
const themeToggleBtn = document.getElementById("themeToggleBtn");

// Holds the currently displayed kural data (used for copy-to-clipboard)
let currentKuralData = null;

/* =====================================================
   INITIALISATION
   ===================================================== */
function init() {
  applySavedTheme();
  attachEventListeners();
}

/* =====================================================
   EVENT LISTENERS
   ===================================================== */
function attachEventListeners() {
  searchBtn.addEventListener("click", handleSearch);
  randomBtn.addEventListener("click", handleRandomKural);
  copyBtn.addEventListener("click", handleCopy);
  themeToggleBtn.addEventListener("click", toggleTheme);

  // Pressing Enter inside the input triggers search
  kuralNumberInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  });

  // Clear old error message as soon as user starts typing again
  kuralNumberInput.addEventListener("input", clearMessage);
}

/* =====================================================
   SEARCH HANDLERS
   ===================================================== */

// Handles the "🔍 தேடு" button click
async function handleSearch() {
  const rawValue = kuralNumberInput.value.trim();

  // --- Validation: empty input ---
  if (rawValue === "") {
    showMessage("தயவுசெய்து குறள் எண்ணை உள்ளிடுங்கள்.");
    hideResult();
    return;
  }

  const kuralNumber = Number(rawValue);

  // --- Validation: not a valid integer or out of range ---
  if (
    !Number.isInteger(kuralNumber) ||
    kuralNumber < MIN_KURAL_NO ||
    kuralNumber > MAX_KURAL_NO
  ) {
    showMessage("1 முதல் 1330 வரை உள்ள எண்ணை மட்டும் உள்ளிடவும்.");
    hideResult();
    return;
  }

  await fetchAndDisplayKural(kuralNumber);
}

// Handles the "🎲 சீரற்ற குறள்" button click
async function handleRandomKural() {
  kuralNumberInput.value = "";
  await displayRandomKural();
}

/* =====================================================
   DATA LOADING (Flask API)
   ===================================================== */

// Fetch a specific kural from the Flask backend
async function fetchKuralFromAPI(kuralNumber) {
  const response = await fetch(`${FLASK_API_URL}/kural/${kuralNumber}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch kural");
  }

  return await response.json();
}

// Fetch a random kural from the Flask backend
async function fetchRandomKuralFromAPI() {
  const response = await fetch(`${FLASK_API_URL}/random-kural`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch random kural");
  }

  return await response.json();
}

/* =====================================================
   FETCH + DISPLAY A SINGLE KURAL
   ===================================================== */
async function fetchAndDisplayKural(kuralNumber) {
  clearMessage();
  hideResult();
  showLoading();

  try {
    const response = await fetchKuralFromAPI(kuralNumber);

    if (!response.success || !response.data) {
      throw new Error(response.message || "Kural not found");
    }

    const kural = response.data;
    displayKural(kural);
  } catch (error) {
    console.error("Thirukkural fetch failed:", error);
    showMessage("தகவலை பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.");
  } finally {
    hideLoading();
  }
}

// Fetch and display random kural
async function displayRandomKural() {
  clearMessage();
  hideResult();
  showLoading();

  try {
    const response = await fetchRandomKuralFromAPI();

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to fetch random kural");
    }

    const kural = response.data;
    kuralNumberInput.value = kural.Number;
    displayKural(kural);
  } catch (error) {
    console.error("Random kural fetch failed:", error);
    showMessage("தகவலை பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.");
  } finally {
    hideLoading();
  }
}

/* =====================================================
   RENDER RESULT
   ===================================================== */
function displayKural(kural) {
  // Store for copy-to-clipboard feature
  currentKuralData = {
    number: kural.Number,
    line1: kural.Line1,
    line2: kural.Line2,
    explanation: kural.mv || kural.sp || kural.mk || "விளக்கம் கிடைக்கவில்லை.",
    chapter: kural.adhikaram || "-",
    section: kural.paal || "-",
  };

  kuralNumberEl.textContent = currentKuralData.number ?? "-";
  kuralLine1El.textContent = currentKuralData.line1 ?? "";
  kuralLine2El.textContent = currentKuralData.line2 ?? "";
  kuralExplanationEl.textContent = currentKuralData.explanation;
  kuralChapterEl.textContent = currentKuralData.chapter;
  kuralSectionEl.textContent = currentKuralData.section;

  resultCard.hidden = false;
  copyToast.hidden = true;

  // Smooth scroll to the result on small screens
  resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* =====================================================
   COPY TO CLIPBOARD
   ===================================================== */
async function handleCopy() {
  if (!currentKuralData) return;

  const textToCopy =
    `குறள் எண்: ${currentKuralData.number}\n` +
    `${currentKuralData.line1}\n${currentKuralData.line2}\n\n` +
    `தமிழ் விளக்கம்: ${currentKuralData.explanation}\n` +
    `அதிகாரம்: ${currentKuralData.chapter}\n` +
    `பால்: ${currentKuralData.section}`;

  try {
    await navigator.clipboard.writeText(textToCopy);
    showCopyToast();
  } catch (error) {
    // Fallback for browsers without clipboard API support
    fallbackCopyToClipboard(textToCopy);
  }
}

// Fallback copy method using a temporary textarea element
function fallbackCopyToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    document.execCommand("copy");
    showCopyToast();
  } catch (err) {
    console.error("Copy failed:", err);
  } finally {
    document.body.removeChild(textarea);
  }
}

function showCopyToast() {
  copyToast.hidden = false;
  setTimeout(() => {
    copyToast.hidden = true;
  }, 2000);
}

/* =====================================================
   DARK MODE
   ===================================================== */
function applySavedTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggleBtn.textContent = "☀️";
  } else {
    themeToggleBtn.textContent = "🌙";
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  themeToggleBtn.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
}

/* =====================================================
   UI HELPER FUNCTIONS
   ===================================================== */
function showMessage(text) {
  messageBox.textContent = text;
}

function clearMessage() {
  messageBox.textContent = "";
}

function showLoading() {
  loadingSpinner.hidden = false;
}

function hideLoading() {
  loadingSpinner.hidden = true;
}

function hideResult() {
  resultCard.hidden = true;
  currentKuralData = null;
}

/* =====================================================
   START APP
   ===================================================== */
document.addEventListener("DOMContentLoaded", init);
