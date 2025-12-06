const menu = {
    user: {
        name: "Guest",
        avatar: 1,
        mmr: 1000,
        gold: 0,
        inventory: ['default'],
        equippedColor: 'default'
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
        this.checkLoginStatus();
    },

    // 1. CARGA
    runLoadingSequence() {
        const bar = document.getElementById('bar-fill');
        const clip = document.getElementById('text-clipper');
        const status = document.getElementById('loading-status');

        setTimeout(() => { bar.style.width = "40%"; clip.style.width = "40%"; status.innerText = "CONECTANDO..."; }, 500);
        setTimeout(() => { bar.style.width = "80%"; clip.style.width = "80%"; status.innerText = "CARGANDO ASSETS..."; }, 1500);
        setTimeout(() => {
            bar.style.width = "100%"; clip.style.width = "100%"; status.innerText = "¡LISTO!";
            setTimeout(() => {
                document.getElementById('loading-screen').classList.add('hidden');
            }, 500);
        }, 2500);
    },

    // 2. LOGIN
    checkLoginStatus() {
        const saved = localStorage.getItem('neonUser');
        if (saved) {
            this.user = JSON.parse(saved);
            this.showMainMenu();
        } else {
            document.getElementById('login-screen').classList.remove('hidden');
        }
    },

    setupAvatarSelector() {
        document.querySelectorAll('.avatar-option').forEach(av => {
            av.addEventListener('click', () => {
                document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
                av.classList.add('selected');
            });
        });
    },

    loginGuest() {
        const name = document.getElementById('username-input').value || "Guest";
        this.user.name = name;
        this.saveUser();
        document.getElementById('login-screen').classList.add('hidden');
        this.showMainMenu();
    },

    loginCloud() { alert("Pronto disponible"); this.loginGuest(); },

    showMainMenu() {
        document.getElementById('main-menu').classList.remove('hidden');
        this.updateUI();
    },

    saveUser() {
        localStorage.setItem('neonUser', JSON.stringify(this.user));
        this.updateUI();
    },

    updateUI() {
        document.getElementById('user-name').innerText = this.user.name;
        document.getElementById('user-mmr').innerText = this.user.mmr;
        document.getElementById('user-gold').innerText = this.user.gold;

        // Tienda
        const shopGold = document.getElementById('shop-gold-display');
        if (shopGold) shopGold.innerText = this.user.gold;
    },

    // 3. CARRUSEL
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

        const diffSel = document.getElementById('difficulty-selector');
        const desc = document.getElementById('mode-desc');

        if (mode.hasDifficulty) {
            desc.classList.add('hidden');
            diffSel.classList.remove('hidden');
        } else {
            desc.innerText = mode.desc;
            desc.classList.remove('hidden');
            diffSel.classList.add('hidden');
        }
    },

    // 4. SELECTOR DIFICULTAD
    toggleDifficultyDropdown() {
        const opts = document.getElementById('difficulty-options');
        opts.classList.toggle('hidden');
    },
    selectDifficulty(val, text) {
        document.getElementById('selected-difficulty-text').innerText = text;
        document.getElementById('diff-select').value = val;
        this.toggleDifficultyDropdown();
        // Marca visual
        document.querySelectorAll('.custom-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.innerText === text) opt.classList.add('selected');
        });
    },

    // 5. LANZAR JUEGO
    launchGame() {
        const mode = this.modes[this.currentModeIndex];
        // Pasamos control a game.js
        if (mode.id === 'pve') game.startGame(document.getElementById('diff-select').value);
        else if (mode.id === 'pvp') game.startPvP();
        else game.startOnline();
    },

    // 6. IAP & RANKING
    openIAP() { document.getElementById('iap-screen').classList.remove('hidden'); },
    closeIAP() { document.getElementById('iap-screen').classList.add('hidden'); },

    simulatePurchase(amount) {
        if (confirm(`¿Comprar ${amount} monedas?`)) {
            this.user.gold += amount;
            this.saveUser();
            this.closeIAP();
        }
    },

    showRanking() {
        if (typeof ranking !== 'undefined') ranking.open();
    },
    watchAd() {
        alert("📺 +15 Monedas");
        this.user.gold += 15;
        this.saveUser();
    }
};