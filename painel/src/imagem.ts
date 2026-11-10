// Prepara a foto da notificação: recorte central 2:1 e JPEG de até 1024 px de largura.
// (JPEG porque a notificação do Android não mostra WebP em todos os aparelhos.)
export async function prepararFoto(arquivo: File): Promise<{ blob: Blob; url: string }> {
  const bmp = await createImageBitmap(arquivo);
  const proporcao = 2;
  let sw = bmp.width, sh = bmp.height;
  if (sw / sh > proporcao) sw = sh * proporcao; else sh = sw / proporcao;
  const sx = (bmp.width - sw) / 2, sy = (bmp.height - sh) / 2;
  const w = Math.min(1024, Math.round(sw)), h = Math.round(w / proporcao);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h);
  const blob: Blob = await new Promise((ok, erro) => c.toBlob((b) => (b ? ok(b) : erro(new Error('Falha ao preparar a foto'))), 'image/jpeg', 0.82));
  return { blob, url: URL.createObjectURL(blob) };
}
