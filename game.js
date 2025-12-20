// ==========================================
// NEON TACTICS - GAME ENGINE REBOOT
// V2.0 - Robust, Scalable, AI-Powered
// ==========================================

const game = {
    // --- CONFIGURACIÓN ---
    config: {
        gridSize: 6,      // 6x6 Puntos -> 5x5 Cajas
        dotRadius: 4,
        lineWidth: 6,
        logicalSize: 500, // Tamaño interno lógico
        colors: {
            bg: '#050505',
            lineInactive: '#222',
            lineDraft: 'rgba(255, 255, 255, 0.2)', // Guía visual
            p1: '#0ff',
            p2: '#f0f',
            boardBg: '#151515'
        }
    },

    // --- ESTADO DEL JUEGO ---
    state: {
        lines: new Map(),       // Map<string, int> key="r,c,type" -> value=playerID
        boxes: [],              // Matriz [rows][cols] (0=Nadie, 1=P1, 2=P2)
        boxTypes: [],           // Matriz [rows][cols] ('normal', 'bonus', 'trap')
        scores: { 1: 0, 2: 0 },
        turn: 1,                // 1 o 2
        active: false,
        mode: 'pve',            // 'pve', 'pvp', 'online'
        difficulty: 'medium',
        isAiThinking: false,
        isAiThinking: false,
        over: false,
        playerNames: { 1: "P1", 2: "P2" }
    },

    // --- REFERENCIAS DOM ---
    dom: {
        canvas: null,
        ctx: null,
        ui: null
    },

    // --- INICIALIZACIÓN ---
    init() {
        console.log("Game Engine Init...");
        this.dom.canvas = document.getElementById('gameCanvas');
        this.dom.ctx = this.dom.canvas.getContext('2d');

        // Exponer globalmente para HTML
        window.game = this;

        // Restore UI Global Object for backward compatibility
        window.ui = {
            exitGame: () => this.exitGame(),
            resize: () => this.resize(),
            updateGameUI: () => this.updateUI(),
            // Shop & Inventory Bridges
            openShop: () => typeof shop !== 'undefined' && shop.open(),
            closeShop: () => typeof shop !== 'undefined' && shop.close(),
        };

        // Listener de Resize
        window.addEventListener('resize', () => this.resize());

        // Input Listeners
        this.setupInputs();

        // Inicializar tamaño
        this.resize();
    },

    // --- GESTIÓN DE PANTALLA ---
    resize() {
        const container = document.getElementById('canvas-container');
        if (!container || container.classList.contains('hidden')) return;

        // Calcular espacio disponible basado en VENTANA
        const totalW = window.innerWidth;
        const totalH = window.innerHeight;

        // Reservar espacio para Header (~100px), Footer/Márgenes (~100px)
        const uiVerticalSpace = 200;
        const uiHorizontalSpace = 40; // Padding lateral

        const availableW = totalW - uiHorizontalSpace;
        const availableH = totalH - uiVerticalSpace;

        // El tamaño es el menor de los dos, topeado a 500px (tamaño lógico)
        let size = Math.min(availableW, availableH, 500);
        size = Math.max(size, 280); // Mínimo absoluto

        const dpr = window.devicePixelRatio || 1;

        // Configuración Física (High DPI)
        this.dom.canvas.width = this.config.logicalSize * dpr;
        this.dom.canvas.height = this.config.logicalSize * dpr;
        this.dom.ctx.scale(dpr, dpr);

        // Configuración Visual (CSS)
        this.dom.canvas.style.width = `${size}px`;
        this.dom.canvas.style.height = `${size}px`;

        // SYNC HEADER WIDTH
        const header = document.getElementById('match-header');
        if (header) {
            header.style.width = `${size}px`;
            header.style.maxWidth = 'none';
        }

        // Recalcular métricas
        this.config.cellSize = this.config.logicalSize / (this.config.gridSize + 1);
        this.config.offset = this.config.cellSize;

        // Recalcular truncado de nombres
        this.adjustHeaderNames();

        // Redibujar si hay partida
        if (this.state.active) this.render();
    },

    adjustHeaderNames() {
        // Obtener ancho real del tablero (Seteado en resize)
        let boardWidth = 0;
        if (this.dom.canvas && this.dom.canvas.style.width) {
            boardWidth = parseInt(this.dom.canvas.style.width);
        }
        if (!boardWidth) boardWidth = window.innerWidth; // Fallback

        // Espacio ocupado por elementos estáticos (Avatares, VS badge, padding)
        // Aprox: 50px (Avatar) * 2 + 40px (VS) + 20px (Padding) = ~160px
        const staticWidth = 160;

        // Espacio disponible para texto (total)
        const availableTextSpace = Math.max(0, boardWidth - staticWidth);

        // Espacio por jugador
        const perPlayerPx = availableTextSpace / 2;

        // Estimación caracteres (Orbitron es ancha, ~11px por char promedio)
        const max = Math.floor(perPlayerPx / 11);

        const truncate = (name) => {
            if (!name) return "";
            if (name.length <= max) return name;
            // Reservar 3 para "..."
            const chars = Math.max(1, max - 3);
            return name.substring(0, chars) + "...";
        };

        const p1n = document.getElementById('p1-name');
        const p2n = document.getElementById('p2-name');

        if (p1n && this.state.playerNames[1]) p1n.innerText = truncate(this.state.playerNames[1]);
        if (p2n && this.state.playerNames[2]) p2n.innerText = truncate(this.state.playerNames[2]);
    },

    // --- UI HELPERS ---
    updateUI() {
        if (!typeof ui !== 'undefined' && ui.updateGameUI) {
            // Sincronizar UI heredada si existe
            // Pero idealmente gestionamos la UI desde aquí o game llamando a ui helper
            // Update scores
            document.getElementById('score1').innerText = this.state.scores[1];
            document.getElementById('score2').innerText = this.state.scores[2];

            // Update Turn Visuals
            const p1c = document.getElementById('p1-card');
            const p2c = document.getElementById('p2-card');
            const p1a = document.getElementById('p1-avatar');
            const p2a = document.getElementById('p2-avatar');

            // Colores dinámicos
            const c1 = this.getPlayerColor(1);
            const c2 = this.getPlayerColor(2);

            if (this.state.turn === 1) {
                p1c.classList.add('active-turn'); p2c.classList.remove('active-turn');
                p1a.style.borderColor = c1; p1a.style.boxShadow = `0 0 15px ${c1}`;
                p2a.style.borderColor = '#333'; p2a.style.boxShadow = 'none';
            } else {
                p2c.classList.add('active-turn'); p1c.classList.remove('active-turn');
                p2a.style.borderColor = c2; p2a.style.boxShadow = `0 0 15px ${c2}`;
                p1a.style.borderColor = '#333'; p1a.style.boxShadow = 'none';
            }
        }
    },

    getPlayerColor(p) {
        // Override for PvP Mode
        if (this.state.mode === 'pvp') {
            return p === 1 ? '#0ff' : '#ff0033';
        }

        // Integración con Tienda
        if (p === 1 && typeof menu !== 'undefined' && menu.user && menu.user.equippedColor) {
            // Mapping directo por si shop no carga a tiempo
            const colorMap = {
                'default': '#0ff', // Cian
                'neon_red': '#ff0033',
                'neon_green': '#39ff14',
                'neon_gold': '#ffd700',
                'neon_purple': '#bf00ff'
            };

            // Intentar buscar en catalogo dinámico
            if (typeof shop !== 'undefined' && shop.catalog) {
                const item = shop.catalog.find(i => i.id === menu.user.equippedColor);
                if (item) return item.val;
            }
            // Fallback a mapa estático
            if (colorMap[menu.user.equippedColor]) return colorMap[menu.user.equippedColor];
        }
        return p === 1 ? this.config.colors.p1 : this.config.colors.p2;
    },

    // --- FINALIZAR / SALIR ---
    exitGame() {
        this.state.active = false;
        this.state.over = true;

        // UI Switching
        document.getElementById('game-interface').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');

        // Refresh Menu
        if (typeof menu !== 'undefined') {
            menu.updateModeDisplay();
        }
    },

    // --- COMIENZO DE PARTIDA ---
    start(mode = 'pve', diff = 'medium') {
        this.state.active = true;
        this.state.over = false;
        this.state.mode = mode;
        this.state.difficulty = diff;
        this.state.turn = 1; // P1 siempre empieza
        this.state.scores = { 1: 0, 2: 0 };
        this.state.lines.clear();
        this.state.isAiThinking = false;

        // Inicializar UI
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-interface').classList.remove('hidden');

        // SETUP HEADER INFO
        const p1a = document.getElementById('p1-avatar');
        const p2a = document.getElementById('p2-avatar');

        let n1 = "Guest";
        let n2 = "CPU";

        if (this.state.mode === 'pvp') {
            n1 = "JUGADOR 1";
            n2 = "JUGADOR 2";
            if (p1a) p1a.innerHTML = '<i class="fa-solid fa-user"></i>';
            if (p2a) p2a.innerHTML = '<i class="fa-solid fa-user"></i>';
        } else {
            // PvE
            if (typeof menu !== 'undefined' && menu.user) {
                n1 = menu.user.name;
            }
            n2 = "CPU";
            if (p2a) p2a.innerHTML = '<i class="fa-solid fa-robot"></i>';
        }

        // Store full names in state
        this.state.playerNames[1] = n1;
        this.state.playerNames[2] = n2;

        // Apply truncation
        this.adjustHeaderNames();

        // Forzar resize tras un frame para asegurar layout
        setTimeout(() => this.resize(), 50);
        setTimeout(() => this.resize(), 100);

        // Generar Tablero (Boxes y Types)
        this.state.boxes = [];
        this.state.boxTypes = [];
        const rows = this.config.gridSize - 1;

        for (let r = 0; r < rows; r++) {
            const rowArr = [];
            const typeArr = [];
            for (let c = 0; c < rows; c++) {
                rowArr.push(0); // 0 = Nadie

                // Generar Tipo (Bonus/Trampas)
                let type = 'normal';
                const rand = Math.random();
                if (rand < 0.15) type = 'bonus';
                else if (rand < 0.40) type = 'trap'; // 25% (0.40 - 0.15)
                typeArr.push(type);
            }
            this.state.boxes.push(rowArr);
            this.state.boxTypes.push(typeArr);
        }

        this.updateUI();
        this.render();
    },

    // --- INPUT SYSTEM ---
    setupInputs() {
        // MOUSE
        this.dom.canvas.addEventListener('mousemove', e => this.handleInput(e, 'move'));
        this.dom.canvas.addEventListener('mousedown', e => this.handleInput(e, 'click'));

        // TOUCH
        this.dom.canvas.addEventListener('touchstart', e => { e.preventDefault(); this.handleInput(e, 'click'); }, { passive: false });
        this.dom.canvas.addEventListener('touchmove', e => { e.preventDefault(); this.handleInput(e, 'move'); }, { passive: false });
    },

    getTouchPos(originalEvent) {
        const rect = this.dom.canvas.getBoundingClientRect();
        const clientX = originalEvent.touches ? originalEvent.touches[0].clientX : originalEvent.clientX;
        const clientY = originalEvent.touches ? originalEvent.touches[0].clientY : originalEvent.clientY;

        // Escalar de vuelta a coordenadas lógicas (500x500)
        const x = (clientX - rect.left) * (this.config.logicalSize / rect.width);
        const y = (clientY - rect.top) * (this.config.logicalSize / rect.height);
        return { x, y };
    },

    handleInput(e, type) {
        if (!this.state.active || this.state.isAiThinking) return;
        if (this.state.turn === 2 && (this.state.mode === 'pve' || this.state.mode === 'online')) return;

        const { x, y } = this.getTouchPos(e);
        const snapped = this.snapToLine(x, y);

        if (type === 'move') {
            // Mostrar Highlight visual (pendiente de implementar renderizado de 'hover')
            this.state.hoverLine = snapped;
            this.render();
        } else if (type === 'click') {
            if (snapped) {
                this.tryMove(snapped);
            }
        }
    },

    snapToLine(x, y) {
        const { cellSize, offset, dotRadius } = this.config;
        const limit = cellSize * 0.35; // Sensibilidad del imán

        // Identificar fila/columna bruta
        let c = Math.round((x - offset) / cellSize);
        let r = Math.round((y - offset) / cellSize);

        // Ajustar a coordenadas de punto exacto
        let dotX = offset + c * cellSize;
        let dotY = offset + r * cellSize;

        let dx = x - dotX;
        let dy = y - dotY;

        // Determinar si es horizontal (h) o vertical (v)
        // Horizontal: Cerca de Y=0, X varía
        // Vertical: Cerca de X=0, Y varía

        // Estamos buscando el CENTRO de la línea, no los puntos.
        // Mejor enfoque: Buscar el "midpoint" de la linea candidata

        // Algoritmo simplificado:
        // Convertir coord a grid index flotante
        let gx = (x - offset) / cellSize;
        let gy = (y - offset) / cellSize;

        let col = Math.floor(gx);
        let row = Math.floor(gy);

        // Residuo dentro de la celda
        let rx = gx - col;
        let ry = gy - row;

        // Línea Horizontal Superior: ry cercano a 0
        // Línea Horizontal Inferior: ry cercano a 1
        // Línea Vertical Izquierda: rx cercano a 0
        // Línea Vertical Derecha: rx cercano a 1

        let candidates = [];

        // H-Top
        if (Math.abs(ry) < 0.3 && col >= 0 && col < this.config.gridSize - 1)
            candidates.push({ r: row, c: col, type: 'h', dist: Math.abs(ry) });

        // H-Bot
        if (Math.abs(ry - 1) < 0.3 && col >= 0 && col < this.config.gridSize - 1)
            candidates.push({ r: row + 1, c: col, type: 'h', dist: Math.abs(ry - 1) });

        // V-Left
        if (Math.abs(rx) < 0.3 && row >= 0 && row < this.config.gridSize - 1)
            candidates.push({ r: row, c: col, type: 'v', dist: Math.abs(rx) });

        // V-Right
        if (Math.abs(rx - 1) < 0.3 && row >= 0 && row < this.config.gridSize - 1)
            candidates.push({ r: row, c: col + 1, type: 'v', dist: Math.abs(rx - 1) });

        // Ordenar por distancia
        candidates.sort((a, b) => a.dist - b.dist);

        if (candidates.length > 0) {
            const best = candidates[0];
            // Validar límites arrays
            if (best.type === 'h' && (best.r < 0 || best.r >= this.config.gridSize || best.c < 0 || best.c >= this.config.gridSize - 1)) return null;
            if (best.type === 'v' && (best.r < 0 || best.r >= this.config.gridSize - 1 || best.c < 0 || best.c >= this.config.gridSize)) return null;

            return best;
        }
        return null;
    },

    // --- GAMEPLAY LOGIC ---
    tryMove(lineObj) {
        const key = `${lineObj.r},${lineObj.c},${lineObj.type}`;
        if (this.state.lines.has(key)) return false; // Ya existe

        // Registrar movimiento con dueño
        this.state.lines.set(key, this.state.turn);

        // Comprobar si cierra cajas
        const closedBoxes = this.checkBoxes(lineObj.r, lineObj.c, lineObj.type);

        // Efectos y Turnos
        if (closedBoxes > 0) {
            // Turno extra (se mantiene el mismo)
            // No cambiar this.state.turn
        } else {
            // Cambio de turno
            this.state.turn = this.state.turn === 1 ? 2 : 1;
        }

        // UI Update
        this.updateUI();
        this.render();

        // Verificar Fin
        this.checkGameOver();

        // Si turno es IA, ejecutar
        if (this.state.active && !this.state.over && this.state.turn === 2 && this.state.mode === 'pve') {
            this.state.isAiThinking = true;
            this.render(); // Mostrar "Pensando"
            setTimeout(() => this.aiMove(), 800);
        }

        return true;
    },

    checkBoxes(r, c, type) {
        let count = 0;

        // Helper para checkear una caja específica
        const checkBox = (br, bc) => {
            if (br < 0 || bc < 0 || br >= this.config.gridSize - 1 || bc >= this.config.gridSize - 1) return;
            if (this.state.boxes[br][bc] !== 0) return; // Ya cerrada

            // Chequear 4 lados
            const l_top = this.state.lines.has(`${br},${bc},h`);
            const l_bot = this.state.lines.has(`${br + 1},${bc},h`);
            const l_left = this.state.lines.has(`${br},${bc},v`);
            const l_right = this.state.lines.has(`${br},${bc + 1},v`);

            if (l_top && l_bot && l_left && l_right) {
                // CAJA CERRADA
                const owner = this.state.turn;
                this.state.boxes[br][bc] = owner;

                // Puntos
                let points = 1;
                const type = this.state.boxTypes[br][bc];
                if (type === 'bonus') points = 3;
                if (type === 'trap') points = -2;

                this.state.scores[owner] += points;
                count++;
            }
        };

        // Si pongo linea H, afecta la caja de arriba (r-1) y la de abajo (r)
        if (type === 'h') {
            checkBox(r - 1, c); // Arriba
            checkBox(r, c);     // Abajo
        }
        // Si pongo linea V, afecta la caja izq (c-1) y dcha (c)
        else {
            checkBox(r, c - 1); // Izq
            checkBox(r, c);     // Dcha
        }

        return count;
    },

    checkGameOver() {
        // Total lineas posibles: fil*(col-1) + col*(fil-1) ?? 
        // Mejor: Si total boxes cerradas == total boxes
        let closed = 0;
        let total = 0;
        this.state.boxes.forEach(row => {
            row.forEach(b => {
                total++;
                if (b !== 0) closed++;
            });
        });

        if (closed === total) {
            this.state.over = true;
            this.state.active = false;
            // TODO: Integrar modal final (Game Over)
            setTimeout(() => {
                alert(`FIN DEL JUEGO\nP1: ${this.state.scores[1]}\nP2: ${this.state.scores[2]}`);
                // Volver a menu o reiniciar
                if (typeof ui !== 'undefined') ui.exitGame();
            }, 500);
        }
    },

    // --- AI SYSTEM ---
    aiMove() {
        // Estrategia simple por ahora (Random + Greedy) para cumplir funcionalidad básica
        // Luego refinar con Minimax si es necesario

        let possibleMoves = [];
        const rows = this.config.gridSize;

        // Identificar movimientos disponibles
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < rows - 1; c++) {
                if (!this.state.lines.has(`${r},${c},h`)) possibleMoves.push({ r, c, type: 'h' });
            }
        }
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < rows; c++) {
                if (!this.state.lines.has(`${r},${c},v`)) possibleMoves.push({ r, c, type: 'v' });
            }
        }

        if (possibleMoves.length === 0) return;

        // LOGICA SIMPLE: Buscar si alguna cierra caja
        let selectedMove = null;

        // 1. Intentar cerrar caja (Greedy)
        for (let move of possibleMoves) {
            // Simulamos (esto requeriría lógica extra, pero podemos inferir por conteo de lineas vecinas)
            // Forma rápida: ver si checkBox daría > 0.
            // ... (Simplificación para MVP Reboot)
        }

        // Fallback: Random
        selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

        this.state.isAiThinking = false;
        this.tryMove(selectedMove);
    },

    // --- RENDER ---
    render() {
        const { ctx } = this.dom;
        const { logicalSize, cellSize, offset, dotRadius, lineWidth } = this.config;

        // Clear Main Background
        ctx.fillStyle = this.config.colors.bg;
        ctx.fillRect(0, 0, logicalSize, logicalSize);

        // 0. Board Background (Rounded Rect behind grid)
        const boardPadding = cellSize * 0.5;
        const gridSizePx = (this.config.gridSize - 1) * cellSize;
        const bx = offset - boardPadding;
        const by = offset - boardPadding;
        const bw = gridSizePx + boardPadding * 2;
        const bh = gridSizePx + boardPadding * 2;
        const bRadius = 15;

        ctx.fillStyle = this.config.colors.boardBg;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(bx, by, bw, bh, bRadius);
        } else {
            // Fallback for rounded rect
            ctx.moveTo(bx + bRadius, by);
            ctx.lineTo(bx + bw - bRadius, by);
            ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + bRadius);
            ctx.lineTo(bx + bw, by + bh - bRadius);
            ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - bRadius, by + bh);
            ctx.lineTo(bx + bRadius, by + bh);
            ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - bRadius);
            ctx.lineTo(bx, by + bRadius);
            ctx.quadraticCurveTo(bx, by, bx + bRadius, by);
        }
        ctx.fill();

        // 1. Dibujar Cajas Cerradas (Fondos)
        for (let r = 0; r < this.state.boxes.length; r++) {
            for (let c = 0; c < this.state.boxes[r].length; c++) {
                const owner = this.state.boxes[r][c];
                const type = this.state.boxTypes[r][c];

                if (owner !== 0 || type !== 'normal') {
                    const x = offset + c * cellSize + lineWidth / 2;
                    const y = offset + r * cellSize + lineWidth / 2;
                    const size = cellSize - lineWidth;

                    // Fondo
                    if (owner !== 0) {
                        const color = this.getPlayerColor(owner);
                        ctx.globalAlpha = 0.3;
                        ctx.fillStyle = color;
                        ctx.fillRect(x, y, size, size);
                        ctx.globalAlpha = 1.0;
                    }

                    // Iconos Bonus/Trap
                    if (type !== 'normal') {
                        ctx.font = '20px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#fff';
                        let txt = type === 'bonus' ? '★' : '💀';
                        if (type === 'bonus') ctx.fillStyle = 'gold';
                        if (type === 'trap') ctx.fillStyle = 'red';
                        ctx.fillText(txt, x + size / 2, y + size / 2);
                    }
                }
            }
        }

        // (Grid Puntos removed from here to be drawn last)

        // 2. Dibujar Líneas
        this.state.lines.forEach((owner, key) => {
            const [r, c, type] = key.split(',');
            const ri = parseInt(r), ci = parseInt(c);

            // Determinar color basado en dueño
            const color = owner === 1 ? (this.getPlayerColor(1)) : (this.getPlayerColor(2));

            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';

            ctx.beginPath();
            if (type === 'h') {
                ctx.moveTo(offset + ci * cellSize, offset + ri * cellSize);
                ctx.lineTo(offset + (ci + 1) * cellSize, offset + ri * cellSize);
            } else {
                ctx.moveTo(offset + ci * cellSize, offset + ri * cellSize);
                ctx.lineTo(offset + ci * cellSize, offset + (ri + 1) * cellSize);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        });

        // 3. Highlight (Hover)
        // 3. Highlight (Hover)
        if (this.state.hoverLine && !this.state.isAiThinking) {
            const h = this.state.hoverLine;
            // Check if line is already taken
            const key = `${h.r},${h.c},${h.type}`;
            if (!this.state.lines.has(key)) {
                const color = this.state.turn === 1 ? this.config.colors.p1 : this.config.colors.p2;

                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                if (h.type === 'h') {
                    ctx.moveTo(offset + h.c * cellSize, offset + h.r * cellSize);
                    ctx.lineTo(offset + (h.c + 1) * cellSize, offset + h.r * cellSize);
                } else {
                    ctx.moveTo(offset + h.c * cellSize, offset + h.r * cellSize);
                    ctx.lineTo(offset + h.c * cellSize, offset + (h.r + 1) * cellSize);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }

        // 4. Dibujar Grid (Puntos) - TOP LAYER
        // "Anclajes" sólidos
        ctx.fillStyle = '#888'; // Slightly lighter than #666 for better visibility on dark board
        for (let r = 0; r < this.config.gridSize; r++) {
            for (let c = 0; c < this.config.gridSize; c++) {
                ctx.beginPath();
                ctx.arc(offset + c * cellSize, offset + r * cellSize, dotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 5. AI Loading
        if (this.state.isAiThinking) {
            document.getElementById('ai-thinking').classList.remove('hidden');
        } else {
            document.getElementById('ai-thinking').classList.add('hidden');
        }
    }
};

// Auto-Init al cargar
window.addEventListener('load', () => game.init());