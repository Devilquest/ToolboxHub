import { GlobalSettings, setupSortableGrid } from '../core.js';
import { APP_CONFIG } from '../config.js';

//=============================================
// Home Tool
//=============================================

/**
 * Manages the home dashboard, including tool card reordering.
 */
class Home {
    constructor() {
        this.gallery = document.querySelector('.tools-gallery');
        if (!this.gallery) return;

        this.init();
    }

    /**
     * Initializes the tool gallery and drag-and-drop sorting.
     */
    init() {
        this.restoreOrder();
        
        this.destroySortable = setupSortableGrid(this.gallery, {
            itemSelector: '.tool-card',
            onOrderChange: () => this.saveOrder()
        });
    }

    /**
     * Persists the current tool card order to localStorage.
     */
    saveOrder() {
        const cards = [...this.gallery.querySelectorAll('.tool-card')];
        const order = cards.map(card => {
            const href = card.getAttribute('href');
            return href ? href.split('/').pop() : null;
        }).filter(Boolean);

        GlobalSettings.saveToolData('home', { order });

        if (window.router && typeof window.router.syncSidebarOrder === 'function') {
            window.router.syncSidebarOrder();
        }
    }

    /**
     * Restores tool card order from localStorage or defaults.
     */
    restoreOrder() {
        const data = GlobalSettings.getToolData('home');
        const order = (data && data.order && Array.isArray(data.order)) 
            ? data.order 
            : APP_CONFIG.tools.defaultOrder;

        if (!order || !Array.isArray(order)) return;
        const cards = [...this.gallery.querySelectorAll('.tool-card')];
        
        const cardMap = {};
        cards.forEach(card => {
            const href = card.getAttribute('href');
            if (href) {
                const id = href.split('/').pop();
                cardMap[id] = card;
            }
        });

        order.forEach(id => {
            if (cardMap[id]) {
                this.gallery.appendChild(cardMap[id]);
                delete cardMap[id];
            }
        });

        Object.values(cardMap).forEach(card => {
            this.gallery.appendChild(card);
        });
    }

    /**
     * Cleans up tool resources.
     */
    destroy() {
        if (this.destroySortable) {
            this.destroySortable();
        }
    }
}

export default Home;
