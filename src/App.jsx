import React, { useState, useEffect } from "react";

export default function App() {
  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
  ];

  const [jogadores, setJogadores] = useState(() => {
    const saved = localStorage.getItem("jogadores");
    return saved ? JSON.parse(saved) : [];
  });

  const [nome, setNome] = useState("");
  //const [valor, setValor] = useState(10);
  //const [valor, setValor] = useState(10);


  useEffect(() => {
    localStorage.setItem("jogadores", JSON.stringify(jogadores));
  }, [jogadores]);

  function adicionarJogador() {
    if (!nome.trim()) return alert("Digite o nome do jogador");

    const novo = {
      id: Date.now(),
      nome,
      valor: 10, // ALTEREI AQUI
      pagamentos: meses.reduce((acc, mes) => {
        acc[mes] = false;
        return acc;
      }, {}),
    };

    setJogadores([...jogadores, novo]);
    setNome("");
  }

  function togglePagamento(id, mes) {
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

  function excluirJogador(id) {
    if (window.confirm("Deseja excluir este jogador?")) {
      setJogadores(jogadores.filter((j) => j.id !== id));
    }
  }

  function gerarRelatorio() {
    const total = jogadores.length;

    const pagosPorMes = meses.map((mes) => {
      const pagos = jogadores.filter((j) => j.pagamentos[mes]).length;
      return `${mes}: ${pagos} pagos`;
    });

    alert(
      `Relatório\n\nTotal: ${total} jogadores\n\n${pagosPorMes.join("\n")}`
    );
  }


	function alterarJogador(index) {
	  let nome = prompt("Digite o novo nome do jogador:", jogadores[index].nome);
	  if (nome) {
		jogadores[index].nome = nome;
		// Atualiza checkboxes
		document.querySelectorAll(`#tabela tr`)[index + 1].querySelectorAll('input[type="checkbox"]').forEach((checkbox, i) => {
		  checkbox.checked = jogadores[index].meses[i]; // Ajuste conforme seu array
		});
		atualizarTabela();
	  }
	}
	
	
	function alterarJogadores(id) {
	  const novoNome = prompt("Digite o novo nome:");

	  if (!novoNome) return;

	  setJogadores(
		jogadores.map((j) =>
		  j.id === id
			? { ...j, nome: novoNome }
			: j
		)
	  );
	}


	function enviarWhatsApp() {
	  let texto = "📋 Controle de Pagamentos\n\n";

	  jogadores.forEach((j) => {
		texto += `👤 ${j.nome}\n`;

		meses.forEach((m) => {
		  texto += `${m.slice(0, 3)}: ${j.pagamentos[m] ? "✅" : "❌"} `;
		});

		texto += "\n\n";
	  });

	  const url =
		"https://wa.me/?text=" +
		encodeURIComponent(texto);

	  window.open(url, "_blank");
	}

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>⚽ Controle de Pagamentos</h1>

      <div style={{ marginBottom: 15 }}>
        <input
          placeholder="Nome do jogador"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

       /* <input
          type="number"
          value={valor}
		  placeholder="Valor" 
          onChange={(e) => setValor(e.target.value)}
          style={{ marginLeft: 5, width: 80 }}
        />
		*/

        <button onClick={adicionarJogador} style={{ marginLeft: 5 }}>
          Adicionar
        </button>
      </div>

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Nome</th>
            //<th>Valor</th>

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
             // <td>R$ {j.valor}</td>

              {meses.map((m) => (
                <td key={m} align="center">
                  <input
                    type="checkbox"
                    checked={j.pagamentos[m]}
                    onChange={() => togglePagamento(j.id, m)}
                  />
                </td>
              ))}

              <td>
                /*<button onClick={() => excluirJogador(j.id)}>
                  Excluir
                </button>*/
				
				<button onClick={() => alterarJogadores(j.id)}>
					Alterar
				  </button>

				  <button
					onClick={() => excluirJogador(j.id)}
					style={{ marginLeft: 5 }}
				  >
					Excluir
				  </button>	
				
              </td>
			  <td>
			  <button onclick="alterarJogador(index)">Alterar</button>
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

      <br />

     /* <button onClick={gerarRelatorio}>
        Gerar Relatório
      </button>*/
	  
	<button onClick={gerarRelatorio}>
	  Gerar Relatório
	</button>

	<button
	  onClick={enviarWhatsApp}
	  style={{ marginLeft: 10 }}
	>
	  WhatsApp
	</button>

	  
    </div>
  );
}
