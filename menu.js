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
        { id: 'pve', titleKey: 'menu_campaign', icon: '🤖', descKey: 'menu_campaign_desc', hasDifficulty: true },
        { id: 'pvp', titleKey: 'menu_pvp', icon: '🤜🤛', descKey: 'menu_pvp_desc', hasDifficulty: false },
        { id: 'online', titleKey: 'menu_online', icon: '🌐', descKey: 'menu_online_desc', hasDifficulty: false }
    ],

    init() {
        // Iniciamos secuencia visual
        this.runLoadingSequence();
        this.setupAvatarSelector();
        this.updateModeDisplay();

        // Intentamos cargar usuario o mostrar login
        // Lo hacemos con un pequeño retraso para asegurar que el DOM está listo
        setTimeout(() => this.checkLoginStatus(), 100);
    },

    // 1. CARGA
    runLoadingSequence() {
        const bar = document.getElementById('bar-fill');
        const clip = document.getElementById('text-clipper');
        const status = document.getElementById('loading-status');
        const screen = document.getElementById('loading-screen');

        if (!bar || !screen) return;

        // Secuencia de carga animada
        setTimeout(() => { if (bar) bar.style.width = "40%"; if (clip) clip.style.width = "40%"; if (status) status.innerText = Lang.t('loading_connect'); }, 500);
        setTimeout(() => { if (bar) bar.style.width = "80%"; if (clip) clip.style.width = "80%"; if (status) status.innerText = Lang.t('loading_assets'); }, 1500);

        setTimeout(() => {
            if (bar) bar.style.width = "100%";
            if (clip) clip.style.width = "100%";
            if (status) status.innerText = Lang.t('loading_ready');

            // Ocultar pantalla suavemente
            setTimeout(() => {
                screen.style.opacity = '0'; // Efecto fade out (requiere CSS transition)
                setTimeout(() => {
                    screen.classList.add('hidden');
                }, 500);
            }, 800);
        }, 2500);
    },

    // 2. LOGIN (VERSIÓN BLINDADA ANTI-ERRORES)
    checkLoginStatus() {
        try {
            const saved = localStorage.getItem('neonUser');
            if (saved) {
                // Intentamos leer los datos guardados
                const parsedUser = JSON.parse(saved);

                // Verificamos que no sea un usuario de una versión vieja (si le falta inventario, es viejo)
                if (!parsedUser.inventory) {
                    throw new Error("Datos antiguos detectados");
                }

                this.user = parsedUser;
                this.showMainMenu();
            } else {
                // No hay datos, mostrar login
                const loginScreen = document.getElementById('login-screen');
                if (loginScreen) loginScreen.classList.remove('hidden');
            }
        } catch (e) {
            console.warn("⚠️ Datos corruptos o antiguos detectados. Reiniciando usuario.", e);
            // Si falla, borramos los datos corruptos y mostramos el login limpio
            localStorage.removeItem('neonUser');
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) loginScreen.classList.remove('hidden');
        }
    },

    setupAvatarSelector() {
        const options = document.querySelectorAll('.avatar-option');
        options.forEach(av => {
            av.addEventListener('click', () => {
                options.forEach(a => a.classList.remove('selected'));
                av.classList.add('selected');
            });
        });
    },

    loginGuest() {
        const nameInput = document.getElementById('username-input');
        const name = nameInput ? (nameInput.value || "Guest") : "Guest";

        // Guardamos el avatar seleccionado
        const selectedAvatar = document.querySelector('.avatar-option.selected');
        const avatarId = selectedAvatar ? selectedAvatar.dataset.id : 1;

        this.user.name = name;
        this.user.avatar = avatarId;

        this.saveUser();

        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.classList.add('hidden');

        this.showMainMenu();
    },

    loginCloud() { alert("Pronto disponible en Firebase"); },

    showMainMenu() {
        const menuEl = document.getElementById('main-menu');
        if (menuEl) menuEl.classList.remove('hidden');
        this.updateUI();
    },

    saveUser() {
        localStorage.setItem('neonUser', JSON.stringify(this.user));
        this.updateUI();
    },

    updateUI() {
        // Usamos ?. para evitar errores si el elemento no existe aun
        const nameEl = document.getElementById('user-name');
        if (nameEl) nameEl.innerText = this.user.name;

        const mmrEl = document.getElementById('user-mmr');
        if (mmrEl) mmrEl.innerText = this.user.mmr;

        const goldEl = document.getElementById('user-gold');
        if (goldEl) goldEl.innerText = this.user.gold;

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

        const titleEl = document.getElementById('mode-title');
        if (titleEl) titleEl.innerText = Lang.t(mode.titleKey);

        const iconEl = document.getElementById('mode-icon');
        if (iconEl) iconEl.innerText = mode.icon;

        const diffSel = document.getElementById('difficulty-selector');
        const desc = document.getElementById('mode-desc');

        if (diffSel && desc) {
            if (mode.hasDifficulty) {
                desc.classList.add('hidden');
                diffSel.classList.remove('hidden');
                // Update selected difficulty text
                const currentDiff = document.getElementById('diff-select').value;
                document.getElementById('selected-difficulty-text').innerText = Lang.t('diff_' + currentDiff);

                // Update options text
                document.querySelectorAll('.custom-option').forEach(opt => {
                    // Assuming onClick has the key, but we need to update the text content based on the value
                    // This is tricky because the original code had hardcoded text in onclick.
                    // Let's rely on Lang.updatePage() or manual update if element has data-i18n
                });

            } else {
                desc.innerText = Lang.t(mode.descKey);
                desc.classList.remove('hidden');
                diffSel.classList.add('hidden');
            }
        }
    },

    // 4. SELECTOR DIFICULTAD
    toggleDifficultyDropdown() {
        const opts = document.getElementById('difficulty-options');
        const wrapper = document.querySelector('.custom-select-wrapper');
        if (opts) opts.classList.toggle('hidden');
        if (wrapper) wrapper.classList.toggle('open');
    },
    selectDifficulty(val, key) {
        const textEl = document.getElementById('selected-difficulty-text');
        const selectEl = document.getElementById('diff-select');

        if (textEl) textEl.innerText = Lang.t(key);
        if (selectEl) selectEl.value = val;

        // Cerrar dropdown al seleccionar
        this.toggleDifficultyDropdown();

        // Marca visual
        document.querySelectorAll('.custom-option').forEach(opt => {
            opt.classList.remove('selected');
            // Check by data attribute or click handler if needed, but since we redraw often this might be overkill.
            // Simplified: Just remove selected as we are closing.
        });
    },

    // 5. LANZAR JUEGO
    launchGame() {
        const mode = this.modes[this.currentModeIndex];
        // Pasamos control a game.js
        if (typeof game === 'undefined') {
            console.error("Game.js no cargado");
            return;
        }

        if (mode.id === 'pve') {
            const selectEl = document.getElementById('diff-select');
            game.start('pve', selectEl ? selectEl.value : 'medium');
        }
        else if (mode.id === 'pvp') game.start('pvp', 'medium');
        else game.start('online', 'medium');
    },

    // 6. IAP & RANKING
    openIAP() {
        const el = document.getElementById('iap-screen');
        if (el) el.classList.remove('hidden');
    },
    closeIAP() {
        const el = document.getElementById('iap-screen');
        if (el) el.classList.add('hidden');
    },

    simulatePurchase(amount) {
        if (confirm(Lang.t('confirm_buy', { price: amount }))) {
            this.user.gold += amount;
            this.saveUser();
            this.closeIAP();
        }
    },

    showRanking() {
        if (typeof ranking !== 'undefined') ranking.open();
    },
    watchAd() {
        alert(Lang.t('ad_reward'));
        this.user.gold += 15;
        this.saveUser();
    }
};

document.addEventListener('DOMContentLoaded', () => menu.init());