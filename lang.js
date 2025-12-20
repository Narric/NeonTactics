const Lang = {
    current: 'es', // Default to Spanish
    data: {
        es: {
            // General
            "title_main": "Neon Tactics: Mobile",
            "loading_init": "INICIALIZANDO...",
            "loading_connect": "CONECTANDO...",
            "loading_assets": "CARGANDO RECURSOS...",
            "loading_ready": "¡LISTO!",

            // Login
            "login_title": "IDENTIFÍCATE",
            "login_placeholder": "Nombre de Usuario",
            "login_guest": "ENTRAR COMO INVITADO",
            "login_divider": "O",
            "login_cloud": "CREAR CUENTA / LOGIN",

            // Menu
            "menu_campaign": "CAMPAÑA",
            "menu_campaign_desc": "Enfréntate a la IA.",
            "menu_pvp": "1 VS 1 LOCAL",
            "menu_pvp_desc": "Juega contra un amigo.",
            "menu_online": "ONLINE",
            "menu_online_desc": "Partidas clasificatorias.",
            "play_btn": "JUGAR",

            // Difficulty
            "diff_easy": "FÁCIL",
            "diff_medium": "MEDIO",
            "diff_hard": "DIFÍCIL",
            "diff_nightmare": "PESADILLA",

            // Docker
            "dock_shop": "Tienda",
            "dock_inventory": "Inventario",
            "dock_ranking": "Ranking",

            // Game Common
            "score_p1": "P1",
            "score_p2": "P2",
            "ai_thinking": "PENSANDO...",
            "victory": "¡VICTORIA!",
            "defeat": "DERROTA",
            "draw": "EMPATE",
            "exit_confirm": "¿Salir al menú?",
            "return_menu": "Volviendo al menú...",
            "role_p1": "ERES AZUL (Tu turno)",
            "role_p2": "ERES ROJO (Espera)",
            "searching_match": "Buscando rival...",
            "connection_error": "Error de conexión con el servidor.",

            // Shop & Inventory
            "shop_title": "MERCADO NEÓN",
            "inventory_title": "MI CAMERINO",
            "tab_neon": "NEÓN",
            "tab_fx": "FX",
            "tab_profile": "PERFIL",
            "confirm_buy": "¿Comprar por {price}?",
            "btn_yes": "SÍ",
            "btn_no": "NO",
            "ad_reward": "📺 +15 Monedas",

            // Ranking
            "ranking_title": "LÍDERES",
            "tab_global": "GLOBAL",
            "tab_nightmare": "PESADILLA",

            // IAP
            "iap_title": "TESORO",
            "iap_popular": "POPULAR",
            "iap_best": "MEJOR"
        },
        en: {
            // General
            "title_main": "Neon Tactics: Mobile",
            "loading_init": "INITIALIZING...",
            "loading_connect": "CONNECTING...",
            "loading_assets": "LOADING ASSETS...",
            "loading_ready": "READY!",

            // Login
            "login_title": "IDENTIFY YOURSELF",
            "login_placeholder": "Username",
            "login_guest": "PLAY AS GUEST",
            "login_divider": "OR",
            "login_cloud": "CREATE ACCOUNT / LOGIN",

            // Menu
            "menu_campaign": "CAMPAIGN",
            "menu_campaign_desc": "Face the AI.",
            "menu_pvp": "LOCAL 1 VS 1",
            "menu_pvp_desc": "Play vs a friend.",
            "menu_online": "ONLINE",
            "menu_online_desc": "Ranked matches.",
            "play_btn": "PLAY",

            // Difficulty
            "diff_easy": "EASY",
            "diff_medium": "MEDIUM",
            "diff_hard": "HARD",
            "diff_nightmare": "NIGHTMARE",

            // Docker
            "dock_shop": "Shop",
            "dock_inventory": "Cabinet",
            "dock_ranking": "Ranking",

            // Game Common
            "score_p1": "P1",
            "score_p2": "P2",
            "ai_thinking": "THINKING...",
            "victory": "VICTORY!",
            "defeat": "DEFEAT",
            "draw": "DRAW",
            "exit_confirm": "Exit to menu?",
            "return_menu": "Returning to menu...",
            "role_p1": "YOU ARE BLUE (Your turn)",
            "role_p2": "YOU ARE RED (Wait)",
            "searching_match": "Searching for opponent...",
            "connection_error": "Connection error.",

            // Shop & Inventory
            "shop_title": "NEON MARKET",
            "inventory_title": "MY CABINET",
            "tab_neon": "NEON",
            "tab_fx": "FX",
            "tab_profile": "PROFILE",
            "confirm_buy": "Buy for {price}?",
            "btn_yes": "YES",
            "btn_no": "NO",
            "ad_reward": "📺 +15 Coins",

            // Ranking
            "ranking_title": "LEADERBOARD",
            "tab_global": "GLOBAL",
            "tab_nightmare": "NIGHTMARE",

            // IAP
            "iap_title": "TREASURY",
            "iap_popular": "POPULAR",
            "iap_best": "BEST"
        }
    },

    init() {
        // Detect language
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.toLowerCase().startsWith('en')) {
            this.current = 'en';
        } else {
            this.current = 'es';
        }

        // Allow override via localStorage
        const savedLang = localStorage.getItem('neonLang');
        if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
            this.current = savedLang;
        }

        console.log("Lang initialized:", this.current);
        this.updatePage();
    },

    t(key, params = {}) {
        let text = this.data[this.current][key] || key;
        for (const prop in params) {
            text = text.replace(`{${prop}}`, params[prop]);
        }
        return text;
    },

    setLang(lang) {
        if (lang === 'es' || lang === 'en') {
            this.current = lang;
            localStorage.setItem('neonLang', lang);
            this.updatePage();
            // Force re-render of dynamic elements if necessary
            if (typeof menu !== 'undefined') menu.updateModeDisplay();
        }
    },

    updatePage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                    el.placeholder = this.t(key);
                } else {
                    el.innerText = this.t(key);
                }
            }
        });
    }
};

// Auto-init if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Lang.init());
} else {
    Lang.init();
}
