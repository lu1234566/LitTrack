import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export type CapsulePngData = {
  readerName: string;
  monthName: string;
  year: string;
  finishedBooks: number;
  pages: number;
  minutesLabel: string;
  averageRating: string;
  vibe: string;
  genre: string;
  bookCount: number;
};

export async function pickImageAsDataUrl(): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.85 });
    if (result.canceled) return null;
    return result.assets?.[0]?.uri || null;
  }

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

export async function pickTextFile(accept = '.json,text/plain,application/json'): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', 'text/*', '*/*'],
      copyToCacheDirectory: true
    });
    if (result.canceled) return null;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return null;
    return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  }

  const documentRef = (globalThis as any).document;
  if (!documentRef?.createElement) return null;

  return new Promise((resolve) => {
    const input = documentRef.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsText(file, 'utf-8');
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

export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8') {
  const documentRef = (globalThis as any).document;
  const URLRef = (globalThis as any).URL;
  if (!documentRef?.createElement || !URLRef?.createObjectURL) return false;
  const blob = new Blob([content], { type: mimeType });
  const url = URLRef.createObjectURL(blob);
  const link = documentRef.createElement('a');
  link.href = url;
  link.download = filename;
  documentRef.body.appendChild(link);
  link.click();
  documentRef.body.removeChild(link);
  URLRef.revokeObjectURL(url);
  return true;
}

export function downloadCapsulePng(data: CapsulePngData) {
  const documentRef = (globalThis as any).document;
  if (!documentRef?.createElement) return false;
  const canvas = documentRef.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const gold = '#ff9900';
  const bg = '#151310';
  const panel = '#1d1b18';
  const line = 'rgba(255,255,255,0.14)';
  const text = '#f7f2e9';
  const muted = '#a8a29a';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGlow(ctx, 540, 360, 420, 'rgba(255,153,0,0.18)');
  drawGlow(ctx, 160, 1500, 520, 'rgba(255,153,0,0.10)');

  roundedRect(ctx, 80, 95, 920, 1730, 42, panel, line);
  ctx.strokeStyle = 'rgba(255,153,0,0.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(112, 128, 856, 1664);

  ctx.fillStyle = gold;
  ctx.font = '700 28px Georgia, serif';
  ctx.fillText('READORA • MEMÓRIAS LITERÁRIAS', 130, 190);

  ctx.fillStyle = text;
  ctx.font = '800 76px Georgia, serif';
  wrapText(ctx, 'Cápsula de ' + data.monthName, 130, 305, 820, 84);

  ctx.fillStyle = muted;
  ctx.font = '400 28px Arial, sans-serif';
  ctx.fillText('Jornada de ' + data.readerName + ' • ' + data.year, 130, 405);

  ctx.strokeStyle = 'rgba(255,255,255,0.11)';
  ctx.beginPath();
  ctx.moveTo(130, 470);
  ctx.lineTo(950, 470);
  ctx.stroke();

  ctx.fillStyle = text;
  ctx.font = 'italic 44px Georgia, serif';
  wrapText(ctx, '“' + data.monthName + ' foi um período de pausa, presença e descobertas entre páginas.”', 160, 610, 760, 60, 'center');

  const statY = 825;
  drawStat(ctx, 140, statY, 'LIVROS LIDOS', String(data.finishedBooks), gold, text, muted);
  drawStat(ctx, 560, statY, 'PÁGINAS', String(data.pages), gold, text, muted);
  drawStat(ctx, 140, statY + 205, 'TEMPO DE FOCO', data.minutesLabel, gold, text, muted);
  drawStat(ctx, 560, statY + 205, 'MÉDIA DO MÊS', data.averageRating, gold, text, muted);

  roundedRect(ctx, 130, 1325, 820, 76, 8, '#0b0b0b', 'rgba(255,255,255,0.10)');
  ctx.fillStyle = muted;
  ctx.font = '800 24px Arial, sans-serif';
  ctx.fillText('ACERVO CONCLUÍDO (' + data.bookCount + ')', 160, 1373);

  roundedRect(ctx, 130, 1440, 820, 150, 18, '#171717', 'rgba(255,255,255,0.16)');
  ctx.fillStyle = muted;
  ctx.font = 'italic 28px Georgia, serif';
  wrapText(ctx, 'Páginas em branco aguardando o despertar da próxima história do mês.', 190, 1512, 700, 38, 'center');

  ctx.fillStyle = muted;
  ctx.font = '800 20px Arial, sans-serif';
  ctx.fillText('ATMOSFERA', 130, 1685);
  ctx.fillText('UNIVERSO DE FOCO', 610, 1685);
  ctx.fillStyle = text;
  ctx.font = '800 34px Georgia, serif';
  ctx.fillText(data.vibe, 130, 1730);
  ctx.fillText(data.genre || 'Diverso', 610, 1730);

  const fileName = 'readora-capsula-' + data.year + '-' + data.monthName.toLowerCase().replace(/\s+/g, '-') + '.png';
  return downloadDataUrl(fileName, canvas.toDataURL('image/png'));
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

function downloadDataUrl(filename: string, dataUrl: string) {
  const documentRef = (globalThis as any).document;
  if (!documentRef?.createElement) return false;
  const link = documentRef.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  documentRef.body.appendChild(link);
  link.click();
  documentRef.body.removeChild(link);
  return true;
}

function drawStat(ctx: any, x: number, y: number, label: string, value: string, gold: string, text: string, muted: string) {
  roundedRect(ctx, x, y, 360, 160, 18, '#22201d', 'rgba(255,255,255,0.12)');
  ctx.fillStyle = muted;
  ctx.font = '800 20px Arial, sans-serif';
  ctx.fillText(label, x + 28, y + 48);
  ctx.fillStyle = text;
  ctx.font = '800 50px Georgia, serif';
  ctx.fillText(value, x + 28, y + 112);
  ctx.fillStyle = gold;
  ctx.fillRect(x + 28, y + 128, 70, 4);
}

function drawGlow(ctx: any, x: number, y: number, radius: number, color: string) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function roundedRect(ctx: any, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function wrapText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number, align: 'left' | 'center' = 'left') {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  ctx.textAlign = align;
  const drawX = align === 'center' ? x + maxWidth / 2 : x;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, drawX, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, drawX, currentY);
  ctx.textAlign = 'left';
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
