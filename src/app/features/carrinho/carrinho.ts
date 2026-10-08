import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarrinhoService } from '../../core/services/carrinho.service';
import { CardapioService } from '../../core/services/cardapio.service';
import { ArmazenamentoDemoService } from '../../core/services/armazenamentoDemo.service';
import { Firestore, collection, addDoc, getDocs, doc, getDoc, setDoc, arrayUnion } from '@angular/fire/firestore';
import { Bairro } from '../../core/models/bairro.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carrinho.html',
  styleUrl: './carrinho.scss',
})
export class CarrinhoComponent implements OnInit {
  carrinhoService = inject(CarrinhoService);
  cardapioService = inject(CardapioService);
  armazenamentoService = inject(ArmazenamentoDemoService);
  router = inject(Router);
  firestore = inject(Firestore);

  lojaAberta = signal(true);
  tipoEntrega = signal<'delivery' | 'retirada'>('delivery');

  cliente = {
    nome: 'Alexandre Demonstração',
    telefone: '(21) 99999-9999',
    rua: 'Av. Exemplo de Entrega',
    numero: '500',
    complemento: 'Apto 101',
    pagamento: 'pix',
    troco: null as number | null, 
    observacao: 'Pedido demonstrativo para teste de portfólio'
  };

  erroValidacao = { nome: false, telefone: false, rua: false, numero: false, bairro: false };
  bairros = signal<Bairro[]>([]);
  bairroSelecionado = signal<Bairro | null>(null);
  
  carregando = signal(false);
  buscandoCliente = signal(false);
  enderecosEncontrados = signal<any[]>([]);
  mostrarSelecaoEndereco = signal(false);
  
  toastMensagem = signal<string>('Operação concluída com sucesso.');
  toastTipo = signal<'sucesso' | 'erro'>('sucesso');
  mostrarToast = signal(false);

  chaveCopiada = false;
  chavePix = '00.000.000/0001-00';

  ngOnInit() {
    this.cardapioService.obterBairros().subscribe(lista => {
      this.bairros.set(lista);
      if (lista.length > 0) {
        this.bairroSelecionado.set(lista[0]);
      }
    });
    this.cardapioService.obterStatusLoja().subscribe((dados: any) => this.lojaAberta.set(dados ? dados.aberta : true));
  }

  formatarTelefone(event: any) {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.slice(0, 11);
    if (valor.length > 10) valor = valor.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
    else if (valor.length > 5) valor = valor.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    else if (valor.length > 2) valor = valor.replace(/^(\d\d)(\d{0,5}).*/, '($1) $2');
    else valor = valor.replace(/^(\d*)/, '($1');
    this.cliente.telefone = valor;
    this.erroValidacao.telefone = false;
  }

  async buscarClientePorTelefone() {
    const tel = this.cliente.telefone.replace(/\D/g, '');
    if (tel.length < 10) return;
    this.buscandoCliente.set(true);
    try {
      if (environment.modoDemonstracao) {
        return;
      }
      const docRef = doc(this.firestore, 'clientes', tel);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const dados = snap.data();
        if (!this.cliente.nome) this.cliente.nome = dados['nome'] || '';
        if (dados['enderecosSalvos'] && dados['enderecosSalvos'].length > 0) {
          this.enderecosEncontrados.set(dados['enderecosSalvos']);
          this.mostrarSelecaoEndereco.set(true);
        } else if (dados['endereco']) {
          this.usarEndereco(dados['endereco']);
        }
      }
    } catch {
    } finally {
      this.buscandoCliente.set(false);
    }
  }

  usarEndereco(end: any) {
    this.cliente.rua = end.rua || '';
    this.cliente.numero = end.numero || '';
    this.cliente.complemento = end.complemento || '';
    if (end.bairro) {
      const bairroEncontrado = this.bairros().find(b => b.nome === end.bairro);
      if (bairroEncontrado) this.bairroSelecionado.set(bairroEncontrado);
    }
    this.mostrarSelecaoEndereco.set(false);
  }

  fecharModalEndereco() {
    this.mostrarSelecaoEndereco.set(false);
  }

  limparErro(campo: keyof typeof this.erroValidacao) { this.erroValidacao[campo] = false; }

  exibirToast(msg: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
    this.toastMensagem.set(msg); this.toastTipo.set(tipo); this.mostrarToast.set(true);
    setTimeout(() => this.mostrarToast.set(false), 3000);
  }

  get totalDoCarrinho() { return this.carrinhoService.valorTotal(); }
  get totalComEntrega() {
    if (this.tipoEntrega() === 'retirada') return this.totalDoCarrinho;
    const taxa = this.bairroSelecionado()?.taxa || 0;
    return this.totalDoCarrinho + taxa;
  }

  selecionarBairro(event: any) {
    const nomeBairro = event?.target?.value || '';
    const bairro = this.bairros().find(b => b.nome === nomeBairro);
    this.bairroSelecionado.set(bairro || null);
    this.erroValidacao.bairro = false;
  }

  remover(id: string) { this.carrinhoService.remover(id); }
  voltar() { this.router.navigate(['/']); }

  async obterProximoNumero(): Promise<number> {
    if (environment.modoDemonstracao) {
      const pedidosDemo = this.armazenamentoService.obterLista('pedidos');
      const historicoDemo = this.armazenamentoService.obterLista('historico');
      const todosNumeros = [...pedidosDemo, ...historicoDemo].map(p => Number(p.numero) || 0);
      const maiorNumero = todosNumeros.length > 0 ? Math.max(...todosNumeros) : 100;
      return maiorNumero + 1;
    }
    try {
      const ref = collection(this.firestore, 'pedidos');
      const snap = await getDocs(ref);
      let maior = 0;
      snap.forEach(d => { const n = d.data()['numero'] ? Number(d.data()['numero']) : 0; if(n > maior) maior = n; });
      const refHist = collection(this.firestore, 'historico');
      const snapHist = await getDocs(refHist);
      snapHist.forEach(d => { const n = d.data()['numero'] ? Number(d.data()['numero']) : 0; if(n > maior) maior = n; });
      return maior + 1;
    } catch { return 1; }
  }

  copiarChavePix() {
    navigator.clipboard.writeText(this.chavePix).then(() => {
      this.chaveCopiada = true;
      setTimeout(() => { this.chaveCopiada = false; }, 2000);
    }).catch(() => {
      alert('Chave Pix: ' + this.chavePix);
    });
  }

  async finalizarPedido() {
    if (!this.lojaAberta()) { this.exibirToast('A loja está fechada!', 'erro'); return; }

    this.erroValidacao = {
      nome: !this.cliente.nome,
      telefone: !this.cliente.telefone,
      rua: this.tipoEntrega() === 'delivery' && !this.cliente.rua,
      numero: this.tipoEntrega() === 'delivery' && !this.cliente.numero,
      bairro: this.tipoEntrega() === 'delivery' && !this.bairroSelecionado()
    };

    if (Object.values(this.erroValidacao).some(v => v)) {
      this.exibirToast('Preencha os campos obrigatórios!', 'erro');
      return;
    }

    this.carregando.set(true);

    let enderecoCompleto = 'Balcão (Retirada)';
    let nomeBairro = 'Retirada';

    if (this.tipoEntrega() === 'delivery') {
      nomeBairro = this.bairroSelecionado()?.nome || 'Não informado';
      enderecoCompleto = `${this.cliente.rua}, ${this.cliente.numero}`;
      if (this.cliente.complemento) enderecoCompleto += ` - ${this.cliente.complemento}`;
    }

    const itensAtuais = this.carrinhoService.itens();
    const numeroPedido = await this.obterProximoNumero();

    const pedido = {
      cliente: {
        nome: this.cliente.nome,
        telefone: this.cliente.telefone,
        endereco: {
          rua: this.cliente.rua,
          numero: this.cliente.numero,
          bairro: nomeBairro,
          completo: enderecoCompleto,
          complemento: this.cliente.complemento,
          referencia: 'Entrega' 
        }
      },
      numero: numeroPedido,
      itens: itensAtuais,
      total: this.totalComEntrega,
      pagamento: this.cliente.pagamento,
      troco: this.cliente.troco || 0,
      observacao: this.cliente.observacao, 
      isRetirada: this.tipoEntrega() === 'retirada',
      data: new Date().toISOString(),
      status: 'pendente',
    };

    try {
      if (environment.modoDemonstracao) {
        this.armazenamentoService.adicionarItem('pedidos', pedido);
        await this.carrinhoService.darBaixaNoEstoque(pedido);
      } else {
        await addDoc(collection(this.firestore, 'pedidos'), pedido);
      }

      this.carrinhoService.limpar(); 
      this.exibirToast('Pedido realizado com sucesso na demonstração!', 'sucesso');
      setTimeout(() => this.router.navigate(['/']), 1500);

    } catch {
      this.exibirToast('Erro ao salvar. Tente novamente.', 'erro');
    } finally {
      this.carregando.set(false);
    }
  }
}