// penUI.js
export class PenUI {
    constructor(inventory) {
        this.inventory = inventory;
        this.activePen = null;
        this.createDOM();
    }

    createDOM() {
        this.container = document.createElement('div');
        this.container.id = 'pen-ui';
        this.container.className = 'hidden';
        this.container.innerHTML = `
            <div class="pen-dialog">
                <div class="pen-header">
                    <h2 id="pen-title">Livestock Pen</h2>
                    <button id="pen-close-btn">&times;</button>
                </div>
                <div class="pen-status-bar">
                    <span id="pen-enclosure-status">Status: Checking...</span>
                    <span id="pen-capacity-status">Animals: 0/6</span>
                </div>
                <div class="pen-body">
                    <div class="pen-section">
                        <h4>Assigned Animal Type</h4>
                        <select id="pen-type-select">
                            <option value="Chickens">Chickens (Hens & Roosters)</option>
                            <option value="Goats">Goats</option>
                        </select>
                    </div>
                    <div class="pen-section">
                        <h4>Feed Level (Seeds / Grain)</h4>
                        <div class="feed-bar-container">
                            <div id="pen-feed-fill" class="feed-bar-fill"></div>
                        </div>
                        <div class="feed-controls">
                            <span id="pen-feed-text">0 / 50</span>
                            <button id="pen-add-feed-btn">+ Deposit Seeds</button>
                        </div>
                    </div>
                    <div class="pen-section">
                        <h4>Pen Output Storage</h4>
                        <div id="pen-output-grid" class="pen-grid"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.container);

        // Bind UI Events
        document.getElementById('pen-close-btn').addEventListener('click', () => this.close());
        document.getElementById('pen-type-select').addEventListener('change', (e) => {
            if (this.activePen) this.activePen.assignedAnimalType = e.target.value;
        });
        document.getElementById('pen-add-feed-btn').addEventListener('click', () => this.depositFeed());
    }

    open(penMarker) {
        this.activePen = penMarker;
        this.container.classList.remove('hidden');
        this.render();
    }

    close() {
        this.container.classList.add('hidden');
        this.activePen = null;
    }

    depositFeed() {
        if (!this.activePen) return;
        // Search player inventory for Seeds or Grain
        const seedItem = this.inventory.items.find(i => i && (i.name === 'Seeds' || i.name === 'Grain'));
        if (seedItem && seedItem.count > 0) {
            const added = this.activePen.addFeed(seedItem.count);
            seedItem.count -= added;
            if (seedItem.count <= 0) {
                const idx = this.inventory.items.indexOf(seedItem);
                this.inventory.items[idx] = null;
            }
            this.inventory.renderInventory();
            this.render();
        }
    }

    render() {
        if (!this.activePen) return;
        const pen = this.activePen;

        // Update Pen Status Header
        const statusEl = document.getElementById('pen-enclosure-status');
        const isEnclosed = pen.checkEnclosure();
        statusEl.innerText = isEnclosed ? 'Status: ✅ Enclosed & Secure' : 'Status: ⚠️ Incomplete Perimeter';
        statusEl.style.color = isEnclosed ? '#2ecc71' : '#e74c3c';

        document.getElementById('pen-capacity-status').innerText = `Animals: ${pen.livestock.length}/${pen.maxCapacity}`;
        document.getElementById('pen-type-select').value = pen.assignedAnimalType;

        // Update Feed Bar
        const feedPct = (pen.feedCount / pen.maxFeed) * 100;
        document.getElementById('pen-feed-fill').style.width = `${feedPct}%`;
        document.getElementById('pen-feed-text').innerText = `${pen.feedCount} / ${pen.maxFeed}`;

        // Render Output Slots
        const grid = document.getElementById('pen-output-grid');
        grid.innerHTML = '';
        pen.outputSlots.forEach((slot, index) => {
            const slotEl = document.createElement('div');
            slotEl.className = 'pen-slot';
            if (slot) {
                slotEl.innerHTML = `
                    <span class="slot-icon">${slot.icon}</span>
                    <span class="slot-count">${slot.count}</span>
                `;
                slotEl.onclick = () => {
                    // Collect finished yield items directly into player inventory
                    this.inventory.addItem(slot.name, slot.count, slot.icon);
                    pen.outputSlots[index] = null;
                    this.render();
                };
            } else {
                slotEl.innerHTML = `<span class="empty-label">Empty</span>`;
            }
            grid.appendChild(slotEl);
        });
    }
}