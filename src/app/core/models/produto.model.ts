export interface Produto {
  id?: string;
  nome: string;
  preco: number;
  categoria: string;
  imagem?: string;       // Opcional
  imagemUrl?: string;    // Adicionei este para bater com o seu TS
  descricao: string;     // ADICIONADO: O que estava dando erro!
  ativo: boolean;        // ADICIONADO: Para o controle de status
  ingredientes?: IngredienteFicha[];
}

export interface IngredienteFicha {
  insumoId: string; // ID lá da coleção de insumos
  nome: string;
  quantidadeNecessaria: number; 
}