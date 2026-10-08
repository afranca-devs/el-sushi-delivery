export interface Insumo {
  id?: string;
  nome: string;      
  unidade: 'kg' | 'un' | 'g' | 'ml';
  quantidadeAtual: number;
  estoqueMinimo: number; 
}