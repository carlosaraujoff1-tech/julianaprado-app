import { useEffect, useRef, useState, type PointerEvent } from 'react';

// Recorte da foto do post no formato da tela do celular (9 x 16):
// arraste para posicionar e use o controle para aproximar.
// Na hora de enviar, gera a foto (até 1080 x 1920) e a miniatura (360 x 640) em WebP.
const LF = 270, AF = 480; // tamanho do quadro na tela

export type Corte = { img: HTMLImageElement; zoom: number; ox: number; oy: number };

export function Recorte({ arquivo, onPronto }: { arquivo: File; onPronto: (c: Corte) => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ ox: 0, oy: 0 });
  const arraste = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(arquivo);
    const i = new Image();
    i.onload = () => {
      setImg(i); setZoom(1);
      const s = Math.max(LF / i.naturalWidth, AF / i.naturalHeight);
      setPos({ ox: (LF - i.naturalWidth * s) / 2, oy: (AF - i.naturalHeight * s) / 2 });
    };
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  const escala = img ? Math.max(LF / img.naturalWidth, AF / img.naturalHeight) * zoom : 1;
  const limitar = (ox: number, oy: number) => img ? ({
    ox: Math.min(0, Math.max(LF - img.naturalWidth * escala, ox)),
    oy: Math.min(0, Math.max(AF - img.naturalHeight * escala, oy)),
  }) : { ox, oy };

  useEffect(() => { setPos((p) => limitar(p.ox, p.oy)); }, [zoom]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (img) onPronto({ img, zoom, ox: pos.ox, oy: pos.oy }); }, [img, zoom, pos]); // eslint-disable-line react-hooks/exhaustive-deps

  const baixo = (e: PointerEvent<HTMLDivElement>) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); arraste.current = { x: e.clientX, y: e.clientY, ...pos }; };
  const mover = (e: PointerEvent<HTMLDivElement>) => {
    const a = arraste.current; if (!a) return;
    setPos(limitar(a.ox + e.clientX - a.x, a.oy + e.clientY - a.y));
  };

  if (!img) return <div className="recorte-quadro"><div className="carregando" /></div>;
  const pequena = Math.round(LF / escala) < 720;
  return (
    <div className="recorte">
      <div className="recorte-quadro" onPointerDown={baixo} onPointerMove={mover} onPointerUp={() => (arraste.current = null)}>
        <img src={img.src} alt="" draggable={false}
          style={{ width: img.naturalWidth * escala, height: img.naturalHeight * escala, transform: `translate(${pos.ox}px, ${pos.oy}px)` }} />
        <div className="recorte-guia topo">área do nome e perfil</div>
        <div className="recorte-guia base">área do título, produto e legenda</div>
      </div>
      <label className="recorte-zoom">Aproximar
        <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
      </label>
      <p className="legenda">Arraste a foto para posicionar. Deixe o principal no meio da tela.</p>
      {pequena && <p className="erro">Foto com pouca resolução para este recorte: pode ficar um pouco desfocada no celular.</p>}
    </div>
  );
}

function desenhar(c: Corte, largura: number) {
  const escala = Math.max(LF / c.img.naturalWidth, AF / c.img.naturalHeight) * c.zoom;
  const sx = -c.ox / escala, sy = -c.oy / escala, sw = LF / escala, sh = AF / escala;
  const lw = Math.min(largura, Math.round(sw)), lh = Math.round(lw * 16 / 9);
  const cv = document.createElement('canvas'); cv.width = lw; cv.height = lh;
  const ctx = cv.getContext('2d')!; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(c.img, sx, sy, sw, sh, 0, 0, lw, lh);
  return cv;
}

function paraWebp(cv: HTMLCanvasElement, q: number): Promise<Blob> {
  return new Promise((ok, erro) => cv.toBlob((b) => (b ? ok(b) : erro(new Error('Falha ao gerar a foto'))), 'image/webp', q));
}

// Foto grande: começa em qualidade 0,8 e reduz até caber em ~600 KB (o servidor aceita até 1,5 MB).
export async function gerarFotos(c: Corte) {
  const grande = desenhar(c, 1080);
  let q = 0.8, blob = await paraWebp(grande, q);
  while (blob.size > 600 * 1024 && q > 0.45) { q -= 0.1; blob = await paraWebp(grande, q); }
  const mini = await paraWebp(desenhar(c, 360), 0.5);
  return { grande: blob, mini, largura: grande.width, altura: grande.height };
}
