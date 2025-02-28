import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import { TextField, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, Checkbox, Typography, AppBar, Toolbar, Snackbar, Alert } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker'; // Selector de hora
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'; // Adaptador de fecha
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'; // Proveedor de localización
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import Reloj from './Reloj'; // Importar el componente Reloj
import { format, parse } from 'date-fns'; // Importar format y parse de date-fns

const Mapa = () => {
    const [circuits, setCircuits] = useState([]);
    const [open, setOpen] = useState(false);
    const [currentCircuit, setCurrentCircuit] = useState({ nombre: '', ciudad: '', horarioInicio: null, horarioFin: null, poligono: [] });
    const [currentTime, setCurrentTime] = useState(new Date()); // Hora actual
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success', 'error', 'info', 'warning'
    const featureGroupRef = useRef();

    // Actualizar la hora cada segundo sin causar re-renderizados innecesarios
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval); // Limpiar el intervalo al desmontar el componente
    }, []);

    useEffect(() => {
        fetchCircuits();
    }, []);

    // Obtener los circuitos desde el backend
    const fetchCircuits = async () => {
        const response = await axios.get('http://localhost:5000/api/circuits');
        setCircuits(response.data.map(circuit => ({
            ...circuit,
            visible: true,
            horarioInicio: parse(circuit.horarioInicio, 'HH:mm:ss', new Date()), // Convertir a objeto Date
            horarioFin: parse(circuit.horarioFin, 'HH:mm:ss', new Date()), // Convertir a objeto Date
        })));
    };

    // Guardar un circuito (crear o actualizar)
    const handleSave = async () => {
        const circuitoParaGuardar = {
            ...currentCircuit,
            horarioInicio: format(currentCircuit.horarioInicio, 'HH:mm:ss'), // Guardar en formato HH:mm:ss
            horarioFin: format(currentCircuit.horarioFin, 'HH:mm:ss'), // Guardar en formato HH:mm:ss
        };

        try {
            if (currentCircuit._id) {
                await axios.put(`http://localhost:5000/api/circuits/${currentCircuit._id}`, circuitoParaGuardar);
                setSnackbarMessage('Circuito actualizado correctamente');
            } else {
                await axios.post('http://localhost:5000/api/circuits', circuitoParaGuardar);
                setSnackbarMessage('Circuito creado correctamente');
            }
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setOpen(false);
            fetchCircuits(); // Actualizar la lista de circuitos
        } catch (error) {
            setSnackbarMessage('Error al guardar el circuito');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    // Eliminar un circuito
    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/circuits/${id}`);
            setCircuits((prevCircuits) => prevCircuits.filter(circuit => circuit._id !== id)); // Actualizar el estado local
            setSnackbarMessage('Circuito eliminado correctamente');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);

            // Eliminar el polígono del mapa
            const layer = featureGroupRef.current.getLayers().find(layer => layer._leaflet_id === id);
            if (layer) {
                featureGroupRef.current.removeLayer(layer);
            }
        } catch (error) {
            setSnackbarMessage('Error al eliminar el circuito');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    // Manejar la creación de un polígono
    const handleCreate = useCallback((e) => {
        const { layerType, layer } = e;
        if (layerType === 'polygon') {
            const coordinates = layer.getLatLngs()[0].map(latLng => [latLng.lat, latLng.lng]);
            setCurrentCircuit({ ...currentCircuit, poligono: coordinates });
            setOpen(true);
        }
    }, [currentCircuit]);

    // Alternar la visibilidad de un circuito
    const toggleVisibility = useCallback((id) => {
        setCircuits((prevCircuits) =>
            prevCircuits.map(circuit =>
                circuit._id === id ? { ...circuit, visible: !circuit.visible } : circuit
            )
        );
    }, []);

    // Verificar si un circuito tiene energía en la hora actual
    const hasEnergy = useCallback((horarioInicio, horarioFin) => {
        const now = format(currentTime, 'HH:mm:ss'); // Obtener la hora actual en formato HH:mm:ss
        return now >= format(horarioInicio, 'HH:mm:ss') && now <= format(horarioFin, 'HH:mm:ss');
    }, [currentTime]);

    // Memoizar los polígonos para evitar re-renderizados innecesarios
    const visibleCircuits = useMemo(() => {
        return circuits.filter(circuit => circuit.visible).map((circuit, idx) => {
            const hasEnergyNow = hasEnergy(circuit.horarioInicio, circuit.horarioFin);
            return (
                <Polygon
                    key={circuit._id}
                    positions={circuit.poligono}
                    pathOptions={{ color: hasEnergyNow ? 'green' : 'red' }} // Colorear según el horario
                >
                    <Popup>
                        <div>
                            <h3>{circuit.nombre}</h3>
                            <p>{circuit.ciudad}</p>
                            <p>{format(circuit.horarioInicio, 'hh:mm a')} - {format(circuit.horarioFin, 'hh:mm a')}</p>
                            <Button onClick={() => { setCurrentCircuit(circuit); setOpen(true); }}>Editar</Button>
                            <Button onClick={() => handleDelete(circuit._id)}>Eliminar</Button>
                        </div>
                    </Popup>
                </Polygon>
            );
        });
    }, [circuits, hasEnergy]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div style={{ height: '100vh', width: '100%' }}>
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Sistema de Control De Energía
                        </Typography>
                        <Reloj /> {/* Usar el componente Reloj */}
                    </Toolbar>
                </AppBar>
                <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
                    <div style={{ width: '300px', padding: '16px', borderRight: '1px solid #ccc', overflowY: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
                        <Typography variant="h6" gutterBottom>
                            Lista de Circuitos
                        </Typography>
                        <List>
                            {circuits.map((circuit) => (
                                <ListItem key={circuit._id}>
                                    <Checkbox
                                        checked={circuit.visible}
                                        onChange={() => toggleVisibility(circuit._id)}
                                    />
                                    <ListItemText primary={circuit.nombre} secondary={`${circuit.ciudad} - ${format(circuit.horarioInicio, 'hh:mm a')} a ${format(circuit.horarioFin, 'hh:mm a')}`} />
                                    <Button onClick={() => { setCurrentCircuit(circuit); setOpen(true); }}>Editar</Button>
                                    <Button onClick={() => handleDelete(circuit._id)}>Eliminar</Button>
                                </ListItem>
                            ))}
                        </List>
                    </div>
                    <div style={{ flex: 1 }}>
                        <MapContainer center={[20.0217, -75.8294]} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <FeatureGroup ref={featureGroupRef}>
                                <EditControl
                                    position="topright"
                                    onCreated={handleCreate}
                                    draw={{
                                        rectangle: false,
                                        circle: false,
                                        circlemarker: false,
                                        marker: false,
                                        polyline: false,
                                        polygon: true,
                                    }}
                                />
                            </FeatureGroup>
                            {visibleCircuits}
                        </MapContainer>
                    </div>
                </div>
                <Dialog open={open} onClose={() => setOpen(false)}>
                    <DialogTitle>{currentCircuit._id ? 'Editar Circuito' : 'Nuevo Circuito'}</DialogTitle>
                    <DialogContent>
                        <TextField label="Nombre" value={currentCircuit.nombre} onChange={(e) => setCurrentCircuit({ ...currentCircuit, nombre: e.target.value })} fullWidth margin="dense" />
                        <TextField label="Ciudad" value={currentCircuit.ciudad} onChange={(e) => setCurrentCircuit({ ...currentCircuit, ciudad: e.target.value })} fullWidth margin="dense" />
                        <TimePicker
                            label="Horario Inicio"
                            value={currentCircuit.horarioInicio}
                            onChange={(newValue) => setCurrentCircuit({ ...currentCircuit, horarioInicio: newValue })}
                            inputFormat="hh:mm a" // Formato de 12 horas
                            renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
                        />
                        <TimePicker
                            label="Horario Fin"
                            value={currentCircuit.horarioFin}
                            onChange={(newValue) => setCurrentCircuit({ ...currentCircuit, horarioFin: newValue })}
                            inputFormat="hh:mm a" // Formato de 12 horas
                            renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave}>Guardar</Button>
                    </DialogActions>
                </Dialog>
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={3000}
                    onClose={() => setSnackbarOpen(false)}
                >
                    <Alert
                        onClose={() => setSnackbarOpen(false)}
                        severity={snackbarSeverity}
                        sx={{ width: '100%' }}
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </div>
        </LocalizationProvider>
    );
};

export default Mapa;