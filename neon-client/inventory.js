const inventory = {
    currentTab: 'neon',

    // Mapeo de categorías para saber qué propiedad del usuario modificar
    categories: {
        'neon': 'equippedColor',   // ej: 'neon_red'
        'fx': 'equippedFX',        // ej: 'fx_fire'
        'profile': 'equippedAvatar'// ej: 'av_ninja'
    },

    open() {
        document.getElementById('inventory-screen').classList.remove('hidden');
        this.updatePreview();
        this.render();
    },

    close() {
        document.getElementById('inventory-screen').classList.add('hidden');
        // Actualizar también el menú principal al salir por si cambiaste algo
        if (typeof menu !== 'undefined') menu.showMainMenu();
    },

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.inv-tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.innerText.toLowerCase() === (tab === 'profile' ? 'perfil' : tab)) btn.classList.add('active');
        });
        this.render();
    },

    updatePreview() {
        const user = menu.user;
        const frame = document.getElementById('preview-frame');
        const img = document.getElementById('preview-img');
        const fx = document.getElementById('preview-fx');
        const name = document.getElementById('preview-name');

        name.innerText = user.name;

        // 1. Color del marco (Busca el valor hexadecimal en el catálogo de la tienda)
        const colorItem = shop.catalog.find(i => i.id === (user.equippedColor || 'default'));
        const colorVal = colorItem ? colorItem.val : '#0ff';
        frame.style.borderColor = colorVal;
        frame.style.boxShadow = `0 0 20px ${colorVal}`;
        frame.style.color = colorVal; // Para herencia

        // 2. Avatar (Placeholder por ahora)
        // const avatarItem = shop.catalog.find(i => i.id === (user.equippedAvatar || '1'));
        // img.src = `assets/avatars/${avatarItem.val}.png`; 
        // TEMPORAL: Usamos color sólido si no hay imagen
        img.style.background = '#222';
        img.style.display = 'block';

        // 3. FX
        const fxItem = shop.catalog.find(i => i.id === (user.equippedFX || 'none'));
        fx.innerHTML = ''; // Limpiar anterior
        if (fxItem && fxItem.val !== 'none') {
            // Aquí pondremos el GIF o partículas. Por ahora texto representativo
            // fx.innerText = fxItem.val.toUpperCase(); 
        }
    },

    equip(itemId) {
        const item = shop.catalog.find(i => i.id === itemId);
        if (!item) return;

        // Guardar equipamiento en la propiedad correcta del usuario
        const targetProp = this.categories[item.type];
        if (targetProp) {
            menu.user[targetProp] = itemId;
            localStorage.setItem('neonUser', JSON.stringify(menu.user));

            // Feedback visual inmediato
            this.updatePreview();
            this.render();
        }
    },

    render() {
        const container = document.getElementById('inventory-container');
        container.innerHTML = '';

        // 1. Obtener items que el usuario TIENE en esta categoría
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