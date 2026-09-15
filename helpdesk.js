/**
 * Ky WIFI Telecom
 * HELP DESK / CHAMADOS
 * Versão corrigida
 */

const HELPDESK_FIREBASE_CONFIG = {
    apiKey: "AIzaSyA0XjvmilmpNwBVDHuVRdyF8YCQ0SimvJA",
    authDomain: "ky-wi-fi-telecom.firebaseapp.com",
    databaseURL: "https://ky-wi-fi-telecom-default-rtdb.firebaseio.com",
    projectId: "ky-wi-fi-telecom",
    storageBucket: "ky-wi-fi-telecom.appspot.com",
    messagingSenderId: "222931880150",
    appId: "1:222931880150:web:4224128a5b03022e3f6177",
    measurementId: "G-RYJLD3M3HY"
};

let helpdeskDb = null;
let chamadoAtualConsulta = null;

/* =========================================================
   CAPTURA DE ERROS SEM DEVTOOLS
   (mostra qualquer erro na tela via alert, para ambientes
   onde o DevTools está bloqueado pela organização)
========================================================= */

window.addEventListener("error", function (evento) {
    try {
        alert(
            "Erro JavaScript detectado:\n\n" +
            (evento.message || "erro desconhecido") +
            "\n\nArquivo: " + (evento.filename || "?") +
            "\nLinha: " + (evento.lineno || "?")
        );
    } catch (e) {}
});

window.addEventListener("unhandledrejection", function (evento) {
    try {
        alert(
            "Erro assíncrono (Firebase/Promise) detectado:\n\n" +
            (evento.reason && evento.reason.message
                ? evento.reason.message
                : JSON.stringify(evento.reason))
        );
    } catch (e) {}
});


/* =========================================================
   NOTIFICAÇÃO POR E-MAIL (EmailJS)
========================================================= */

const HD_EMAILJS_SERVICE_ID = "service_uuczxm4";
const HD_EMAILJS_TEMPLATE_ID = "template_nbdfq2p";
const HD_EMAIL_EMPRESA = "kywifitelecom@gmail.com";

function enviarEmailChamado(dados) {

    if (typeof emailjs === "undefined") {
        console.error("EmailJS não foi carregado.");
        return Promise.resolve(false);
    }

    return emailjs.send(
        HD_EMAILJS_SERVICE_ID,
        HD_EMAILJS_TEMPLATE_ID,
        dados
    ).then(() => {
        console.log("E-mail de notificação enviado.");
        return true;
    }).catch(error => {
        console.error("Erro ao enviar e-mail de notificação:", error);
        return false;
    });
}


/* =========================================================
   FIREBASE
========================================================= */

function initHelpdeskFirebase() {
    try {
        if (typeof firebase === "undefined") {
            console.error("Firebase não foi carregado.");
            return null;
        }

        if (!firebase.apps.length) {
            firebase.initializeApp(HELPDESK_FIREBASE_CONFIG);
        }

        helpdeskDb = firebase.database();

        console.log("Help Desk: Firebase conectado.");

        return helpdeskDb;

    } catch (error) {
        console.error("Erro ao iniciar Firebase:", error);
        return null;
    }
}


/* =========================================================
   UTILITÁRIOS
========================================================= */

function limparCPF(valor) {
    return String(valor || "").replace(/\D/g, "");
}

function limparTelefone(valor) {
    return String(valor || "").replace(/\D/g, "");
}

function gerarProtocoloChamado() {

    const ano = new Date().getFullYear();

    const numero = Math.floor(
        100000 + Math.random() * 900000
    );

    return `KY-${ano}-${numero}`;
}

function formatarDataHora(data) {

    if (!data) {
        return "-";
    }

    try {

        const d = new Date(data);

        if (isNaN(d.getTime())) {
            return String(data);
        }

        return d.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

    } catch (error) {
        return String(data);
    }
}

function statusLabel(status) {

    const mapa = {
        aberto: "Aberto",
        em_andamento: "Em andamento",
        aguardando_cliente: "Aguardando cliente",
        resolvido: "Resolvido",
        fechado: "Fechado",
        cancelado: "Cancelado"
    };

    return mapa[status] || status || "Aberto";
}

function statusBadgeClass(status) {

    switch (status) {

        case "resolvido":
        case "fechado":
            return "badge-resolvido";

        case "em_andamento":
            return "badge-andamento";

        case "aguardando_cliente":
            return "badge-aguardando";

        case "cancelado":
            return "badge-cancelado";

        default:
            return "badge-aberto";
    }
}


/* =========================================================
   TRADUÇÃO DE ERROS DO FIREBASE
========================================================= */

function mensagemErroFirebase(error, acaoPadrao) {

    if (error && error.code === "PERMISSION_DENIED") {
        return "Acesso negado pelo Firebase. As Regras (Rules) do Realtime Database " +
               "estão bloqueando esta operação — normalmente porque o modo de teste expirou. " +
               "Veja o console do navegador (F12) e ajuste as Rules no Firebase Console.";
    }

    if (error && error.message) {
        return `${acaoPadrao} (${error.message})`;
    }

    return acaoPadrao;
}


/* =========================================================
   SEGURANÇA HTML
========================================================= */

function escapeHtmlHd(valor) {

    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, "<br>");
}


/* =========================================================
   TOAST
========================================================= */

function showHelpdeskToast(mensagem, tipo = "success") {

    if (typeof showToast === "function") {
        showToast(mensagem, tipo);
        return;
    }

    let toast = document.getElementById("helpdeskToast");

    if (!toast) {

        toast = document.createElement("div");

        toast.id = "helpdeskToast";

        toast.style.position = "fixed";
        toast.style.bottom = "25px";
        toast.style.right = "25px";
        toast.style.zIndex = "99999";
        toast.style.padding = "14px 20px";
        toast.style.borderRadius = "10px";
        toast.style.color = "#fff";
        toast.style.fontWeight = "600";
        toast.style.boxShadow = "0 8px 30px rgba(0,0,0,.2)";

        document.body.appendChild(toast);
    }

    toast.style.background =
        tipo === "error" ? "#dc2626" :
        tipo === "warning" ? "#d97706" :
        "#16a34a";

    toast.textContent = mensagem;

    toast.style.display = "block";

    clearTimeout(window.helpdeskToastTimer);

    window.helpdeskToastTimer = setTimeout(() => {
        toast.style.display = "none";
    }, 4000);
}


/* =========================================================
   ABAS
========================================================= */

function trocarAbaHelpdesk(aba) {

    const abrir = document.getElementById("hdTabAbrir");
    const consultar = document.getElementById("hdTabConsultar");

    const botoes = document.querySelectorAll(".hd-tab-btn");

    if (!abrir || !consultar) {
        return;
    }

    abrir.classList.add("hd-hidden");
    consultar.classList.add("hd-hidden");

    botoes.forEach(btn => {
        btn.classList.remove("active");
    });

    if (aba === "consultar") {

        consultar.classList.remove("hd-hidden");

        const btn = document.querySelector(
            '.hd-tab-btn[data-tab="consultar"]'
        );

        if (btn) {
            btn.classList.add("active");
        }

    } else {

        abrir.classList.remove("hd-hidden");

        const btn = document.querySelector(
            '.hd-tab-btn[data-tab="abrir"]'
        );

        if (btn) {
            btn.classList.add("active");
        }
    }
}


/* =========================================================
   ABRIR CHAMADO
========================================================= */

async function abrirChamadoCliente(event) {

    if (event) {
        event.preventDefault();
    }

    console.log("Iniciando abertura de chamado...");

    const db = initHelpdeskFirebase();

    if (!db) {

        showHelpdeskToast(
            "Não foi possível conectar ao banco de dados.",
            "error"
        );

        return false;
    }

    const nomeEl = document.getElementById("hdNome");
    const emailEl = document.getElementById("hdEmail");
    const telefoneEl = document.getElementById("hdTelefone");
    const cpfEl = document.getElementById("hdCpf");
    const assuntoEl = document.getElementById("hdAssunto");
    const mensagemEl = document.getElementById("hdMensagem");
    const botao = document.getElementById("btnAbrirChamado");

    if (
        !nomeEl ||
        !emailEl ||
        !telefoneEl ||
        !cpfEl ||
        !assuntoEl ||
        !mensagemEl
    ) {

        console.error("Campos do formulário não encontrados.");

        showHelpdeskToast(
            "Erro interno: campos do formulário não encontrados.",
            "error"
        );

        return false;
    }

    const nome = nomeEl.value.trim();
    const email = emailEl.value.trim();
    const telefone = limparTelefone(telefoneEl.value);
    const cpf = limparCPF(cpfEl.value);
    const assunto = assuntoEl.value.trim();
    const mensagem = mensagemEl.value.trim();

    if (!nome || !email || !telefone || !cpf || !assunto || !mensagem) {

        showHelpdeskToast(
            "Preencha todos os campos obrigatórios.",
            "warning"
        );

        return false;
    }

    if (cpf.length !== 11) {

        showHelpdeskToast(
            "Digite um CPF válido.",
            "warning"
        );

        return false;
    }

    if (mensagem.length < 5) {

        showHelpdeskToast(
            "Digite uma mensagem mais detalhada.",
            "warning"
        );

        return false;
    }

    const protocolo = gerarProtocoloChamado();

    const chamadoRef = db.ref("chamados").push();

    const primeiraRespostaKey = db.ref("chamados").push().key;

    const chamado = {

        protocolo: protocolo,

        cliente: nome,

        email: email,

        telefone: telefone,

        cpf: cpf,

        assunto: assunto,

        mensagem: mensagem,

        status: "aberto",

        dataCriacao: Date.now(),

        respostas: {

            [primeiraRespostaKey]: {

                mensagem: mensagem,

                autor: "cliente",

                data: Date.now()
            }
        }
    };

    try {

        if (botao) {

            botao.disabled = true;

            botao.innerHTML =
                '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        }

        console.log("Salvando chamado:", chamado);

        await chamadoRef.set(chamado);

        console.log(
            "Chamado salvo com sucesso:",
            chamadoRef.key
        );

        enviarEmailChamado({
            to_email: HD_EMAIL_EMPRESA,
            titulo_evento: "Novo chamado aberto",
            protocolo: protocolo,
            cliente: nome,
            email_cliente: email,
            telefone: telefone,
            assunto: assunto,
            status: statusLabel("aberto"),
            mensagem: mensagem
        });

        const protocoloEl =
            document.getElementById("hdProtocoloGerado");

        if (protocoloEl) {
            protocoloEl.textContent = protocolo;
        }

        const form =
            document.getElementById("formAbrirChamado");

        const sucesso =
            document.getElementById("hdSucessoBox");

        if (form) {
            form.classList.add("hd-hidden");
        }

        if (sucesso) {
            sucesso.classList.remove("hd-hidden");
        }

        showHelpdeskToast(
            "Chamado aberto com sucesso!",
            "success"
        );

        return true;

    } catch (error) {

        console.error(
            "ERRO AO SALVAR CHAMADO:",
            error
        );

        showHelpdeskToast(
            mensagemErroFirebase(error, "Não foi possível enviar o chamado."),
            "error"
        );

        if (botao) {

            botao.disabled = false;

            botao.innerHTML =
                '<i class="fas fa-paper-plane"></i> Abrir Chamado';
        }

        return false;
    }
}


/* =========================================================
   COPIAR PROTOCOLO
========================================================= */

async function copiarProtocolo() {

    const elemento =
        document.getElementById("hdProtocoloGerado");

    if (!elemento) {
        return;
    }

    const protocolo =
        elemento.textContent.trim();

    try {

        await navigator.clipboard.writeText(protocolo);

        showHelpdeskToast(
            "Protocolo copiado!",
            "success"
        );

    } catch (error) {

        const campo =
            document.createElement("textarea");

        campo.value = protocolo;

        document.body.appendChild(campo);

        campo.select();

        document.execCommand("copy");

        campo.remove();

        showHelpdeskToast(
            "Protocolo copiado!",
            "success"
        );
    }
}


/* =========================================================
   CONSULTAR CHAMADO
========================================================= */

async function consultarChamadoCliente(event) {

    if (event) {
        event.preventDefault();
    }

    const db = initHelpdeskFirebase();

    if (!db) {

        showHelpdeskToast(
            "Erro de conexão com o Firebase.",
            "error"
        );

        return false;
    }

    const cpfEl =
        document.getElementById("hdConsultaCpf");

    const protocoloEl =
        document.getElementById("hdConsultaProtocolo");

    const resultado =
        document.getElementById("hdResultadoConsulta");

    const botao =
        document.getElementById("btnConsultarChamado");

    const cpf =
        limparCPF(cpfEl ? cpfEl.value : "");

    const protocolo =
        protocoloEl
            ? protocoloEl.value.trim().toUpperCase()
            : "";

    if (!cpf && !protocolo) {

        showHelpdeskToast(
            "Informe o CPF ou o protocolo.",
            "warning"
        );

        return false;
    }

    try {

        if (botao) {

            botao.disabled = true;

            botao.innerHTML =
                '<i class="fas fa-spinner fa-spin"></i> Consultando...';
        }

        const snapshot =
            await db.ref("chamados").once("value");

        const dados = snapshot.val();

        let encontrado = null;
        let idEncontrado = null;

        if (dados) {

            Object.entries(dados).forEach(
                ([id, chamado]) => {

                    if (encontrado) {
                        return;
                    }

                    const chamadoCpf =
                        limparCPF(chamado.cpf);

                    const chamadoProtocolo =
                        String(
                            chamado.protocolo || ""
                        ).toUpperCase();

                    const cpfOk =
                        cpf &&
                        chamadoCpf === cpf;

                    const protocoloOk =
                        protocolo &&
                        chamadoProtocolo === protocolo;

                    if (
                        (cpf && protocolo && cpfOk && protocoloOk) ||
                        (!cpf && protocolo && protocoloOk) ||
                        (cpf && !protocolo && cpfOk)
                    ) {

                        encontrado = chamado;

                        idEncontrado = id;
                    }
                }
            );
        }

        if (!encontrado) {

            if (resultado) {

                resultado.classList.remove("hd-hidden");

                resultado.innerHTML = `
                    <div class="hd-info-box">
                        <i class="fas fa-circle-exclamation"></i>
                        Nenhum chamado encontrado com os dados informados.
                    </div>
                `;
            }

            showHelpdeskToast(
                "Chamado não encontrado.",
                "warning"
            );

            return false;
        }

        chamadoAtualConsulta = {
            id: idEncontrado,
            dados: encontrado
        };

        renderizarConsultaCliente(
            idEncontrado,
            encontrado
        );

        return true;

    } catch (error) {

        console.error(
            "Erro ao consultar chamado:",
            error
        );

        showHelpdeskToast(
            mensagemErroFirebase(error, "Erro ao consultar os chamados."),
            "error"
        );

        return false;

    } finally {

        if (botao) {

            botao.disabled = false;

            botao.innerHTML =
                '<i class="fas fa-search"></i> Consultar';
        }
    }
}


/* =========================================================
   RENDERIZAR CONSULTA DO CLIENTE
========================================================= */

function renderizarConsultaCliente(id, chamado) {

    const resultado =
        document.getElementById("hdResultadoConsulta");

    if (!resultado) {
        return;
    }

    let respostasHtml = "";

    const respostas =
        chamado.respostas || {};

    Object.values(respostas)
        .sort((a, b) => {
            return Number(a.data || 0) -
                   Number(b.data || 0);
        })
        .forEach(resposta => {

            const autor =
                resposta.autor === "admin"
                    ? "Atendimento Ky WIFI"
                    : "Você";

            respostasHtml += `
                <div style="
                    background:#fff;
                    border:1px solid #e2e8f0;
                    border-radius:10px;
                    padding:12px;
                    margin-bottom:10px;
                ">
                    <strong>${escapeHtmlHd(autor)}</strong>

                    <div style="
                        margin-top:6px;
                        color:#475569;
                    ">
                        ${escapeHtmlHd(resposta.mensagem)}
                    </div>

                    <small style="
                        display:block;
                        margin-top:7px;
                        color:#94a3b8;
                    ">
                        ${formatarDataHora(resposta.data)}
                    </small>
                </div>
            `;
        });

    resultado.classList.remove("hd-hidden");

    resultado.innerHTML = `

        <div style="
            border:1px solid #e2e8f0;
            border-radius:12px;
            padding:18px;
            background:#f8fafc;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                gap:10px;
                flex-wrap:wrap;
                margin-bottom:15px;
            ">

                <div>
                    <strong>Protocolo</strong>

                    <div style="
                        color:#6A1B9A;
                        font-size:1.1rem;
                        font-weight:700;
                    ">
                        ${escapeHtmlHd(chamado.protocolo)}
                    </div>
                </div>

                <div>
                    <strong>Status</strong>

                    <div style="
                        margin-top:5px;
                        font-weight:600;
                    ">
                        ${escapeHtmlHd(
                            statusLabel(chamado.status)
                        )}
                    </div>
                </div>

            </div>

            <div style="
                margin-bottom:15px;
                color:#475569;
            ">
                <strong>Assunto:</strong>
                ${escapeHtmlHd(chamado.assunto)}
            </div>

            <h4 style="
                margin-bottom:10px;
            ">
                Conversa
            </h4>

            ${respostasHtml || `
                <p style="color:#64748b;">
                    Nenhuma resposta ainda.
                </p>
            `}

            ${
                chamado.status !== "resolvido" &&
                chamado.status !== "fechado" &&
                chamado.status !== "cancelado"
                ?

                `
                <div style="
                    margin-top:15px;
                ">

                    <textarea
                        id="hdRespostaCliente"
                        class="form-control"
                        rows="3"
                        placeholder="Digite uma resposta..."
                    ></textarea>

                    <button
                        type="button"
                        class="btn-submit"
                        onclick="enviarRespostaCliente()"
                        style="margin-top:10px;"
                    >
                        <i class="fas fa-paper-plane"></i>
                        Enviar resposta
                    </button>

                </div>
                `

                : ""
            }

        </div>
    `;
}


/* =========================================================
   RESPOSTA DO CLIENTE
========================================================= */

async function enviarRespostaCliente() {

    if (!chamadoAtualConsulta) {

        showHelpdeskToast(
            "Consulte um chamado primeiro.",
            "warning"
        );

        return;
    }

    const campo =
        document.getElementById("hdRespostaCliente");

    if (!campo) {
        return;
    }

    const mensagem =
        campo.value.trim();

    if (!mensagem) {

        showHelpdeskToast(
            "Digite uma mensagem.",
            "warning"
        );

        return;
    }

    const db = initHelpdeskFirebase();

    if (!db) {
        return;
    }

    try {

        const respostaRef =
            db.ref(
                `chamados/${chamadoAtualConsulta.id}/respostas`
            ).push();

        await respostaRef.set({

            mensagem: mensagem,

            autor: "cliente",

            data: Date.now()
        });

        await db.ref(
            `chamados/${chamadoAtualConsulta.id}`
        ).update({

            status: "aberto",

            ultimaAtualizacao: Date.now()
        });

        enviarEmailChamado({
            to_email: HD_EMAIL_EMPRESA,
            titulo_evento: "Cliente respondeu ao chamado",
            protocolo: chamadoAtualConsulta.dados.protocolo || "",
            cliente: chamadoAtualConsulta.dados.cliente || "",
            email_cliente: chamadoAtualConsulta.dados.email || "",
            telefone: chamadoAtualConsulta.dados.telefone || "",
            assunto: chamadoAtualConsulta.dados.assunto || "",
            status: statusLabel("aberto"),
            mensagem: mensagem
        });

        showHelpdeskToast(
            "Resposta enviada!",
            "success"
        );

        campo.value = "";

        const snapshot =
            await db.ref(
                `chamados/${chamadoAtualConsulta.id}`
            ).once("value");

        const atualizado =
            snapshot.val();

        chamadoAtualConsulta.dados =
            atualizado;

        renderizarConsultaCliente(
            chamadoAtualConsulta.id,
            atualizado
        );

    } catch (error) {

        console.error(
            "Erro ao enviar resposta:",
            error
        );

        showHelpdeskToast(
            mensagemErroFirebase(error, "Erro ao enviar resposta."),
            "error"
        );
    }
}


/* =========================================================
   ADMIN — CARREGAR CHAMADOS
========================================================= */

async function carregarChamadosAdmin() {

    const lista =
        document.getElementById("listaChamados");

    if (!lista) {
        return;
    }

    const db = initHelpdeskFirebase();

    if (!db) {

        lista.innerHTML = `
            <tr>
                <td colspan="7">
                    Erro ao conectar ao Firebase.
                </td>
            </tr>
        `;

        return;
    }

    lista.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center;">
                <i class="fas fa-spinner fa-spin"></i>
                Carregando chamados...
            </td>
        </tr>
    `;

    try {

        const snapshot =
            await db.ref("chamados").once("value");

        const dados =
            snapshot.val();

        if (!dados) {

            lista.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;">
                        Nenhum chamado encontrado.
                    </td>
                </tr>
            `;

            return;
        }

        const chamados =
            Object.entries(dados)
                .map(([id, chamado]) => ({
                    id,
                    ...chamado
                }))
                .sort(
                    (a, b) =>
                        Number(b.dataCriacao || 0) -
                        Number(a.dataCriacao || 0)
                );

        lista.innerHTML = "";

        chamados.forEach(chamado => {

            const quantidade =
                Object.keys(
                    chamado.respostas || {}
                ).length;

            const tr =
                document.createElement("tr");

            tr.innerHTML = `

                <td>
                    <strong>
                        ${escapeHtmlHd(
                            chamado.protocolo
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHtmlHd(
                        chamado.cliente
                    )}
                </td>

                <td>
                    ${escapeHtmlHd(
                        chamado.assunto
                    )}
                </td>

                <td>
                    ${formatarDataHora(
                        chamado.dataCriacao
                    )}
                </td>

                <td>
                    <span class="${statusBadgeClass(
                        chamado.status
                    )}">
                        ${escapeHtmlHd(
                            statusLabel(chamado.status)
                        )}
                    </span>
                </td>

                <td>
                    ${quantidade}
                </td>

                <td>
                    <button
                        class="btn-action"
                        onclick="abrirChamadoAdmin('${chamado.id}')"
                    >
                        <i class="fas fa-eye"></i>
                        Ver
                    </button>
                </td>
            `;

            lista.appendChild(tr);
        });

    } catch (error) {

        console.error(
            "Erro ao carregar chamados:",
            error
        );

        const msg = mensagemErroFirebase(error, "Erro ao carregar os chamados.");

        lista.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center;color:#dc2626;">
                    ${escapeHtmlHd(msg)}
                </td>
            </tr>
        `;

        showHelpdeskToast(
            msg,
            "error"
        );
    }
}


/* =========================================================
   ADMIN — ABRIR CHAMADO
========================================================= */

async function abrirChamadoAdmin(id) {

    const db = initHelpdeskFirebase();

    if (!db) {
        return;
    }

    try {

        const snapshot =
            await db.ref(
                `chamados/${id}`
            ).once("value");

        const chamado =
            snapshot.val();

        if (!chamado) {

            showHelpdeskToast(
                "Chamado não encontrado (ou o acesso foi negado pelas Rules do Firebase).",
                "error"
            );

            return;
        }

        window.chamadoAtualAdmin = {
            id,
            dados: chamado
        };

        const protocolo =
            document.getElementById(
                "modalChamadoProtocolo"
            );

        const cliente =
            document.getElementById(
                "modalChamadoCliente"
            );

        const email =
            document.getElementById(
                "modalChamadoEmail"
            );

        const assunto =
            document.getElementById(
                "modalChamadoAssunto"
            );

        const status =
            document.getElementById(
                "modalChamadoStatus"
            );

        const resposta =
            document.getElementById(
                "modalChamadoResposta"
            );

        if (protocolo) {
            protocolo.textContent =
                chamado.protocolo || "—";
        }

        if (cliente) {
            cliente.textContent =
                chamado.cliente || "—";
        }

        if (email) {
            email.textContent =
                chamado.email || "—";
        }

        if (assunto) {
            assunto.textContent =
                chamado.assunto || "—";
        }

        if (status) {
            status.value =
                chamado.status || "aberto";
        }

        if (resposta) {
            resposta.value = "";
        }

        renderizarConversaAdmin(chamado);

        if (typeof abrirModalElemento === "function") {

            abrirModalElemento(
                "modalChamado"
            );

        } else {

            const modal =
                document.getElementById(
                    "modalChamado"
                );

            if (modal) {
                modal.style.display = "flex";
            }
        }

    } catch (error) {

        console.error(
            "Erro ao abrir chamado:",
            error
        );

        showHelpdeskToast(
            mensagemErroFirebase(error, "Erro ao abrir o chamado."),
            "error"
        );
    }
}


/* =========================================================
   ADMIN — CONVERSA
========================================================= */

function renderizarConversaAdmin(chamado) {

    const container =
        document.getElementById(
            "modalChamadoConversa"
        );

    if (!container) {
        return;
    }

    let html = "";

    const respostas =
        chamado.respostas || {};

    Object.values(respostas)
        .sort(
            (a, b) =>
                Number(a.data || 0) -
                Number(b.data || 0)
        )
        .forEach(resposta => {

            const ehAdmin =
                resposta.autor === "admin";

            html += `

                <div style="
                    margin-bottom:12px;
                    padding:12px;
                    border-radius:10px;
                    background:${ehAdmin ? "#f3e8ff" : "#fff"};
                    border:1px solid #e2e8f0;
                ">

                    <strong>
                        ${ehAdmin
                            ? "Atendimento Ky WIFI"
                            : "Cliente"}
                    </strong>

                    <div style="
                        margin-top:6px;
                        color:#334155;
                    ">
                        ${escapeHtmlHd(
                            resposta.mensagem
                        )}
                    </div>

                    <small style="
                        display:block;
                        margin-top:7px;
                        color:#94a3b8;
                    ">
                        ${formatarDataHora(
                            resposta.data
                        )}
                    </small>

                </div>
            `;
        });

    container.innerHTML =
        html ||
        `
            <p style="color:#64748b;">
                Nenhuma mensagem encontrada.
            </p>
        `;
}


/* =========================================================
   ADMIN — RESPONDER
========================================================= */

async function enviarRespostaAdmin(event) {

    if (event) {
        event.preventDefault();
    }

    const atual =
        window.chamadoAtualAdmin;

    if (!atual) {

        showHelpdeskToast(
            "Nenhum chamado selecionado.",
            "warning"
        );

        return false;
    }

    const campo =
        document.getElementById(
            "modalChamadoResposta"
        );

    const statusEl =
        document.getElementById(
            "modalChamadoStatus"
        );

    const botao =
        document.getElementById(
            "btnResponderChamado"
        );

    const mensagem =
        campo
            ? campo.value.trim()
            : "";

    const status =
        statusEl
            ? statusEl.value
            : "aberto";

    if (!mensagem) {

        showHelpdeskToast(
            "Digite uma resposta.",
            "warning"
        );

        return false;
    }

    const db =
        initHelpdeskFirebase();

    if (!db) {
        return false;
    }

    try {

        if (botao) {

            botao.disabled = true;

            botao.innerHTML =
                '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        }

        const respostaRef =
            db.ref(
                `chamados/${atual.id}/respostas`
            ).push();

        await respostaRef.set({

            mensagem: mensagem,

            autor: "admin",

            data: Date.now()
        });

        await db.ref(
            `chamados/${atual.id}`
        ).update({

            status: status,

            ultimaAtualizacao: Date.now()
        });

        if (atual.dados && atual.dados.email) {

            enviarEmailChamado({
                to_email: atual.dados.email,
                titulo_evento: "Atendimento respondeu seu chamado",
                protocolo: atual.dados.protocolo || "",
                cliente: atual.dados.cliente || "",
                email_cliente: atual.dados.email || "",
                telefone: atual.dados.telefone || "",
                assunto: atual.dados.assunto || "",
                status: statusLabel(status),
                mensagem: mensagem
            });
        }

        showHelpdeskToast(
            "Resposta enviada com sucesso!",
            "success"
        );

        if (campo) {
            campo.value = "";
        }

        await abrirChamadoAdmin(atual.id);

        await carregarChamadosAdmin();

        return true;

    } catch (error) {

        console.error(
            "Erro ao responder chamado:",
            error
        );

        showHelpdeskToast(
            mensagemErroFirebase(error, "Erro ao enviar resposta."),
            "error"
        );

        return false;

    } finally {

        if (botao) {

            botao.disabled = false;

            botao.innerHTML =
                '<i class="fas fa-paper-plane"></i> Enviar Resposta';
        }
    }
}


/* =========================================================
   COLAR RESPOSTA DE E-MAIL
========================================================= */

function adicionarRespostaEmailAdmin() {

    const campo =
        document.getElementById(
            "modalChamadoResposta"
        );

    if (!campo) {
        return;
    }

    campo.focus();

    if (navigator.clipboard) {

        navigator.clipboard.readText()
            .then(texto => {

                if (texto) {

                    campo.value =
                        texto;

                    showHelpdeskToast(
                        "Texto colado.",
                        "success"
                    );
                }

            })
            .catch(() => {

                showHelpdeskToast(
                    "Cole o texto manualmente com Ctrl + V.",
                    "warning"
                );
            });

    } else {

        showHelpdeskToast(
            "Cole o texto manualmente com Ctrl + V.",
            "warning"
        );
    }
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Help Desk Ky WIFI carregado."
        );

        initHelpdeskFirebase();

    }
);


/* =========================================================
   DISPONIBILIZAR FUNÇÕES PARA O HTML
========================================================= */

window.initHelpdeskFirebase =
    initHelpdeskFirebase;

window.gerarProtocoloChamado =
    gerarProtocoloChamado;

window.trocarAbaHelpdesk =
    trocarAbaHelpdesk;

window.abrirChamadoCliente =
    abrirChamadoCliente;

window.consultarChamadoCliente =
    consultarChamadoCliente;

window.copiarProtocolo =
    copiarProtocolo;

window.enviarRespostaCliente =
    enviarRespostaCliente;

window.carregarChamadosAdmin =
    carregarChamadosAdmin;

window.abrirChamadoAdmin =
    abrirChamadoAdmin;

window.enviarRespostaAdmin =
    enviarRespostaAdmin;

window.adicionarRespostaEmailAdmin =
    adicionarRespostaEmailAdmin;
    