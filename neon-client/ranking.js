const ranking = {
    currentTab: 'global',

    // DATOS DE EJEMPLO (Mock Data)
    // En el futuro, esto vendrá de Firebase
    mockGlobal: [
        { name: "Neo_King", avatar: 1, score: 2500 },
        { name: "CyberWolf", avatar: 2, score: 2450 },
        { name: "Glitch_00", avatar: 3, score: 2300 },
        { name: "Player_One", avatar: 1, score: 2100 },
        { name: "Tron_Legacy", avatar: 2, score: 1950 },
        { name: "Guest_99", avatar: 3, score: 1800 },
        { name: "ZeroCool", avatar: 1, score: 1500 },
        { name: "AcidBurn", avatar: 2, score: 1200 },
    ],

    mockNightmare: [
        { name: "AI_Slayer", avatar: 3, score: 50 }, // Victorias
        { name: "Neo_King", avatar: 1, score: 42 },
        { name: "Humanity", avatar: 2, score: 15 },
        { name: "Sarah_C", avatar: 1, score: 10 },
    ],

    open() {
        document.getElementById('ranking-screen').classList.remove('hidden');
        this.render();
    },

    close() {
        document.getElementById('ranking-screen').classList.add('hidden');
    },

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.rank-tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.innerText.toLowerCase() === tab) btn.classList.add('active');
        });
        this.render();
    },

    render() {
        const podium = document.getElementById('ranking-podium');
        const list = document.getElementById('ranking-list');
        const anchor = document.getElementById('user-rank-anchor');

        podium.innerHTML = '';
        list.innerHTML = '';
        anchor.innerHTML = '';

        // 1. Obtener datos (Simulado: Ordenamos y añadimos al usuario actual para probar)
        let data = this.currentTab === 'global' ? [...this.mockGlobal] : [...this.mockNightmare];

        // Simulamos que el usuario está en la lista para ver el ancla
        const myScore = this.currentTab === 'global' ? menu.user.mmr : 0;
        const myEntry = { name: menu.user.name, avatar: menu.user.avatar, score: myScore, isMe: true };

        // Añadir usuario si no está en el top (simulación simple)
        data.push(myEntry);

        // Ordenar de mayor a menor
        data.sort((a, b) => b.score - a.score);

        // 2. Renderizar PODIO (Top 3)
        // Ojo: El orden visual suele ser 2º - 1º - 3º
        const top3 = [data[1], data[0], data[2]].filter(x => x); // Filtramos undefined si hay menos de 3

        top3.forEach((p, index) => {
            // Reajustar índice real: Si es data[0] es 1º, si data[1] es 2º...
            let realRank = 0;
            let visualClass = '';
            if (p === data[0]) { realRank = 1; visualClass = 'p1'; }
            if (p === data[1]) { realRank = 2; visualClass = 'p2'; }
            if (p === data[2]) { realRank = 3; visualClass = 'p3'; }

            // Placeholder imagen
            const bg = '#222';

            podium.innerHTML += `
                <div class="podium-item ${visualClass}">
                    <div class="podium-avatar" style="background: ${bg}">
                        <div class="podium-rank">${realRank}</div>
                    </div>
                    <div class="podium-name">${p.name}</div>
                    <div class="podium-score">${p.score}</div>
                </div>
            `;
        });

        // 3. Renderizar LISTA (Del 4 en adelante)
        let myRankIndex = -1;

        for (let i = 3; i < data.length; i++) {
            const p = data[i];
            if (p.isMe) myRankIndex = i + 1;

            const html = `
                <div class="rank-row ${p.isMe ? 'highlight' : ''}">
                    <div class="rank-left">
                        <div class="rank-num">${i + 1}</div>
                        <div class="rank-img" style="background: #333"></div>
                        <div class="rank-name">${p.name}</div>
                    </div>
                    <div class="rank-score">${p.score} <i class="fa-solid fa-trophy" style="font-size:0.8rem"></i></div>
                </div>
            `;
            list.innerHTML += html;
        }

        // 4. Renderizar ANCLA (Mi posición)
        // Si estoy en el Top 3, no hace falta ancla. Si estoy abajo, sí.
        let myRank = data.findIndex(x => x.isMe) + 1;
        if (myRank > 0) {
            anchor.innerHTML = `
                <div class="rank-row me">
                    <div class="rank-left">
                        <div class="rank-num">#${myRank}</div>
                        <div class="rank-img" style="background: #333; border-color: var(--primary)"></div>
                        <div class="rank-name">${menu.user.name} (Tú)</div>
                    </div>
                    <div class="rank-score">${myScore} 🏆</div>
                </div>
            `;
        }
    }
};