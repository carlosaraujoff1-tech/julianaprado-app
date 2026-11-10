const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarReais(v: number | null | undefined) {
  return reais.format(Number(v ?? 0)).replace(/ /g, ' ');
}

export function soDigitos(t: string) {
  return (t ?? '').replace(/\D/g, '');
}

export function mascaraCpf(t: string) {
  const d = soDigitos(t).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

export function mascaraTelefone(t: string) {
  const d = soDigitos(t).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function mascaraData(t: string) {
  const d = soDigitos(t).slice(0, 8);
  return d.replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
}

// "31/12/1990" -> "1990-12-31" (ou null se inválida)
export function dataParaIso(t: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (!m) return null;
  const [, d, mes, a] = m;
  const dt = new Date(`${a}-${mes}-${d}T12:00:00`);
  if (Number.isNaN(dt.getTime()) || dt.getDate() !== Number(d)) return null;
  return `${a}-${mes}-${d}`;
}

export function isoParaData(iso: string | null | undefined) {
  if (!iso) return '';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

// Mesma regra do banco (public.cpf_valido).
export function cpfValido(t: string) {
  const c = soDigitos(t);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const dv = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(c[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
}

export function emailValido(t: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t.trim());
}

export function dataHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function tempoRelativo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'agora';
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  if (s < 7 * 86400) return `há ${Math.floor(s / 86400)} dia${s >= 2 * 86400 ? 's' : ''}`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

export const rotuloStatus: Record<string, string> = {
  recebido: 'Recebido',
  pago: 'Pago',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};
export const ordemStatus = ['recebido', 'pago', 'em_separacao', 'enviado', 'entregue'] as const;
