require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// Rota de teste simples para navegador
app.get('/', (req, res) => {
    res.send('Servidor de e-mail rodando online!');
});

// Rota de disparo de e-mail
app.post('/enviar-email', async (req, res) => {
    const { para, assunto, mensagem } = req.body;

    if (!para || !assunto || !mensagem) {
        return res.status(400).json({ erro: "Preencha todos os campos." });
    }

    try {
        const info = await transporter.sendMail({
            from: `"Meu Servidor" <${process.env.GMAIL_USER}>`,
            to: para,
            subject: assunto,
            text: mensagem,
            html: `
