import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalBaseComponent } from '../../components/modal-base/modal-base';
import { ModalConfirmacaoComponent } from '../../components/modal-confirmacao/modal-confirmacao';
import { Firestore, collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDocs, getDoc, setDoc } from '@angular/fire/firestore';
import { CardapioService } from '../../core/services/cardapio.service';
import { ImpressaoService } from '../../core/services/impressao.service';
import { ArmazenamentoDemoService } from '../../core/services/armazenamentoDemo.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-painel-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalBaseComponent, ModalConfirmacaoComponent],
  templateUrl: './painel-pedidos.html',
  styleUrl: './painel-pedidos.scss'
})
export class PainelPedidosComponent implements OnInit {
  firestore = inject(Firestore);
  cardapioService = inject(CardapioService);
  impressaoService = inject(ImpressaoService);
  armazenamentoService = inject(ArmazenamentoDemoService);

  pedidos = signal<any[]>([]);
  cardapio = signal<any[]>([]);

  modoExibicao = signal<'kanban' | 'mesas'>('kanban');

  modalFinalizarAberto = false;
  modalCancelarAberto = false;
  modalManualAberto = false;
  modalConfigAberto = false;
  modalRecusarAberto = false;
  modalFecharContaAberto = false;
  
  modalExcluirBairroAberto = false;
  bairroParaExcluirId: string | null = null;

  erroManual = signal(false);
  pedidoSelecionado: any = null;
  motivoRecusa = signal('Cancelamento solicitado pelo cliente');
  idEdicao: string | null = null;

  termoBusca = signal('Sushi');
  produtosFiltrados = computed(() => {
    const busca = this.termoBusca().toLowerCase();
    if (!busca || busca.length < 2) return [];
    return this.cardapio().filter(p => p.nome.toLowerCase().includes(busca)).slice(0, 5);
  });

  novoPedido = {
    cliente: {
      nome: 'Cliente Balcão Demo',
      telefone: '(21) 99999-9999',
      endereco: { rua: 'Balcão da Loja', numero: 'Balcão', bairro: 'Centro', referencia: 'Retirada presencial' }
    },
    itens: [] as any[],
    total: 0 as number | null, 
    pagamento: 'A Pagar',
    observacao: 'Pedido para viagem',
    taxaEntrega: 0
  };

  buscandoCliente = signal(false);
  lojaAberta = signal(true);
  listaBairros = signal<any[]>([]);
  novoBairroNome = 'Novo Bairro Demo';
  novoBairroTaxa: number | null = 5;

  get pendentes() { return this.pedidos().filter(p => p.status === 'pendente'); }
  get preparando() { return this.pedidos().filter(p => p.status === 'preparando' || p.status === 'preparacao'); }
  get entregues() { return this.pedidos().filter(p => p.status === 'aguardando' || p.status === 'em_rota'); }
  get comandas() { return this.pedidos().filter(p => p.status === 'comanda_aberta'); }
  get agora() { return new Date(); }

  ngOnInit() {
    this.carregarPedidos();
    this.carregarCardapio();
    this.cardapioService.obterStatusLoja().subscribe((d: any) => this.lojaAberta.set(d ? d.aberta : true));
    this.cardapioService.obterBairros().subscribe(b => this.listaBairros.set(b));
  }

  irParaMesas() { this.modoExibicao.set('mesas'); }
  voltarProDelivery() { this.modoExibicao.set('kanban'); }

  async buscarClientePorTelefone() {
    const tel = this.novoPedido.cliente.telefone.replace(/\D/g, '');
    if (tel.length < 8) return;
    this.buscandoCliente.set(true);
    try {
      if (environment.modoDemonstracao) return;
      const docRef = doc(this.firestore, 'clientes', tel);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const dados = snap.data();
        this.novoPedido.cliente.nome = dados['nome'] || 'Cliente Frequente';
        if (dados['endereco']) {
          this.novoPedido.cliente.endereco.rua = dados['endereco'].rua || 'Rua Principal';
          this.novoPedido.cliente.endereco.numero = dados['endereco'].numero || '10';
          this.novoPedido.cliente.endereco.bairro = dados['endereco'].bairro || 'Centro';
          this.novoPedido.cliente.endereco.referencia = dados['endereco'].referencia || 'Casa';
        }
      }
    } catch {
    } finally {
      this.buscandoCliente.set(false);
    }
  }

  abrirModalManual(comandaParaEditar: any = null) {
    if (comandaParaEditar) {
      this.idEdicao = comandaParaEditar.id;
      this.novoPedido = JSON.parse(JSON.stringify({
        cliente: comandaParaEditar.cliente,
        itens: comandaParaEditar.itens || [],
        total: comandaParaEditar.total || 0,
        pagamento: comandaParaEditar.pagamento || 'A Pagar',
        observacao: comandaParaEditar.observacao || 'Observação padrão',
        taxaEntrega: 0
      }));
    } else {
      this.idEdicao = null;
      this.novoPedido = {
        cliente: { nome: 'Cliente Balcão Demo', telefone: '(21) 99999-9999', endereco: { rua: 'Balcão da Loja', numero: 'Balcão', bairro: 'Centro', referencia: 'Retirada presencial' } },
        itens: [],
        total: 0, 
        pagamento: 'A Pagar',
        observacao: 'Pedido balcão',
        taxaEntrega: 0
      };
    }
    this.erroManual.set(false);
    this.modalManualAberto = true;
  }

  async salvarPedidoManual() {
    const cli = this.novoPedido.cliente;
    const ehMesa = this.modoExibicao() === 'mesas';

    if (!cli.nome || !this.novoPedido.itens.length || !this.novoPedido.total) {
      this.erroManual.set(true);
      return;
    }

    try {
      const proximoNum = await this.obterProximoNumero();

      const dadosBase = {
        cliente: cli,
        itens: this.novoPedido.itens,
        total: this.novoPedido.total || 0, 
        observacao: this.novoPedido.observacao,
        status: ehMesa ? 'comanda_aberta' : 'pendente',
        pagamento: this.novoPedido.pagamento || 'A Pagar',
        origem: ehMesa ? 'Mesa/Presencial' : 'Balcao/Zap',
        isRetirada: !ehMesa,
        enviarZap: !ehMesa
      };

      if (environment.modoDemonstracao) {
        if (this.idEdicao) {
          this.armazenamentoService.atualizarItem('pedidos', this.idEdicao, {
            itens: this.novoPedido.itens,
            total: this.novoPedido.total,
            observacao: this.novoPedido.observacao
          });
        } else {
          this.armazenamentoService.adicionarItem('pedidos', {
            ...dadosBase,
            numero: proximoNum,
            data: new Date().toISOString()
          });
        }
        this.fecharModais();
        return;
      }

      if (this.idEdicao) {
        await updateDoc(doc(this.firestore, 'pedidos', this.idEdicao), {
          itens: this.novoPedido.itens,
          total: this.novoPedido.total,
          observacao: this.novoPedido.observacao
        });
      } else {
        await addDoc(collection(this.firestore, 'pedidos'), {
          ...dadosBase,
          numero: proximoNum,
          data: new Date().toISOString()
        });
      }

      const telLimpo = cli.telefone.replace(/\D/g, '');
      if (telLimpo.length >= 8) {
        const clienteRef = doc(this.firestore, 'clientes', telLimpo);
        await setDoc(clienteRef, {
          nome: cli.nome,
          telefone: cli.telefone,
          endereco: cli.endereco,
          ultimoPedido: new Date()
        }, { merge: true });
      }

      this.fecharModais();
    } catch {
      alert('Erro ao salvar.');
    }
  }

  abrirFecharConta(p: any) {
    this.pedidoSelecionado = p;
    this.pedidoSelecionado.pagamentoFinal = 'dinheiro';
    this.modalFecharContaAberto = true;
  }

  async confirmarFechamentoConta() {
    if (!this.pedidoSelecionado.pagamentoFinal) { alert('Selecione o pagamento.'); return; }
    try {
      if (environment.modoDemonstracao) {
        this.armazenamentoService.adicionarItem('historico', {
          ...this.pedidoSelecionado,
          pagamento: this.pedidoSelecionado.pagamentoFinal,
          concluidoEm: new Date().toISOString(),
          statusFinal: 'Concluido',
          origem: 'Mesa/Presencial'
        });
        this.armazenamentoService.removerItem('pedidos', this.pedidoSelecionado.id);
        this.fecharModais();
        return;
      }

      await addDoc(collection(this.firestore, 'historico'), {
        ...this.pedidoSelecionado,
        pagamento: this.pedidoSelecionado.pagamentoFinal,
        concluidoEm: new Date(),
        statusFinal: 'Concluido',
        origem: 'Mesa/Presencial'
      });
      await deleteDoc(doc(this.firestore, 'pedidos', this.pedidoSelecionado.id));
      this.fecharModais();
    } catch {
    }
  }

  enviarZap(p: any, msg: string) {
    if (!msg) return;
    const tel = p.cliente?.telefone || p.telefone || '21999999999';
    const numeroLimpo = tel.replace(/\D/g, '');
    if (numeroLimpo.length >= 10) {
      const link = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(msg)}`;
      setTimeout(() => window.open(link, '_blank'), 100);
    }
  }

  abrirModalConfig() { this.modalConfigAberto = true; }
  fecharModais() {
    this.modalFinalizarAberto = false; this.modalCancelarAberto = false; this.modalManualAberto = false;
    this.modalConfigAberto = false; this.modalRecusarAberto = false; this.modalFecharContaAberto = false;
    this.modalExcluirBairroAberto = false;
    this.pedidoSelecionado = null; this.idEdicao = null; this.termoBusca.set('Sushi');
    this.bairroParaExcluirId = null;
  }

  getClienteNome(p: any): string { if (p && p.cliente && typeof p.cliente === 'object' && p.cliente.nome) return p.cliente.nome; if (p && p.cliente && typeof p.cliente === 'string') return p.cliente; return 'Cliente'; }
  getPedidoId(p: any): string { if (!p) return ''; if (p.numero) return '#' + String(p.numero).padStart(3, '0'); return '#' + (p.id ? p.id.slice(0, 4) : '001'); }

  aplicarMascaraTelefone(event: any) { let v = event.target.value.replace(/\D/g, ''); if (v.length > 11) v = v.substring(0, 11); if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3'); else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3'); else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2'); else if (v.length > 0) v = v.replace(/^(\d*)/, '($1'); this.novoPedido.cliente.telefone = v; event.target.value = v; }

  selecionarProduto(p: any) {
    this.novoPedido.itens.push({ nome: p.nome, quantidade: 1, preco: p.preco });
    const totalAtual = this.novoPedido.total || 0;
    this.novoPedido.total = totalAtual + p.preco;
    this.erroManual.set(false);
  }

  removerItemManual(index: number) {
    const item = this.novoPedido.itens[index];
    let totalAtual = this.novoPedido.total || 0;
    totalAtual -= (item.preco * item.quantidade);
    this.novoPedido.itens.splice(index, 1);

    if (totalAtual <= 0) this.novoPedido.total = 0; 
    else this.novoPedido.total = totalAtual;
  }

  imprimirComanda(p: any) {
    const idBonito = this.getPedidoId(p);
    const clienteLimpo = this.getClienteNome(p);
    const pagamentoLimpo = p.pagamento || 'A Pagar';
    const textoComanda = this.impressaoService.formatarTextoComanda(
      idBonito,
      clienteLimpo,
      pagamentoLimpo,
      p.itens || [],
      p.observacao || '',
      p.total || 0
    );
    this.impressaoService.imprimirComanda(textoComanda);
  }

  calcularTempo(data: any): string { if (!data) return 'Agora'; const d = data.seconds ? new Date(data.seconds * 1000) : new Date(data); const diff = Math.floor((new Date().getTime() - d.getTime()) / 60000); return diff < 60 ? `${diff} min` : `${Math.floor(diff / 60)}h`; }
  isAtrasado(data: any): boolean { if (!data) return false; const d = data.seconds ? new Date(data.seconds * 1000) : new Date(data); return (new Date().getTime() - d.getTime()) > 40 * 60000; }

  async carregarCardapio() { 
    this.cardapioService.obterProdutos().subscribe((lista) => {
      this.cardapio.set(lista);
    });
  }

  carregarPedidos() { 
    if (environment.modoDemonstracao) {
      this.armazenamentoService.ouvirColecao('pedidos').subscribe((lista) => {
        this.pedidos.set(lista);
      });
      return;
    }
    const ref = collection(this.firestore, 'pedidos'); 
    const q = query(ref, orderBy('data', 'asc')); 
    onSnapshot(q, (snapshot) => { 
      this.pedidos.set(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); 
    }); 
  }

  async obterProximoNumero(): Promise<number> { 
    if (environment.modoDemonstracao) {
      const pedidosDemo = this.armazenamentoService.obterLista('pedidos');
      const histDemo = this.armazenamentoService.obterLista('historico');
      const nums = [...pedidosDemo, ...histDemo].map(p => Number(p.numero) || 0);
      return (nums.length > 0 ? Math.max(...nums) : 100) + 1;
    }
    try { 
      const refPedidos = collection(this.firestore, 'pedidos'); 
      const snapPedidos = await getDocs(refPedidos); 
      let maxPedidos = 0; 
      snapPedidos.forEach(docSnap => { 
        const n = docSnap.data()['numero'] ? Number(docSnap.data()['numero']) : 0; 
        if (n > maxPedidos) maxPedidos = n; 
      }); 
      const refHistorico = collection(this.firestore, 'historico'); 
      const snapHistorico = await getDocs(refHistorico); 
      let maxHistorico = 0; 
      snapHistorico.forEach(docSnap => { 
        const n = docSnap.data()['numero'] ? Number(docSnap.data()['numero']) : 0; 
        if (n > maxHistorico) maxHistorico = n; 
      }); 
      return Math.max(maxPedidos, maxHistorico) + 1; 
    } catch { 
      return 1; 
    } 
  }

  async moverStatus(p: any, novoStatus: string) {
    try {
      if (environment.modoDemonstracao) {
        this.armazenamentoService.atualizarItem('pedidos', p.id, { status: novoStatus });
      } else {
        await updateDoc(doc(this.firestore, 'pedidos', p.id), { status: novoStatus });
      }

      if (p.enviarZap === false) return;

      const idVisual = this.getPedidoId(p);
      const nomeCompleto = this.getClienteNome(p);
      const primeiroNome = nomeCompleto.split(' ')[0];
      let msg = '';

      if (novoStatus === 'preparando') {
        msg = `*E&L SUSHI INFORMA* 🍣\n\n`;
        msg += `👨‍🍳 Olá, *${primeiroNome}*! Recebemos seu pedido *${idVisual}*.\n\n`;
        msg += `🔥 *Status:* Confirmado e em preparação na cozinha!\n`;
        msg += p.isRetirada ? `⏳ *Previsão:* Avisaremos assim que estiver pronto para retirar.` : `⏳ *Previsão:* Avisaremos assim que sair para entrega.`;
      }
      else if (novoStatus === 'aguardando') {
        if (p.isRetirada) {
          msg = `*PEDIDO PRONTO!* 🥡\n\n`;
          msg += `Olá *${primeiroNome}*, seu pedido *${idVisual}* já está pronto!\n\n`;
          msg += `📍 *Pode vir buscar no balcão.*\nEstamos te aguardando!`;
        } else {
          msg = `*PEDIDO PRONTO!* 🥡\n\n`;
          msg += `Olá *${primeiroNome}*, seu pedido *${idVisual}* acabou de ficar pronto.\n`;
          msg += `🛵 Estamos aguardando o entregador para levar até você.`;
        }
      }
      else if (novoStatus === 'em_rota') {
        if (p.isRetirada) {
          msg = `*PEDIDO ENTREGUE!* ✅\n\n`;
          msg += `Obrigado por retirar seu pedido *${idVisual}* conosco, *${primeiroNome}*.\n`;
          msg += `Bom apetite! 🥢`;
        } else {
          msg = `*SAIU PARA ENTREGA!* 🛵💨\n\n`;
          msg += `O pedido *${idVisual}* já está com o entregador.\n\n`;
          msg += `📍 *Destino:* Sua residência\n`;
          msg += `💵 *Total:* R$ ${p.total?.toFixed(2)?.replace('.', ',')}\n\n`;
          msg += `Prepare os hashis! 🥢 Obrigado pela preferência.`;
        }
      }

      this.enviarZap(p, msg);

    } catch {
    }
  }

  solicitarRecusa(p: any) { this.pedidoSelecionado = p; this.motivoRecusa.set('Item indisponível na cozinha'); this.modalRecusarAberto = true; }
  async confirmarRecusa() { 
    if (!this.motivoRecusa().trim()) { alert('Informe o motivo.'); return; } 
    const p = this.pedidoSelecionado; 
    const motivo = this.motivoRecusa(); 
    this.fecharModais(); 
    try { 
      if (p.id) { 
        if (environment.modoDemonstracao) {
          this.armazenamentoService.adicionarItem('historico', { ...p, concluidoEm: new Date().toISOString(), statusFinal: 'Cancelado', motivoCancelamento: motivo });
          this.armazenamentoService.removerItem('pedidos', p.id);
          return;
        }
        await addDoc(collection(this.firestore, 'historico'), { ...p, concluidoEm: new Date(), statusFinal: 'Cancelado', motivoCancelamento: motivo }); 
        await deleteDoc(doc(this.firestore, 'pedidos', p.id)); 
      } 
    } catch { 
    } 
  }

  solicitarCancelamento(p: any) { this.pedidoSelecionado = p; this.modalCancelarAberto = true; }
  async confirmarCancelamento() { 
    if (this.pedidoSelecionado) {
      if (environment.modoDemonstracao) {
        this.armazenamentoService.removerItem('pedidos', this.pedidoSelecionado.id);
      } else {
        await deleteDoc(doc(this.firestore, 'pedidos', this.pedidoSelecionado.id)); 
      }
    }
    this.fecharModais(); 
  }

  solicitarConclusao(p: any) { this.pedidoSelecionado = p; this.modalFinalizarAberto = true; }
  async confirmarConclusao() { 
    if (!this.pedidoSelecionado) return; 
    try { 
      if (environment.modoDemonstracao) {
        this.armazenamentoService.adicionarItem('historico', { ...this.pedidoSelecionado, concluidoEm: new Date().toISOString(), statusFinal: 'Concluido' });
        this.armazenamentoService.removerItem('pedidos', this.pedidoSelecionado.id);
        this.fecharModais();
        return;
      }
      await addDoc(collection(this.firestore, 'historico'), { ...this.pedidoSelecionado, concluidoEm: new Date(), statusFinal: 'Concluido' }); 
      await deleteDoc(doc(this.firestore, 'pedidos', this.pedidoSelecionado.id)); 
      this.fecharModais(); 
    } catch { 
    } 
  }

  alternarLoja() { this.cardapioService.alternarStatusLoja(!this.lojaAberta()); }
  async addBairro() { 
    if (!this.novoBairroNome || this.novoBairroTaxa === null) return; 
    await this.cardapioService.adicionarBairro({ nome: this.novoBairroNome, taxa: this.novoBairroTaxa }); 
    this.novoBairroNome = 'Bairro Exemplo'; 
    this.novoBairroTaxa = 7; 
  }
  
  solicitarExclusaoBairro(id: string) {
    this.bairroParaExcluirId = id;
    this.modalExcluirBairroAberto = true;
    this.modalConfigAberto = false; 
  }

  async confirmarExclusaoBairro() {
    if (this.bairroParaExcluirId) {
      await this.cardapioService.removerBairro(this.bairroParaExcluirId);
    }
    this.fecharModais();
    this.modalConfigAberto = true; 
  }

  atualizarTaxa(id: string, event: any) { const val = Number(event.target.value); if (val >= 0) this.cardapioService.atualizarTaxaBairro(id, val); }
}