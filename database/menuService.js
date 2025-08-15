// database/menuService.js
const db = require('./db');

async function getMenu(type, level) {
  const query = `
    SELECT title, description, options
    FROM menus
    WHERE type = $1 AND level = $2
    LIMIT 1;
  `;
  const result = await db.query(query, [type, level]);
  return result.rows[0]; // Devuelve un solo menú
}

module.exports = { getMenu };