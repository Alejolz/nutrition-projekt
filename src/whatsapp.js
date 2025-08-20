const axios = require('axios');
const { getMenu } = require('../database/menuService');
const { responderIA, analizarImagen } = require('../database/AI')
const https = require("https");
const { send } = require('process');

const token = process.env.WHATSAPP_TOKEN;
const phoneId = process.env.PHONE_NUMBER_ID;

const estadoUsuarios = new Map();

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

async function handleMessage(body) {
  const mensaje = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const sender = mensaje?.from;
  const tipo = mensaje?.type;

  if (!sender || !mensaje) return;

  let usuario = estadoUsuarios.get(sender);

  // Si no hay usuario, iniciar flujo
  if (!usuario) {
    estadoUsuarios.set(sender, { estado: "esperando_opcion", intentos: 1 });
    return enviarOpcionesIniciales(sender);
  }

  // --- ESTADO: esperando opción ---
  if (usuario.estado === "esperando_opcion") {
    if (tipo === "interactive") {
      const idOpcion = mensaje?.interactive?.list_reply?.id;

      if (idOpcion === "analizar_imagen") {
        estadoUsuarios.set(sender, { estado: "modo_imagen", intentos: 0 });
        return sendText(sender, "¡Perfecto! Envía una imagen para analizar.");
      } else if (idOpcion === "preguntar_ia") {
        estadoUsuarios.set(sender, { estado: "modo_ia", intentos: 0 });
        return sendText(sender, "Listo, puedes preguntarme lo que quieras.");
      } else {
        return sendText(sender, "Esa opción aún no está disponible.");
      }
    } else {
      usuario.intentos += 1;
      estadoUsuarios.set(sender, usuario);

      if (usuario.intentos === 2) {
        return sendText(sender, "Por favor selecciona una opción del menú.");
      } else if (usuario.intentos >= 3) {
        return sendText(sender, "Debes usar el botón 'Ver opciones'.");
      } else {
        return enviarOpcionesIniciales(sender);
      }
    }
  }

  if (usuario.estado === "modo_ia" && mensaje?.text?.body) {
    const texto = mensaje.text.body;
    const response = await responderIA(texto)
    estadoUsuarios.set(sender, { estado: "esperando_opcion", intentos: 0 });
    await sendText(sender, response);

  }

  if (usuario.estado === "modo_imagen" && tipo === "image") {
    const mediaId = mensaje.image.id;

    try {
      const urlArchivo = await obtenerUrlArchivoWhatsApp(mediaId);

      const base64Imagen = await descargarYConvertirBase64(urlArchivo);

      // const dataUri = `data:image/jpeg;base64,${base64Imagen}`;

      const response = await analizarImagen(base64Imagen)
      await sendText(sender, response)
      estadoUsuarios.set(sender, { estado: "esperando_opcion", intentos: 0 });
      return;

    } catch (error) {
      console.error("Error analizando imagen:", error.response?.data || error.message);
      return sendText(sender, "No pude analizar la imagen, intenta de nuevo.");
    }
  }


  if (usuario.estado === "modo_imagen" && tipo !== "image") {
    return sendText(sender, "Por favor, envíame una imagen para analizar.");
  }
}

async function obtenerUrlArchivoWhatsApp(mediaId) {
  try {
    const res = await axios.get(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data.url;
  } catch (error) {
    console.error("Error obteniendo URL de archivo WhatsApp:", error.response?.data || error.message);
    throw new Error("No se pudo obtener la URL del archivo");
  }
}

async function descargarYConvertirBase64(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Authorization: `Bearer ${token}` } }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString("base64");
        resolve(base64);
      });
    }).on("error", (err) => reject(err));
  });
}


module.exports = { sendText, enviarOpcionesIniciales, handleMessage };
