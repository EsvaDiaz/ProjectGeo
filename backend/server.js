const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const circuitsRouter = require('./routes/circuits');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
connectDB();

// Rutas
app.use('/api/circuits', circuitsRouter);

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});