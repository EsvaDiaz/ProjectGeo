const mongoose = require('mongoose');

const CircuitSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    ciudad: { type: String, required: true },
    horarioInicio: { type: String, required: true },
    horarioFin: { type: String, required: true },
    poligono: { type: Array, required: true } // Array de coordenadas [lat, lng]
});

module.exports = mongoose.model('Circuit', CircuitSchema);