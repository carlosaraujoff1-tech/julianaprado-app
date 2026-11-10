// Gerado a partir do banco (Supabase → generate types). Não editar à mão:
// depois de mudar o banco, gere de novo.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Tabela<R, I = Partial<R>> = { Row: R; Insert: I; Update: Partial<R>; Relationships: [] };

export type StatusPedido = 'recebido' | 'pago' | 'em_separacao' | 'enviado' | 'entregue' | 'cancelado';
export type TipoPerfil = 'cliente' | 'vendedora' | 'admin';
export type SituacaoRevenda = 'nao_solicitada' | 'pendente' | 'aprovada' | 'recusada';
export type TipoCupom = 'percentual' | 'valor';

export type Perfil = {
  atualizado_em: string; bubble_id: string | null; cidade: string | null; cpf: string | null; criado_em: string;
  data_nascimento: string | null; email: string | null; id: string; nome: string; notificacoes_lidas_em: string;
  revenda: SituacaoRevenda; revenda_decidida_em: string | null; sacola_alterada_em: string | null;
  sacola_aviso_1d_em: string | null; sacola_aviso_1h_em: string | null; telefone: string | null;
  tipo: TipoPerfil; uf: string | null; ultimo_acesso: string | null;
};
export type Pedido = {
  atendente_id: string | null; atualizado_em: string; cliente_id: string | null; cliente_snapshot: Json;
  criado_em: string; cupom_codigo: string | null; cupom_id: string | null; desconto: number; id: string;
  numero: number; observacoes: string | null; observacoes_internas: string | null; status: StatusPedido;
  status_alterado_em: string; subtotal: number; tabela_preco: string; total: number;
};
export type PedidoItem = {
  id: string; imagem_url: string | null; pedido_id: string; preco_unitario: number; produto_id: string | null;
  produto_nome: string; quantidade: number; sku: string | null; subtotal: number; variacao_id: string | null;
  variacao_nome: string | null;
};
export type Notificacao = {
  corpo: string; criado_em: string; criado_por: string | null; destinatario_id: string | null; evento: string | null;
  id: string; imagem_url: string | null; rota: string | null; titulo: string;
};
export type Banner = { ativo: boolean; criado_em: string; id: string; imagem_url: string; link: string | null; ordem: number; titulo: string };
export type Configuracao = { chave: string; descricao: string | null; valor: string };
export type Favorito = { criado_em: string; produto_id: string; usuario_id: string };
export type ErroApp = {
  criado_em: string; id: number; mensagem: string; plataforma: string | null; stack: string | null;
  tela: string | null; usuario_id: string | null; versao_app: string | null;
};

export type ProdutoVitrine = {
  categoria_id: string; categoria_nome: string; desconto_pct: number | null; esgotado: boolean; id: string;
  imagem: string | null; nome: string; novidade: boolean; preco_de: number | null; preco_por: number;
  sku: string; tem_variacoes: boolean;
};
export type ItemSacola = {
  disponivel: boolean; imagem: string | null; item_id: string; nome: string; preco_de: number | null; preco_por: number;
  produto_id: string; quantidade: number; subtotal: number; variacao_id: string | null; variacao_nome: string | null;
};

export type Database = {
  public: {
    Tables: {
      perfis: Tabela<Perfil, Partial<Perfil> & { id: string }>;
      pedidos: Tabela<Pedido>;
      pedido_itens: Tabela<PedidoItem>;
      notificacoes: Tabela<Notificacao, Partial<Notificacao> & { titulo: string; corpo: string }>;
      banners: Tabela<Banner>;
      configuracoes: Tabela<Configuracao>;
      favoritos: Tabela<Favorito, { produto_id: string; usuario_id: string }>;
      erros_app: Tabela<ErroApp, Partial<ErroApp> & { mensagem: string }>;
    };
    Views: { [_ in never]: never };
    Functions: {
      contar_notificacoes_nao_lidas: { Args: never; Returns: number };
      criar_pedido: { Args: { p_cupom?: string; p_observacoes?: string }; Returns: Json };
      decidir_revenda: { Args: { p_aprovar: boolean; p_usuario: string }; Returns: undefined };
      excluir_minha_conta: { Args: never; Returns: undefined };
      marcar_notificacoes_lidas: { Args: never; Returns: undefined };
      registrar_acesso: { Args: never; Returns: undefined };
      registrar_dispositivo: { Args: { p_plataforma: string; p_token: string }; Returns: undefined };
      sacola_adicionar: { Args: { p_produto_id: string; p_quantidade?: number; p_variacao_id?: string }; Returns: undefined };
      sacola_mesclar: { Args: { p_itens: Json }; Returns: number };
      sacola_quantidade: { Args: { p_item_id: string; p_quantidade: number }; Returns: undefined };
      sacola_ver: { Args: never; Returns: ItemSacola[] };
      solicitar_revenda: { Args: never; Returns: undefined };
      validar_cupom: { Args: { p_codigo: string }; Returns: Json };
      vitrine_categorias: { Args: never; Returns: { id: string; imagem_url: string | null; nome: string; qtd: number }[] };
      vitrine_produto: { Args: { p_id: string }; Returns: Json };
      vitrine_produtos: {
        Args: { p_busca?: string; p_categoria?: string; p_filtro?: string; p_ids?: string[]; p_limite?: number; p_offset?: number };
        Returns: ProdutoVitrine[];
      };
    };
    Enums: { situacao_revenda: SituacaoRevenda; status_pedido: StatusPedido; tipo_cupom: TipoCupom; tipo_perfil: TipoPerfil };
    CompositeTypes: { [_ in never]: never };
  };
};
