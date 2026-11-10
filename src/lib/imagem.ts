// Pede a foto no tamanho de uso (o servidor da loja/Shopify devolve WebP leve).
// Ex.: foto de card ~15 KB em vez do original de ~1,4 MB.
const PIXELS = { miniatura: 200, card: 500, grande: 1100 } as const;
export type TamanhoImagem = keyof typeof PIXELS;

export function urlImagem(url: string | null | undefined, tamanho: TamanhoImagem = 'card'): string | null {
  if (!url) return null;
  if (url.includes('/cdn/shop/')) {
    const semLargura = url.replace(/([?&])width=\d+&?/, '$1').replace(/[?&]$/, '');
    return `${semLargura}${semLargura.includes('?') ? '&' : '?'}width=${PIXELS[tamanho]}`;
  }
  return url; // fotos enviadas pelo painel já sobem em WebP no tamanho certo
}
