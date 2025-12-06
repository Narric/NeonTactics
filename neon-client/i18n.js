const translations = {
    es: {
        pvp: "1 VS 1 (LOCAL)",
        shop: "TIENDA / SKINS",
        tutorial: "TUTORIAL",
        easy: "VS IA: FÁCIL",
        medium: "VS IA: MEDIO",
        hard: "VS IA: DIFÍCIL",
        nightmare: "VS IA: PESADILLA",
        winner: "GANADOR",
        loser: "DERROTADO",
        draw: "EMPATE",
        next: "SIGUIENTE RONDA",
        menu: "MENÚ PRINCIPAL",
        thinking: "CALCULANDO...",
        shop_title: "TIENDA NEÓN",
        buy: "COMPRAR",
        equip: "EQUIPAR",
        equipped: "EQUIPADO",
        back: "VOLVER",
        p1_win: "¡JUGADOR 1 GANA!",
        p2_win: "¡JUGADOR 2 GANA!",
        champion: "¡CAMPEÓN!",
        cpu: "CPU",
        p2: "JUGADOR 2"
    },
    en: {
        pvp: "1 VS 1 (LOCAL)",
        shop: "SKIN SHOP",
        tutorial: "TUTORIAL",
        easy: "VS AI: EASY",
        medium: "VS AI: MEDIUM",
        hard: "VS AI: HARD",
        nightmare: "VS AI: NIGHTMARE",
        winner: "WINNER",
        loser: "DEFEATED",
        draw: "DRAW",
        next: "NEXT ROUND",
        menu: "MAIN MENU",
        thinking: "CALCULATING...",
        shop_title: "NEON SHOP",
        buy: "BUY",
        equip: "EQUIP",
        equipped: "EQUIPPED",
        back: "BACK",
        p1_win: "PLAYER 1 WINS!",
        p2_win: "PLAYER 2 WINS!",
        champion: "CHAMPION!",
        cpu: "CPU",
        p2: "PLAYER 2"
    }
};

const i18n = {
    lang: 'es',
    init() {
        // Detectar idioma del navegador
        const userLang = navigator.language || navigator.userLanguage; 
        this.lang = userLang.startsWith('es') ? 'es' : 'en';
        this.updateDOM();
    },
    setLang(l) {
        this.lang = l;
        this.updateDOM();
    },
    t(key) {
        return translations[this.lang][key] || key;
    },
    updateDOM() {
        // Actualizar botones del menú
        document.querySelector('.btn-pvp').innerText = this.t('pvp');
        document.querySelector('.btn-shop').innerText = this.t('shop');
        document.querySelector('.btn-tutorial').innerText = this.t('tutorial');
        document.querySelector('.btn-easy').innerText = this.t('easy');
        document.querySelector('.btn-medium').innerText = this.t('medium');
        document.querySelector('.btn-hard').innerText = this.t('hard');
        document.querySelector('.btn-nightmare').innerText = this.t('nightmare');
        
        // Tienda
        document.querySelector('#shop-screen h1').innerText = this.t('shop_title');
        document.querySelector('.close-shop').innerText = this.t('back');
        
        // Pantallas finales
        document.getElementById('next-round-btn').innerText = this.t('next');
        document.getElementById('restart-btn').innerText = this.t('menu');
        document.getElementById('ai-thinking').innerText = this.t('thinking');
    }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => i18n.init());