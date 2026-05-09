const zone     = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const list     = document.getElementById('upload-list');
const footer   = document.getElementById('upload-footer');
const uploadBtn = document.getElementById('upload-all-btn');
const tpl      = document.getElementById('upload-item-tpl');

if (!zone) throw new Error('Upload page elements not found');

let fileMap = new Map(); // fileId → { file, itemEl }
let idCounter = 0;

// ── Drag and drop ──────────────────────────────────────────────────────────
zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
zone.addEventListener('drop', (e) => {
  e.preventDefault();
  zone.classList.remove('drag-over');
  addFiles(e.dataTransfer.files);
});
zone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => addFiles(fileInput.files));

function addFiles(fileList) {
  for (const file of fileList) {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert(`${file.name}: solo JPEG y PNG.`);
      continue;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert(`${file.name}: máximo 10 MB.`);
      continue;
    }
    addFileItem(file);
  }
}

function addFileItem(file) {
  const fileId = ++idCounter;
  const clone = tpl.content.cloneNode(true);
  const item = clone.querySelector('.upload-item');
  item.dataset.fileId = fileId;

  // Preview
  const preview = item.querySelector('.upload-item__preview');
  preview.src = URL.createObjectURL(file);
  preview.onload = () => URL.revokeObjectURL(preview.src);

  item.querySelector('.upload-item__filename').textContent = file.name;

  // Remove button
  item.querySelector('.upload-item__remove').addEventListener('click', () => {
    fileMap.delete(fileId);
    item.remove();
    toggleFooter();
  });

  list.appendChild(item);
  fileMap.set(fileId, { file, itemEl: item });
  toggleFooter();
}

function toggleFooter() {
  footer.hidden = fileMap.size === 0;
}

// ── Upload all ─────────────────────────────────────────────────────────────
uploadBtn.addEventListener('click', async () => {
  uploadBtn.disabled = true;
  for (const [fileId, { file, itemEl }] of fileMap) {
    await uploadOne(fileId, file, itemEl);
  }
  uploadBtn.disabled = false;
});

async function uploadOne(fileId, file, itemEl) {
  const progressWrap = itemEl.querySelector('.upload-item__progress');
  const progressFill = itemEl.querySelector('.progress-bar__fill');
  const statusEl     = itemEl.querySelector('.upload-item__status');

  progressWrap.hidden = false;
  statusEl.textContent = 'Obteniendo URL…';

  // 1. Get pre-signed URL
  let presignedUrl, photoId;
  try {
    const res = await fetch('/admin/upload/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
    });
    if (!res.ok) throw new Error('Presign failed');
    ({ presignedUrl, photoId } = await res.json());
  } catch {
    statusEl.textContent = '✕ Error al iniciar subida.';
    return;
  }

  // 2. PUT to S3 with XHR (supports upload progress)
  statusEl.textContent = 'Subiendo…';
  try {
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          progressFill.style.width = `${(e.loaded / e.total * 100).toFixed(0)}%`;
        }
      });
      xhr.addEventListener('load', () => xhr.status < 300 ? resolve() : reject(new Error(`S3 ${xhr.status}`)));
      xhr.addEventListener('error', reject);
      xhr.send(file);
    });
  } catch {
    statusEl.textContent = '✕ Error al subir a S3.';
    return;
  }

  // 3. Notify server to process
  progressFill.style.width = '100%';
  statusEl.textContent = 'Procesando…';

  const fields = itemEl.querySelector('.upload-item__fields');
  const getValue = (name) => fields.querySelector(`[name="${name}"]`)?.value ?? '';
  const tagsRaw  = getValue('tags');

  try {
    const res = await fetch('/admin/upload/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId,
        title:        getValue('title') || undefined,
        location:     getValue('location') || undefined,
        shotAt:       getValue('shotAt') || undefined,
        collectionId: getValue('collectionId') || undefined,
        tags: tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [],
      }),
    });
    if (!res.ok) throw new Error('Complete failed');
  } catch {
    statusEl.textContent = '✕ Error al registrar la foto.';
    return;
  }

  statusEl.textContent = '✓ Listo';
  itemEl.querySelector('.upload-item__fields').style.opacity = '0.4';
  itemEl.querySelector('.upload-item__remove').hidden = true;
  fileMap.delete(fileId);
  toggleFooter();
}
