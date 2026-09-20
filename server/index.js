require('dotenv').config();
const app = require('./app');
const migrate = require('./db/migrate');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await migrate();
    app.listen(PORT, () => {
      console.log(`🚀 SamasyaSetu backend server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to initialize database and start server:', err);
    process.exit(1);
  }
}

startServer();
