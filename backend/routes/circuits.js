const express = require('express');
const Circuit = require('../models/Circuit');
const router = express.Router();

// Crear un nuevo circuito
router.post('/', async (req, res) => {
    try {
        const newCircuit = new Circuit(req.body);
        await newCircuit.save();
        res.status(201).json(newCircuit);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Obtener todos los circuitos
router.get('/', async (req, res) => {
    try {
        const circuits = await Circuit.find();
        res.json(circuits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Actualizar un circuito
router.put('/:id', async (req, res) => {
    try {
        const updatedCircuit = await Circuit.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedCircuit);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Eliminar un circuito
router.delete('/:id', async (req, res) => {
    try {
        await Circuit.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;