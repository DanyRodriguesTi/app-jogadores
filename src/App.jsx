import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function App() {

  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
  ];

  const valorMensal = 15;
  const jogadoresPorPagina = 10;

  const [mesSelecionado, setMesSelecionado] = useState(
    meses[new Date().getMonth()]
  );

  const [paginaAtual, setPaginaAtual] = useState(1);

  const [jogadores, setJogadores] = useState(() => {
    const saved = localStorage.getItem("jogadores");
    return saved ? JSON.parse(saved) : [];
  });

  const [despesas, setDespesas] = useState(() => {
    const saved = localStorage.getItem("despesas");
    return saved ? JSON.parse(saved) : {};
  });

  const [mesesFechados, setMesesFechados] = useState(() => {
    const saved = localStorage.getItem("mesesFechados");
    return saved ? JSON.parse(saved) : {};
  });

  const [nome, setNome] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [valorDespesa, setValorDespesa] = useState("");
  const [historicoDespesa, setHistoricoDespesa] = useState("");

  useEffect(() => {
    localStorage.setItem("jogadores", JSON.stringify(jogadores));
    localStorage.setItem("despesas", JSON.stringify(despesas));
    localStorage.setItem("mesesFechados", JSON.stringify(mesesFechados));
  }, [jogadores, despesas, mesesFechados]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [mesSelecionado]);

  const mesFechado = mesesFechados[mesSelecionado];

  // ================= PAGINAÇÃO =================
  const totalPaginas = Math.max(1,
  Math.ceil(jogadores.length / jogadoresPorPagina)
);

  const indiceInicial = (paginaAtual - 1) * jogadoresPorPagina;
  const jogadoresPagina = jogadores.slice(
    indiceInicial,
    indiceInicial + jogadoresPorPagina
  );
  const quantidadePaginaAtual = jogadoresPagina.length;


  function proximaPagina() {
    if (paginaAtual < totalPaginas)
      setPaginaAtual(paginaAtual + 1);
  }

  function paginaAnterior() {
    if (paginaAtual > 1)
      setPaginaAtual(paginaAtual - 1);
  }

  // ================= FECHAR MÊS =================
  function toggleMesFechado(mes) {
    setMesesFechados(prev => ({
      ...prev,
      [mes]: !prev[mes]
    }));
  }

  // ================= JOGADORES =================
  function salvarJogador() {

    if (!nome.trim()) return alert("Digite o nome");

    if (editandoId) {
      const atualizada = jogadores.map(j =>
        j.id === editandoId ? { ...j, nome: nome.toUpperCase() } : j
      ).sort((a,b)=>a.nome.localeCompare(b.nome));

      setJogadores(atualizada);
      setEditandoId(null);
      setNome("");
      return;
    }

    const novo = {
      id: Date.now(),
      nome: nome.toUpperCase(),
      pagamentos: meses.reduce((acc, mes) => {
        acc[mes] = false;
        return acc;
      }, {})
    };

    setJogadores([...jogadores, novo].sort((a,b)=>a.nome.localeCompare(b.nome)));
    setNome("");
  }

  function editarJogador(j) {
    if (mesFechado) return;
    setNome(j.nome);
    setEditandoId(j.id);
  }

  function excluirJogador(id) {
    if (mesFechado) return;
    if (window.confirm("Excluir jogador?"))
      setJogadores(jogadores.filter(j => j.id !== id));
  }

  function togglePagamento(id, mes, nomeJogador) {

  if (mesFechado) return;

  setJogadores(prevJogadores => {

    const jogadorAtual = prevJogadores.find(j => j.id === id);
    if (!jogadorAtual) return prevJogadores;

    if (jogadorAtual.pagamentos[mes]) {
      if (!window.confirm(`Deseja desmarcar ${nomeJogador} em ${mes}?`))
        return prevJogadores;
    }

    const atualizados = prevJogadores.map(j =>
      j.id === id
        ? {
            ...j,
            pagamentos: {
              ...j.pagamentos,
              [mes]: !j.pagamentos[mes]
            }
          }
        : j
    );

    return [...atualizados];
  });
}

  // ================= DESPESAS =================
  function adicionarDespesa() {

    if (mesFechado) return alert("Mês fechado!");

    if (!valorDespesa || !historicoDespesa)
      return alert("Preencha valor e histórico");

    const nova = {
      id: Date.now(),
      valor: parseFloat(valorDespesa),
      historico: historicoDespesa.toUpperCase()
    };

    const listaMes = despesas[mesSelecionado] || [];

    setDespesas({
      ...despesas,
      [mesSelecionado]: [...listaMes, nova]
    });

    setValorDespesa("");
    setHistoricoDespesa("");
  }

  function excluirDespesa(id) {

    if (mesFechado) return;

    if (!window.confirm("Deseja excluir essa despesa?")) return;

    const listaMes = despesas[mesSelecionado] || [];

    setDespesas({
      ...despesas,
      [mesSelecionado]: listaMes.filter(d => d.id !== id)
    });
  }

  // ================= CÁLCULOS =================
  // ================= CÁLCULOS =================
	const totalPagos = jogadores.reduce((acc, j) => {
	  return j.pagamentos?.[mesSelecionado] ? acc + 1 : acc;
	}, 0);

	const totalReceita = totalPagos * valorMensal;

	const totalDespesas = (despesas[mesSelecionado] || [])
	  .reduce((acc, d) => acc + Number(d.valor), 0);

	const saldo = totalReceita - totalDespesas;


  // ================= RELATÓRIOS =================
  function gerarRelatorioMensal() {

    let texto = `📊 RELATÓRIO ${mesSelecionado}\n\n`;

    texto += `Total Jogadores: ${jogadores.length}\n`;
    texto += `Pagaram: ${totalPagos}\n`;
    texto += `Faltam: ${jogadores.length - totalPagos}\n\n`;	
    texto += `Receita: R$ ${totalReceita}\n`;
    texto += `Despesas: R$ ${totalDespesas}\n`;
    texto += `Saldo: R$ ${saldo}\n\n`;

    texto += "Despesas:\n";
    (despesas[mesSelecionado] || []).forEach(d => {
      texto += `- ${d.historico} R$ ${d.valor}\n`;
    });

    alert(texto);
  }

  function gerarRelatorioGeral() {

    let texto = "📊 RELATÓRIO GERAL\n\n";
    texto += `Total Jogadores: ${jogadores.length}\n\n`;

    meses.forEach(mes => {

      const pagosMes = jogadores.filter(j => j.pagamentos[mes]).length;
      const despesasMes = (despesas[mes] || [])
        .reduce((acc,d)=>acc + d.valor,0);

      texto += `📅 ${mes}\n`;
      texto += `Pagaram: ${pagosMes}\n`;
      texto += `Faltam: ${jogadores.length - pagosMes}\n`;
      texto += `Saldo: R$ ${(pagosMes * valorMensal) - despesasMes}\n\n`;
    });

    alert(texto);
  }

  function gerarRelatorioWhatsApp() {

    let texto = `📊 *RELATÓRIO ${mesSelecionado}*\n\n`;
    texto += `Saldo: R$ ${saldo}\n\n`;

    jogadores.forEach(j => {
      texto += `${j.pagamentos[mesSelecionado] ? "✅" : "❌"} ${j.nome}\n`;
    });

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`);
  }

  function gerarRelatorioPDF() {

  const doc = new jsPDF();

  doc.text(`RELATÓRIO ${mesSelecionado}`, 14, 15);
  doc.text(`Receita: R$ ${totalReceita}`, 14, 25);
  doc.text(`Despesas: R$ ${totalDespesas}`, 14, 32);
  doc.text(`Saldo: R$ ${saldo}`, 14, 39);

  // ================= TABELA JOGADORES =================
  autoTable(doc, {
    startY: 50,
    head: [["Nome", "Status"]],
    body: jogadores.map(j => [
      j.nome,
      j.pagamentos?.[mesSelecionado] ? "PAGO" : "PENDENTE"
    ])
  });

  // ================= TABELA DESPESAS =================
  const finalY = doc.lastAutoTable.finalY || 60;

  autoTable(doc, {
    startY: finalY + 10,
    head: [["Histórico", "Valor"]],
    body: (despesas[mesSelecionado] || []).map(d => [
      d.historico,
      `R$ ${d.valor}`
    ])
  });

  doc.save(`Relatorio_${mesSelecionado}.pdf`);
}

  // ================= UI =================
  return (
    <div style={{maxWidth:1000,margin:"auto",padding:10,fontFamily:"Arial"}}>

      <h2 style={{textAlign:"center"}}>⚽ Controle Financeiro</h2>

      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <select value={mesSelecionado}
          onChange={e=>setMesSelecionado(e.target.value)}>
          {meses.map(m=><option key={m}>{m}</option>)}
        </select>

        <button onClick={()=>toggleMesFechado(mesSelecionado)}>
          {mesFechado ? "🔓 Reabrir Mês" : "🔒 Fechar Mês"}
        </button>

       <div style={{display:"flex",flexDirection:"column"}}>
		  <strong>
			Página {paginaAtual} / {totalPaginas}
		  </strong>
		  <span>
			Jogadores na página: {quantidadePaginaAtual}
		  </span>
		  <span>
			Total de Jogadores: {jogadores.length}
		  </span>
		</div>



        <button type="button" onClick={paginaAnterior}>⬅</button>
		<button type="button" onClick={proximaPagina}>➡</button>

      </div>

      <h3>Jogadores</h3>

      <input
        value={nome}
        onChange={e=>setNome(e.target.value)}
        placeholder="Nome"
        disabled={mesFechado}
      />
      <button onClick={salvarJogador} disabled={mesFechado}>
        {editandoId ? "Salvar" : "Adicionar"}
      </button>

      <table border="1" width="100%">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Pago</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {jogadoresPagina.map(j=>(
            <tr key={j.id}>
              <td>{j.nome}</td>
              <td>
                <input
                  type="checkbox"
                  checked={!!j.pagamentos?.[mesSelecionado]}

                  disabled={mesFechado}
                  onChange={()=>togglePagamento(j.id,mesSelecionado,j.nome)}
                />
              </td>
              <td>
                <button disabled={mesFechado}
                  onClick={()=>editarJogador(j)}>✏</button>
                <button disabled={mesFechado}
                  onClick={()=>excluirJogador(j.id)}>❌</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Despesas</h3>

      <input type="number"
        placeholder="Valor"
        value={valorDespesa}
        onChange={e=>setValorDespesa(e.target.value)}
        disabled={mesFechado}
      />

      <input
        placeholder="Histórico"
        value={historicoDespesa}
        onChange={e=>setHistoricoDespesa(e.target.value)}
        disabled={mesFechado}
      />

      <button onClick={adicionarDespesa} disabled={mesFechado}>
        Adicionar
      </button>

      <ul>
        {(despesas[mesSelecionado] || []).map(d=>(
          <li key={d.id}>
            {d.historico} - R$ {d.valor}
            <button disabled={mesFechado}
              onClick={()=>excluirDespesa(d.id)}>❌</button>
          </li>
        ))}
      </ul>

      <h3>Caixa</h3>
      <p>Receita: R$ {totalReceita}</p>
      <p>Despesas: R$ {totalDespesas}</p>
      <p><b>Saldo: R$ {saldo}</b></p>

      <button onClick={gerarRelatorioMensal}>📊 Mensal</button>
      <button onClick={gerarRelatorioGeral}>📊 Geral</button>
      <button onClick={gerarRelatorioPDF}>📄 PDF</button>
      <button onClick={gerarRelatorioWhatsApp}>📲 WhatsApp</button>

    </div>
  );
}
