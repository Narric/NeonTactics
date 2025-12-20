const shop = {
    currentTab: 'neon',
    selectedItem: null,

    // BASE DE DATOS DE PRODUCTOS
    catalog: [
        // --- CATEGORÍA: NEÓN ---
        { id: 'default', name: 'Cian Original', type: 'neon', price: 0, val: '#0ff' },
        { id: 'neon_red', name: 'Rojo Láser', type: 'neon', price: 100, val: '#ff0033' },
        { id: 'neon_green', name: 'Verde Tóxico', type: 'neon', price: 150, val: '#39ff14' },
        { id: 'neon_purple', name: 'Ultra Violeta', type: 'neon', price: 200, val: '#b026ff' },
        { id: 'neon_gold', name: 'Oro Puro', type: 'neon', price: 500, val: '#ffd700' },

        // --- CATEGORÍA: FX ---
        { id: 'fx_fire', name: '🔥 Infierno', type: 'fx', price: 2000, val: 'fire' },
        { id: 'fx_ice', name: '❄️ Congelado', type: 'fx', price: 2000, val: 'ice' },
        { id: 'fx_matrix', name: '👾 Matrix', type: 'fx', price: 3500, val: 'matrix' },
        { id: 'fx_rainbow', name: '🌈 RGB Gamer', type: 'fx', price: 5000, val: 'rainbow' },

        // --- CATEGORÍA: PERFIL (Próximamente imágenes reales) ---
        { id: 'av_robot', name: 'Mecha-01', type: 'profile', price: 500, val: 'robot' },
        { id: 'av_ninja', name: 'Cyber Ninja', type: 'profile', price: 800, val: 'ninja' }
    ],

    init() {
        this.render();
    },

    open() {
        document.getElementById('shop-screen').classList.remove('hidden');
        document.getElementById('shop-gold-display').innerText = menu.user.gold;
        this.render();
    },

    close() {
        document.getElementById('shop-screen').classList.add('hidden');
        if (typeof menu !== 'undefined') menu.showMainMenu();
    },

    switchTab(tabName) {
        this.currentTab = tabName;
        // Actualizar visual de botones
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.innerText.toLowerCase() === (tabName === 'profile' ? 'perfil' : tabName))
                btn.classList.add('active');
        });
        this.render();
    },

    render() {
        const container = document.getElementById('shop-container');
        container.innerHTML = '';

        // Filtrar productos por pestaña actual
        const items = this.catalog.filter(i => i.type === this.currentTab);

        items.forEach(item => {
            // Verificar si el usuario ya lo tiene (buscando en el inventario del usuario)
            // Nota: Asumimos que menu.user.inventory es un array de IDs ['default', 'neon_red']
            const isOwned = (menu.user.inventory || []).includes(item.id) || item.price === 0;

            const card = document.createElement('div');
            card.className = 'product-card';

            // Crear vista previa visual (Color o Icono)
            let bgStyle = item.val;
            if (item.type === 'fx') bgStyle = '#333'; // Placeholder para FX
            if (item.type === 'profile') bgStyle = '#333'; // Placeholder para Avatar

            if (item.id === 'neon_red') bgStyle = '#ff0033';
            if (item.id === 'neon_green') bgStyle = '#39ff14';
            // ... Aquí expandiremos la lógica visual luego

            card.innerHTML = `
                <div class="product-preview" style="background: ${bgStyle}"></div>
                <div class="product-name">${item.name}</div>
                ${isOwned
                    ? `<button class="btn-owned">EN PROPIEDAD</button>`
                    : `<button class="btn-price" onclick="shop.promptBuy('${item.id}')">
                         ${item.price} <i class="fa-solid fa-coins"></i>
                       </button>`
                }
            `;
            container.appendChild(card);
        });
    },

    promptBuy(itemId) {
        this.selectedItem = this.catalog.find(i => i.id === itemId);
        if (!this.selectedItem) return;

        // Abrir modal
        document.getElementById('modal-item-name').innerText = this.selectedItem.name;
        document.getElementById('modal-item-price').innerText = this.selectedItem.price;

        // PREVIEW UPDATE
        const previewEl = document.getElementById('modal-item-preview');
        if (previewEl) {
            // Reset
            previewEl.style.background = '#333';
            previewEl.innerText = '';

            // Logic mirrored from render()
            if (this.selectedItem.type === 'neon') {
                previewEl.style.background = this.selectedItem.val;
                previewEl.style.boxShadow = `0 0 20px ${this.selectedItem.val}`;
            } else {
                // Placeholder for FX/Avatars (Text or Icon)
                previewEl.style.display = 'flex';
                previewEl.style.alignItems = 'center';
                previewEl.style.justifyContent = 'center';
                previewEl.innerText = '?';
            }
        }

        document.getElementById('buy-modal').classList.remove('hidden');

        // Configurar botón confirmar
        document.getElementById('btn-confirm-buy').onclick = () => this.buyItem();
    },

    buyItem() {
        if (!this.selectedItem) return;

        if (menu.user.gold >= this.selectedItem.price) {
            // 1. Cobrar
            menu.user.gold -= this.selectedItem.price;

            // 2. Añadir al inventario
            if (!menu.user.inventory) menu.user.inventory = [];
            menu.user.inventory.push(this.selectedItem.id);

            // 3. Guardar
            // 3. Guardar centralizado
            if (typeof menu !== 'undefined') menu.saveUser();

            // 4. Feedback y cerrar
            alert("¡Compra realizada con éxito! Ve al inventario para equiparlo.");
            this.closeModal();
            document.getElementById('shop-gold-display').innerText = menu.user.gold;
            this.render(); // Re-renderizar para que salga como "En Propiedad"
        } else {
            alert("❌ No tienes suficientes monedas.");
            this.closeModal();
        }
    },

    closeModal() {
        document.getElementById('buy-modal').classList.add('hidden');
        this.selectedItem = null;
    }
};