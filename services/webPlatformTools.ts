export async function pickImageAsDataUrl(): Promise<string | null> {
  const documentRef = (globalThis as any).document;
  if (!documentRef?.createElement) return null;

  return new Promise((resolve) => {
    const input = documentRef.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

export async function scanBarcodeFromImage(): Promise<string | null> {
  const documentRef = (globalThis as any).document;
  const BarcodeDetectorRef = (globalThis as any).BarcodeDetector;
  if (!documentRef?.createElement || !BarcodeDetectorRef) return null;

  const dataUrl = await pickImageAsDataUrl();
  if (!dataUrl) return null;

  return new Promise((resolve) => {
    const img = documentRef.createElement('img');
    img.onload = async () => {
      try {
        const detector = new BarcodeDetectorRef({ formats: ['ean_13', 'ean_8', 'isbn_13', 'upc_a', 'code_128'] });
        const results = await detector.detect(img);
        const value = results?.[0]?.rawValue;
        resolve(value ? String(value) : null);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export function printTextDocument(title: string, body: string) {
  const windowRef = (globalThis as any).window;
  if (!windowRef?.open) return false;
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body).replace(/\n/g, '<br />');
  const printWindow = windowRef.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return false;
  printWindow.document.write(`<!doctype html><html><head><title>${safeTitle}</title><style>body{background:#fff;color:#111;font-family:Georgia,serif;padding:40px;line-height:1.6;}h1{font-size:28px;}pre{white-space:pre-wrap;font-family:Georgia,serif;font-size:14px;}</style></head><body><h1>${safeTitle}</h1><pre>${safeBody}</pre></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
