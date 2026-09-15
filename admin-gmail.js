/**
 * Ky WIFI Telecom
 * CAIXA DE E-MAIL (Gmail integrado ao painel admin)
 *
 * IMPORTANTE: troque GMAIL_CLIENT_ID abaixo pelo Client ID gerado
 * no Google Cloud Console (veja o passo a passo que o Claude te deu).
 */

window.addEventListener("error", function (evento) {
    try {
        alert(
            "Erro JavaScript no painel admin:\n\n" +
            (evento.message || "erro desconhecido") +
            "\n\nArquivo: " + (evento.filename || "?") +
            "\nLinha: " + (evento.lineno || "?")
        );
    } catch (e) {}
});

window.addEventListener("unhandledrejection", function (evento) {
    try {
        alert(
            "Erro assíncrono no painel admin:\n\n" +
            (evento.reason && evento.reason.message
                ? evento.reason.message
                : JSON.stringify(evento.reason))
        );
    } catch (e) {}
});


const GMAIL_CLIENT_ID = "62004082485-atd2mludvgmpi4vfmuvh72gp4dq14b6j.apps.googleusercontent.com";

const GMAIL_SCOPES =
    "https://www.googleapis.com/auth/gmail.readonly " +
    "https://www.googleapis.com/auth/gmail.send";

let gmailTokenClient = null;
let gmailAccessToken = null;
let gmailMensagensCache = {};
let gmailMensagemAtual = null;


/* =========================================================
   AUTENTICAÇÃO
========================================================= */

function conectarGmail() {

    try {

        if (GMAIL_CLIENT_ID.indexOf("COLE_AQUI") === 0) {

            alert(
                "Configuração pendente: abra admin-gmail.js e coloque o " +
                "Client ID do Google Cloud na constante GMAIL_CLIENT_ID."
            );

            return;
        }

        if (typeof google === "undefined" || !google.accounts) {

            alert(
                "A biblioteca de login do Google (accounts.google.com/gsi/client) " +
                "não carregou. Isso pode ser: (1) a rede está bloqueando o domínio " +
                "accounts.google.com, (2) o script admin-gmail.js/admin.html no " +
                "GitHub ainda não é a versão nova (dê Ctrl+Shift+R), ou (3) um " +
                "bloqueador de conteúdo está impedindo o carregamento."
            );

            return;
        }

        if (!gmailTokenClient) {

            gmailTokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GMAIL_CLIENT_ID,
                scope: GMAIL_SCOPES,
                callback: (resposta) => {

                    if (resposta && resposta.access_token) {

                        gmailAccessToken = resposta.access_token;

                        onGmailConectado();

                    } else if (resposta && resposta.error) {

                        alert("Erro de autenticação Google: " + resposta.error);
                    }
                },
                error_callback: (erro) => {

                    alert(
                        "O Google bloqueou/cancelou o login: " +
                        (erro && erro.type ? erro.type : JSON.stringify(erro)) +
                        "\n\nCausas comuns: pop-up bloqueado, ou o e-mail usado " +
                        "não está na lista de 'Test users' da Tela de Consentimento."
                    );
                }
            });
        }

        gmailTokenClient.requestAccessToken();

    } catch (error) {

        alert("Erro ao tentar conectar ao Gmail: " + error.message);
    }
}

function onGmailConectado() {

    const btnConectar = document.getElementById("btnGmailConectar");
    const btnAtualizar = document.getElementById("btnGmailAtualizar");
    const chip = document.getElementById("gmailStatusChip");
    const naoConectado = document.getElementById("gmailNaoConectado");
    const layout = document.getElementById("gmailLayout");

    if (btnConectar) btnConectar.style.display = "none";
    if (btnAtualizar) btnAtualizar.style.display = "inline-flex";
    if (chip) chip.style.display = "inline-flex";
    if (naoConectado) naoConectado.style.display = "none";
    if (layout) layout.style.display = "flex";

    const contaEl = document.getElementById("gmailContaLogada");

    if (contaEl) {
        contaEl.textContent = "kywifitelecom@gmail.com";
    }

    listarEmailsGmail();
}


/* =========================================================
   CHAMADAS À GMAIL API
========================================================= */

async function gmailFetch(caminho, opcoes = {}) {

    if (!gmailAccessToken) {
        throw new Error("Gmail não conectado.");
    }

    const resposta = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/${caminho}`,
        {
            ...opcoes,
            headers: {
                Authorization: `Bearer ${gmailAccessToken}`,
                ...(opcoes.headers || {})
            }
        }
    );

    if (!resposta.ok) {

        const corpoErro = await resposta.text();

        throw new Error(
            `Gmail API retornou ${resposta.status}: ${corpoErro}`
        );
    }

    return resposta.json();
}


/* =========================================================
   LISTAR E-MAILS
========================================================= */

async function listarEmailsGmail() {

    const lista = document.getElementById("listaEmails");

    if (!lista) {
        return;
    }

    const buscaEl = document.getElementById("gmailBusca");
    const termo = buscaEl ? buscaEl.value.trim() : "";

    lista.innerHTML = `
        <div style="padding:16px;text-align:center;color:#64748b;">
            <i class="fas fa-spinner fa-spin"></i> Carregando e-mails...
        </div>
    `;

    try {

        const query = termo
            ? `q=${encodeURIComponent(termo)}`
            : "";

        const dados = await gmailFetch(
            `messages?maxResults=25&${query}`
        );

        const mensagens = dados.messages || [];

        if (!mensagens.length) {

            lista.innerHTML = `
                <div style="padding:16px;text-align:center;color:#64748b;">
                    Nenhum e-mail encontrado.
                </div>
            `;

            return;
        }

        lista.innerHTML = "";

        for (const msgRef of mensagens) {

            const detalhe = await gmailFetch(
                `messages/${msgRef.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`
            );

            gmailMensagensCache[msgRef.id] = detalhe;

            const headers = {};

            (detalhe.payload && detalhe.payload.headers || []).forEach(h => {
                headers[h.name] = h.value;
            });

            const item = document.createElement("div");

            item.style.cssText =
                "padding:12px 14px;border-bottom:1px solid #e2e8f0;cursor:pointer;";

            item.onmouseenter = () => item.style.background = "#f8fafc";
            item.onmouseleave = () => item.style.background = "transparent";

            item.onclick = () => abrirEmailGmail(msgRef.id);

            item.innerHTML = `
                <div style="font-weight:600;font-size:0.9rem;color:#1e293b;">
                    ${escapeHtmlGmail(headers.From || "Desconhecido")}
                </div>
                <div style="font-size:0.85rem;color:#334155;margin-top:2px;">
                    ${escapeHtmlGmail(headers.Subject || "(sem assunto)")}
                </div>
                <div style="font-size:0.78rem;color:#94a3b8;margin-top:4px;">
                    ${escapeHtmlGmail(detalhe.snippet || "")}
                </div>
            `;

            lista.appendChild(item);
        }

    } catch (error) {

        console.error("Erro ao listar e-mails:", error);

        lista.innerHTML = `
            <div style="padding:16px;text-align:center;color:#dc2626;">
                Erro ao carregar e-mails: ${escapeHtmlGmail(error.message)}
            </div>
        `;
    }
}


/* =========================================================
   ABRIR / LER UM E-MAIL
========================================================= */

function extrairCorpoHtml(payload) {

    if (!payload) {
        return "";
    }

    if (payload.mimeType === "text/html" && payload.body && payload.body.data) {
        return decodificarBase64Url(payload.body.data);
    }

    if (payload.mimeType === "text/plain" && payload.body && payload.body.data) {
        const texto = decodificarBase64Url(payload.body.data);
        return `<pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtmlGmail(texto)}</pre>`;
    }

    if (payload.parts) {

        const partesHtml = payload.parts.find(p => p.mimeType === "text/html");

        if (partesHtml) {
            return extrairCorpoHtml(partesHtml);
        }

        const partesTexto = payload.parts.find(p => p.mimeType === "text/plain");

        if (partesTexto) {
            return extrairCorpoHtml(partesTexto);
        }

        for (const parte of payload.parts) {

            const resultado = extrairCorpoHtml(parte);

            if (resultado) {
                return resultado;
            }
        }
    }

    return "";
}

function decodificarBase64Url(dados) {

    try {

        const base64 = dados.replace(/-/g, "+").replace(/_/g, "/");

        const texto = decodeURIComponent(
            atob(base64)
                .split("")
                .map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join("")
        );

        return texto;

    } catch (error) {

        try {
            return atob(dados.replace(/-/g, "+").replace(/_/g, "/"));
        } catch (e2) {
            return "";
        }
    }
}

async function abrirEmailGmail(id) {

    const vazio = document.getElementById("gmailDetalheVazio");
    const detalhe = document.getElementById("gmailDetalhe");

    try {

        const completo = await gmailFetch(`messages/${id}?format=full`);

        gmailMensagemAtual = completo;

        const headers = {};

        (completo.payload && completo.payload.headers || []).forEach(h => {
            headers[h.name] = h.value;
        });

        document.getElementById("gmailDetalheAssunto").textContent =
            headers.Subject || "(sem assunto)";

        document.getElementById("gmailDetalheDe").textContent =
            headers.From || "—";

        document.getElementById("gmailDetalheData").textContent =
            headers.Date || "—";

        const corpoHtml = extrairCorpoHtml(completo.payload) ||
            "<p style='color:#94a3b8;'>Não foi possível exibir o conteúdo.</p>";

        const iframe = document.getElementById("gmailDetalheCorpo");

        iframe.srcdoc = corpoHtml;

        if (vazio) vazio.style.display = "none";
        if (detalhe) detalhe.style.display = "block";

        const campoResposta = document.getElementById("gmailResposta");
        if (campoResposta) campoResposta.value = "";

    } catch (error) {

        console.error("Erro ao abrir e-mail:", error);

        alert("Erro ao abrir e-mail: " + error.message);
    }
}


/* =========================================================
   RESPONDER
========================================================= */

function extrairEmailDeHeader(valorHeader) {

    if (!valorHeader) {
        return "";
    }

    const match = valorHeader.match(/<([^>]+)>/);

    return match ? match[1] : valorHeader.trim();
}

async function responderEmailGmail() {

    if (!gmailMensagemAtual) {

        alert("Abra um e-mail antes de responder.");

        return;
    }

    const campo = document.getElementById("gmailResposta");
    const botao = document.getElementById("btnGmailResponder");

    const corpo = campo ? campo.value.trim() : "";

    if (!corpo) {

        alert("Digite uma resposta.");

        return;
    }

    const headers = {};

    (gmailMensagemAtual.payload && gmailMensagemAtual.payload.headers || [])
        .forEach(h => { headers[h.name] = h.value; });

    const destinatario = extrairEmailDeHeader(headers.From);
    const assuntoOriginal = headers.Subject || "";
    const assuntoResposta = /^re:/i.test(assuntoOriginal)
        ? assuntoOriginal
        : `Re: ${assuntoOriginal}`;

    const messageIdOriginal = headers["Message-ID"] || headers["Message-Id"] || "";

    const linhas = [
        `To: ${destinatario}`,
        `Subject: ${assuntoResposta}`,
        messageIdOriginal ? `In-Reply-To: ${messageIdOriginal}` : "",
        messageIdOriginal ? `References: ${messageIdOriginal}` : "",
        "Content-Type: text/plain; charset=UTF-8",
        "",
        corpo
    ].filter(Boolean).join("\r\n");

    const raw = btoa(unescape(encodeURIComponent(linhas)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    try {

        if (botao) {
            botao.disabled = true;
            botao.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        }

        await gmailFetch("messages/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                raw: raw,
                threadId: gmailMensagemAtual.threadId
            })
        });

        alert("Resposta enviada!");

        if (campo) campo.value = "";

    } catch (error) {

        console.error("Erro ao enviar resposta:", error);

        alert("Erro ao enviar resposta: " + error.message);

    } finally {

        if (botao) {
            botao.disabled = false;
            botao.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Resposta';
        }
    }
}


/* =========================================================
   UTIL
========================================================= */

function escapeHtmlGmail(valor) {

    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   DISPONIBILIZAR PARA O HTML
========================================================= */

window.conectarGmail = conectarGmail;
window.listarEmailsGmail = listarEmailsGmail;
window.abrirEmailGmail = abrirEmailGmail;
window.responderEmailGmail = responderEmailGmail;
