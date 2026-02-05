import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import jwt_decode from "jwt-decode";


export default function App() {
  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
  ];

  const valorMensal = 15;

  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);

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

  // =====================
  // LOCAL STORAGE
  // =====================
  useEffect(() => {
    localStorage.setItem("jogadores", JSON.stringify(jogadores));
    localStorage.setItem("mesesFechados", JSON.stringify(mesesFechados));
  }, [jogadores, mesesFechados]);

  // =====================
  // GOOGLE API INIT
  // =====================
  
  // =====================
  // FECHAR MÊS
  // =====================
  function toggleMesFechado(mes) {
    setMesesFechados((prev) => ({
      ...prev,
      [mes]: !prev[mes],
    }));
  }

  // =====================
  // SALVAR JOGADOR
  // =====================
  function salvarJogador() {
    if (!nome.trim()) {
      alert("Digite o nome");
      return;
    }

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

  // =====================
  // PAGAMENTO
  // =====================
  function togglePagamento(id, mes, nomeJogador) {
    if (mesesFechados[mes]) return;

    const jogador = jogadores.find((j) => j.id === id);

    if (!jogador) return;

    if (jogador.pagamentos[mes]) {
      const confirmar = window.confirm(
        `Deseja desmarcar ${nomeJogador} em ${mes}?`
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

  // =====================
  // EXCLUIR
  // =====================
  function excluirJogador(id) {
    if (window.confirm("Deseja excluir?")) {
      setJogadores(jogadores.filter((j) => j.id !== id));
    }
  }

  function editarJogador(j) {
    setNome(j.nome);
    setEditandoId(j.id);
  }

  // =====================
  // RELATÓRIO
  // =====================
  function gerarRelatorio() {
    let relatorio =
      "📋 RELATÓRIO\n\n" +
      `👥 Jogadores: ${jogadores.length}\n\n`;

    meses.forEach((mes) => {
      const pagos = jogadores.filter(
        (j) => j.pagamentos[mes]
      ).length;

      const total = pagos * valorMensal;

      relatorio += `${mes}: ${pagos} pagos | R$ ${total}\n`;
    });

    alert(relatorio);
  }

  // =====================
  // PDF
  // =====================
  function gerarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Relatório de Pagamentos", 14, 15);

    doc.setFontSize(10);
    doc.text(
      `Total: ${jogadores.length} jogadores`,
      14,
      22
    );

    const head = [
      ["Nome", ...meses.map((m) => m.slice(0, 3))]
    ];

    const body = jogadores.map((j) => [
      j.nome,
      ...meses.map((m) => (j.pagamentos[m] ? "PG" : "DV")),
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 28,
      styles: { fontSize: 8, halign: "center" },
    });

    doc.save("relatorio.pdf");
  }

  // =====================
  // WHATSAPP
  // =====================
  function enviarWhatsApp() {
    let texto = "📋 Pagamentos\n\n";

    jogadores.forEach((j) => {
      texto += `👤 ${j.nome}\n`;

      meses.forEach((m) => {
        texto += `${m.slice(0, 3)}: ${
          j.pagamentos[m] ? "✅" : "❌"
        } `;
      });

      texto += "\n\n";
    });

    window.open(
      "https://wa.me/?text=" + encodeURIComponent(texto),
      "_blank"
    );
  }

  // =====================
  // GOOGLE LOGIN
  // =====================
	function loginSucesso(response) {
	  try {
		const userObject = jwt_decode(response.credential);

		setUsuario({
		  name: userObject.name,
		  email: userObject.email,
		  picture: userObject.picture,
		});

		// Buscar access token real via Google OAuth
		window.google.accounts.oauth2.initTokenClient({
		  client_id:
			"277718466842-ajr820s0ra7i8rtb6op7am8hufbmlocl.apps.googleusercontent.com",
		  scope: "https://www.googleapis.com/auth/drive.file",
		  callback: (tokenResponse) => {
			setToken(tokenResponse.access_token);
		  },
		}).requestAccessToken();

	  } catch (err) {
		console.error(err);
		alert("Erro no login");
	  }
	}


  // =====================
  // BACKUP
  // =====================
  async function fazerBackup() {
    if (!token) {
      alert("Faça login");
      return;
    }

    const dados = {
      jogadores,
      mesesFechados,
    };

    const blob = new Blob([JSON.stringify(dados)], {
      type: "application/json",
    });

    const metadata = {
      name: "app-jogadores-backup.json",
      mimeType: "application/json",
    };

    const form = new FormData();

    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], {
        type: "application/json",
      })
    );

    form.append("file", blob);

    await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
        body: form,
      }
    );

    alert("✅ Backup salvo!");
  }

  async function restaurarBackup() {
    if (!token) {
      alert("Faça login");
      return;
    }

    const res = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=name='app-jogadores-backup.json'",
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    const data = await res.json();

    if (!data.files || !data.files.length) {
      alert("Nenhum backup encontrado");
      return;
    }

    const fileId = data.files[0].id;

    const file = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    const conteudo = await file.json();

    setJogadores(conteudo.jogadores || []);
    setMesesFechados(conteudo.mesesFechados || {});

    alert("✅ Restaurado!");
  }

  // =====================
  // TELA
  // =====================
  return (
    <>
      <div
        style={{
          maxWidth: 1200,
          margin: "auto",
          padding: 15,
          fontFamily: "Arial",
        }}
      >
        <h2 align="center">
          ⚽ Controle de Pagamentos
        </h2>

        <p align="center">
          👥 Total: {jogadores.length}
        </p>

        {/* MESES */}
        <div align="center">
          {meses.map((mes) => (
            <button
              key={mes}
              onClick={() => toggleMesFechado(mes)}
              style={{
                margin: 3,
                background: mesesFechados[mes]
                  ? "#f44336"
                  : "#4caf50",
                color: "#fff",
              }}
            >
              {mesesFechados[mes] ? "🔓" : "🔒"} {mes}
            </button>
          ))}
        </div>

        <br />

        {/* FORM */}
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome"
        />

        <button onClick={salvarJogador}>
          {editandoId ? "Salvar" : "Adicionar"}
        </button>

        <br /><br />

        {/* TABELA */}
        <table border="1" width="100%">
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
                      onChange={() =>
                        togglePagamento(j.id, m, j.nome)
                      }
                    />
                  </td>
                ))}

                <td>
                  <button onClick={() => editarJogador(j)}>
                    ✏️
                  </button>

                  <button
                    onClick={() => excluirJogador(j.id)}
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <br />

        <button onClick={gerarRelatorio}>
          📊 Relatório
        </button>

        <button onClick={gerarPDF}>
          📄 PDF
        </button>

        <button onClick={enviarWhatsApp}>
          📱 WhatsApp
        </button>
      </div>

      {/* GOOGLE */}
      <div align="center">
        {!usuario ? (
          <GoogleLogin
			  onSuccess={loginSucesso}
			  onError={() => alert("Erro no login")}
			  useOneTap
			/>


        ) : (
          <>
            <p>✅ Logado</p>

            <button onClick={fazerBackup}>
              ☁️ Backup
            </button>

            <button onClick={restaurarBackup}>
              📥 Restaurar
            </button>

            <button onClick={sair}>
              🚪 Sair
            </button>
          </>
        )}
      </div>
    </>
  );
}
