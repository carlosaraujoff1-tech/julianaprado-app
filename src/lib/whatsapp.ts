import { Linking } from 'react-native';

import { formatarReais } from '@/lib/formatacao';
import type { Pedido, PedidoItem } from '@/types/database';

export function linkWhatsapp(numero: string, texto: string) {
  const n = (numero ?? '').replace(/\D/g, '');
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
}

export async function abrirWhatsapp(numero: string, texto: string) {
  await Linking.openURL(linkWhatsapp(numero, texto));
}

export function mensagemPedido(modelo: string, pedido: Pedido, itens: PedidoItem[], nome?: string) {
  const inicio = (modelo || 'Olá! Acabei de fazer o pedido Nº {numero} pelo app.').replace('{numero}', String(pedido.numero));
  const linhas = itens.map((i) =>
    `• ${i.quantidade}x ${i.produto_nome}${i.variacao_nome ? ` (${i.variacao_nome})` : ''} — ${formatarReais(i.subtotal)}`);
  const partes = [inicio, '', ...linhas, ''];
  if (Number(pedido.desconto) > 0) partes.push(`Cupom ${pedido.cupom_codigo}: -${formatarReais(pedido.desconto)}`);
  partes.push(`*Total: ${formatarReais(pedido.total)}*`);
  if (pedido.tabela_preco === 'revenda') partes.push('(preço de revenda)');
  if (nome) partes.push('', `Nome: ${nome}`);
  if (pedido.observacoes) partes.push(`Obs.: ${pedido.observacoes}`);
  partes.push('', 'Podemos combinar a entrega e o pagamento?');
  return partes.join('\n');
}
