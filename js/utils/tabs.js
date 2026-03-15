//=============================================
// Tab Navigation Utilities
//=============================================

/**
 * Toggles the active tab and its associated content panel.
 * @param {string} tabName - The value of the tab's `data-tab` attribute.
 */
export function switchTab(tabName) {
    document.querySelectorAll('#app .tab').forEach(tab =>
        tab.classList.toggle('active', tab.dataset.tab === tabName)
    );
    document.querySelectorAll('#app .tab-content').forEach(content =>
        content.classList.toggle('active', content.id === `${tabName}-tab`)
    );
}
