// ==========================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 6;
const DOT_RADIUS = 4;
const LINE_WIDTH = 6;
let CELL_SIZE, OFFSET;

// Estado del Juego
let linesH = [], linesV = [], boxes = [], boxTypes = [];
let scores = { 1: 0, 2: 0 };
let turn = 1;
let gameActive = false;
let gameMode = 'pve';
let difficulty = 'medium';
let isProcessingAI = false;
let matchScore = { p1: 0, p2: 0 };

// Variables Online
let socket = null;
let onlineRoom = null;
let myOnlineRole = null;
let isRemoteMove = false;

// Colores para lógica visual (se sincronizan con la tienda)
const shopItems = [
    { id: 'default', val: '#0ff' },
    { id: 'neon_red', val: '#ff0033' },
    { id: 'neon_green', val: '#39ff14' },
    { id: 'neon_purple', val: '#b026ff' },
    { id: 'neon_gold', val: '#ffd700' }
];

// ==========================================
// MÓDULO 1: UI Y CONTROL DE PANTALLAS
// ==========================================
const ui = {
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        // Exponer ui globalmente
        window.ui = this;
    },

    // Conexiones con la Tienda y el Menú
    openShop() { if (typeof shop !== 'undefined') shop.open(); },

    // Función crítica: Ajustar el canvas al tamaño del móvil
    resize() {
        const container = document.getElementById('canvas-container');
        if (container && !container.classList.contains('hidden')) {
            const size = Math.min(container.clientWidth, container.clientHeight * 0.95);
            // Resolución interna alta para nitidez
            canvas.width = 500;
            canvas.height = 500;
            // Tamaño visual CSS
            canvas.style.width = `${size}px`;
            canvas.style.height = `${size}px`;

            CELL_SIZE = canvas.width / (GRID_SIZE + 1);
            OFFSET = CELL_SIZE;

            if (typeof game !== 'undefined') game.draw();
        }
    },

    updateGameUI() {
        document.getElementById('score1').innerText = scores[1];
        document.getElementById('score2').innerText = scores[2];

        // Efecto visual de turno activo
        const p1El = document.querySelector('.p1-score');
        const p2El = document.querySelector('.p2-score');

        if (turn === 1) {
            p1El.style.opacity = 1; p1El.style.textShadow = "0 0 10px var(--p1-color)";
            p2El.style.opacity = 0.5; p2El.style.textShadow = "none";
        } else {
            p2El.style.opacity = 1; p2El.style.textShadow = "0 0 10px var(--p2-color)";
            p1El.style.opacity = 0.5; p1El.style.textShadow = "none";
        }
    },

    showEndScreen(winner, endMatch) {
        let msg = (winner === 1) ? "¡VICTORIA!" : "DERROTA";
        if (winner === 0) msg = "EMPATE";

        setTimeout(() => {
            // Aquí puedes personalizar un modal bonito en el futuro
            // Por ahora usamos alert y recarga para limpiar memoria
            alert(`${msg}\n\nVolviendo al menú...`);

            // Recompensa simple
            if (winner === 1 && typeof menu !== 'undefined') {
                menu.user.gold += (gameMode === 'online' ? 30 : 10);
                localStorage.setItem('neonUser', JSON.stringify(menu.user));
            }

            location.reload(); // Reset total
        }, 500);
    }
};

// ==========================================
// MÓDULO 2: MOTOR DE JUEGO (GAME)
// ==========================================
const game = {
    init() {
        // Inicializar Sockets si existen
        if (typeof io !== 'undefined') {
            socket = io('http://localhost:3000');

            socket.on('gameStart', (data) => {
                onlineRoom = data.room;
                gameMode = 'online';
                window.serverMapData = data.map;
                // Iniciamos la partida quitando el menú
                this.startCommon();
            });

            socket.on('role', (role) => {
                myOnlineRole = role;
                alert(role === 'p1' ? "ERES AZUL (Tu turno)" : "ERES ROJO (Espera)");
                if (turn === 1 && role === 'p1') isProcessingAI = false;
                else if (turn === 1 && role !== 'p1') isProcessingAI = true;
            });

            socket.on('remoteMove', (data) => {
                isRemoteMove = true; isProcessingAI = false;
                this.applyMove(data.type, data.r, data.c);
            });
        }

        // Listener de Clics en el Canvas
        canvas.addEventListener('mousedown', (e) => {
            if (!gameActive || isProcessingAI) return;
            // Bloqueo turno IA
            if (gameMode === 'pve' && turn === 2) return;
            // Bloqueo turno Online
            if (gameMode === 'online') {
                if (!myOnlineRole) return;
                if ((turn === 1 && myOnlineRole === 'p2') || (turn === 2 && myOnlineRole === 'p1')) return;
            }

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            const move = this.getClosestLine((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);

            if (move) {
                // Verificar si la línea ya está cogida
                let free = (move.type === 'h' && linesH[move.r][move.c] === 0) || (move.type === 'v' && linesV[move.r][move.c] === 0);

                if (free) {
                    if (gameMode === 'online' && onlineRoom) {
                        socket.emit('move', { room: onlineRoom, type: move.type, r: move.r, c: move.c });
                    }
                    this.applyMove(move.type, move.r, move.c);
                }
            }
        });
    },

    // Funciones de entrada desde menu.js
    startGame(diff) {
        gameMode = 'pve';
        difficulty = diff;
        this.startCommon();
    },

    startPvP() {
        gameMode = 'pvp';
        this.startCommon();
    },

    startOnline() {
        if (!socket || !socket.connected) socket = io('http://localhost:3000');
        setTimeout(() => {
            if (!socket.connected) {
                alert("Error de conexión con el servidor.");
                return;
            }
            gameMode = 'online';
            socket.emit('findMatch');
            alert("Buscando rival...");
        }, 300);
    },

    // --- TRANSICIÓN DE PANTALLAS (CLAVE) ---
    startCommon() {
        // 1. Ocultar Menú Principal
        document.getElementById('main-menu').classList.add('hidden');

        // 2. Mostrar Pantalla de Juego
        const gameUI = document.getElementById('game-interface');
        gameUI.classList.remove('hidden');

        // 3. Forzar redibujado del canvas (Crucial en móviles)
        setTimeout(() => {
            ui.resize();
            this.startRound();
        }, 100);
    },

    startRound() {
        this.resetBoard();
        gameActive = true;

        // Configurar quién empieza (Bloqueos)
        if (gameMode === 'online') {
            if (!myOnlineRole) isProcessingAI = true;
            else {
                const soyP1 = (myOnlineRole === 'p1');
                isProcessingAI = !(turn === 1 && soyP1);
            }
        } else {
            isProcessingAI = false;
        }

        // Generar Mapa (Trampas/Bonus)
        if (gameMode === 'online' && window.serverMapData) {
            boxTypes = window.serverMapData;
            window.serverMapData = null;
        } else {
            // Generación local para PvE/PvP
            for (let r = 0; r < GRID_SIZE - 1; r++) for (let c = 0; c < GRID_SIZE - 1; c++) {
                const n = Math.random();
                if (n < .15) boxTypes[r][c] = 'bonus';
                else if (n < .25) boxTypes[r][c] = 'trap';
            }
        }

        ui.updateGameUI();
        this.draw();
    },

    resetBoard() {
        linesH = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE - 1).fill(0));
        linesV = Array(GRID_SIZE - 1).fill().map(() => Array(GRID_SIZE).fill(0));
        boxes = Array(GRID_SIZE - 1).fill().map(() => Array(GRID_SIZE - 1).fill(0));
        boxTypes = Array(GRID_SIZE - 1).fill().map(() => Array(GRID_SIZE - 1).fill('normal'));
        scores = { 1: 0, 2: 0 };
        turn = 1;
    },

    getClosestLine(x, y) {
        const cRaw = (x - OFFSET) / CELL_SIZE, rRaw = (y - OFFSET) / CELL_SIZE;
        const rInt = Math.floor(rRaw), cInt = Math.floor(cRaw);
        const rRem = rRaw - rInt, cRem = cRaw - cInt;

        if (rRem < .25 && cInt >= 0 && cInt < GRID_SIZE - 1 && rInt >= 0 && rInt < GRID_SIZE) return { type: 'h', r: rInt, c: cInt };
        if (rRem > .75 && cInt >= 0 && cInt < GRID_SIZE - 1 && rInt + 1 >= 0 && rInt + 1 < GRID_SIZE) return { type: 'h', r: rInt + 1, c: cInt };
        if (cRem < .25 && rInt >= 0 && rInt < GRID_SIZE - 1 && cInt >= 0 && cInt < GRID_SIZE) return { type: 'v', r: rInt, c: cInt };
        if (cRem > .75 && rInt >= 0 && rInt < GRID_SIZE - 1 && cInt + 1 >= 0 && cInt + 1 < GRID_SIZE) return { type: 'v', r: rInt, c: cInt + 1 };
        return null;
    },

    applyMove(type, r, c) {
        if (type === 'h') linesH[r][c] = turn; else linesV[r][c] = turn;
        const closed = this.checkBoxes();

        if (isRemoteMove) isRemoteMove = false;

        if (closed > 0) {
            // Repite turno
            this.checkWinRound();
            // Si es turno de la IA y cerró caja, le damos otro turno
            if (gameMode === 'pve' && turn === 2 && gameActive) ai.trigger();
        } else {
            // Cambio de turno
            turn = (turn === 1) ? 2 : 1;
            ui.updateGameUI();

            // Turno IA
            if (gameMode === 'pve' && turn === 2) ai.trigger();

            // Turno Online
            if (gameMode === 'online') {
                const myTurnNum = (myOnlineRole === 'p1' ? 1 : 2);
                isProcessingAI = (turn !== myTurnNum);
            }
        }
        this.draw();
    },

    checkBoxes() {
        let closed = 0;
        for (let r = 0; r < GRID_SIZE - 1; r++) for (let c = 0; c < GRID_SIZE - 1; c++) {
            if (boxes[r][c] !== 0) continue;
            if (linesH[r][c] && linesH[r + 1][c] && linesV[r][c] && linesV[r][c + 1]) {
                boxes[r][c] = turn; closed++;
                let p = 1;
                if (boxTypes[r][c] === 'bonus') p = 3;
                else if (boxTypes[r][c] === 'trap') p = -2;
                scores[turn] += p;
            }
        }
        return closed;
    },

    checkWinRound() {
        let all = true; for (let r = 0; r < GRID_SIZE - 1; r++) for (let c = 0; c < GRID_SIZE - 1; c++) if (boxes[r][c] === 0) all = false;
        if (all) {
            gameActive = false;
            let w = 0;
            if (scores[1] > scores[2]) w = 1;
            else if (scores[2] > scores[1]) w = 2;
            ui.showEndScreen(w, true);
        }
    },

    // --- RENDERIZADO VISUAL ---
    draw() {
        // Fondo
        ctx.fillStyle = '#111'; ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Efecto Matrix (Si equipado)
        if (gameMode === 'pve' && typeof menu !== 'undefined' && menu.user && menu.user.equippedFX === 'matrix') {
            ctx.fillStyle = 'rgba(0,255,0,0.05)'; ctx.font = '10px monospace';
            for (let i = 0; i < 15; i++) ctx.fillText(Math.random() > .5 ? '0' : '1', Math.random() * canvas.width, Math.random() * canvas.height);
        }

        // Cajas
        for (let r = 0; r < GRID_SIZE - 1; r++) for (let c = 0; c < GRID_SIZE - 1; c++) boxes[r][c] !== 0 ? this.drawBoxBg(r, c) : this.drawBoxIcon(r, c);

        // Líneas
        linesH.forEach((row, r) => row.forEach((v, c) => { if (v) this.drawLineH(r, c, v) }));
        linesV.forEach((row, r) => row.forEach((v, c) => { if (v) this.drawLineV(r, c, v) }));

        // Puntos
        ctx.fillStyle = '#555';
        for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
            ctx.beginPath(); ctx.arc(OFFSET + c * CELL_SIZE, OFFSET + r * CELL_SIZE, DOT_RADIUS, 0, 2 * Math.PI); ctx.fill();
        }
    },

    getP1Color() {
        // Leer color equipado del usuario
        if (typeof menu !== 'undefined' && menu.user && menu.user.equippedColor) {
            const item = shopItems.find(i => i.id === menu.user.equippedColor);
            return item ? item.val : '#0ff';
        }
        return '#0ff';
    },
    getP2Color() { return (gameMode === 'pvp' || gameMode === 'online') ? '#f00' : '#f0f'; },

    drawBoxBg(r, c) {
        const o = boxes[r][c], x = OFFSET + c * CELL_SIZE, y = OFFSET + r * CELL_SIZE;
        ctx.save(); ctx.globalAlpha = 0.3;
        ctx.fillStyle = (o === 1) ? this.getP1Color() : this.getP2Color();
        ctx.fillRect(x + LINE_WIDTH / 2, y + LINE_WIDTH / 2, CELL_SIZE - LINE_WIDTH, CELL_SIZE - LINE_WIDTH);
        ctx.restore();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let t = boxTypes[r][c] === 'bonus' ? '+3' : (boxTypes[r][c] === 'trap' ? '-2' : '+1');
        ctx.fillText(t, x + CELL_SIZE / 2, y + CELL_SIZE / 2);
    },
    drawBoxIcon(r, c) {
        const x = OFFSET + c * CELL_SIZE + CELL_SIZE / 2, y = OFFSET + r * CELL_SIZE + CELL_SIZE / 2;
        if (boxTypes[r][c] === 'bonus') { ctx.fillStyle = 'rgba(255,215,0,0.2)'; ctx.beginPath(); ctx.arc(x, y, 10, 0, 2 * Math.PI); ctx.fill(); ctx.strokeStyle = 'gold'; ctx.lineWidth = 1; ctx.stroke(); }
        else if (boxTypes[r][c] === 'trap') { ctx.fillStyle = 'rgba(255,0,0,0.2)'; ctx.beginPath(); ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 8, y + 8); ctx.moveTo(x + 8, y - 8); ctx.lineTo(x - 8, y + 8); ctx.stroke(); }
    },
    drawLineH(r, c, p) { ctx.strokeStyle = (p === 1) ? this.getP1Color() : this.getP2Color(); ctx.shadowBlur = 10; ctx.shadowColor = ctx.strokeStyle; ctx.lineWidth = LINE_WIDTH; ctx.beginPath(); ctx.moveTo(OFFSET + c * CELL_SIZE, OFFSET + r * CELL_SIZE); ctx.lineTo(OFFSET + (c + 1) * CELL_SIZE, OFFSET + r * CELL_SIZE); ctx.stroke(); ctx.shadowBlur = 0; },
    drawLineV(r, c, p) { ctx.strokeStyle = (p === 1) ? this.getP1Color() : this.getP2Color(); ctx.shadowBlur = 10; ctx.shadowColor = ctx.strokeStyle; ctx.lineWidth = LINE_WIDTH; ctx.beginPath(); ctx.moveTo(OFFSET + c * CELL_SIZE, OFFSET + r * CELL_SIZE); ctx.lineTo(OFFSET + c * CELL_SIZE, OFFSET + (r + 1) * CELL_SIZE); ctx.stroke(); ctx.shadowBlur = 0; }
};

// ==========================================
// MÓDULO 3: IA BÁSICA (Para que funcione el modo Campaña)
// ==========================================
const ai = {
    trigger() {
        // Retardo para que parezca que piensa
        setTimeout(() => {
            let available = [];
            // Buscar todos los movimientos posibles
            for (let r = 0; r < GRID_SIZE; r++)for (let c = 0; c < GRID_SIZE - 1; c++) if (!linesH[r][c]) available.push({ type: 'h', r, c });
            for (let r = 0; r < GRID_SIZE - 1; r++)for (let c = 0; c < GRID_SIZE; c++) if (!linesV[r][c]) available.push({ type: 'v', r, c });

            // Inteligencia aleatoria básica (Por ahora)
            if (available.length > 0) {
                const m = available[Math.floor(Math.random() * available.length)];
                game.applyMove(m.type, m.r, m.c);
            }
        }, 500);
    }
};

// INICIAR
game.resetBoard();
ui.init();
game.init();