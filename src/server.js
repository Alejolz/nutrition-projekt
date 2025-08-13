const express = require('express');
const app = express();

app.get('/', (req, res) => {
  console.log('[GET /] Petición recibida');
  res.send('Chatbot activo 🚀');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));