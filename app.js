const imageInput = document.querySelector("#imageInput");
const cameraInput = document.querySelector("#cameraInput");
const uploadZone = document.querySelector("#uploadZone");
const checklistBody = document.querySelector("#checklistBody");
const emptyState = document.querySelector("#emptyState");
const toast = document.querySelector("#toast");

let toastTimer;
let checklistItems = [];
const inspectionOptions = [
  "防水工程-外牆樓層接縫",
  "防水工程-浴廁",
  "防水工程-廚房",
  "防水工程-陽台",
  "防水工程-屋頂",
  "防水工程-露臺",
  "防水工程-地下室頂板",
  "防水工程-花台第二次防水",
  "防水工程-外牆窗框防水",
  "防水工程-防水試水",
];
const standardOptions = [
  "施工面應乾燥、平順、無突出物及雜物",
  "防水測試時間：48 小時",
  "無毒防水膜：均勻塗布，無剝離、脫落",
  "角隅斜角彈泥＋玻纖網或纖維絲：纖維網長度＝30 cm",
  "底塗：均勻塗布，無剝離、脫落",
  "彈性高分子樹脂防水材－第一道：均勻塗布，無剝離、脫落",
  "彈性高分子樹脂防水材－第二道：均勻塗布，無剝離、脫落",
  "聚脲防水膜：塗布厚度 2 mm",
  "隔熱層＋保護層：PS 版鋪設、點焊鋼絲網、7 cm PC 保護層",
];

document.querySelector("#todayDate").textContent = new Intl.DateTimeFormat("zh-TW", {
  year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function addPhotos(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  let added = 0;
  let rejected = 0;
  for (const file of files) {
    if (!file.type.startsWith("image/") || file.size > 20 * 1024 * 1024) {
      rejected += 1;
      continue;
    }
    checklistItems.push(createRecord({ file, url: URL.createObjectURL(file) }));
    added += 1;
  }
  if (added) renderChecklist();
  if (rejected) notify(`已建立 ${added} 筆照片紀錄；${rejected} 個檔案格式不符或超過 20 MB。`);
  else if (added) notify(`已依 ${added} 張照片建立檢查紀錄，請補填檢查內容。`);
}

imageInput.addEventListener("change", (event) => {
  addPhotos(event.target.files);
  imageInput.value = "";
});
cameraInput.addEventListener("change", (event) => {
  addPhotos(event.target.files);
  cameraInput.value = "";
});
document.querySelector("#cameraButton").addEventListener("click", () => cameraInput.click());
uploadZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  uploadZone.classList.add("dragover");
});
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
uploadZone.addEventListener("drop", (event) => {
  event.preventDefault();
  uploadZone.classList.remove("dragover");
  addPhotos(event.dataTransfer.files);
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function renderChecklist() {
  const masterIndex = getSyncSourceIndex();
  emptyState.hidden = checklistItems.length > 0;
  checklistBody.innerHTML = checklistItems.map((item, index) => `
    <tr class="${(index + 1) % 3 === 0 && index < checklistItems.length - 1 ? "print-page-break" : ""}" data-index="${index}">
      <td class="record-photo-cell">
        ${item.photo ? `<img class="record-photo" src="${item.photo.url}" alt="第 ${index + 1} 筆自主檢查照片：${escapeHtml(item.photo.file.name)}" />` : `<div class="record-photo-empty"><i data-lucide="image"></i><span>尚未加入照片</span></div>`}
        <button class="delete-row" type="button" data-remove="${index}" aria-label="刪除第 ${index + 1} 筆檢查紀錄"><i data-lucide="x"></i></button>
      </td>
      <td class="record-details-cell">
        <div class="record-meta">
          <label class="record-field"><span>日期：</span><input type="date" data-field="checkDate" aria-label="第 ${index + 1} 筆檢查日期" value="${escapeHtml(item.checkDate)}" ${index === masterIndex ? "" : "disabled title='依第一張照片同步'"} /></label>
          <label class="record-field"><span>檢查項目：</span><select data-field="item" aria-label="第 ${index + 1} 筆檢查項目" ${index === masterIndex ? "" : "disabled title='依第一張照片同步'"}>
            <option value=""${item.item ? "" : " selected"}>請選擇檢查項目</option>
            ${inspectionOptions.map((option) => `<option value="${escapeHtml(option)}"${item.item === option ? " selected" : ""}>${escapeHtml(option)}</option>`).join("")}
          </select></label>
          <div class="location-selects" aria-label="檢查位置">
            <label class="location-field"><span>棟別</span><input list="buildingOptions" data-field="building" aria-label="第 ${index + 1} 筆棟別" value="${escapeHtml(item.building)}" placeholder="選擇／輸入" ${index === masterIndex ? "" : "disabled title='依第一張照片同步'"} /></label>
            <label class="location-field"><span>樓層</span><input list="floorOptions" data-field="floor" aria-label="第 ${index + 1} 筆樓層" value="${escapeHtml(item.floor)}" placeholder="選擇／輸入" ${index === masterIndex ? "" : "disabled title='依第一張照片同步'"} /></label>
            <label class="location-field"><span>房號</span><input list="roomOptions" data-field="room" aria-label="第 ${index + 1} 筆房號" value="${escapeHtml(item.room)}" placeholder="選擇／輸入" /></label>
          </div>
        </div>
        <label class="record-long-field record-standard-field"><span>檢查標準：</span>
          <select data-field="standard" aria-label="第 ${index + 1} 筆檢查標準選單" ${index === masterIndex ? "" : "disabled title='依第一張照片同步'"}>
            <option value=""${standardOptions.includes(item.standard) ? "" : " selected"}>請選擇檢查標準</option>
            ${standardOptions.map((option) => `<option value="${escapeHtml(option)}"${item.standard === option ? " selected" : ""}>${escapeHtml(option)}</option>`).join("")}
          </select>
        </label>
        <label class="record-long-field"><span>實際：</span><textarea data-field="actual" aria-label="第 ${index + 1} 筆實際情況" placeholder="請填寫實際檢查結果">${escapeHtml(item.actual)}</textarea></label>
      </td>
    </tr>`).join("");
  if (window.lucide) lucide.createIcons();
  document.querySelector("#itemCount").textContent = `${checklistItems.length} 項`;
  document.querySelector("#recordCount").textContent = `${checklistItems.length} 筆檢查紀錄`;
  document.querySelector("#photoSummary").textContent = `${checklistItems.filter((item) => item.photo).length} 張照片`;
}

function createRecord(photo = null) {
  const master = checklistItems[getSyncSourceIndex()];
  const building = master?.building || "";
  return {
    checkDate: master?.checkDate || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
    item: master?.item || "",
    building,
    floor: master?.floor || "",
    room: photo ? nextRoomNumber(building) : "",
    standard: master?.standard || "",
    actual: master?.standard || "",
    photo,
  };
}

function roomNumberRange(building) {
  if (building === "A棟") return { prefix: "A", limit: 27 };
  if (building === "B棟") return { prefix: "B", limit: 21 };
  return null;
}

function nextRoomNumber(building) {
  const range = roomNumberRange(building);
  if (!range) return "";
  const usedRooms = new Set(checklistItems.filter((item) => item.photo).map((item) => item.room));
  for (let number = 1; number <= range.limit; number += 1) {
    const room = `${range.prefix}${number}`;
    if (!usedRooms.has(room)) return room;
  }
  return "";
}

function assignRoomNumbers(building) {
  const range = roomNumberRange(building);
  const photoRows = checklistItems
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.photo);
  photoRows.forEach(({ item }, index) => {
    item.room = range && index < range.limit ? `${range.prefix}${index + 1}` : "";
  });
  checklistBody.querySelectorAll('[data-field="room"]').forEach((control) => {
    const item = checklistItems[Number(control.closest("tr").dataset.index)];
    control.value = item.room;
  });
  return { count: photoRows.length, limit: range?.limit || 0 };
}

function getSyncSourceIndex() {
  const firstPhotoIndex = checklistItems.findIndex((item) => item.photo);
  return firstPhotoIndex >= 0 ? firstPhotoIndex : (checklistItems.length ? 0 : -1);
}

function syncPrimaryField(field, value) {
  const masterIndex = getSyncSourceIndex();
  if (masterIndex < 0) return;
  checklistItems.forEach((item, index) => {
    if (index !== masterIndex) item[field] = value;
  });
  checklistBody.querySelectorAll(`[data-field="${field}"]`).forEach((control) => {
    const index = Number(control.closest("tr").dataset.index);
    if (index !== masterIndex) control.value = value;
  });
}

function addRow() {
  checklistItems.push(createRecord());
  renderChecklist();
  checklistBody.querySelector("tr:last-child select[data-field='item']")?.focus();
}
document.querySelector("#addRowButton").addEventListener("click", addRow);
document.querySelector("#emptyAddButton").addEventListener("click", addRow);
document.querySelector("#clearRowsButton").addEventListener("click", () => {
  if (!checklistItems.length) return;
  checklistItems.forEach((item) => {
    if (item.photo) URL.revokeObjectURL(item.photo.url);
  });
  checklistItems = [];
  renderChecklist();
  notify("自檢表已清空。");
});

checklistBody.addEventListener("input", (event) => {
  const field = event.target.dataset.field;
  const row = event.target.closest("tr");
  if (field && row) checklistItems[Number(row.dataset.index)][field] = event.target.value;
});
checklistBody.addEventListener("change", (event) => {
  const row = event.target.closest("tr");
  const field = event.target.dataset.field;
  if (!field || !row) return;
  const index = Number(row.dataset.index);
  checklistItems[index][field] = event.target.value;
  if (index === getSyncSourceIndex() && ["checkDate", "item", "building", "floor", "standard"].includes(field)) {
    syncPrimaryField(field, event.target.value);
    if (field === "standard") {
      checklistItems.forEach((item) => {
        item.actual = event.target.value;
      });
      checklistBody.querySelectorAll('[data-field="actual"]').forEach((control) => {
        control.value = event.target.value;
      });
    }
    if (field === "building") {
      const { count, limit } = assignRoomNumbers(event.target.value);
      if (limit && count > limit) notify(`${event.target.value}房號最多編至 ${limit}，超出部分請手動確認。`);
    }
  }
});
checklistBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  removeRecord(Number(button.dataset.remove));
});

function removeRecord(index) {
  const [removed] = checklistItems.splice(index, 1);
  if (removed?.photo) URL.revokeObjectURL(removed.photo.url);
  renderChecklist();
}

document.querySelector("#exportButton").addEventListener("click", () => {
  if (!checklistItems.length) {
    notify("先新增至少一個檢查項目，再匯出表格。");
    return;
  }
  const rows = [
    ["臺南市安平區億載安居社會住宅新建統包工程"],
    ["自主檢查照片"],
    ["表單名稱", document.querySelector("#checklistTitle").value],
    [],
    ["檢查日期", "檢查項目", "棟別", "樓層", "房號", "檢查標準", "實際"],
    ...checklistItems.map((item) => [item.checkDate, item.item, item.building, item.floor, item.room, item.standard, item.actual]),
  ];
  const csv = "\uFEFF" + rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${document.querySelector("#checklistTitle").value.trim() || "自檢表"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  notify("CSV 自檢表已匯出。");
});

function readPhotoAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

document.querySelector("#reportButton").addEventListener("click", async (event) => {
  if (!checklistItems.length) {
    notify("先新增檢查紀錄，再匯出照片文件。");
    return;
  }
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const reportRows = await Promise.all(checklistItems.map(async (item) => {
      const photo = item.photo ? await readPhotoAsDataUrl(item.photo.file) : "";
      return `<tr>
        <td class="photo-cell">${photo ? `<img src="${photo}" alt="自主檢查照片" />` : "<span class=\"no-photo\">未附照片</span>"}</td>
        <td class="details-cell">
          <div class="meta-row"><b>日期：</b><span>${escapeHtml(item.checkDate)}</span></div>
          <div class="meta-row"><b>檢查項目：</b><span>${escapeHtml(item.item)}</span></div>
          <div class="meta-row"><b>檢查位置：</b><span>${escapeHtml([item.building, item.floor, item.room].filter(Boolean).join("／"))}</span></div>
          <section><b>檢查標準：</b><p>${escapeHtml(item.standard).replace(/\n/g, "<br>")}</p></section>
          <section><b>實際：</b><p>${escapeHtml(item.actual).replace(/\n/g, "<br>")}</p></section>
        </td>
      </tr>`;
    }));
    const title = document.querySelector("#checklistTitle").value.trim() || "自主檢查照片";
    const report = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>
      @page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}body{margin:0;color:#172925;font-family:"Noto Sans TC",sans-serif;font-size:12px}h1,h2{text-align:center;margin:0;font-weight:600}h1{font-size:17px;padding:5px;border:1px solid #333}h2{font-size:15px;padding:5px 0 8px;border:1px solid #333;border-top:0;margin-bottom:12px}.form-title{margin:0 0 8px;font-size:12px}table{width:100%;border-collapse:collapse;table-layout:fixed}tr{break-inside:avoid;page-break-inside:avoid}td{border:1px solid #333;vertical-align:top}.photo-cell{width:52%;height:290px;padding:0;text-align:center;vertical-align:middle;background:#f4f5f2}.photo-cell img{display:block;width:100%;height:288px;object-fit:contain}.no-photo{color:#89948c}.details-cell{width:48%;padding:0}.meta-row{display:grid;grid-template-columns:88px 1fr;min-height:25px;align-items:center;padding:3px 6px;border-bottom:1px solid #777}.details-cell section{min-height:105px;padding:9px 7px;border-bottom:1px solid #777}.details-cell section:last-child{border-bottom:0}.details-cell p{margin:7px 0 0;white-space:normal;line-height:1.6}@media screen{body{max-width:900px;margin:30px auto;padding:20px;background:#fff}.photo-cell,.photo-cell img{height:320px}}@media print{.photo-cell,.photo-cell img{height:275px}}
      </style></head><body><h1>臺南市安平區億載安居社會住宅新建統包工程</h1><h2>自主檢查照片</h2><p class="form-title">表單名稱：${escapeHtml(title)}</p><table><tbody>${reportRows.join("")}</tbody></table></body></html>`;
    const blob = new Blob([report], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = title.replace(/[\\/:*?"<>|]/g, "_");
    link.download = `${filename}-照片報告.html`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("含照片檢查文件已匯出，可開啟後列印或另存 PDF。");
  } catch (error) {
    console.error("Photo report export failed", error);
    notify("照片文件匯出失敗，請確認瀏覽器可讀取照片後重試。");
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#printButton").addEventListener("click", () => window.print());

if (window.lucide) lucide.createIcons();