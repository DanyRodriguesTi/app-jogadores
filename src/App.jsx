import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export default function App() {
  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
  ];

  const valorMensal = 10;

  const [jogadores, setJogadores] = useState(() => {
    const saved = localStorage.getItem("jogadores");
    return saved ? JSON.parse(saved) : [];
  });

  const [nome, setNome] = useState("");
  const [mesesFechados, setMesesFechados] = useState(() => {
  const saved = localStorage.getItem("mesesFechados");
  return saved ? JSON.parse(saved) : {};
});

  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
  localStorage.setItem("jogadores", JSON.stringify(jogadores));
  localStorage.setItem("mesesFechados", JSON.stringify(mesesFechados));
}, [jogadores, mesesFechados]);


  
  // ==========================
  //função fechar/abrir mês
  //===========================
  function toggleMesFechado(mes) {
  setMesesFechados((prev) => ({
    ...prev,
    [mes]: !prev[mes],
  }));
}

  // =========================
  // ADICIONAR / EDITAR
  // =========================
  function salvarJogador() {
    if (!nome.trim()) {
      alert("Digite o nome");
      return;
    }

    // EDITAR
    if (editandoId) {
      setJogadores(
        jogadores.map((j) =>
          j.id === editandoId ? { ...j, nome } : j
        )
      );

      setEditandoId(null);
      setNome("");
      return;
    }

    // ADICIONAR
    const novo = {
      id: Date.now(),
      nome,
      valor: valorMensal,
      pagamentos: meses.reduce((acc, mes) => {
        acc[mes] = false;
        return acc;
      }, {}),
    };

    setJogadores([...jogadores, novo]);
    setNome("");
  }

  // =========================
  // CHECK PAGAMENTO
  // =========================
function togglePagamento(id, mes, nomeJogador) {
  if (mesesFechados[mes]) return;

  const jogador = jogadores.find((j) => j.id === id);

  if (!jogador) return;

  const jaPago = jogador.pagamentos[mes];

  if (jaPago) {
    const confirmar = window.confirm(
      `Deseja realmente desmarcar o pagamento de ${nomeJogador} em ${mes}?`
    );

    if (!confirmar) return;
  }

  setJogadores(
    jogadores.map((j) =>
      j.id === id
        ? {
            ...j,
            pagamentos: {
              ...j.pagamentos,
              [mes]: !j.pagamentos[mes],
            },
          }
        : j
    )
  );
}


  // =========================
  // EXCLUIR
  // =========================
  function excluirJogador(id) {
    if (window.confirm("Deseja excluir?")) {
      setJogadores(jogadores.filter((j) => j.id !== id));
    }
  }

  // =========================
  // EDITAR
  // =========================
  function editarJogador(j) {
    setNome(j.nome);
    setEditandoId(j.id);
  }

  // =========================
  // RELATÓRIO
  // =========================
  function gerarRelatorio() {
    let relatorio = "📋 RELATÓRIO DE PAGAMENTOS\n\n";

    meses.forEach((mes) => {
      const pagos = jogadores.filter(
        (j) => j.pagamentos[mes]
      ).length;

      const total = pagos * valorMensal;

      relatorio += `${mes}: Pagos ${pagos} | Total R$ ${total}\n`;
    });

    alert(relatorio);
  }
  
  //==========================
  // RELATÓRIO EM PDF
  //===========================
  
  function gerarPDF() {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Relatório de Pagamentos - Jogadores", 14, 15);

  doc.setFontSize(10);
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString()}`,
    14,
    22
  );

  // Cabeçalho da tabela
  const head = [
    ["Nome", ...meses.map((m) => m.slice(0, 3))]
  ];

  // Corpo da tabela
  const body = jogadores.map((j) => [
    j.nome,
    ...meses.map((m) => (j.pagamentos[m] ? "PG" : "DV")),
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 28,
    styles: {
      fontSize: 8,
      halign: "center",
    },
    headStyles: {
      fillColor: [22, 160, 133],
    },
  });

  doc.save("relatorio_pagamentos.pdf");
}


  // =========================
  // WHATSAPP
  // =========================
  function enviarWhatsApp() {
    let texto = "📋 Controle de Pagamentos\n\n";

    jogadores.forEach((j) => {
      texto += `👤 ${j.nome}\n`;

      meses.forEach((m) => {
        texto += `${m.slice(0, 3)}: ${j.pagamentos[m] ? "✅" : "❌"}  `;
      });

      texto += "\n\n";
    });

    const url =
      "https://wa.me/?text=" +
      encodeURIComponent(texto);

    window.open(url, "_blank");
  }

  // =========================
  // TELA
  // =========================
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "auto",
        padding: 15,
        fontFamily: "Arial",
      }}
    >
      <h1 style={{ textAlign: "center" }}>
        ⚽ Controle de Pagamentos
		 

	    <div style={{ marginBottom: 15, textAlign: "center" }}>
		  {meses.map((mes) => (
			<button
			  key={mes}
			  onClick={() => toggleMesFechado(mes)}
			  style={{
				margin: 4,
				padding: "4px 8px",
				background: mesesFechados[mes] ? "#f44336" : "#4caf50",
				color: "white",
				border: "none",
				borderRadius: 4,
				cursor: "pointer",
			  }}
			>
			  {mesesFechados[mes] ? "🔓 " : "🔒 "}
			  {mes}
			</button>
		  ))}
		</div>

		
      </h1>

      {/* FORM */}
      <div style={{ display: "flex", gap: 8, marginBottom: 15 }}>
        <input
          placeholder="Nome do jogador"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <button onClick={salvarJogador}>
          {editandoId ? "Salvar" : "Adicionar"}
        </button>
      </div>

      {/* TABELA */}
      <div style={{ overflowX: "auto" }}>
        <table border="1" cellPadding="5" width="100%">
          <thead>
            <tr>
              <th>Nome</th>

              {meses.map((m) => (
                <th key={m}>{m.slice(0, 3)}</th>
              ))}

              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {jogadores.map((j) => (
              <tr key={j.id}>
                <td>{j.nome}</td>

                {meses.map((m) => (
                  <td key={m} align="center">
                   <input
					  type="checkbox"
					  checked={j.pagamentos[m]}
					  disabled={mesesFechados[m]}
					  onChange={() => togglePagamento(j.id, m, j.nome)}
					/>


                    <span
                      style={{
                        marginLeft: 4,
                        color: j.pagamentos[m]
                          ? "green"
                          : "red",
                      }}
                    >
                      {j.pagamentos[m] ? "PG" : "DV"}
                    </span>
                  </td>
                ))}

                <td>
                  <button
                    onClick={() => editarJogador(j)}
                  >
                    Alterar
                  </button>

                  <button
                    onClick={() => excluirJogador(j.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}

            {jogadores.length === 0 && (
              <tr>
                <td colSpan="15" align="center">
                  Nenhum jogador cadastrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <br />

    <button onClick={gerarRelatorio}>
	  📊 Relatório
	</button>

	<button
	  onClick={gerarPDF}
	  style={{ marginLeft: 10 }}
	>
	  📄 PDF
	</button>

	<button
	  onClick={enviarWhatsApp}
	  style={{ marginLeft: 10 }}
	>
	  📱 WhatsApp
	</button>

	  
	  
    </div>
  );
}
