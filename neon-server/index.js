const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors({ origin: "*" }));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

let waitingPlayer = null;

// Configuración del juego en servidor
const GRID_SIZE = 6;

io.on('connection', (socket) => {
    console.log('✅ Jugador conectado ID:', socket.id);

    socket.on('findMatch', () => {
        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            // ¡Emparejamiento encontrado!
            const room = waitingPlayer.id + '#' + socket.id;
            const p1 = waitingPlayer;
            const p2 = socket;
            
            p1.join(room);
            p2.join(room);
            
            // === GENERACIÓN DEL MAPA EN EL SERVIDOR ===
            // Generamos el mapa AQUÍ para que sea idéntico para los dos
            let serverMap = [];
            for (let r = 0; r < GRID_SIZE - 1; r++) {
                let row = [];
                for (let c = 0; c < GRID_SIZE - 1; c++) {
                    const rand = Math.random();
                    if (rand < 0.15) row.push('bonus');
                    else if (rand < 0.25) row.push('trap');
                    else row.push('normal');
                }
                serverMap.push(row);
            }
            // ==========================================

            // Enviamos el MISMO mapa a los dos jugadores
            io.to(room).emit('gameStart', { room: room, map: serverMap });
            
            p1.emit('role', 'p1');
            p2.emit('role', 'p2');
            
            waitingPlayer = null;
            console.log(`⚔️ Partida iniciada en sala ${room} con mapa sincronizado`);
        } else {
            waitingPlayer = socket;
            socket.emit('waiting', true);
            console.log(`⏳ Jugador ${socket.id} esperando rival...`);
        }
    });

    socket.on('move', (data) => {
        // Reenviar movimiento al rival
        socket.to(data.room).emit('remoteMove', data);
    });

    socket.on('disconnect', () => {
        console.log('❌ Desconectado:', socket.id);
        if (waitingPlayer === socket) waitingPlayer = null;
    });
});

server.listen(3000, () => {
    console.log('🚀 SERVIDOR NEON TACTICS V2 (CON MAPAS) LISTO EN PUERTO 3000');
});