const inventory = {
    currentTab: 'neon',

    // Mapeo de categorías para saber qué propiedad del usuario modificar
    categories: {
        'neon': 'equippedColor',   // ej: 'neon_red'
        'fx': 'equippedFX',        // ej: 'fx_fire'
        'profile': 'equippedAvatar'// ej: 'av_ninja'
    },

    open() {
        // SAFEGUARDS: Ensure user and inventory exist
        if (typeof menu === 'undefined' || !menu.user) return;
        if (!menu.user.inventory) menu.user.inventory = ['default'];

        const invScreen = document.getElementById('inventory-screen');
        if (invScreen) invScreen.classList.remove('hidden');

        // UPDATE PREVIEW & RENDER IMMEDIATELY
        this.updatePreview();

        // Reset to first tab explicitly
        this.currentTab = 'neon';

        // Manual visual toggle for buttons (redundant safety)
        document.querySelectorAll('.inv-tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === 'neon') btn.classList.add('active');
        });

        // Forced Render 1 (Sync)
        this.render();

        // Forced Render 2 (Async - for slow DOM updates)
        setTimeout(() => {
            this.switchTab('neon');
        }, 50);
    },

    close() {
        const invScreen = document.getElementById('inventory-screen');
        if (invScreen) invScreen.classList.add('hidden');
        // Actualizar también el menú principal al salir por si cambiaste algo
        if (typeof menu !== 'undefined') menu.showMainMenu();
    },

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.inv-tab-btn').forEach(btn => {
            btn.classList.remove('active');
            // Comparación robusta usando data-tab
            if (btn.dataset.tab === tab) btn.classList.add('active');
        });
        this.render();
    },

    updatePreview() {
        if (typeof menu === 'undefined' || !menu.user) return;

        const user = menu.user;
        const frame = document.getElementById('preview-frame');
        const img = document.getElementById('preview-img');
        const fx = document.getElementById('preview-fx');
        const name = document.getElementById('preview-name');

        if (name) name.innerText = user.name;

        // 1. Color del marco (Busca el valor hexadecimal en el catálogo de la tienda)
        // Safety check for shop
        if (typeof shop !== 'undefined' && shop.catalog) {
            const colorItem = shop.catalog.find(i => i.id === (user.equippedColor || 'default'));
            const colorVal = colorItem ? colorItem.val : '#0ff';

            if (frame) {
                frame.style.borderColor = colorVal;
                frame.style.boxShadow = `0 0 20px ${colorVal}`;
                frame.style.color = colorVal; // Para herencia
            }

            // 2. Avatar (Placeholder por ahora)
            if (img) {
                img.style.background = '#222';
                img.style.display = 'block';
            }

            // 3. FX
            const fxItem = shop.catalog.find(i => i.id === (user.equippedFX || 'none'));
            if (fx) {
                fx.innerHTML = '';
                if (fxItem && fxItem.val !== 'none') {
                    // Placeholder
                }
            }
        }
    },

    equip(itemId) {
        if (typeof shop === 'undefined' || !shop.catalog) return;

        const item = shop.catalog.find(i => i.id === itemId);
        if (!item) return;

        // Guardar equipamiento en la propiedad correcta del usuario
        const targetProp = this.categories[item.type];
        if (targetProp) {
            console.log("Equipping:", itemId);
            menu.user[targetProp] = itemId;

            // MUTUAL EXCLUSIVITY: Neon vs FX
            if (item.type === 'neon') {
                // Si equipamos Neon, desequipamos FX
                menu.user.equippedFX = 'none';
            } else if (item.type === 'fx') {
                // Si equipamos FX, desequipamos Neon (Color)
                // Usamos 'none' para que no haga match con ningún item (ni siquiera 'default')
                menu.user.equippedColor = 'none';
            }

            if (typeof menu !== 'undefined') menu.saveUser();

            // Feedback visual inmediato
            this.updatePreview();
            this.render();
        }
    },

    render() {
        const container = document.getElementById('inventory-container');
        if (!container) return;

        container.innerHTML = '';

        // 1. Obtener items (con seguridad)
        if (typeof shop === 'undefined' || !shop.catalog) {
            container.innerHTML = '<p style="color:red">Error loading shop catalog...</p>';
            return;
        }

        const myItems = shop.catalog.filter(item => {
            const owned = (menu.user.inventory || []).includes(item.id) || item.price === 0;
            return item.type === this.currentTab && owned;
        });

        if (myItems.length === 0) {
            container.innerHTML = '<p style="color:#666; grid-column:1/-1; text-align:center">Vacío. ¡Ve a la tienda!</p>';
            return;
        }

        // 2. Renderizar tarjetas
        myItems.forEach(item => {
            const targetProp = this.categories[item.type];
            const isEquipped = menu.user[targetProp] === item.id || (!menu.user[targetProp] && item.id === 'default');

            const card = document.createElement('div');
            card.className = `inv-card ${isEquipped ? 'equipped' : 'unequipped'}`;
            card.onclick = () => this.equip(item.id);

            // Preview Visual
            let bgStyle = item.val;
            if (item.id === 'default') bgStyle = '#0ff';
            if (item.type !== 'neon') bgStyle = '#333'; // Placeholder para FX/Avatar

            card.innerHTML = `
                <div class="inv-preview" style="background: ${bgStyle}"></div>
                <div class="inv-name">${item.name}</div>
                <div class="equip-badge">${isEquipped ? 'EQUIPADO' : 'USAR'}</div>
            `;
            container.appendChild(card);
        });
    }
};