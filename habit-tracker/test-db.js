const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '10356055', // Posa la contrasenya del teu MySQL
      database: 'HabitAPP'
    });

    console.log('✅ Connexió establerta correctament amb MySQL!');

    // Fem una consulta senzilla per comprovar les taules
    const [rows] = await connection.query('SHOW TABLES;');
    console.log('Taules trobades:', rows);

    await connection.end();
  } catch (error) {
    console.error('❌ Error de connexió:', error.message);
  }
}

testConnection();