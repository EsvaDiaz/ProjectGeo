import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import { format } from 'date-fns'; // Importar format de date-fns

const Reloj = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval); // Limpiar el intervalo al desmontar el componente
    }, []);

    return (
        <Typography variant="h6">
            {format(currentTime, 'hh:mm:ss a')} {/* Reloj en tiempo real en formato 12 horas */}
        </Typography>
    );
};

export default Reloj;