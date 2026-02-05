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

  const [mesesFechados, setMesesFechados] = useState(() => {
    const saved = localStorage.getItem("mesesFechados");
    return saved ? JSON.parse(saved) : {};
  });

  const [nome, setNome] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  // =========================
  // LOCAL STORAGE
  // =========================
  useEffect(() => {
    localStorage.setItem("jogadores", JSON.stringify(jogadores));
    localStorage.setItem("mesesFechados", JSON.stringify(mesesFechados));
  }, [jogadores, mesesFechados]);

  // =========================
  // GOOGLE SCRIPT
  // =========================
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  // =========================
  // LOGIN
  // =========================
  function loginSucesso(response) {
    try {
      const user = jwt_decode(response.credential);

      setUsuario(user);

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id:
          "277718466842-ajr820s0ra7i8rtb6op7am8hufbmlocl.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: (res) => {
          setToken(res.access_token);
        },
      });

      client.requestAccessToken();

    } catch (err) {
      console.error(err);
      alert("Erro no login");
    }
  }

  function sair() {
    googleLogout();
    setUsuario(null);
    setToken(null);
  }

  // =========================
  // JOGADORES
  // =========================
  function salvarJogador() {
    if (!nome.trim()) return;

    if (editandoId) {
      setJogadores(jogadores.map(j =>
        j.id === editandoId ? { ...j, nome } : j
      ));

      setEditandoId(null);
      setNome("");
      return;
    }

    const novo = {
      id: Date.now(),
      nome,
      pagamentos: meses.reduce((a, m) => {
        a[m] = false;
        return a;
      }, {}),
    };

    setJogadores([...jogadores, novo]);
    setNome("");
  }

  function togglePagamento(id, mes, nome) {
    if (mesesFechados[mes]) return;

    const jogador = jogadores.find(j => j.id === id);

    if (jogador.pagamentos[mes]) {
      if (!window.confirm(`Desmarcar ${nome}?`)) return;
    }

    setJogadores(jogadores.map(j =>
      j.id === id
        ? {
            ...j,
            pagamentos: {
              ...j.pagamentos,
              [mes]: !j.pagamentos[mes],
            },
          }
        : j
    ));
  }

  function excluirJogador(id) {
    if (window.confirm("Excluir?")) {
      setJogadores(jogadores.filter(j => j.id !== id));
    }
  }

  function toggleMesFechado(m) {
    setMesesFechados(p => ({
      ...p,
      [m]: !p[m],
    }));
  }

  // =========================
  // BACKUP
  // =========================
  async function fazerBackup() {
    if (!token) {
      alert("Faça login");
      return;
    }

    const blob = new Blob(
      [JSON.stringify({ jogadores, mesesFechados })],
      { type: "application/json" }
    );

    const form = new FormData();

    form.append(
      "metadata",
      new Blob(
        [JSON.stringify({ name: "backup.json" })],
        { type: "application/json" }
      )
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

    alert("✅ Backup salvo");
  }

  // =========================
  // TELA
  // =========================
  return (
    <div style={{ maxWidth: 1200, margin: "auto", padding: 15 }}>

      <h2 align="center">⚽ Controle</h2>

      <p align="center">
        Jogadores: {jogadores.length}
      </p>

      <div align="center">
        {meses.map(m => (
          <button
            key={m}
            onClick={() => toggleMesFechado(m)}
            style={{
              margin: 2,
              background: mesesFechados[m] ? "red" : "green",
              color: "white",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <br />

      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome"
      />

      <button onClick={salvarJogador}>
        {editandoId ? "Salvar" : "Adicionar"}
      </button>

      <br /><br />

      <table border="1" width="100%">
        <thead>
          <tr>
            <th>Nome</th>
            {meses.map(m => (
              <th key={m}>{m.slice(0,3)}</th>
            ))}
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {jogadores.map(j => (
            <tr key={j.id}>
              <td>{j.nome}</td>

              {meses.map(m => (
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
                <button onClick={() => excluirJogador(j.id)}>
                  ❌
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />

      <div align="center">

        {!usuario ? (

          <GoogleLogin
            onSuccess={loginSucesso}
            onError={() => alert("Erro")}
          />

        ) : (

          <>
            <p>✅ {usuario.name}</p>

            <button onClick={fazerBackup}>
              ☁️ Backup
            </button>

            <button onClick={sair}>
              🚪 Sair
            </button>
          </>
        )}

      </div>

    </div>
  );
}
