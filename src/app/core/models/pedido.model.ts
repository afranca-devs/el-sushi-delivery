export interface ItemPedido {
  id?: string;
  nome: string;
  quantidade: number;
  preco: number;
  observacao?: string;
}

export interface EnderecoCliente {
  rua: string;
  numero: string;
  bairro: string;
  complemento?: string;
  referencia?: string;
}

export interface ClientePedido {
  nome: string;
  telefone: string;
  endereco?: EnderecoCliente;
}

export interface Pedido {
  id: string;
  numero?: number;
  cliente: ClientePedido;
  itens: ItemPedido[];
  total: number;
  taxaEntrega?: number;
  pagamento: string;
  status: string;
  observacao?: string;
  dataCriacao?: string;
  origem?: string;
  isRetirada?: boolean;
  enviarZap?: boolean;
}
