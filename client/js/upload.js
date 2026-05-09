const zone      = document.getElementById('upload-zone');
const fileInput  = document.getElementById('file-input');
const list       = document.getElementById('upload-list');
const footer     = document.getElementById('upload-footer');
const uploadBtn  = document.getElementById('upload-all-btn');
const tpl        = document.getElementById('upload-item-tpl');
const i18nEl     = document.getElementById('upload-i18n');

if (!zone) throw new Error('Upload page elements not found');

const i18n = i18nEl ? JSON.parse(i18nEl.textContent) : {};
const MAX_MB = 25;
const MAX_BYTES = MAX_MB * 1024 * 1024;

let fileMap = new Map();
let idCounter = 0;

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
      alert(`${file.name}: ${i18n.onlyJpegPng || 'JPEG y PNG únicamente.'}`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      alert(`${file.name}: ${i18n.maxSize || `máximo ${MAX_MB} MB.`}`);
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

  const preview = item.querySelector('.upload-item__preview');
  preview.src = URL.createObjectURL(file);
  preview.onload = () => URL.revokeObjectURL(preview.src);

  item.querySelector('.upload-item__filename').textContent = file.name;

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
  statusEl.textContent = i18n.getting || 'Obteniendo URL…';

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
    statusEl.textContent = i18n.errStart || '✕ Error al iniciar subida.';
    return;
  }

  statusEl.textContent = i18n.uploading || 'Subiendo…';
  try {
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) progressFill.style.width = `${(e.loaded / e.total * 100).toFixed(0)}%`;
      });
      xhr.addEventListener('load', () => xhr.status < 300 ? resolve() : reject(new Error(`S3 ${xhr.status}`)));
      xhr.addEventListener('error', reject);
      xhr.send(file);
    });
  } catch {
    statusEl.textContent = i18n.errS3 || '✕ Error al subir a S3.';
    return;
  }

  progressFill.style.width = '100%';
  statusEl.textContent = i18n.processing || 'Procesando…';

  const fields = itemEl.querySelector('.upload-item__fields');
  const getValue = (name) => fields.querySelector(`[name="${name}"]`)?.value ?? '';
  const tagsRaw = getValue('tags');

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
    statusEl.textContent = i18n.errComplete || '✕ Error al registrar la foto.';
    return;
  }

  statusEl.textContent = i18n.done || '✓ Listo';
  itemEl.querySelector('.upload-item__fields').style.opacity = '0.4';
  itemEl.querySelector('.upload-item__remove').hidden = true;
  fileMap.delete(fileId);
  toggleFooter();
}
