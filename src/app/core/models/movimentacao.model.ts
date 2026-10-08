export interface Movimentacao {
  id?: string;
  insumoId: string;
  nomeInsumo: string;
  quantidade: number; // Negativo para saída, Positivo para entrada
  tipo: 'entrada' | 'saida';
  motivo: string; // Ex: "Venda Pedido #102" ou "Compra de fornecedor"
  data: any; // Timestamp do Firebase
}