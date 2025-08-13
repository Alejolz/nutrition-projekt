const axios = require('axios');

const token = process.env.WHATSAPP_TOKEN;
const phoneId = process.env.PHONE_NUMBER_ID;

async function sendText(to, body) {
  try {
    await axios.post(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body }
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('Error enviando mensaje:', err.response?.data || err.message);
  }
}

async function enviarOpcionesIniciales(to) {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "alo 👋" },
      body: { text: "Selecciona una opción para continuar:" },
      footer: { text: "Bot" },
      action: {
        button: "Ver opciones",
        sections: [
          {
            title: "Opciones disponibles",
            rows: [
              {
                id: "analizar_imagen",
                title: "Analizar imagen",
                description: "Envía una imagen para que la analice"
              },
              {
                id: "preguntar_ia",
                title: "Hablar con la IA",
                description: "Puedes hacer preguntas"
              }
            ]
          }
        ]
      }
    }
  };

  try {
    await axios.post(`https://graph.facebook.com/v19.0/${phoneId}/messages`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Error enviando opciones:", err.response?.data || err.message);
  }
}

module.exports = { sendText, enviarOpcionesIniciales};
