const images = {
    carinosa: "assets/imagen_2.webp",
    feliz: "assets/imagen_1.webp",
    somnolienta: "assets/imagen_3.webp",
    mimosa: "assets/imagen_12.webp",
    juguetona: "assets/imagen_4.webp",
    necesitada: "assets/imagen_6.webp",
    melancolica: "assets/imagen_7.webp",
    molesta: "assets/imagen_5.webp",
    timida: "assets/imagen_9.webp",
    concentrada: "assets/imagen_8.webp",
    motivada: "assets/imagen_11.webp",
    ocupada: "assets/imagen_10.webp"
};

// ENVIAR MENSAJE DE CHAT
async function enviarMensajeChat(event) {
    event.preventDefault();
    const input = document.getElementById('userMessageInput');
    const dialogueBox = document.getElementById('dialogueBox');
    const select = document.getElementById('stateSelect');
    
    const mensaje = input.value.trim();
    if (!mensaje) return;

    const estadoActual = select ? select.value : 'carinosa';
    
    dialogueBox.innerText = "Pensando qué responderte...";
    input.value = '';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensajeUsuario: mensaje, estadoActual: estadoActual })
        });

        const data = await response.json();
        dialogueBox.innerText = (data.respuesta || "Te escucho, Blush.").trim().replace(/^"|"$/g, '');
    } catch (error) {
        console.error("Error en chat:", error);
        dialogueBox.innerText = "Me mee un poquito la conexión, ¿me repites po?";
    }
}

// TOCAR A LA MASCOTA
async function touchMascot() {
    const dialogueBox = document.getElementById('dialogueBox');
    const select = document.getElementById('stateSelect');
    const estadoActual = select ? select.value : 'carinosa';

    const sprite = document.getElementById('mascotSprite');
    if (sprite) {
        sprite.style.transform = 'scale(1.1)';
        setTimeout(() => { sprite.style.transform = 'scale(1)'; }, 150);
    }

    dialogueBox.innerText = "¡Jeje!...";

    try {
        const response = await fetch('/api/generar-toque-mascota', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estadoActual: estadoActual })
        });

        const data = await response.json();
        dialogueBox.innerText = (data.respuesta || "¡Oye, me haces cosquillas!").trim().replace(/^"|"$/g, '');
    } catch (error) {
        dialogueBox.innerText = "¡Oye, me haces cosquillas!";
    }
}

// CAMBIAR ÁNIMO
async function changeState(state) {
    const mascotSprite = document.getElementById('mascotSprite');
    const dialogueBox = document.getElementById('dialogueBox');

    if (!images[state]) return;

    if (mascotSprite) mascotSprite.src = images[state];
    if (dialogueBox) dialogueBox.innerText = "...";

    try {
        const response = await fetch('/api/generar-frase-estado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: state })
        });

        const data = await response.json();
        if (dialogueBox) {
            dialogueBox.innerText = (data.frase || "¡Aquí estoy, Blush!").trim().replace(/^"|"$/g, '');
        }
    } catch (error) {
        if (dialogueBox) dialogueBox.innerText = "¡Hola, Blush!";
    }
}

// ACCIONES RÁPIDAS
async function speak(type) {
    const dialogue = document.getElementById('dialogueBox');
    const select = document.getElementById('stateSelect');
    const estadoActual = select ? select.value : 'carinosa';

    if (!dialogue) return;

    dialogue.innerText = "...";

    try {
        const response = await fetch('/api/generar-interaccion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipoAccion: type, estadoActual: estadoActual })
        });

        const data = await response.json();
        dialogue.innerText = (data.respuesta || "Te quiero mucho, Blush.").trim().replace(/^"|"$/g, '');
    } catch (error) {
        dialogue.innerText = "Te quiero mucho, Blush.";
    }

    if (type === 'descansar') changeState('somnolienta');
}