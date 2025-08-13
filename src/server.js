require('dotenv').config();
const express = require('express');
const app = express();
const whatsapp = require('./whatsapp');

app.use(express.json());

// Verificación webhook (GET)
app.get('/webhook', (req, res) => {
  const verifyToken = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Recepción mensajes (POST)
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // siempre responder rápido

  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return;

  const from = message.from; // número del usuario
  const msgBody = message.text?.body;

  // Si el mensaje tiene texto
  if (msgBody) {
    await whatsapp.sendText(from, `Recibí tu mensaje: ${msgBody}`);
  }
});

app.get('/', (req, res) => res.send('NutriBot activo 🚀'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));