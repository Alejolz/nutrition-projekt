const axios = require('axios');
const { getMenu } = require('../database/menuService');

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
  const menu = await getMenu('user', 1);

  if (!menu) {
    return sendText(to, 'No se encontró un menú configurado.');
  }

  const rows = menu.options.map(opt => ({
    id: opt.id,
    title: opt.title,
    description: opt.description
  }));

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: menu.title },
      body: { text: menu.description || "Selecciona una opción para continuar:" },
      footer: { text: "Bot" },
      action: {
        button: "Ver opciones",
        sections: [
          {
            title: "Opciones disponibles",
            rows
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

module.exports = { sendText, enviarOpcionesIniciales };
