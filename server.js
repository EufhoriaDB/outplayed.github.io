const express = require('express');
const cors = require('cors');
const db = require('./database');
const MEMORIA_BASE = require('./memoria_prehecha');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const GEMINI_API_KEY = "AQ.Ab8RN6LLA6FG-YIC8z_EIY0J884SiKr7kJts11eqpRsD5mZ_KQ";

function obtenerMemoriaChat() {
    return new Promise((resolve) => {
        const query = `SELECT prompt, respuesta FROM interacciones ORDER BY id DESC LIMIT 6`;
        db.all(query, [], (err, rows) => {
            if (err || !rows || rows.length === 0) {
                resolve("");
                return;
            }
            const historial = rows.reverse()
                .map(r => `Blush: "${r.prompt}"\nIllyana: "${r.respuesta}"`)
                .join("\n");
            resolve(historial);
        });
    });
}

function guardarEnBaseDeDatos(tipoAccion, estadoAnimo, prompt, respuesta) {
    const query = `INSERT INTO interacciones (tipo_accion, estado_animo, prompt, respuesta) VALUES (?, ?, ?, ?)`;
    db.run(query, [tipoAccion, estadoAnimo, prompt, respuesta], (err) => {
        if (err) console.error("Error al guardar en la BD:", err.message);
    });
}

async function llamarGemini(prompt, fallbackTexto) {
    if (!GEMINI_API_KEY) return fallbackTexto;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0] && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            console.error("Respuesta inesperada de Gemini:", data);
            return fallbackTexto;
        }
    } catch (error) {
        console.error("Error en Gemini:", error);
        return fallbackTexto;
    }
}

app.post('/api/chat', async (req, res) => {
    const { mensajeUsuario, estadoActual } = req.body;
    const historialPrevio = await obtenerMemoriaChat();

    const prompt = `
${MEMORIA_BASE}

ESTADO DE ÁNIMO ACTUAL: "${estadoActual}"

${historialPrevio ? `HISTORIAL DE LA CONVERSACIÓN RECIENTE (para no repetir las mismas palabras):\n${historialPrevio}\n` : ''}

Blush te acaba de decir: "${mensajeUsuario}"

REGLAS DE RESPUESTA:
1. Responde de forma natural, dulce y variada. NO repitas las mismas frases que ya dijiste en el historial reciente.
2. Habla SIEMPRE en primera persona y EN FEMENINO.
3. Mantén un tono neutro-cariñoso con modismos chilenos MÍNIMOS y muy suaves. No exageres las expresiones.
4. Responde en máximo 2 a 3 oraciones.
    `;

    const respuestaTexto = await llamarGemini(prompt, "Te escucho, amor. Dime más.");
    guardarEnBaseDeDatos('chat', estadoActual, mensajeUsuario, respuestaTexto);

    res.json({ respuesta: respuestaTexto });
});

app.post('/api/generar-interaccion', async (req, res) => {
    const { tipoAccion, estadoActual } = req.body;

    const promptsPorAccion = {
        carino: "Blush acaba de darte un mimo o abrazo. Reacciona súper tierna.",
        que_hace: "Blush te pregunta qué haces. Cuéntale algo breve y cariñoso.",
        descansar: "Blush te sugiere descansar. Acurrúcate y dile algo dulce."
    };

    const reglaAccion = promptsPorAccion[tipoAccion] || "Dile algo lindo a Blush.";
    const historialPrevio = await obtenerMemoriaChat();

    const prompt = `
${MEMORIA_BASE}

Estado actual: "${estadoActual}".
Acción: ${reglaAccion}

${historialPrevio ? `Contexto reciente:\n${historialPrevio}\n` : ''}

Responde en 1 o 2 oraciones, en femenino, dulce y con un español neutro y cariñoso.
    `;

    const texto = await llamarGemini(prompt, "Te quiero mucho, Blush.");
    guardarEnBaseDeDatos(tipoAccion, estadoActual, tipoAccion, texto);

    res.json({ respuesta: texto });
});

app.post('/api/generar-toque-mascota', async (req, res) => {
    const { estadoActual } = req.body;

    const prompt = `
Eres "Illyana" hablándole a "Blush". Te acaban de tocar la pantalla (cosquillas/mimo).
Estado de ánimo: "${estadoActual}".

Reacciona juguetona o tierna en menos de 10 palabras y en femenino.
    `;

    const texto = await llamarGemini(prompt, "¡Oye, me haces cosquillas!");
    res.json({ respuesta: texto });
});

app.post('/api/generar-frase-estado', async (req, res) => {
    const { estado } = req.body;

    const prompt = `
Eres "Illyana" hablándole a "Blush". Acabas de cambiar al estado: "${estado}".
Expresa cómo te sientes en menos de 12 palabras, en femenino y en primera persona.
    `;

    const texto = await llamarGemini(prompt, "¡Aquí estoy para ti!");
    res.json({ frase: texto });
});

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});