const menu = {
    user: {
        name: "Guest",
        avatar: 1,
        mmr: 1000,
        gold: 0,
        inventory: ['default'], // Inventario base
        equippedColor: 'default',
        equippedFX: null,
        equippedAvatar: null
    },
    currentModeIndex: 0,
    modes: [
        { id: 'pve', title: 'CAMPAÑA', icon: '🤖', desc: 'Entrenamiento contra la IA.', hasDifficulty: true },
        { id: 'pvp', title: '1 VS 1 LOCAL', icon: '🤜🤛', desc: 'Juega contra un amigo.', hasDifficulty: false },
        { id: 'online', title: 'ONLINE', icon: '🌐', desc: 'Partidas clasificatorias.', hasDifficulty: false }
    ],

    init() {
        this.runLoadingSequence();
        this.setupAvatarSelector();
        this.updateModeDisplay();
    },

    // --- 1. LOADING SCREEN ---
    runLoadingSequence() {
        const bar = document.getElementById('bar-fill');
        const textClip = document.getElementById('text-clipper');
        const status = document.getElementById('loading-status');

        if (!bar || !textClip) return; // Seguridad

        setTimeout(() => { bar.style.width = "30%"; textClip.style.width = "30%"; status.innerText = "Conectando..."; }, 500);
        setTimeout(() => { bar.style.width = "70%"; textClip.style.width = "70%"; status.innerText = "Cargando assets..."; }, 1500);
        setTimeout(() => {
            bar.style.width = "100%"; textClip.style.width = "100%"; status.innerText = "¡Listo!";
            setTimeout(() => {
                document.getElementById('loading-screen').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('loading-screen').classList.add('hidden');
                    this.checkLoginStatus();
                }, 500);
            }, 800);
        }, 2500);
    },

    // --- 2. LOGIN & DATA ---
    checkLoginStatus() {
        const savedUser = localStorage.getItem('neonUser');
        if (savedUser) {
            this.user = JSON.parse(savedUser);
            this.showMainMenu();
        } else {
            document.getElementById('login-screen').classList.remove('hidden');
        }
    },

    setupAvatarSelector() {
        const avatars = document.querySelectorAll('.avatar-option');
        avatars.forEach(av => {
            av.addEventListener('click', () => {
                avatars.forEach(a => a.classList.remove('selected'));
                av.classList.add('selected');
            });
        });
    },

    loginGuest() {
        const nameInput = document.getElementById('username-input').value || "Guest";
        const avatarId = document.querySelector('.avatar-option.selected').dataset.id;

        this.user.name = nameInput;
        this.user.avatar = avatarId;
        // Respetamos los valores por defecto si no existen
        if (!this.user.inventory) this.user.inventory = ['default'];

        this.saveUser();
        document.getElementById('login-screen').classList.add('hidden');
        this.showMainMenu();
    },

    loginCloud() { alert("Pronto disponible con Firebase"); this.loginGuest(); },

    showMainMenu() {
        document.getElementById('main-menu').classList.remove('hidden');
        this.updateUI();
    },

    saveUser() {
        localStorage.setItem('neonUser', JSON.stringify(this.user));
        this.updateUI();
    },

    updateUI() {
        // Actualizar header del menú principal
        document.getElementById('user-name').innerText = this.user.name;
        document.getElementById('user-mmr').innerText = this.user.mmr;
        document.getElementById('user-gold').innerText = this.user.gold;

        // Actualizar header de la tienda también
        const shopGold = document.getElementById('shop-gold-display');
        if (shopGold) shopGold.innerText = this.user.gold;
    },

    // --- 3. CARRUSEL DE MODOS ---
    nextMode() {
        this.currentModeIndex = (this.currentModeIndex + 1) % this.modes.length;
        this.updateModeDisplay();
    },
    prevMode() {
        this.currentModeIndex = (this.currentModeIndex - 1 + this.modes.length) % this.modes.length;
        this.updateModeDisplay();
    },

    updateModeDisplay() {
        const mode = this.modes[this.currentModeIndex];
        document.getElementById('mode-title').innerText = mode.title;
        document.getElementById('mode-icon').innerText = mode.icon;

        const descEl = document.getElementById('mode-desc');
        const diffSel = document.getElementById('difficulty-selector');

        if (mode.hasDifficulty) {
            descEl.classList.add('hidden');
            diffSel.classList.remove('hidden');
        } else {
            descEl.innerText = mode.desc;
            descEl.classList.remove('hidden');
            diffSel.classList.add('hidden');
        }
    },

    // --- LÓGICA DEL SELECTOR PERSONALIZADO ---
    toggleDifficultyDropdown() {
        const wrapper = document.querySelector('.custom-select-wrapper');
        const options = document.getElementById('difficulty-options');

        // Alternar visibilidad
        if (options.classList.contains('hidden')) {
            options.classList.remove('hidden');
            wrapper.classList.add('open');
        } else {
            options.classList.add('hidden');
            wrapper.classList.remove('open');
        }
    },

    selectDifficulty(value, text) {
        // 1. Actualizar texto visual
        document.getElementById('selected-difficulty-text').innerText = text;

        // 2. Actualizar el select oculto (para que game.js lo lea)
        document.getElementById('diff-select').value = value;

        // 3. Actualizar estilo visual de la lista
        document.querySelectorAll('.custom-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.innerText === text) opt.classList.add('selected');
        });

        // 4. Cerrar menú
        this.toggleDifficultyDropdown();

        // Detener propagación para que no se reabra instantáneamente si hubo lag
        event.stopPropagation();
    },

    launchGame() {
        const mode = this.modes[this.currentModeIndex];

        if (mode.id === 'pve') {
            const diff = document.getElementById('diff-select').value;
            game.startGame(diff);
        } else if (mode.id === 'pvp') {
            game.startPvP();
        } else if (mode.id === 'online') {
            game.startOnline();
        }
    },

    // --- 4. EXTRAS & IAP ---
    watchAd() {
        alert("📺 Viendo anuncio...\n\n¡Gracias! +15 Monedas recibidas.");
        this.user.gold += 15;
        this.saveUser();
    },

    // Nueva función: Abrir Ranking
    showRanking() {
        if (typeof ranking !== 'undefined') ranking.open();
        else alert("Sistema de Ranking cargando...");
    },

    // --- 5. TIENDA DE MONEDAS (REAL MONEY) ---
    openIAP() {
        document.getElementById('iap-screen').classList.remove('hidden');
    },

    closeIAP() {
        document.getElementById('iap-screen').classList.add('hidden');
    },

    simulatePurchase(amount) {
        // Aquí conectaremos con la API de pagos de Google Play / Apple
        if (confirm(`¿Confirmar compra de ${amount} monedas? (Simulación)`)) {
            this.user.gold += amount;
            this.saveUser();
            alert("¡Compra exitosa! Monedas añadidas.");
            this.closeIAP();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => menu.init());