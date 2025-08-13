require('dotenv').config();
const express = require('express');
const app = express();
const whatsapp = require('./whatsapp');

app.use(express.json());

// Verificación webhook (GET)
app.get('/', (req, res) => {
  const verifyToken = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('[Webhook GET] mode:', mode, 'token:', token, 'verifyToken env:', verifyToken);

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Webhook GET] Verificación exitosa');
    return res.status(200).send(challenge);
  }
  console.warn('[Webhook GET] Verificación fallida');
  return res.sendStatus(403);
});

// Recepción mensajes (POST)
app.post('/', async (req, res) => {
  console.log('[Webhook POST] Payload recibido:', JSON.stringify(req.body));
  res.sendStatus(200); // siempre responder rápido

  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) {
    console.log('[Webhook POST] No se encontró mensaje en el payload');
    return;
  }

  const from = message.from; // número del usuario
  const msgBody = message.text?.body;

  console.log(`[Webhook POST] Mensaje de ${from}: ${msgBody}`);

  // Si el mensaje tiene texto
  if (msgBody) {
    try {
      await whatsapp.sendText(from, `Gracias por contactarte con nutritoche`);
      await whatsapp.enviarOpcionesIniciales(from)
      console.log('[Webhook POST] Respuesta enviada correctamente');
    } catch (error) {
      console.error('[Webhook POST] Error enviando respuesta:', error);
    }
  } else {
    console.log('[Webhook POST] Mensaje sin texto recibido');
  }
});

// app.get('/', (req, res) => {
//   console.log('[GET /] Petición recibida');
//   res.send('NutriBot activo 🚀');
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
