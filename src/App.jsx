import React, { useState, useEffect, useRef } from 'react';
import { Package, Coffee, Shield, LayoutGrid, X, Plus, ArrowLeft, Trash2, Edit3, Search } from 'lucide-react';

const APP_STATE_KEY = 'controle-estoque-app-state';
const ICON_OPTIONS = ['🛏️', '☕', '🛡️', '🧺', '🍽️', '🔧', '📦', '🧴', '🚑', '⚕️', '🧹', '🪑', '🧼'];

const defaultSetores = [
  { id: 'rouparia', nome: 'Rouparia', icone: '🧺', color: 'text-blue-600', bg: 'bg-blue-50', border: 'hover:border-blue-400' },
  { id: 'copa', nome: 'Copa', icone: '☕', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'hover:border-emerald-400' },
  { id: 'guarita', nome: 'Guarita', icone: '🛡️', color: 'text-amber-600', bg: 'bg-amber-50', border: 'hover:border-amber-400' }
];

const defaultProdutos = [
  { id: 1, nome: 'Lençol Descartável', qtd: 50, imagem: '', icone: '🛏️', local: 'rouparia' },
  { id: 2, nome: 'Café 500g', qtd: 10, imagem: '', icone: '☕', local: 'copa' }
];

export default function App() {
  const fileInputRef = useRef(null);

  const [setores, setSetores] = useState(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem(APP_STATE_KEY);
      if (salvo) {
        try {
          const parsed = JSON.parse(salvo);
          if (Array.isArray(parsed.setores)) return parsed.setores;
        } catch (error) {
          console.warn('Erro ao carregar setores.', error);
        }
      }
    }
    return defaultSetores;
  });

  const [produtos, setProdutos] = useState(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem(APP_STATE_KEY);
      if (salvo) {
        try {
          const parsed = JSON.parse(salvo);
          if (Array.isArray(parsed)) return parsed;
          if (Array.isArray(parsed.produtos)) return parsed.produtos;
        } catch (error) {
          console.warn('Erro ao carregar produtos.', error);
        }
      }
    }
    return defaultProdutos;
  });

  const [setorAtivo, setSetorAtivo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [itemParaEditar, setItemParaEditar] = useState(null);
  const [novoItem, setNovoItem] = useState({ nome: '', qtd: '', imagem: '', icone: '' });
  const [itemAcoesAbertas, setItemAcoesAbertas] = useState(null);

  const [setorModalAberto, setSetorModalAberto] = useState(false);
  const [novoSetor, setNovoSetor] = useState({ nome: '', icone: ICON_OPTIONS[0] });

  useEffect(() => {
    localStorage.setItem(APP_STATE_KEY, JSON.stringify({ produtos, setores }));
  }, [produtos, setores]);

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ produtos, setores }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'estoque-backup.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importarBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dados = JSON.parse(reader.result);
        if (Array.isArray(dados)) {
          setProdutos(dados);
          alert('Backup importado com sucesso.');
        } else if (dados && Array.isArray(dados.produtos)) {
          setProdutos(dados.produtos);
          if (Array.isArray(dados.setores)) setSetores(dados.setores);
          alert('Backup importado com sucesso.');
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (error) {
        console.error(error);
        alert('Erro ao ler o backup.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  function salvarProduto(e, id = null) {
    e.preventDefault();

    const dados = id ? itemParaEditar : novoItem;
    const itemDados = {
      id: id || Date.now(),
      nome: dados.nome,
      qtd: parseInt(dados.qtd) || 0,
      imagem: dados.imagem || '',
      icone: dados.icone || '',
      local: setorAtivo
    };

    if (id) {
      setProdutos(produtos.map(p => p.id === id ? itemDados : p));
      setItemParaEditar(null);
    } else {
      setProdutos([...produtos, itemDados]);
      setModalAberto(false);
      setNovoItem({ nome: '', qtd: '', imagem: '', icone: '' });
    }

    setItemAcoesAbertas(null);
  }

  const handleExcluir = (id) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      setProdutos(produtos.filter(p => p.id !== id));
      setItemAcoesAbertas(null);
    }
  };

  const updateSetor = (id, changes) => {
    setSetores(setores.map(setor => setor.id === id ? { ...setor, ...changes } : setor));
  };

  const addSetor = () => {
    if (!novoSetor.nome.trim()) {
      alert('Digite um nome para o setor.');
      return;
    }

    setSetores([...setores, {
      id: Date.now().toString(),
      nome: novoSetor.nome.trim(),
      icone: novoSetor.icone,
      color: 'text-slate-700',
      bg: 'bg-slate-100',
      border: 'hover:border-slate-400'
    }]);
    setNovoSetor({ nome: '', icone: ICON_OPTIONS[0] });
  };

  const handleExcluirSetor = (id) => {
    if (!confirm('Excluir este setor também removerá os itens desse setor. Continuar?')) return;
    setSetores(setores.filter(setor => setor.id !== id));
    setProdutos(produtos.filter(produto => produto.local !== id));
    if (setorAtivo === id) setSetorAtivo(null);
  };

  const setoresConfig = setores;

  // --- RENDERIZAÇÃO DA TELA DE SETOR ---
  if (setorAtivo) {
    const config = setoresConfig.find(s => s.id === setorAtivo);
    return (
      <div className="min-h-screen bg-white pb-10">
        <nav className="p-3 border-b flex flex-col gap-3 bg-gray-50 sticky top-0 z-[100] shadow-sm">
          <div className="flex items-center justify-between">
            <button onClick={() => {setSetorAtivo(null); setSearchTerm('');}} className="p-2 hover:bg-gray-200 rounded-full transition"><ArrowLeft size={20} /></button>
            <h1 className="text-base font-black uppercase text-slate-800">{config?.nome || setorAtivo}</h1>
            <div className="w-8"></div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none text-sm shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <button type="button" onClick={() => setSetorModalAberto(true)} className="flex-1 bg-white border border-gray-200 text-slate-600 py-2 rounded-xl font-bold flex items-center justify-center gap-2 text-xs">
                    <Edit3 size={16}/> Editar setores
                </button>
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={() => setModalAberto(true)} className="flex-1 bg-slate-900 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 text-xs shadow-md">
                    <Plus size={16}/> Novo item
                </button>
                <button type="button" onClick={exportBackup} className="flex-1 bg-white border border-gray-200 text-slate-600 py-2 rounded-xl font-bold text-xs">Exportar backup</button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white border border-gray-200 text-slate-600 py-2 rounded-xl font-bold text-xs">Importar backup</button>
            </div>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={importarBackup} />
          </div>
          </div>
        </nav>

        <div className="p-3">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {produtos.filter(p => p.local === setorAtivo && p.nome.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col relative">
                <div className="aspect-square bg-gray-50 relative cursor-pointer" onClick={() => setItemAcoesAbertas(itemAcoesAbertas === item.id ? null : item.id)}>
                    {item.icone && (
                      <div className="absolute top-3 left-3 z-10 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center text-xl shadow-sm">
                        <span>{item.icone}</span>
                      </div>
                    )}
                    <img src={item.imagem || 'https://placehold.co/200x200?text=Sem+Foto'} className={`w-full h-full object-cover transition-all duration-300 ${itemAcoesAbertas === item.id ? 'brightness-50 scale-105' : ''}`} alt={item.nome} />
                    {itemAcoesAbertas === item.id && (
                      <div className="absolute inset-0 flex items-center justify-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); setItemParaEditar(item); }} className="bg-white text-amber-500 p-3 rounded-full shadow-xl"><Edit3 size={18} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleExcluir(item.id); }} className="bg-white text-red-500 p-3 rounded-full shadow-xl"><Trash2 size={18} /></button>
                      </div>
                    )}
                </div>
                <div className="p-2 text-center flex-1 flex flex-col justify-between">
                  <h3 className="font-bold text-slate-800 text-[11px] line-clamp-1 mb-1">{item.nome}</h3>
                  <div className={`inline-block px-2 py-0.5 rounded-lg font-black text-[10px] ${config.bg} ${config.color}`}>{item.qtd} un</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {setorModalAberto && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[200]">
            <div className="w-full max-w-3xl rounded-t-3xl md:rounded-3xl p-6 bg-white shadow-2xl">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-lg">Configurar setores</h2>
                  <button onClick={() => setSetorModalAberto(false)}><X size={20} /></button>
                </div>
                <div className="grid gap-4">
                  {setores.map((setor) => (
                    <div key={setor.id} className="p-4 rounded-3xl border border-gray-200 bg-gray-50">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="text-3xl">{setor.icone}</span>
                        <input value={setor.nome} onChange={(e) => updateSetor(setor.id, { nome: e.target.value })} className="flex-1 border rounded-2xl px-3 py-2 bg-white border-gray-200" placeholder="Nome do setor" />
                        <button type="button" onClick={() => handleExcluirSetor(setor.id)} className="px-3 py-2 bg-red-500 text-white rounded-2xl text-xs">Excluir</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ICON_OPTIONS.map(icon => (
                          <button key={icon} type="button" onClick={() => updateSetor(setor.id, { icone: icon })} className={`h-10 w-10 rounded-2xl border flex items-center justify-center text-xl ${setor.icone === icon ? 'border-slate-900 bg-slate-100' : 'border-gray-200 bg-white'}`}>
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-3xl border border-gray-200 bg-gray-50">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-3xl">{novoSetor.icone}</span>
                    <input value={novoSetor.nome} onChange={(e) => setNovoSetor({ ...novoSetor, nome: e.target.value })} className="flex-1 border rounded-2xl px-3 py-2 bg-white border-gray-200" placeholder="Novo setor" />
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {ICON_OPTIONS.map(icon => (
                      <button key={icon} type="button" onClick={() => setNovoSetor({ ...novoSetor, icone: icon })} className={`h-10 w-10 rounded-2xl border flex items-center justify-center text-xl ${novoSetor.icone === icon ? 'border-slate-900 bg-slate-100' : 'border-gray-200 bg-white'}`}>
                        {icon}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={addSetor} className="w-full bg-slate-900 text-white py-3 rounded-2xl font-bold">Adicionar setor</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CADASTRO/EDIÇÃO */}
        {(modalAberto || itemParaEditar) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[200]">
            <div className="bg-white w-full max-w-sm rounded-t-3xl md:rounded-3xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-black text-slate-800">{itemParaEditar ? 'Editar' : 'Novo'}</h2>
                  <button onClick={() => {setModalAberto(false); setItemParaEditar(null);}}><X size={20}/></button>
                </div>
                <form onSubmit={(e) => salvarProduto(e, itemParaEditar?.id)} className="space-y-3">
                  <input required placeholder="Nome" className="w-full border border-gray-200 p-3 rounded-xl outline-none text-sm bg-gray-50" value={itemParaEditar ? itemParaEditar.nome : novoItem.nome} onChange={e => itemParaEditar ? setItemParaEditar({...itemParaEditar, nome: e.target.value}) : setNovoItem({...novoItem, nome: e.target.value})} />
                  <input type="number" required placeholder="Qtd" className="w-full border border-gray-200 p-3 rounded-xl outline-none text-sm bg-gray-50" value={itemParaEditar ? itemParaEditar.qtd : novoItem.qtd} onChange={e => itemParaEditar ? setItemParaEditar({...itemParaEditar, qtd: e.target.value}) : setNovoItem({...novoItem, qtd: e.target.value})} />
                    <input placeholder="Link Imagem" className="w-full border border-gray-200 p-3 rounded-xl outline-none text-sm bg-gray-50" value={itemParaEditar ? itemParaEditar.imagem : novoItem.imagem} onChange={e => itemParaEditar ? setItemParaEditar({...itemParaEditar, imagem: e.target.value}) : setNovoItem({...novoItem, imagem: e.target.value})} />
                  <input placeholder="Ícone (emoji ou texto curto)" className="w-full border border-gray-200 p-3 rounded-xl outline-none text-sm bg-gray-50" value={itemParaEditar ? itemParaEditar.icone : novoItem.icone} onChange={e => itemParaEditar ? setItemParaEditar({...itemParaEditar, icone: e.target.value}) : setNovoItem({...novoItem, icone: e.target.value})} />
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-3 rounded-xl text-sm uppercase">Salvar no Dispositivo</button>
                </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- HOME / SELEÇÃO DE SETORES ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <header className="text-center mb-10">
        <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-4">
          <LayoutGrid className="text-white" size={30} />
        </div>
        <div className="flex items-center justify-center gap-3 mb-3">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Controle de Estoque</h1>
        </div>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Gestão local segura</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        {setoresConfig.map(setor => (
          <button 
            key={setor.id} 
            onClick={() => setSetorAtivo(setor.id)} 
            className="bg-white p-8 rounded-[32px] shadow-sm flex flex-col items-center border-2 border-transparent transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl active:scale-95 hover:border-blue-400">
            <div className={`${setor.bg} ${setor.color} p-5 rounded-2xl mb-4`}>
              <span className="text-4xl">{setor.icone}</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 capitalize mb-1">{setor.nome}</h2>
            <div className={`text-4xl font-black ${setor.color}`}>
              {produtos.filter(p => p.local === setor.id).reduce((acc, item) => acc + (Number(item.qtd) || 0), 0)}
            </div>
          </button>
        ))}
      </div>

    </div>
  );
}