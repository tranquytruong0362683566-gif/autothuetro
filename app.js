'use strict';

const APP = {
  version: '10.1.26',
  defaultApiUrl: 'https://console.flatkey.ai/v1/chat/completions',
  metaApiUrl: 'https://rakko.tools/api/tools/meta-extractor/extractMeta',
  defaultModel: 'gpt-4o-mini',
  fixedExtensionId: 'fegidjoncepnihnnfddbaipddleabaom',
  dbName: 'phongtro_ai_commenter_v10',
  dbVersion: 1,
  storage: {
    apiKey: 'truong_ai_commenter_flatkey_api_key_v1',
    model: 'truong_ai_commenter_model_v1',
    history: 'truong_ai_commenter_history_v10',
    draft: 'truong_ai_commenter_draft_v10',
    groupIds: 'truong_ai_commenter_group_ids_v1',
    scanMode: 'truong_ai_commenter_scan_mode_v1',
    groupLimit: 'truong_ai_commenter_group_limit_v1',
    loopPauseSeconds: 'truong_ai_commenter_loop_pause_seconds_v1',
    duplicatePauseSeconds: 'truong_ai_commenter_duplicate_pause_seconds_v1',
    linkPauseSeconds: 'truong_ai_commenter_link_pause_seconds_v1',
    pageLoadWaitSeconds: 'truong_ai_commenter_page_load_wait_seconds_v1',
    imageLoadWaitSeconds: 'truong_ai_commenter_image_load_wait_seconds_v1',
    afterSendWaitSeconds: 'truong_ai_commenter_after_send_wait_seconds_v1',
    scannedLinks: 'truong_ai_commenter_scanned_group_links_v2',
    extensionId: 'truong_ai_commenter_extension_id_v1'
  }
};

const $ = (selector, root = document) => root.querySelector(selector);
const els = {
  apiKeyInput: $('#apiKeyInput'),
  modelInput: $('#modelInput'),
  apiStatus: $('#apiStatus'),
  toggleKeyBtn: $('#toggleKeyBtn'),
  saveApiBtn: $('#saveApiBtn'),
  clearApiBtn: $('#clearApiBtn'),
  articleInput: $('#articleInput'),
  facebookUrlsInput: $('#facebookUrlsInput'),
  groupIdsInput: $('#groupIdsInput'),
  scanSourceModeSelect: $('#scanSourceModeSelect'),
  groupLimitInput: $('#groupLimitInput'),
  loopPauseSecondsInput: $('#loopPauseSecondsInput'),
  duplicatePauseSecondsInput: $('#duplicatePauseSecondsInput'),
  linkPauseSecondsInput: $('#linkPauseSecondsInput'),
  pageLoadWaitSecondsInput: $('#pageLoadWaitSecondsInput'),
  imageLoadWaitSecondsInput: $('#imageLoadWaitSecondsInput'),
  afterSendWaitSecondsInput: $('#afterSendWaitSecondsInput'),
  scanGroupLinksBtn: $('#scanGroupLinksBtn'),
  autoGroupLoopBtn: $('#autoGroupLoopBtn'),
  runExistingLinksBtn: $('#runExistingLinksBtn'),
  stopGroupLoopBtn: $('#stopGroupLoopBtn'),
  groupScanStatus: $('#groupScanStatus'),
  scanConfigSummary: $('#scanConfigSummary'),
  scannedLinksInput: $('#scannedLinksInput'),
  scannedLinksCounter: $('#scannedLinksCounter'),
  clearScannedLinksBtn: $('#clearScannedLinksBtn'),
  productLinkInput: $('#productLinkInput'),
  toneSelect: $('#toneSelect'),
  commentModeSelect: $('#commentModeSelect'),
  generateBtn: $('#generateBtn'),
  runFacebookBtn: $('#runFacebookBtn'),
  clearBtn: $('#clearBtn'),
  fetchArticleApiBtn: $('#fetchArticleApiBtn'),
  pasteBtn: $('#pasteBtn'),
  copyBtn: $('#copyBtn'),
  saveHistoryBtn: $('#saveHistoryBtn'),
  output: $('#output'),
  articleCounter: $('#articleCounter'),
  urlCounter: $('#urlCounter'),
  linkCounter: $('#linkCounter'),
  linkStatus: $('#linkStatus'),
  listingTotal: $('#listingTotal'),
  addressTotal: $('#addressTotal'),
  typeTotal: $('#typeTotal'),
  listingCards: $('#listingCards'),
  toggleListingFormBtn: $('#toggleListingFormBtn'),
  listingFormPanel: $('#listingFormPanel'),
  productNameInput: $('#productNameInput'),
  normalizedPreview: $('#normalizedPreview'),
  listingImageInput: $('#listingImageInput'),
  chooseImageBtn: $('#chooseImageBtn'),
  clearImageBtn: $('#clearImageBtn'),
  imagePreview: $('#imagePreview'),
  imageStatus: $('#imageStatus'),
  listingAddressInput: $('#listingAddressInput'),
  listingTypeInput: $('#listingTypeInput'),
  listingPriceInput: $('#listingPriceInput'),
  listingAreaInput: $('#listingAreaInput'),
  listingTermInput: $('#listingTermInput'),
  listingFurnitureInput: $('#listingFurnitureInput'),
  listingAmenitiesInput: $('#listingAmenitiesInput'),
  listingContactInput: $('#listingContactInput'),
  listingNoteInput: $('#listingNoteInput'),
  addListingBtn: $('#addListingBtn'),
  resetListingFormBtn: $('#resetListingFormBtn'),
  clearListingBtn: $('#clearListingBtn'),
  attachImageCheckbox: $('#attachImageCheckbox'),
  fallbackTextCheckbox: $('#fallbackTextCheckbox'),
  closeTabCheckbox: $('#closeTabCheckbox'),
  extensionBadge: $('#extensionBadge'),
  extensionIdInput: $('#extensionIdInput'),
  saveExtensionIdBtn: $('#saveExtensionIdBtn'),
  selectedBox: $('#selectedBox'),
  selectedImage: $('#selectedImage'),
  selectedTitle: $('#selectedTitle'),
  selectedMeta: $('#selectedMeta'),
  toastHost: $('#toastHost')
};

let currentImage = null;
let imageWasCleared = false;
let editingId = null;
let dbPromise = null;
let isRunning = false;
let groupLoopRunning = false;
let extensionInfo = { ready: false, version: '' };

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function safeJsonParse(value, fallback) {
  try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
}
function loadStorage(key, fallback) { return safeJsonParse(localStorage.getItem(key), fallback); }
function saveStorage(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function removeStorage(key) { localStorage.removeItem(key); }
function field(value) { return String(value || '').trim(); }
function cleanApiKey(value) { return field(value).replace(/^Bearer\s+/i, ''); }
function normalizeContactInfo(raw) {
  return String(raw || '').split(/\n+/).map(x => x.trim()).filter(Boolean).join(' | ');
}
function stripAiWrapper(text) {
  return String(text || '')
    .replace(/^```(?:json|text|md|markdown)?/i, '')
    .replace(/```$/i, '')
    .replace(/^\s*["“”']|["“”']\s*$/g, '')
    .trim();
}
function getErrorText(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  try { return JSON.stringify(error); } catch { return String(error); }
}
function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  els.toastHost.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}
function setOutput(message, className = '') {
  els.output.textContent = message;
  els.output.className = `out-body ${className}`.trim();
}
function logLine(message) {
  const time = new Date().toLocaleTimeString('vi-VN');
  console.info(`[${time}] ${message}`);
}

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(APP.dbName, APP.dbVersion);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('listings')) db.createObjectStore('listings', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}
async function dbAll() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('listings', 'readonly');
    const req = tx.objectStore('listings').getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')));
    req.onerror = () => reject(req.error);
  });
}
async function dbPut(item) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('listings', 'readwrite');
    tx.objectStore('listings').put(item);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
async function dbDelete(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('listings', 'readwrite');
    tx.objectStore('listings').delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
async function dbClear() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('listings', 'readwrite');
    tx.objectStore('listings').clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function makeId() {
  return 'room_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}
function listingLine(item) {
  const parts = [
    ['Mã mẫu', item.id], ['Địa chỉ', item.address], ['Loại', item.type], ['Giá', item.price],
    ['Diện tích', item.area], ['Nội thất', item.furniture], ['Tiện ích', item.amenities],
    ['Thời hạn', item.term], ['Liên hệ bắt buộc', item.contact], ['Ghi chú', item.note]
  ].filter(([, value]) => field(value));
  return parts.map(([key, value]) => `${key}: ${value}`).join(' | ');
}
function listingStructured(item, index) {
  const lines = [`[MẪU ${index + 1}]`, `Mã mẫu: ${item.id}`];
  if (item.address) lines.push(`Địa chỉ/khu vực: ${item.address}`);
  if (item.type) lines.push(`Loại phòng/nhà: ${item.type}`);
  if (item.price) lines.push(`Giá: ${item.price}`);
  if (item.area) lines.push(`Diện tích: ${item.area}`);
  if (item.furniture) lines.push(`Nội thất: ${item.furniture}`);
  if (item.amenities) lines.push(`Tiện ích: ${item.amenities}`);
  if (item.term) lines.push(`Thời hạn: ${item.term}`);
  if (item.contact) lines.push(`Liên hệ bắt buộc: ${normalizeContactInfo(item.contact)}`);
  if (item.note) lines.push(`Ghi chú: ${item.note}`);
  lines.push(`Có ảnh mẫu: ${item.image?.dataUrl ? 'có' : 'không'}`);
  return lines.join('\n');
}
function uniqueCount(list, key) {
  return new Set(list.map(item => field(item[key]).toLowerCase()).filter(Boolean)).size;
}
async function getListingById(id) {
  const list = await dbAll();
  return list.find(item => item.id === id) || null;
}
function getFormData() {
  return {
    id: editingId || makeId(),
    address: field(els.listingAddressInput.value),
    type: field(els.listingTypeInput.value),
    price: field(els.listingPriceInput.value),
    area: field(els.listingAreaInput.value),
    furniture: field(els.listingFurnitureInput.value),
    amenities: field(els.listingAmenitiesInput.value),
    term: field(els.listingTermInput.value),
    contact: normalizeContactInfo(els.listingContactInput.value),
    note: field(els.listingNoteInput.value),
    image: currentImage,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function setListingFormVisible(show, scroll = false) {
  if (!els.listingFormPanel || !els.toggleListingFormBtn) return;
  els.listingFormPanel.classList.toggle('hidden', !show);
  els.toggleListingFormBtn.textContent = show ? '−' : '+';
  els.toggleListingFormBtn.title = show ? 'Ẩn form thêm mẫu' : 'Thêm mẫu';
  els.toggleListingFormBtn.setAttribute('aria-expanded', show ? 'true' : 'false');
  if (show && scroll) {
    setTimeout(() => els.listingFormPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
  }
}
function toggleListingForm() {
  const isHidden = els.listingFormPanel?.classList.contains('hidden');
  setListingFormVisible(!!isHidden, true);
}

function resetImage() {
  currentImage = null;
  imageWasCleared = true;
  els.listingImageInput.value = '';
  els.imagePreview.innerHTML = 'Chưa có ảnh';
  els.imageStatus.textContent = 'Nên dùng ảnh phòng/căn rõ nét, dung lượng vừa phải.';
}
function setImagePreview(image) {
  currentImage = image || null;
  imageWasCleared = false;
  if (image?.dataUrl) {
    els.imagePreview.innerHTML = `<img src="${image.dataUrl}" alt="Ảnh mẫu">`;
    els.imageStatus.textContent = `Đã chọn: ${image.name || 'ảnh mẫu'}`;
  } else {
    els.listingImageInput.value = '';
    els.imagePreview.innerHTML = 'Chưa có ảnh';
    els.imageStatus.textContent = 'Nên dùng ảnh phòng/căn rõ nét, dung lượng vừa phải.';
  }
}
function resetListingForm() {
  editingId = null;
  imageWasCleared = false;
  currentImage = null;
  els.listingAddressInput.value = '';
  els.listingTypeInput.value = '';
  els.listingPriceInput.value = '';
  els.listingAreaInput.value = '';
  els.listingTermInput.value = '';
  els.listingFurnitureInput.value = '';
  els.listingAmenitiesInput.value = '';
  els.listingContactInput.value = '';
  els.listingNoteInput.value = '';
  els.addListingBtn.textContent = '➕ Thêm vào kho';
  els.listingImageInput.value = '';
  els.imagePreview.innerHTML = 'Chưa có ảnh';
  els.imageStatus.textContent = 'Nên dùng ảnh phòng/căn rõ nét, dung lượng vừa phải.';
}
async function compressImage(file, maxWidth = 1280, maxHeight = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = image;
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({ dataUrl, name: file.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg', size: dataUrl.length, width, height });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được ảnh'));
    };
    image.src = url;
  });
}
async function renderListings() {
  const list = await dbAll();
  els.listingCards.innerHTML = '';
  els.listingTotal.textContent = String(list.length);
  els.addressTotal.textContent = String(uniqueCount(list, 'address'));
  els.typeTotal.textContent = String(uniqueCount(list, 'type'));
  els.productNameInput.value = list.map(listingLine).join('\n');
  els.normalizedPreview.value = list.map(listingStructured).join('\n\n');
  if (!list.length) {
    els.listingCards.innerHTML = '<div class="empty">Chưa có mẫu nào. Hãy thêm mẫu phòng/căn bằng form bên trên.</div>';
    return;
  }
  list.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'listing';
    card.title = listingStructured(item, index);
    const image = item.image?.dataUrl ? `<img src="${item.image.dataUrl}" alt="Ảnh ${escapeHtml(item.address || 'mẫu')}">` : '🏠';
    card.innerHTML = `<div class="thumb">${image}</div><div class="listing-name"><div class="address">📍 ${escapeHtml(item.address || `Mẫu ${index + 1}`)}</div><div class="type">🏠 ${escapeHtml(item.type || 'Chưa rõ loại')}</div><div class="type">☎️ ${escapeHtml(item.contact ? 'Đã có liên hệ' : 'Thiếu liên hệ')}</div></div><div class="lactions"><button class="btn btn-muted btn-sm" data-edit="${escapeHtml(item.id)}" type="button">Sửa</button><button class="btn btn-danger btn-sm" data-delete="${escapeHtml(item.id)}" type="button">Xoá</button></div>`;
    els.listingCards.appendChild(card);
  });
}
async function addListing() {
  const data = getFormData();
  if (!data.address && !data.type) {
    toast('Hãy nhập ít nhất địa chỉ/khu vực hoặc loại phòng.', 'warning');
    els.listingAddressInput.focus();
    return;
  }
  if (!data.contact) {
    toast('Hãy nhập thông tin liên hệ bắt buộc cho mẫu này.', 'warning');
    els.listingContactInput.focus();
    return;
  }
  const wasEditing = !!editingId;
  const old = editingId ? await getListingById(editingId) : null;
  if (old && !data.image && !imageWasCleared) data.image = old.image;
  data.createdAt = old?.createdAt || data.createdAt;
  await dbPut(data);
  resetListingForm();
  await renderListings();
  saveDraft();
  toast(wasEditing ? 'Đã cập nhật mẫu' : 'Đã thêm mẫu vào kho');
}
async function editListing(id) {
  const item = await getListingById(id);
  if (!item) return;
  editingId = item.id;
  imageWasCleared = false;
  els.listingAddressInput.value = item.address || '';
  els.listingTypeInput.value = item.type || '';
  els.listingPriceInput.value = item.price || '';
  els.listingAreaInput.value = item.area || '';
  els.listingTermInput.value = item.term || '';
  els.listingFurnitureInput.value = item.furniture || '';
  els.listingAmenitiesInput.value = item.amenities || '';
  els.listingContactInput.value = item.contact || '';
  els.listingNoteInput.value = item.note || '';
  setImagePreview(item.image || null);
  els.addListingBtn.textContent = '💾 Lưu mẫu đang sửa';
  setListingFormVisible(true, true);
  toast('Đã đưa mẫu lên form để sửa');
}
async function deleteListing(id) {
  await dbDelete(id);
  await renderListings();
  saveDraft();
  toast('Đã xoá mẫu khỏi kho', 'warning');
}
async function clearListings() {
  await dbClear();
  await renderListings();
  showSelected(null);
  saveDraft();
  toast('Đã xoá toàn bộ kho mẫu', 'warning');
}

function updateApiStatus() {
  const key = cleanApiKey(els.apiKeyInput.value);
  if (!key) {
    els.apiStatus.textContent = 'Chưa nhập API key';
    els.apiStatus.className = 'hint status warn';
    return;
  }
  els.apiStatus.textContent = `✅ API key sẵn sàng: ${key.length > 10 ? `${key.slice(0, 6)}...${key.slice(-4)}` : 'Đã nhập API key'}`;
  els.apiStatus.className = 'hint status ok';
}
function normalizeFacebookUrl(raw) {
  const value = field(raw);
  if (!value) return '';
  try {
    const url = new URL(value);
    if (!/(^|\.)facebook\.com$/i.test(url.hostname)) return '';
    if (!/^https?:$/i.test(url.protocol)) return '';
    url.hostname = 'www.facebook.com';
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}
function normalizedUrlKey(url) {
  return normalizeFacebookUrl(url).toLowerCase().replace(/[#?].*$/g, '').replace(/\/+$/g, '');
}
function uniqueUrls(list) {
  const out = [];
  const seen = new Set();
  for (const item of list || []) {
    const clean = normalizeFacebookUrl(item);
    if (!clean || !/^https?:\/\//i.test(clean)) continue;
    const key = normalizedUrlKey(clean);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }
  return out;
}
function getScannedLinks() {
  return uniqueUrls(loadStorage(APP.storage.scannedLinks, []));
}
function saveScannedLinks(list) {
  saveStorage(APP.storage.scannedLinks, uniqueUrls(list).slice(0, 5000));
  renderScannedLinks();
}
function renderScannedLinks() {
  const list = getScannedLinks();
  if (els.scannedLinksInput) els.scannedLinksInput.value = list.join('\n');
  if (els.scannedLinksCounter) els.scannedLinksCounter.textContent = `${list.length} link`;
}
function markLinkScanned(url) {
  const clean = normalizeFacebookUrl(url);
  if (!clean) return;
  const list = getScannedLinks();
  const key = normalizedUrlKey(clean);
  if (!list.some(item => normalizedUrlKey(item) === key)) list.unshift(clean);
  saveScannedLinks(list);
}
function filterUnscannedLinks(list) {
  const scanned = new Set(getScannedLinks().map(normalizedUrlKey));
  return uniqueUrls(list).filter(link => !scanned.has(normalizedUrlKey(link)));
}
function syncUrlInputFiltered() {
  const raw = uniqueUrls(String(els.facebookUrlsInput.value || '').split(/[\n\t ]+/));
  const next = filterUnscannedLinks(raw).join('\n');
  if (els.facebookUrlsInput.value !== next) els.facebookUrlsInput.value = next;
  updateCounters();
  saveDraft();
}
function urls() {
  return uniqueUrls(String(els.facebookUrlsInput.value || '').split(/[\n\t ]+/));
}
function removeUrlFromInput(url) {
  const key = normalizedUrlKey(url);
  const remain = urls().filter(item => normalizedUrlKey(item) !== key);
  els.facebookUrlsInput.value = remain.join('\n');
  updateCounters();
  saveDraft();
}
function parseGroupLines() {
  return String(els.groupIdsInput?.value || '').split(/[\n,;|]+/).map(field).filter(Boolean);
}
function numberInputValue(el, fallback, min, max) {
  const n = Number(el?.value);
  const value = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, value));
}
function getScanMode() {
  const mode = field(els.scanSourceModeSelect?.value) || 'group_latest';
  const normalized = mode === 'groups_feed' ? 'group_feed' : mode;
  return ['group_latest', 'group_top', 'group_feed', 'home_feed'].includes(normalized) ? normalized : 'group_latest';
}
function scanModeNeedsGroup(mode) {
  return mode === 'group_latest' || mode === 'group_top';
}
function scanModeLabel(mode) {
  return ({ group_latest: 'Bài viết mới', group_top: 'Bài viết Top', group_feed: 'Bản Tin Nhóm', groups_feed: 'Bản Tin Nhóm', home_feed: 'Bài Viết Trang Chủ' })[mode] || 'Bài viết mới';
}
function setGroupStatus(message, type = 'warn') {
  if (!els.groupScanStatus) return;
  els.groupScanStatus.textContent = message;
  els.groupScanStatus.className = `hint status ${type}`;
}
async function sleepMs(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, ms)));
}
async function waitCountdown(seconds, makeMessage, shouldContinue = () => true) {
  const total = Math.max(0, Number(seconds) || 0);
  if (!total) return;
  const endAt = Date.now() + total * 1000;
  while (shouldContinue() && Date.now() < endAt) {
    const remain = Math.ceil((endAt - Date.now()) / 1000);
    setGroupStatus(makeMessage(remain), 'warn');
    await sleepMs(Math.min(1000, Math.max(150, endAt - Date.now())));
  }
}
function updateScanConfigSummary() {
  if (!els.scanConfigSummary) return;
  const mode = getScanMode();
  const limit = numberInputValue(els.groupLimitInput, 5, 1, 50);
  const linkPause = numberInputValue(els.linkPauseSecondsInput, 60, 0, 86400);
  const loopPause = numberInputValue(els.loopPauseSecondsInput, 240, 0, 86400);
  const duplicatePause = numberInputValue(els.duplicatePauseSecondsInput, 300, 0, 86400);
  els.scanConfigSummary.textContent = `Nguồn quét: ${scanModeLabel(mode)} · ${limit} link/nhóm · nghỉ ${linkPause}s/link · ${loopPause}s/vòng · trùng hết nghỉ ${duplicatePause}s`;
}
function updateCounters() {
  els.articleCounter.textContent = `${els.articleInput.value.length}/8000`;
  els.urlCounter.textContent = `${urls().length} link`;
  if (els.linkCounter) els.linkCounter.textContent = '0 ký tự';
  if (els.linkStatus) els.linkStatus.textContent = 'Thông tin liên hệ đã chuyển vào từng mẫu';
  updateScanConfigSummary();
}

function collectMetaObjects(value, out = []) {
  if (!value) return out;
  if (Array.isArray(value)) {
    value.forEach(item => collectMetaObjects(item, out));
    return out;
  }
  if (typeof value === 'object') {
    out.push(value);
    Object.values(value).forEach(item => collectMetaObjects(item, out));
  }
  return out;
}
function pickMetaField(data, keys) {
  const objects = collectMetaObjects(data, []);
  for (const obj of objects) {
    for (const key of keys) {
      const direct = obj[key];
      if (typeof direct === 'string' && field(direct)) return field(direct);
    }
    for (const [key, value] of Object.entries(obj)) {
      if (!keys.some(target => String(key).toLowerCase() === String(target).toLowerCase())) continue;
      if (typeof value === 'string' && field(value)) return field(value);
    }
  }
  return '';
}
function extractMetaArticle(data) {
  const description = pickMetaField(data, [
    'description',
    'og:description',
    'ogDescription',
    'twitter:description',
    'twitterDescription',
    'metaDescription'
  ]);
  const title = pickMetaField(data, [
    'title',
    'og:title',
    'ogTitle',
    'twitter:title',
    'twitterTitle'
  ]);
  const text = description || title;
  return field(String(text || '').replace(/\s+/g, ' '));
}
async function portableHttpRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const bodyText = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type') || '',
      bodyText
    };
  } catch (directError) {
    try {
      const proxyResult = await sendExt({
        type: 'HTTP_JSON_REQUEST',
        url,
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body || ''
      }, 120000);
      const bodyText = typeof proxyResult.bodyText === 'string'
        ? proxyResult.bodyText
        : typeof proxyResult.body === 'string'
          ? proxyResult.body
          : proxyResult.data !== undefined
            ? JSON.stringify(proxyResult.data)
            : proxyResult.json !== undefined
              ? JSON.stringify(proxyResult.json)
              : '';
      return {
        ...proxyResult,
        bodyText,
        contentType: proxyResult.contentType || proxyResult.headers?.['content-type'] || proxyResult.headers?.['Content-Type'] || (bodyText.trim().startsWith('{') || bodyText.trim().startsWith('[') ? 'application/json' : ''),
        status: Number(proxyResult.status || proxyResult.statusCode || 200),
        statusText: proxyResult.statusText || '',
        ok: proxyResult.ok !== false && proxyResult.httpOk !== false
      };
    } catch (extensionError) {
      throw new Error(`Không gọi được API từ GitHub Pages: ${getErrorText(extensionError) || getErrorText(directError)}`);
    }
  }
}
function parsePortableBody(result) {
  if (result?.data !== undefined && typeof result.data !== 'string') return result.data;
  if (result?.json !== undefined && typeof result.json !== 'string') return result.json;
  if (String(result.contentType || '').includes('application/json')) {
    try { return JSON.parse(result.bodyText || 'null'); } catch {}
  }
  const raw = String(result.bodyText || '').trim();
  if (raw.startsWith('{') || raw.startsWith('[')) {
    try { return JSON.parse(raw); } catch {}
  }
  return result.bodyText || '';
}
function bridgeResponseData(response) {
  return response?.payload || response?.data || response?.result || response || {};
}
function extractLinksFromExtensionResponse(response) {
  const data = bridgeResponseData(response);
  const raw = data.links || data.urls || data.postLinks || data.items || [];
  if (Array.isArray(raw)) {
    return raw.map(item => typeof item === 'string' ? item : (item?.url || item?.link || item?.href || '')).filter(Boolean);
  }
  if (typeof raw === 'string') return raw.split(/[\n\s]+/).filter(Boolean);
  return [];
}
function extractArticleFromExtensionResponse(response) {
  const data = bridgeResponseData(response);
  const candidates = [
    data.article,
    data.content,
    data.text,
    data.title,
    data.postText,
    data.message,
    response?.article,
    response?.content,
    response?.title
  ];
  return candidates.map(value => field(value)).find(isUsableArticleText) || '';
}
function isUsableArticleText(text) {
  const value = field(String(text || '').replace(/\s+/g, ' '));
  if (value.length < 8) return false;
  const normalized = value.toLowerCase();
  const generic = [
    'log into facebook',
    'đăng nhập facebook',
    'facebook – log in or sign up',
    'facebook - log in or sign up',
    'facebook helps you connect and share',
    'see posts, photos and more on facebook',
    'hãy đăng nhập để tiếp tục'
  ];
  return !generic.some(item => normalized.includes(item));
}
async function fetchArticleByMetaApi(url) {
  const result = await portableHttpRequest(APP.metaApiUrl, {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ urls: [url] })
  });
  if (!result.ok) throw new Error(`${result.status} ${result.statusText}: ${String(result.bodyText || '').slice(0, 1200)}`);
  const article = extractMetaArticle(parsePortableBody(result));
  if (!isUsableArticleText(article)) throw new Error('API chỉ trả về trang Facebook chung hoặc nội dung quá ngắn, chưa đọc được bài viết thật.');
  return article;
}
async function fetchArticleSmart(url) {
  try {
    const response = await sendExt({
      type: 'READ_FB_POST_BY_API',
      action: 'READ_FB_POST_BY_API',
      url,
      link: url,
      delayMs: 30000,
      timeoutMs: 30000,
      maxChars: 8000,
      useRakkoApi: true,
      openInBackground: true,
      active: false,
      closeAfter: true,
      closeAfterRead: true,
      keepOpen: false,
      useFbPostLogic: true
    }, 45000);
    const article = extractArticleFromExtensionResponse(response);
    if (article) return article;
  } catch (error) {
    logLine(`Extension/Rakko API chưa đọc được bài, chuyển sang API dự phòng từ web: ${getErrorText(error)}`);
  }
  return fetchArticleByMetaApi(url);
}
async function fetchArticleApiToInput() {
  const list = urls();
  const url = list[0];
  if (!url) {
    toast('Hãy nhập ít nhất 1 URL bài viết Facebook trước.', 'warning');
    els.facebookUrlsInput.focus();
    return;
  }

  els.fetchArticleApiBtn.disabled = true;
  const oldText = els.fetchArticleApiBtn.textContent;
  els.fetchArticleApiBtn.textContent = '⏳ Đang lấy...';
  try {
    const article = await fetchArticleSmart(url);
    els.articleInput.value = article.slice(0, 8000);
    markLinkScanned(url);
    removeUrlFromInput(url);
    updateCounters();
    saveDraft();
    logLine(`🌐 API đã lấy nội dung: ${article.slice(0, 140).replace(/\s+/g, ' ')}${article.length > 140 ? '...' : ''}`);
    toast('Đã lấy Nội dung bài viết gốc bằng API');
  } catch (error) {
    const message = getErrorText(error);
    logLine(`❌ API lấy nội dung lỗi: ${message}`);
    toast(message, 'error');
    setOutput('❌ API lấy nội dung lỗi: ' + message, 'error');
  } finally {
    els.fetchArticleApiBtn.disabled = false;
    els.fetchArticleApiBtn.textContent = oldText;
  }
}

function saveApiConfig(options = {}) {
  const key = cleanApiKey(els.apiKeyInput.value);
  const model = field(els.modelInput.value) || APP.defaultModel;
  if (key) saveStorage(APP.storage.apiKey, key);
  saveStorage(APP.storage.model, model);
  els.apiKeyInput.value = key;
  els.modelInput.value = model;
  updateApiStatus();
  if (!options.silent) toast('Đã lưu cấu hình API');
}
function restoreApiConfig() {
  els.apiKeyInput.value = loadStorage(APP.storage.apiKey, '');
  let savedModel = loadStorage(APP.storage.model, APP.defaultModel);
  if (savedModel === 'gpt-4.1') savedModel = 'gpt-4.1-mini';
  els.modelInput.value = savedModel;
  if (!field(els.modelInput.value)) els.modelInput.value = APP.defaultModel;
  saveStorage(APP.storage.model, els.modelInput.value);
  updateApiStatus();
}
function clearApiConfig() {
  removeStorage(APP.storage.apiKey);
  els.apiKeyInput.value = '';
  updateApiStatus();
  toast('Đã xoá API key');
}
function saveDraft() {
  saveStorage(APP.storage.draft, {
    article: els.articleInput.value,
    urls: els.facebookUrlsInput.value,
    contact: els.productLinkInput.value,
    tone: els.toneSelect.value,
    mode: els.commentModeSelect.value,
    attachImage: els.attachImageCheckbox.checked,
    fallbackText: els.fallbackTextCheckbox.checked,
    closeTab: els.closeTabCheckbox.checked,
    groupIds: els.groupIdsInput?.value || '',
    scanMode: els.scanSourceModeSelect?.value || 'group_latest',
    groupLimit: els.groupLimitInput?.value || '5',
    loopPauseSeconds: els.loopPauseSecondsInput?.value || '240',
    duplicatePauseSeconds: els.duplicatePauseSecondsInput?.value || '300',
    linkPauseSeconds: els.linkPauseSecondsInput?.value || '60',
    pageLoadWaitSeconds: els.pageLoadWaitSecondsInput?.value || '10',
    imageLoadWaitSeconds: els.imageLoadWaitSecondsInput?.value || '5',
    afterSendWaitSeconds: els.afterSendWaitSecondsInput?.value || '7'
  });
}
function restoreDraft() {
  const draft = loadStorage(APP.storage.draft, null);
  if (!draft) return;
  els.articleInput.value = draft.article || '';
  els.facebookUrlsInput.value = draft.urls || '';
  els.productLinkInput.value = draft.contact || '';
  if (draft.tone) els.toneSelect.value = draft.tone;
  if (draft.mode) els.commentModeSelect.value = draft.mode;
  els.attachImageCheckbox.checked = draft.attachImage !== false;
  els.fallbackTextCheckbox.checked = draft.fallbackText !== false;
  els.closeTabCheckbox.checked = draft.closeTab !== false;
  if (els.groupIdsInput) els.groupIdsInput.value = draft.groupIds ?? loadStorage(APP.storage.groupIds, '');
  if (els.scanSourceModeSelect) els.scanSourceModeSelect.value = draft.scanMode || loadStorage(APP.storage.scanMode, 'group_latest');
  if (els.groupLimitInput) els.groupLimitInput.value = draft.groupLimit || loadStorage(APP.storage.groupLimit, '5');
  if (els.loopPauseSecondsInput) els.loopPauseSecondsInput.value = draft.loopPauseSeconds || loadStorage(APP.storage.loopPauseSeconds, '240');
  if (els.duplicatePauseSecondsInput) els.duplicatePauseSecondsInput.value = draft.duplicatePauseSeconds || loadStorage(APP.storage.duplicatePauseSeconds, '300');
  if (els.linkPauseSecondsInput) els.linkPauseSecondsInput.value = draft.linkPauseSeconds || loadStorage(APP.storage.linkPauseSeconds, '60');
  if (els.pageLoadWaitSecondsInput) els.pageLoadWaitSecondsInput.value = draft.pageLoadWaitSeconds || loadStorage(APP.storage.pageLoadWaitSeconds, '10');
  if (els.imageLoadWaitSecondsInput) els.imageLoadWaitSecondsInput.value = draft.imageLoadWaitSeconds || loadStorage(APP.storage.imageLoadWaitSeconds, '5');
  if (els.afterSendWaitSecondsInput) els.afterSendWaitSecondsInput.value = draft.afterSendWaitSeconds || loadStorage(APP.storage.afterSendWaitSeconds, '7');
}


function extractResponseText(data) {
  if (typeof data === 'string') return data;
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(part => part?.text || part?.content || '').join('').trim();
  return data?.content || data?.text || data?.message?.content || '';
}
async function readErrorBody(response) {
  const contentType = response.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      const json = await response.json();
      return json?.error?.message || json?.message || JSON.stringify(json);
    }
    return await response.text();
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}
async function callChatCompletions({ apiKey, model, prompt }) {
  const result = await portableHttpRequest(APP.defaultApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] })
  });
  if (!result.ok) throw new Error(`${result.status} ${result.statusText}: ${String(result.bodyText || '').slice(0, 1600)}`);
  const data = parsePortableBody(result);
  const text = extractResponseText(data);
  if (!field(text)) throw new Error('API trả về rỗng.');
  return text;
}
function buildClassificationPrompt(article) {
  return `Bạn là bộ lọc bài viết Facebook cho công cụ auto comment phòng trọ/nhà ở.\n\nNội dung bài viết gốc:\n"${article}"\n\nQuy tắc:\n1. Trả về "next" nếu người đăng là người CHO THUÊ, người BÁN, chủ phòng, môi giới đăng tin có phòng/căn/nhà, đăng giá thuê, quảng cáo phòng/nhà.\n2. Trả về "reply" nếu người đăng là khách đang CẦN THUÊ, CẦN MUA, TÌM PHÒNG, TÌM NHÀ, hỏi ai biết phòng, cần ở ghép, cần thuê gần khu vực nào đó, cần mua nhà/căn nào đó.\n3. Trả về "next" nếu bài không rõ nhu cầu, spam, tuyển môi giới, ngoài chủ đề hoặc không chắc chắn.\n\nChỉ trả về đúng 1 từ viết thường: next hoặc reply.`;
}
function parseClass(raw) {
  const value = String(raw || '').toLowerCase().replace(/[`"'“”‘’.,:;!?()[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
  if (/\breply\b/.test(value)) return 'reply';
  return 'next';
}
function buildJsonPrompt({ article, structuredListings, tone, mode }) {
  const modeText = {
    auto: 'Tự nhận diện khách cần thuê hay cần mua. Ưu tiên so khớp vị trí trước, sau đó loại phòng/nhà, giá, tiện ích.',
    rent: 'Khách cần thuê phòng/nhà. Chọn mẫu phù hợp nhất theo vị trí và loại phòng.',
    buy: 'Khách cần mua nhà/căn hộ. Chọn mẫu phù hợp nhất theo vị trí/ngân sách/loại nhà.',
    ask_more: 'Hỏi thêm nhu cầu còn thiếu, nhưng vẫn chọn mẫu gần nhất để gợi ý tham khảo.'
  }[mode] || 'Tự nhận diện và chọn mẫu phù hợp nhất.';

  return `Bạn là người tư vấn phòng trọ/nhà ở đang trả lời bình luận trong nhóm Facebook. Hãy viết tự nhiên, gần gũi, thân thiện như người thật; không viết kiểu quảng cáo máy móc.

Nhiệm vụ:
- Đọc sát bài viết gốc của khách.
- Chọn đúng 1 mẫu phù hợp nhất trong kho.
- Viết bình luận nhiều dòng có icon, dễ đọc trên Facebook.

Bài viết gốc của khách:
"${article}"

Kho mẫu phòng/nhà đang có:
${structuredListings}

Phong cách: ${tone}
Logic: ${modeText}

Cách chọn mẫu:
1. Ưu tiên vị trí/khu vực/địa chỉ trùng hoặc gần nhất với nhu cầu khách.
2. Sau vị trí mới so khớp loại phòng/nhà, ngân sách, diện tích, nội thất, tiện ích và thời hạn.
3. Chỉ dùng thông tin của đúng mẫu đã chọn, tuyệt đối không trộn nhiều mẫu.
4. Nếu không có mẫu trùng khu vực, chọn mẫu gần hoặc phù hợp nhất và nói rõ theo hướng "bạn tham khảo thêm căn này", không khẳng định sai vị trí.
5. Không bịa giá, diện tích, tiện ích, khoảng cách, thời gian di chuyển hoặc bất kỳ dữ liệu nào không có trong mẫu.
6. Bắt buộc dùng đúng "Liên hệ bắt buộc" của mẫu đã chọn và đặt ở dòng 📞 ngay trước lời mời inbox cuối.

Bố cục bình luận bắt buộc:
- Dòng 1 là câu phản hồi tự nhiên, không có icon. Câu này phải bám sát 1 đến 2 chi tiết quan trọng có thật trong bài gốc như khu vực, loại phòng, ngân sách, thời điểm vào ở hoặc nhu cầu cụ thể. Không sao chép nguyên tiêu đề và không nhắc lại quá nhiều thông tin.
- Dòng 2 là đúng 1 câu chuyển ý, không có icon. Câu này phải giới thiệu mẫu đã chọn và nói rõ vì sao căn đó phù hợp với khách ở ít nhất 1 điểm cụ thể như vị trí, loại phòng, giá, nội thất hoặc thời điểm vào ở.
- Không dùng câu chuyển ý chung chung như "Em có căn này khá phù hợp", "Mình có căn này khá sát nhu cầu", "Em xin giới thiệu căn bên dưới" hoặc "Nếu cần thông tin thì ib em nhé".
- Nếu mẫu không trùng hoàn toàn khu vực hoặc ngân sách, phải diễn đạt trung thực theo hướng "mình có thể tham khảo thêm căn này" và nêu điểm gần/phù hợp nhất; không nói là đúng nhu cầu.
- Sau dòng chuyển ý, xuống đúng 1 dòng để sang dòng icon đầu tiên; không tạo dòng trống.
- Phần thông tin căn phải có mỗi ý trên một dòng riêng và mỗi dòng bắt đầu bằng đúng 1 icon phù hợp.
- Chỉ tạo dòng cho dữ liệu thật đang có trong mẫu; thiếu mục nào thì bỏ mục đó, không tự bổ sung.
- Dùng các icon theo ý nghĩa sau khi phù hợp:
  📍 địa chỉ/khu vực và ưu điểm vị trí có thật
  🏠 loại phòng/nhà, bố cục hoặc đặc điểm chính
  💰 giá
  📐 diện tích
  🛋️ nội thất
  🧺 máy giặt hoặc tiện nghi sinh hoạt
  🌞 cửa sổ, ban công, ánh sáng hoặc độ thoáng
  🚗 chỗ để xe, ô tô hoặc giao thông
  ✨ các tiện ích khác
  🕓 thời hạn thuê hoặc thời điểm vào ở
  📞 thông tin liên hệ bắt buộc
- Gộp các thông tin cùng nhóm vào một dòng ngắn, không lặp lại nguyên câu chuyển ý.
- Dòng 📞 phải dùng đúng thông tin liên hệ của mẫu đã chọn và đặt ngay trước lời mời inbox cuối.
- Dòng cuối cùng, không có icon, bắt buộc viết đúng câu: "Nếu cần biết thêm thông tin về phòng thì ib em nhé."

Quy tắc trình bày:
- Tổng thể khoảng 8 đến 12 dòng, có thể ít hơn nếu mẫu có ít dữ liệu.
- Không hashtag, không dấu đầu dòng dạng gạch ngang, không markdown, không tiêu đề quảng cáo.
- Không dùng icon ở dòng phản hồi, dòng chuyển ý và dòng mời inbox cuối.
- Không viết thành một đoạn dài; bắt buộc giữ nguyên từng dòng.
- Mỗi phần chỉ cách nhau đúng 1 lần xuống dòng; tuyệt đối không có dòng trống hoặc 2 ký tự xuống dòng liên tiếp.
- Không dùng từ ngữ phóng đại như "siêu rẻ", "cực hot", "duy nhất" nếu mẫu không có.

Chỉ trả về JSON hợp lệ, không thêm chữ ngoài JSON. Trong trường comment phải dùng chuỗi \\n để biểu diễn xuống dòng, theo đúng dạng:
{"selected_id":"Mã mẫu đã chọn","comment":"Câu phản hồi bám sát nhu cầu khách.\\nCâu chuyển ý nêu rõ lý do căn này phù hợp.\\n📍 Thông tin địa chỉ/khu vực\\n🏠 Thông tin loại phòng hoặc đặc điểm chính\\n🛋️ Thông tin nội thất\\n✨ Thông tin tiện ích\\n🕓 Thông tin thời hạn nếu có\\n📞 Thông tin liên hệ bắt buộc\\nNếu cần biết thêm thông tin về phòng thì ib em nhé."}`;
}
function normalizeAiComment(value) {
  const requiredCta = 'Nếu cần biết thêm thông tin về phòng thì ib em nhé.';
  let text = stripAiWrapper(value).replace(/\r\n?/g, '\n');
  if (!text.includes('\n') && text.includes('\\n')) text = text.replace(/\\n/g, '\n');

  text = text
    .replace(/nếu cần biết thêm thông tin về phòng thì ib em nhé[.!]?/gi, '')
    .replace(/\n{2,}/g, '\n');

  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (!lines.length) return '';
  if (/^next$/i.test(lines.join(' '))) return 'next';

  const iconLinePattern = /^[📍🏠💰📐🛋️🧺🌞🚗✨🕓📞]/u;
  const firstIconIndex = lines.findIndex(line => iconLinePattern.test(line));
  let leadLines = firstIconIndex >= 0 ? lines.slice(0, firstIconIndex) : lines.slice();
  const detailLines = firstIconIndex >= 0 ? lines.slice(firstIconIndex) : [];

  leadLines = leadLines
    .map(line => line.replace(/\s{2,}/g, ' ').replace(/\s+([,.;!?])/g, '$1').trim())
    .filter(Boolean);

  // Nếu AI gộp câu phản hồi và câu chuyển ý vào cùng một dòng, tách tối đa thành 2 dòng.
  if (leadLines.length === 1) {
    const sentences = leadLines[0].match(/[^.!?]+[.!?]+|[^.!?]+$/gu) || [];
    const cleaned = sentences.map(sentence => sentence.trim()).filter(Boolean);
    if (cleaned.length >= 2) {
      leadLines = [cleaned[0], cleaned.slice(1).join(' ')];
    }
  } else if (leadLines.length > 2) {
    leadLines = [leadLines[0], leadLines.slice(1).join(' ')];
  }

  leadLines = leadLines.map(line => /[.!?]$/.test(line) ? line : `${line}.`);

  const normalizedDetails = detailLines
    .map(line => line.replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean);

  return [...leadLines, ...normalizedDetails, requiredCta]
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
function enforceSelectedContact(comment, selected) {
  const requiredCta = 'Nếu cần biết thêm thông tin về phòng thì ib em nhé.';
  const normalized = normalizeAiComment(comment);
  if (!normalized || /^next$/i.test(normalized)) return normalized;
  const contact = normalizeContactInfo(selected?.contact).replace(/\s*\|\s*/g, ' · ');
  if (!contact) return normalized;
  const lines = normalized
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !/^📞/u.test(line) && line.toLowerCase() !== requiredCta.toLowerCase());
  return [...lines, `📞 ${contact}`, requiredCta].join('\n');
}
function parseJsonResult(raw) {
  let text = stripAiWrapper(raw);
  const match = text.match(/\{[\s\S]*\}/);
  if (match) text = match[0];
  try {
    const json = JSON.parse(text);
    return { selected_id: field(json.selected_id), comment: normalizeAiComment(json.comment) };
  } catch {
    const selectedMatch = text.match(/"selected_id"\s*:\s*"([^"]*)"/i);
    const commentMatch = text.match(/"comment"\s*:\s*"([\s\S]*)"\s*}\s*$/i);
    if (commentMatch) {
      const looseComment = commentMatch[1]
        .replace(/\\"/g, '"')
        .replace(/\\r\\n|\\n|\\r/g, '\n')
        .replace(/\\t/g, ' ')
        .replace(/\\\\/g, '\\');
      return {
        selected_id: field(selectedMatch?.[1]),
        comment: normalizeAiComment(looseComment)
      };
    }
    return { selected_id: '', comment: normalizeAiComment(raw) };
  }
}
function normalizeSelectedToken(value) {
  return field(value)
    .replace(/^mã\s*mẫu\s*[:#-]?\s*/i, '')
    .replace(/^selected[_\s-]*id\s*[:#-]?\s*/i, '')
    .replace(/^["'“”‘’`]+|["'“”‘’`.,;:]+$/g, '')
    .trim()
    .toLowerCase();
}
function resolveSelectedListing(listings, parsed, raw) {
  const token = normalizeSelectedToken(parsed?.selected_id);
  if (token) {
    const exact = listings.find(item => normalizeSelectedToken(item.id) === token);
    if (exact) return exact;

    const byAddress = listings.find(item => normalizeSelectedToken(item.address) === token);
    if (byAddress) return byAddress;

    const numberMatch = token.match(/(?:mẫu|mau)?\s*(\d{1,3})$/i);
    if (numberMatch) {
      const index = Number(numberMatch[1]) - 1;
      if (index >= 0 && index < listings.length) return listings[index];
    }
  }

  const rawText = String(raw || '').toLowerCase();
  const mentioned = listings
    .map((item, index) => ({ item, index: rawText.indexOf(String(item.id || '').toLowerCase()) }))
    .filter(entry => entry.index >= 0)
    .sort((a, b) => a.index - b.index);
  if (mentioned.length) return mentioned[0].item;

  const sampleMatch = rawText.match(/(?:mẫu|mau)\s*(?:số|so)?\s*[#:]?\s*(\d{1,3})/i);
  if (sampleMatch) {
    const index = Number(sampleMatch[1]) - 1;
    if (index >= 0 && index < listings.length) return listings[index];
  }

  return listings[0] || null;
}
async function aiCreateComment(article) {
  const apiKey = cleanApiKey(els.apiKeyInput.value);
  const model = field(els.modelInput.value) || APP.defaultModel;
  const listings = await dbAll();
  const structured = listings.map(listingStructured).join('\n\n').trim();

  if (!apiKey) throw new Error('Chưa nhập API key');
  if (!field(article)) throw new Error('Chưa có nội dung bài viết');
  if (!structured) throw new Error('Kho mẫu đang trống');
  const missingContact = listings.filter(item => !normalizeContactInfo(item.contact));
  if (missingContact.length) throw new Error('Có mẫu chưa nhập thông tin liên hệ. Hãy bấm Sửa và bổ sung liên hệ cho từng mẫu.');

  saveApiConfig({ silent: true });
  saveDraft();

  const classRaw = await callChatCompletions({ apiKey, model, prompt: buildClassificationPrompt(article) });
  const classification = parseClass(stripAiWrapper(classRaw));
  if (classification === 'next') return { classification: 'next', selected: null, comment: 'next' };

  const raw = await callChatCompletions({
    apiKey,
    model,
    prompt: buildJsonPrompt({ article, structuredListings: structured, tone: els.toneSelect.value, mode: els.commentModeSelect.value })
  });
  const parsed = parseJsonResult(raw);
  const selected = resolveSelectedListing(listings, parsed, raw);
  const comment = enforceSelectedContact(field(parsed.comment || stripAiWrapper(raw)), selected);
  if (/^next$/i.test(comment)) {
    return { classification: 'next', selected: null, comment: 'next' };
  }
  if (!comment) throw new Error('AI không tạo được nội dung comment hợp lệ.');
  return { classification: 'reply', selected, comment };
}
function showSelected(listing) {
  if (!listing) {
    els.selectedBox.classList.remove('show');
    els.selectedImage.removeAttribute('src');
    return;
  }
  els.selectedBox.classList.add('show');
  els.selectedImage.src = listing.image?.dataUrl || '';
  els.selectedImage.style.display = listing.image?.dataUrl ? 'block' : 'none';
  els.selectedTitle.textContent = listing.address || 'Mẫu được chọn';
  els.selectedMeta.textContent = `${listing.type || 'Chưa rõ loại phòng/nhà'}${listing.contact ? ' · Liên hệ: ' + listing.contact : ''}`;
}
async function generateManual() {
  const article = field(els.articleInput.value);
  if (!article) {
    toast('Vui lòng dán nội dung bài viết để test.', 'warning');
    els.articleInput.focus();
    return;
  }
  els.generateBtn.disabled = true;
  els.generateBtn.textContent = '⏳ Đang tạo...';
  setOutput('Đang lọc bài và chọn mẫu phù hợp...', 'loading');
  try {
    const result = await aiCreateComment(article);
    showSelected(result.selected);
    setOutput(result.comment || 'Không có phản hồi từ API.', result.comment ? '' : 'error');
    if (result.comment && result.comment !== 'next') await copyText(result.comment, { silent: true });
    toast(result.classification === 'next' ? 'Bài này trả về next' : 'Đã tạo bình luận và chọn mẫu');
  } catch (error) {
    setOutput('❌ ' + getErrorText(error), 'error');
    toast(getErrorText(error), 'error');
  } finally {
    els.generateBtn.disabled = false;
    els.generateBtn.textContent = '✨ Tạo bình luận thử';
  }
}
async function copyText(text, options = {}) {
  const value = field(text);
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    if (!options.silent) toast('Đã sao chép');
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    textarea.remove();
    if (!options.silent) toast(ok ? 'Đã sao chép' : 'Trình duyệt chặn sao chép', ok ? 'success' : 'warning');
    return ok;
  }
}
function normalizeExtensionId(value) {
  const raw = String(value || '').trim().toLowerCase();
  const exact = raw.match(/[a-p]{32}/);
  if (exact) return exact[0];
  return raw.replace(/[^a-p]/g, '');
}
function getExtensionId() {
  return normalizeExtensionId(els.extensionIdInput?.value || loadStorage(APP.storage.extensionId, '') || APP.fixedExtensionId);
}
function saveExtensionId(options = {}) {
  const id = getExtensionId();
  if (id && id.length !== 32) {
    if (!options.silent) toast('Extension ID phải gồm đúng 32 ký tự từ a đến p.', 'warning');
    return false;
  }
  saveStorage(APP.storage.extensionId, id);
  if (els.extensionIdInput) els.extensionIdInput.value = id;
  extensionInfo = { ready: false, version: '' };
  if (!options.silent) toast(id ? 'Đã lưu Extension ID' : 'Đã xoá Extension ID');
  return true;
}
function restoreExtensionId() {
  if (!els.extensionIdInput) return;
  const saved = normalizeExtensionId(loadStorage(APP.storage.extensionId, ''));
  const id = saved || APP.fixedExtensionId;
  els.extensionIdInput.value = id;
  if (!saved && id) saveStorage(APP.storage.extensionId, id);
}
function directExtensionReady() {
  return !!globalThis.chrome?.runtime?.sendMessage;
}
function extensionReady() {
  return directExtensionReady() && getExtensionId().length === 32;
}
function extensionOriginHelp() {
  const origin = location.protocol === 'file:' ? 'file:// local' : location.origin;
  return `Origin hiện tại: ${origin}. Bản extension đã mở quyền cho GitHub Pages, Cloudflare Pages, Netlify, Vercel, localhost và 127.0.0.1. Nếu mở file HTML trực tiếp bằng file:// thì hãy đưa WEB_GITHUB lên GitHub Pages hoặc chạy bằng localhost.`;
}
function sendExt(message, timeout = 120000) {
  const extensionId = getExtensionId();
  if (!extensionId) return Promise.reject(new Error('Chưa nhập Extension ID. Mở Extension, sao chép ID rồi dán vào Cài đặt nâng cao.'));
  if (extensionId.length !== 32) return Promise.reject(new Error('Extension ID không hợp lệ. ID phải có đúng 32 ký tự từ a đến p.'));
  if (!directExtensionReady()) return Promise.reject(new Error('Trang hiện tại chưa được Chrome cấp API chrome.runtime để gọi Extension. ' + extensionOriginHelp()));
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Extension xử lý quá lâu hoặc đã bị ngắt.'));
    }, timeout);
    chrome.runtime.sendMessage(extensionId, message, response => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const err = chrome.runtime.lastError;
      if (err) return reject(new Error(`Không kết nối được Extension ID ${extensionId}: ${err.message}. ${extensionOriginHelp()}`));
      if (!response?.ok) return reject(new Error(response?.error || 'Extension không phản hồi đúng.'));
      resolve(response);
    });
  });
}
async function closeTabIfNeeded(tabId) {
  if (!els.closeTabCheckbox.checked || !tabId) return;
  try { await sendExt({ type: 'FB_CLOSE_TAB', tabId }, 15000); } catch {}
}
async function checkExtension() {
  els.extensionBadge.textContent = '🧩 Đang kết nối Extension...';
  els.extensionBadge.disabled = true;
  try {
    const response = await sendExt({ type: 'PING', action: 'PING' }, 8000);
    const data = bridgeResponseData(response);
    const version = field(data.version || response.version);
    extensionInfo = { ready: true, version };
    els.extensionBadge.textContent = `🧩 Extension sẵn sàng${version ? ' · v' + version : ''}`;
    els.extensionBadge.style.background = '#ecfdf3';
    els.extensionBadge.style.borderColor = '#bbf7d0';
    els.extensionBadge.style.color = '#166534';
    return response;
  } catch (error) {
    extensionInfo = { ready: false, version: '' };
    els.extensionBadge.textContent = '🧩 Chưa kết nối Extension';
    els.extensionBadge.style.background = '#fff7ed';
    els.extensionBadge.style.borderColor = '#fed7aa';
    els.extensionBadge.style.color = '#9a3412';
    throw error;
  } finally {
    els.extensionBadge.disabled = false;
  }
}
async function ensureExtensionReady() {
  try {
    return await checkExtension();
  } catch (error) {
    throw new Error('Chưa kết nối Extension. Hãy nhập đúng Extension ID, bật Extension rồi bấm kiểm tra lại. Chi tiết: ' + getErrorText(error));
  }
}
async function preflightBeforeRun() {
  if (!cleanApiKey(els.apiKeyInput.value)) throw new Error('Chưa nhập API key.');
  const listings = await dbAll();
  if (!listings.length) throw new Error('Kho mẫu đang trống. Hãy thêm ít nhất 1 mẫu phòng/căn.');
  if (listings.some(item => !normalizeContactInfo(item.contact))) throw new Error('Có mẫu trong kho chưa có thông tin liên hệ bắt buộc. Hãy sửa mẫu và nhập liên hệ.');
  await ensureExtensionReady();
}
async function scanGroupLinksToInput({ silent = false } = {}) {
  await ensureExtensionReady();
  const scanMode = getScanMode();
  const groups = parseGroupLines();
  const limit = numberInputValue(els.groupLimitInput, 5, 1, 50);

  if (scanModeNeedsGroup(scanMode) && !groups.length) {
    setGroupStatus('Hãy nhập UID hoặc link nhóm Facebook trước.', 'warn');
    els.groupIdsInput?.focus();
    return { links: [], rawCount: 0, duplicateCount: 0, allDuplicated: false, noCandidates: true };
  }

  setGroupStatus(`Đang quét ${scanModeLabel(scanMode)}...`, 'warn');
  const response = await sendExt({
    type: 'SCAN_GROUP_PERMALINKS',
    groups,
    groupIds: groups,
    scanMode,
    sourceMode: scanMode,
    feedMode: scanMode,
    maxRounds: 35,
    limit,
    limitPerGroup: limit,
    perGroupLimit: limit,
    onlyPermalink: scanMode !== 'home_feed',
    openInBackground: false,
    active: true,
    activateTab: true,
    closeAfter: true
  }, 15 * 60 * 1000);

  const responseData = bridgeResponseData(response);
  const candidates = uniqueUrls(extractLinksFromExtensionResponse(response));
  const found = filterUnscannedLinks(candidates);
  const duplicateCount = Math.max(0, candidates.length - found.length);
  const allDuplicated = candidates.length > 0 && found.length === 0 && duplicateCount === candidates.length;
  const merged = uniqueUrls([...urls(), ...found]);
  els.facebookUrlsInput.value = merged.join('\n');
  updateCounters();
  saveDraft();

  const reports = Array.isArray(responseData.reports) ? responseData.reports : [];
  const reportText = reports.map(r => `${r.source || r.groupId || scanModeLabel(scanMode)}: ${r.count || 0} link`).join(' | ');
  if (found.length) {
    const duplicateText = duplicateCount ? `, bỏ qua ${duplicateCount} link trùng` : '';
    setGroupStatus(`Đã lấy ${found.length} link mới${duplicateText}${reportText ? ' — ' + reportText : ''}.`, 'ok');
    if (!silent) toast(`Đã quét được ${found.length} link mới${duplicateText}`);
  } else if (allDuplicated) {
    setGroupStatus(`Đã quét ${candidates.length} link nhưng tất cả đều đã xử lý${reportText ? ' — ' + reportText : ''}.`, 'warn');
    if (!silent) toast(`Tất cả ${candidates.length} link quét được đều bị trùng.`, 'warning');
  } else {
    setGroupStatus(responseData.error || response.error || `Không tìm thấy link hợp lệ${reportText ? ' — ' + reportText : ''}.`, 'warn');
    if (!silent) toast('Không tìm thấy link hợp lệ trong lần quét này.', 'warning');
  }
  return {
    links: found,
    rawCount: candidates.length,
    duplicateCount,
    allDuplicated,
    noCandidates: candidates.length === 0,
    reportText
  };
}
async function scanGroupLinksManual() {
  if (isRunning) return;
  isRunning = true;
  els.scanGroupLinksBtn.disabled = true;
  const oldText = els.scanGroupLinksBtn.textContent;
  els.scanGroupLinksBtn.textContent = '⏳ Đang quét...';
  try {
    await scanGroupLinksToInput();
  } catch (error) {
    setGroupStatus(getErrorText(error), 'error');
    toast(getErrorText(error), 'error');
  } finally {
    isRunning = false;
    els.scanGroupLinksBtn.disabled = false;
    els.scanGroupLinksBtn.textContent = oldText;
  }
}
async function processOneFacebookUrl(url, index = 0, total = 1) {
  logLine(`(${index}/${total}) Lấy Nội dung bài viết gốc bằng Rakko API: ${url}`);

  let article = '';
  try {
    article = await fetchArticleSmart(url);
    els.articleInput.value = article.slice(0, 8000);
    updateCounters();
    saveDraft();
    logLine(`✅ API đã trả về: ${article.slice(0, 140).replace(/\s+/g, ' ')}${article.length > 140 ? '...' : ''}`);
  } catch (error) {
    logLine(`❌ API không lấy được Nội dung bài viết gốc, giữ link để lần sau đọc lại: ${getErrorText(error)}`);
    return { ok: false, skipped: true, error: getErrorText(error) };
  }

  if (!field(article)) {
    logLine('⚠️ API trả về rỗng, giữ link để lần sau đọc lại.');
    return { ok: false, skipped: true, error: 'empty_article' };
  }

  markLinkScanned(url);
  removeUrlFromInput(url);

  let ai = null;
  try {
    setOutput('Đang gửi nội dung API cho AI phân tích...', 'loading');
    ai = await aiCreateComment(article);
  } catch (error) {
    logLine(`❌ Lỗi AI: ${getErrorText(error)}`);
    return { ok: false, skipped: true, error: getErrorText(error) };
  }

  if (ai.classification === 'next') {
    showSelected(null);
    setOutput('next', 'placeholder');
    logLine('↪️ AI trả về next: bỏ qua comment và chạy link kế tiếp ngay.');
    return { ok: true, skipped: true, reason: 'next' };
  }

  if (!field(ai.comment)) {
    logLine('⚠️ AI trả về comment rỗng, bỏ qua link này.');
    return { ok: false, skipped: true, error: 'empty_comment' };
  }

  showSelected(ai.selected);
  setOutput(ai.comment, '');
  const wantsImage = !!els.attachImageCheckbox.checked;
  const image = wantsImage ? ai.selected?.image : null;
  const requireImage = !!image?.dataUrl;
  logLine(`🎯 Mẫu chọn: ${(ai.selected?.address || 'Không rõ địa chỉ')} / ${(ai.selected?.type || 'Không rõ loại')}${requireImage ? ' / có ảnh — bắt buộc gắn đúng ảnh này' : ' / mẫu không có ảnh'}`);
  if (wantsImage && !requireImage) logLine('⚠️ Mẫu AI chọn chưa lưu ảnh nên chỉ có thể gửi phần văn bản.');

  try {
    const allowTextFallback = !!els.fallbackTextCheckbox.checked;
    const pageLoadWaitMs = numberInputValue(els.pageLoadWaitSecondsInput, 10, 0, 300) * 1000;
    const imageLoadWaitMs = numberInputValue(els.imageLoadWaitSecondsInput, 5, 0, 300) * 1000;
    const afterSendWaitMs = numberInputValue(els.afterSendWaitSecondsInput, 7, 0, 300) * 1000;
    const extensionTimeoutMs = Math.max(150000, pageLoadWaitMs + imageLoadWaitMs + afterSendWaitMs + 60000);
    logLine(`⏱️ Thời gian chờ: tải trang ${pageLoadWaitMs / 1000}s · tải ảnh ${imageLoadWaitMs / 1000}s · sau gửi ${afterSendWaitMs / 1000}s.`);
    const sentResponse = await sendExt({
      type: 'FB_COMMENT_WITH_IMAGE',
      action: 'FB_COMMENT_WITH_IMAGE',
      url,
      comment: ai.comment,
      imageDataUrl: image?.dataUrl || '',
      imageName: image?.name || 'anh_mau.jpg',
      requireImage,
      fallbackText: allowTextFallback,
      closeAfter: els.closeTabCheckbox.checked,
      pageLoadWaitMs,
      imageLoadWaitMs,
      afterSendWaitMs
    }, extensionTimeoutMs);
    const sent = bridgeResponseData(sentResponse);
    const textVerified = sent.textVerified === true || sent.textPasted === true || sent.commentSent === true || sent.submitted === true || sent.sent === true;
    const imageAttached = sent.imageAttached === true || sent.imagePasted === true || sent.hasImage === true;
    if (!textVerified) throw new Error('Facebook chưa xác nhận văn bản được dán đúng cấu trúc.');
    if (requireImage && !imageAttached && !allowTextFallback) throw new Error('Ảnh của mẫu AI chọn chưa được gắn vào bình luận.');
    if (requireImage && !imageAttached && allowTextFallback) {
      logLine('⚠️ Không gắn được ảnh; Extension đã gửi phần chữ theo cấu hình dự phòng.');
    }
    logLine(`✅ Đã gửi comment${imageAttached ? ' kèm đúng ảnh mẫu' : ' dạng chữ'}: ${ai.comment.slice(0, 100)}${ai.comment.length > 100 ? '...' : ''}`);
    return { ok: true, skipped: false, imageAttached, textFallback: requireImage && !imageAttached };
  } catch (error) {
    logLine(`❌ Lỗi comment: ${getErrorText(error)}. Link đã được ghi vào danh sách đã quét vì nội dung bài đã đọc xong.`);
    return { ok: false, skipped: true, error: getErrorText(error) };
  }
}
async function runFacebookLinksQueue(list, { clearLog = true, manageRunning = true } = {}) {
  const queue = filterUnscannedLinks(list);
  if (!queue.length) {
    toast('Không có link Facebook mới để chạy.', 'warning');
    return;
  }

  try {
    await preflightBeforeRun();
  } catch (error) {
    toast(getErrorText(error), 'error');
    setOutput('❌ ' + getErrorText(error), 'error');
    return;
  }

  if (manageRunning) {
    if (isRunning) return;
    isRunning = true;
  }
  els.runFacebookBtn.disabled = true;
  if (els.runExistingLinksBtn) {
    els.runExistingLinksBtn.disabled = true;
    els.runExistingLinksBtn.textContent = '⏳ Đang chạy link hiện có...';
  }
  els.runFacebookBtn.textContent = '⏳ Đang chạy...';

  const summary = { success: 0, next: 0, failed: 0, textFallback: 0 };
  try {
    for (let i = 0; i < queue.length; i++) {
      if (!manageRunning && !groupLoopRunning) break;
      const link = queue[i];
      const result = await processOneFacebookUrl(link, i + 1, queue.length);
      const shouldRunNextImmediately = result?.reason === 'next';
      if (result?.reason === 'next') summary.next += 1;
      else if (result?.ok) {
        summary.success += 1;
        if (result.textFallback) summary.textFallback += 1;
      } else summary.failed += 1;

      const stillRunning = () => manageRunning ? isRunning : groupLoopRunning;
      if (i < queue.length - 1 && stillRunning() && !shouldRunNextImmediately) {
        const pause = numberInputValue(els.linkPauseSecondsInput, 60, 0, 86400);
        await waitCountdown(
          pause,
          remain => `Đã xử lý link ${i + 1}/${queue.length}. Nghỉ ${remain} giây rồi chạy link tiếp theo...`,
          stillRunning
        );
      }
    }
    const parts = [`${summary.success} đã comment`, `${summary.next} next`, `${summary.failed} lỗi`];
    if (summary.textFallback) parts.push(`${summary.textFallback} gửi chữ do ảnh lỗi`);
    const message = `Đã chạy xong: ${parts.join(' · ')}.`;
    setGroupStatus(message, summary.failed ? 'warn' : 'ok');
    toast(message, summary.failed ? 'warning' : 'success');
    return summary;
  } finally {
    if (manageRunning) isRunning = false;
    els.runFacebookBtn.disabled = false;
    if (els.runExistingLinksBtn) {
      els.runExistingLinksBtn.disabled = false;
      els.runExistingLinksBtn.textContent = '▶ Chạy link hiện có';
    }
    els.runFacebookBtn.textContent = 'Chạy link Facebook';
  }
}
async function runClosedGroupLoop() {
  if (isRunning || groupLoopRunning) return;
  try {
    await preflightBeforeRun();
  } catch (error) {
    toast(getErrorText(error), 'error');
    setOutput('❌ ' + getErrorText(error), 'error');
    return;
  }

  isRunning = true;
  groupLoopRunning = true;
  els.autoGroupLoopBtn.disabled = true;
  els.autoGroupLoopBtn.textContent = '⏳ Đang chạy quy trình...';
  els.scanGroupLinksBtn.disabled = true;
  els.runFacebookBtn.disabled = true;
  if (els.runExistingLinksBtn) els.runExistingLinksBtn.disabled = true;
  els.stopGroupLoopBtn?.classList.remove('hidden');
  let cycle = 1;

  try {
    while (groupLoopRunning) {
      setGroupStatus(`Đang chạy vòng ${cycle}: quét nhóm...`, 'warn');
      let scanResult = { links: [], rawCount: 0, duplicateCount: 0, allDuplicated: false, noCandidates: true };
      try {
        scanResult = await scanGroupLinksToInput({ silent: true });
      } catch (error) {
        setGroupStatus(`Lỗi quét nhóm: ${getErrorText(error)}`, 'error');
      }

      if (!groupLoopRunning) break;
      const links = Array.isArray(scanResult.links) ? scanResult.links : [];
      if (links.length) {
        setGroupStatus(`Vòng ${cycle}: có ${links.length} link mới, bắt đầu xử lý...`, 'ok');
        await runFacebookLinksQueue(urls(), { clearLog: false, manageRunning: false });
      } else if (scanResult.allDuplicated) {
        const duplicatePause = numberInputValue(els.duplicatePauseSecondsInput, 300, 0, 86400);
        await waitCountdown(
          duplicatePause,
          remain => `Vòng ${cycle}: ${scanResult.rawCount} link đều đã xử lý. Tạm nghỉ ${remain} giây rồi tự quét lại...`,
          () => groupLoopRunning
        );
        if (!groupLoopRunning) break;
        cycle += 1;
        continue;
      }

      if (!groupLoopRunning) break;
      const pause = numberInputValue(els.loopPauseSecondsInput, 240, 0, 86400);
      await waitCountdown(
        pause,
        remain => `Vòng ${cycle} đã xong. Nghỉ ${remain} giây rồi quét tiếp...`,
        () => groupLoopRunning
      );
      cycle += 1;
    }
  } finally {
    groupLoopRunning = false;
    isRunning = false;
    els.autoGroupLoopBtn.disabled = false;
    els.autoGroupLoopBtn.textContent = '▶ Bắt đầu quy trình';
    els.scanGroupLinksBtn.disabled = false;
    els.runFacebookBtn.disabled = false;
    if (els.runExistingLinksBtn) els.runExistingLinksBtn.disabled = false;
    els.stopGroupLoopBtn?.classList.add('hidden');
    els.runFacebookBtn.textContent = 'Chạy link Facebook';
    setGroupStatus('Vòng lặp đã dừng.', 'warn');
  }
}

async function runFacebookLinks() {
  if (isRunning) return;
  const list = urls();
  if (!list.length) {
    toast('Hãy nhập ít nhất 1 URL Facebook mới.', 'warning');
    els.facebookUrlsInput.focus();
    return;
  }
  els.facebookUrlsInput.value = list.join('\n');
  updateCounters();
  saveDraft();
  await runFacebookLinksQueue(list, { clearLog: true, manageRunning: true });
}

function clearArticleAndUrls() {
  els.articleInput.value = '';
  els.facebookUrlsInput.value = '';
  setOutput('Bình luận tư vấn sẽ xuất hiện tại đây...', 'placeholder');
  showSelected(null);
  updateCounters();
  saveDraft();
  toast('Đã làm mới bài/link');
}
async function pasteArticle() {
  try {
    els.articleInput.value = await navigator.clipboard.readText();
    updateCounters();
    saveDraft();
    toast('Đã dán nội dung');
  } catch {
    toast('Trình duyệt chặn clipboard. Hãy dán thủ công Ctrl+V.', 'warning');
  }
}
function saveHistory() {
  const comment = els.output.textContent.trim();
  if (!comment || els.output.classList.contains('placeholder') || els.output.classList.contains('loading')) {
    toast('Chưa có bình luận hợp lệ để lưu.', 'warning');
    return;
  }
  const history = loadStorage(APP.storage.history, []);
  history.unshift({ comment, createdAt: new Date().toISOString() });
  saveStorage(APP.storage.history, history.slice(0, 80));
  toast('Đã lưu lịch sử');
}
function requireElements() {
  const missing = Object.entries(els).filter(([, el]) => !el).map(([key]) => key);
  if (missing.length) throw new Error('Thiếu phần tử giao diện: ' + missing.join(', '));
}
function wire() {
  els.saveExtensionIdBtn?.addEventListener('click', async () => {
    if (!saveExtensionId()) return;
    try { await checkExtension(); toast('Extension ID hợp lệ và đã kết nối', 'success'); }
    catch (error) { toast(getErrorText(error), 'warning'); }
  });
  els.extensionIdInput?.addEventListener('input', () => {
    const clean = normalizeExtensionId(els.extensionIdInput.value);
    if (els.extensionIdInput.value !== clean) els.extensionIdInput.value = clean;
    saveExtensionId({ silent: true });
  });
  els.extensionIdInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') els.saveExtensionIdBtn?.click();
  });
  els.extensionBadge.addEventListener('click', async () => {
    try {
      await checkExtension();
      toast('Extension đã kết nối', 'success');
    } catch (error) {
      toast(getErrorText(error) || 'Chưa kết nối được Extension', 'warning');
    }
  });
  els.toggleKeyBtn.addEventListener('click', () => {
    const show = els.apiKeyInput.type === 'password';
    els.apiKeyInput.type = show ? 'text' : 'password';
    els.toggleKeyBtn.textContent = show ? '🙈 Ẩn key' : '👁️ Hiện key';
  });
  els.saveApiBtn.addEventListener('click', () => saveApiConfig());
  els.clearApiBtn.addEventListener('click', clearApiConfig);
  els.apiKeyInput.addEventListener('input', () => { updateApiStatus(); saveApiConfig({ silent: true }); });
  els.modelInput.addEventListener('change', () => saveApiConfig({ silent: true }));
  els.fetchArticleApiBtn.addEventListener('click', fetchArticleApiToInput);
  els.pasteBtn.addEventListener('click', pasteArticle);
  els.generateBtn.addEventListener('click', generateManual);
  els.runFacebookBtn.addEventListener('click', runFacebookLinks);
  els.scanGroupLinksBtn?.addEventListener('click', scanGroupLinksManual);
  els.autoGroupLoopBtn?.addEventListener('click', runClosedGroupLoop);
  els.runExistingLinksBtn?.addEventListener('click', runFacebookLinks);
  els.stopGroupLoopBtn?.addEventListener('click', () => { groupLoopRunning = false; setGroupStatus('Đang dừng vòng lặp...', 'warn'); });
  els.clearScannedLinksBtn?.addEventListener('click', () => { saveScannedLinks([]); setGroupStatus('Đã xoá danh sách link đã quét ở nhóm.', 'ok'); toast('Đã xoá danh sách link đã quét'); });
  els.clearBtn.addEventListener('click', clearArticleAndUrls);
  els.copyBtn.addEventListener('click', () => copyText(els.output.textContent));
  els.saveHistoryBtn.addEventListener('click', saveHistory);
  els.toggleListingFormBtn.addEventListener('click', toggleListingForm);
  els.chooseImageBtn.addEventListener('click', () => els.listingImageInput.click());
  els.clearImageBtn.addEventListener('click', resetImage);
  els.listingImageInput.addEventListener('change', async () => {
    const file = els.listingImageInput.files?.[0];
    if (!file) return;
    try {
      els.imageStatus.textContent = 'Đang nén ảnh...';
      setImagePreview(await compressImage(file));
    } catch (error) {
      toast(getErrorText(error), 'error');
      resetImage();
    }
  });
  els.addListingBtn.addEventListener('click', addListing);
  els.resetListingFormBtn.addEventListener('click', resetListingForm);
  els.clearListingBtn.addEventListener('click', clearListings);
  els.facebookUrlsInput.addEventListener('change', syncUrlInputFiltered);
  els.listingCards.addEventListener('click', async event => {
    const edit = event.target.closest('[data-edit]')?.dataset.edit;
    const del = event.target.closest('[data-delete]')?.dataset.delete;
    if (edit) await editListing(edit);
    if (del) await deleteListing(del);
  });
  [els.articleInput, els.facebookUrlsInput, els.groupIdsInput, els.scanSourceModeSelect, els.groupLimitInput, els.loopPauseSecondsInput, els.duplicatePauseSecondsInput, els.linkPauseSecondsInput, els.pageLoadWaitSecondsInput, els.imageLoadWaitSecondsInput, els.afterSendWaitSecondsInput, els.productLinkInput, els.toneSelect, els.commentModeSelect, els.attachImageCheckbox, els.fallbackTextCheckbox, els.closeTabCheckbox].filter(Boolean).forEach(el => {
    el.addEventListener('input', () => { updateCounters(); saveDraft(); });
    el.addEventListener('change', () => { updateCounters(); saveDraft(); });
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      generateManual();
    }
  });
}
async function init() {
  try {
    requireElements();
    restoreApiConfig();
    restoreExtensionId();
    restoreDraft();
    wire();
    updateCounters();
    await renderListings();
    renderScannedLinks();
    syncUrlInputFiltered();
    checkExtension().catch(() => {});
  } catch (error) {
    console.error(error);
    alert('Lỗi khởi tạo giao diện: ' + getErrorText(error));
  }
}

window.addEventListener('DOMContentLoaded', init);

  