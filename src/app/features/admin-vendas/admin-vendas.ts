import { Component, inject, OnInit, signal, PLATFORM_ID, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Firestore, collection, query, orderBy, onSnapshot, where, Timestamp } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-vendas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-vendas.html',
  styleUrl: './admin-vendas.scss'
})
export class AdminVendasComponent implements OnInit {
  firestore = inject(Firestore);
  platformId = inject(PLATFORM_ID);

  // 🔥 RAW DATA (Dados brutos do banco)
  historicoBruto = signal<any[]>([]);
  despesas = signal<any[]>([]); 
  
  // 🔥 SEPARAÇÃO INTELIGENTE
  // Vendas reais (Status diferente de Cancelado)
  vendas = computed(() => this.historicoBruto().filter(v => v.statusFinal !== 'Cancelado'));
  
  // Recusados (Status igual a Cancelado)
  recusados = computed(() => this.historicoBruto().filter(v => v.statusFinal === 'Cancelado'));

  filtroPeriodo = signal<'hoje' | '7dias' | '30dias' | 'todos' | 'personalizado'>('hoje');
  
  // 🔥 Nova opção de aba 'recusados'
  abaAtiva = signal<'resumo' | 'historico' | 'recusados'>('resumo');

  itensPorPagina = 8;
  paginaAtual = signal(0); 
  dataInicio = signal<string>('');
  dataFim = signal<string>('');

  // --- CÁLCULOS (Baseados apenas nas Vendas Concluídas) ---
  totalFaturamento = computed(() => this.vendas().reduce((acc, v) => acc + (v.total || 0), 0));
  totalGastos = computed(() => this.despesas().reduce((acc, d) => acc + (d.valor || 0), 0));
  totalLucro = computed(() => this.totalFaturamento() - this.totalGastos());

  // Métricas de Recusados
  totalPerdido = computed(() => this.recusados().reduce((acc, v) => acc + (v.total || 0), 0));

  totalPix = computed(() => this.vendas().filter(v => v.pagamento?.toLowerCase() === 'pix').reduce((acc, v) => acc + (v.total || 0), 0));
  totalDinheiro = computed(() => this.vendas().filter(v => v.pagamento?.toLowerCase() === 'dinheiro' || v.pagamento?.toLowerCase() === 'especie').reduce((acc, v) => acc + (v.total || 0), 0));
  totalCartao = computed(() => this.vendas().filter(v => v.pagamento?.toLowerCase().includes('cart')).reduce((acc, v) => acc + (v.total || 0), 0));

  porcentagemPix = computed(() => this.totalFaturamento() > 0 ? (this.totalPix() / this.totalFaturamento()) * 100 : 0);
  porcentagemDinheiro = computed(() => this.totalFaturamento() > 0 ? (this.totalDinheiro() / this.totalFaturamento()) * 100 : 0);
  porcentagemCartao = computed(() => this.totalFaturamento() > 0 ? (this.totalCartao() / this.totalFaturamento()) * 100 : 0);

  rankingProdutos = computed(() => {
    const mapa = new Map();
    this.vendas().forEach(v => {
      v.itens?.forEach((item: any) => {
        const nomeProduto = item.nome || 'Produto';
        const quantidade = item.quantidade || 1;
        const atual = mapa.get(nomeProduto) || 0;
        mapa.set(nomeProduto, atual + quantidade);
      });
    });
    return [...mapa.entries()].map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd).slice(0, 3);
  });

  // Paginação Vendas
  vendasPaginadas = computed(() => {
    const inicio = this.paginaAtual() * this.itensPorPagina;
    return this.vendas().slice(inicio, inicio + this.itensPorPagina);
  });

  // Paginação Recusados
  recusadosPaginados = computed(() => {
    const inicio = this.paginaAtual() * this.itensPorPagina;
    return this.recusados().slice(inicio, inicio + this.itensPorPagina);
  });

  // Lógica de paginação dinâmica (depende da aba ativa)
  listaAtualParaPaginacao = computed(() => this.abaAtiva() === 'recusados' ? this.recusados() : this.vendas());
  
  totalPaginas = computed(() => Math.ceil(this.listaAtualParaPaginacao().length / this.itensPorPagina));
  temProxima = computed(() => this.paginaAtual() < this.totalPaginas() - 1);
  temAnterior = computed(() => this.paginaAtual() > 0);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) this.aplicarFiltro('hoje');
  }

  aplicarFiltro(tipo: any) {
    this.paginaAtual.set(0); 
    this.filtroPeriodo.set(tipo);
    // Carrega tudo (vendas + cancelados) no historicoBruto
    this.carregarDadosFirestore('historico', tipo, (docs) => this.historicoBruto.set(docs), 'concluidoEm');
    this.carregarDadosFirestore('despesas', tipo, (docs) => this.despesas.set(docs), 'data');
  }

  private carregarDadosFirestore(colecao: string, tipo: string, callback: (dados: any[]) => void, campoData: string) {
    const ref = collection(this.firestore, colecao);
    let q;

    if (tipo === 'todos') {
      q = query(ref, orderBy(campoData, 'desc'));
    } else if (tipo === 'personalizado') {
      if (!this.dataInicio() || !this.dataFim()) return;
      const de = new Date(this.dataInicio() + 'T00:00:00');
      const ate = new Date(this.dataFim() + 'T23:59:59');
      q = query(ref, where(campoData, '>=', Timestamp.fromDate(de)), where(campoData, '<=', Timestamp.fromDate(ate)), orderBy(campoData, 'desc'));
    } else {
      const dataFiltro = new Date();
      dataFiltro.setHours(0, 0, 0, 0);
      
      if (tipo === '7dias') {
        dataFiltro.setDate(dataFiltro.getDate() - 7);
      } else if (tipo === '30dias') {
        dataFiltro.setDate(dataFiltro.getDate() - 30);
      }
      
      q = query(ref, where(campoData, '>=', Timestamp.fromDate(dataFiltro)), orderBy(campoData, 'desc'));
    }

    onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }

  mudarPagina(direcao: number) { this.paginaAtual.update(p => p + direcao); }
  
  // Reseta paginação ao trocar aba
  trocarAba(novaAba: 'resumo' | 'historico' | 'recusados') {
    this.abaAtiva.set(novaAba);
    this.paginaAtual.set(0);
  }
}