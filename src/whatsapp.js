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

module.exports = { sendText };
