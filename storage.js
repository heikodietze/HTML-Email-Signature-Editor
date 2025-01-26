class StorageManager {
    constructor() {
        this.isOnline = false;
        this.syncQueue = [];
        this.initialized = false;
        this.statusIndicator = document.getElementById('statusIndicator');
        
        // Warte auf DOMContentLoaded und Supabase-Initialisierung
        document.addEventListener('DOMContentLoaded', () => {
            // Warte kurz, bis Supabase initialisiert ist
            setTimeout(() => this.init(), 100);
        });
    }

    // UI-Status aktualisieren
    updateUI() {
        // Status-Indikator aktualisieren
        if (this.statusIndicator) {
            this.statusIndicator.className = `status-indicator ${this.isOnline ? 'status-online' : 'status-offline'}`;
            this.statusIndicator.innerHTML = `
                ${this.isOnline ? 'Online' : 'Offline'}
                ${this.syncQueue.length > 0 ? `(${this.syncQueue.length} pending)` : ''}
            `;
        }

        // Sync-Button aktualisieren
        if (typeof window.updateSyncButton === 'function') {
            window.updateSyncButton();
        }

        // Debug-Information
        if (this.syncQueue.length > 0) {
            console.log('Ausstehende Änderungen:', this.syncQueue);
        }
    }

    // Initialisierung
    async init() {
        console.log('StorageManager: Initialisierung...');
        if (!window.supabaseClient) {
            console.error('StorageManager: Supabase Client nicht verfügbar');
            this.isOnline = false;
            this.updateUI();
            return;
        }

        try {
            const { data, error } = await window.supabaseClient
                .from('templates')
                .select('id')
                .limit(1);
            
            this.isOnline = !error;
            this.initialized = true;
            console.log('StorageManager: Initialisierung abgeschlossen, Online:', this.isOnline);
            
            // Versuche sofort zu synchronisieren
            if (this.isOnline && this.syncQueue.length > 0) {
                console.log('Versuche ausstehende Änderungen zu synchronisieren...');
                await this.syncQueuedChanges();
            }
        } catch (error) {
            console.error('StorageManager: Initialisierungsfehler:', error);
            this.isOnline = false;
        }
        
        this.updateUI();

        // Regelmäßige Synchronisierung
        setInterval(() => {
            if (this.isOnline && this.syncQueue.length > 0) {
                console.log('Automatische Synchronisierung...');
                this.syncQueuedChanges();
            }
        }, 5000); // Alle 5 Sekunden
    }

    // Verbindungsstatus prüfen
    async checkConnection() {
        if (!this.initialized) {
            await this.init();
        }
        return this.isOnline;
    }

    // Template speichern
    async saveTemplate(name, content, category = 'default', tags = []) {
        const templateData = {
            name,
            content,
            category,
            tags,
            updated_at: new Date().toISOString()
        };

        try {
            if (await this.checkConnection()) {
                console.log('Speichere Template direkt in Supabase...');
                const { data, error } = await window.supabaseClient
                    .from('templates')
                    .upsert([templateData], {
                        onConflict: 'name',
                        returning: true
                    });

                if (error) throw error;
                
                // Lokale Kopie aktualisieren
                this.saveToLocalStorage(name, data[0]);
                return data[0];
            }
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            console.log('Füge Änderung zur Warteschlange hinzu...');
            this.queueChange('save', templateData);
            this.updateUI();
        }

        // Fallback: Lokale Speicherung
        this.saveToLocalStorage(name, templateData);
        return templateData;
    }

    // Template laden
    async loadTemplate(name) {
        try {
            if (await this.checkConnection()) {
                const { data, error } = await window.supabaseClient
                    .from('templates')
                    .select('*')
                    .eq('name', name)
                    .single();

                if (error) throw error;
                if (data) {
                    this.saveToLocalStorage(name, data);
                    return data;
                }
            }
        } catch (error) {
            console.error('Fehler beim Laden:', error);
        }

        // Fallback: Lokaler Speicher
        return this.loadFromLocalStorage(name);
    }

    // Alle Templates laden
    async loadAllTemplates() {
        try {
            if (await this.checkConnection()) {
                const { data, error } = await window.supabaseClient
                    .from('templates')
                    .select('*')
                    .order('name');

                if (error) throw error;
                if (data) {
                    // Lokalen Cache aktualisieren
                    data.forEach(template => {
                        this.saveToLocalStorage(template.name, template);
                    });
                    return data;
                }
            }
        } catch (error) {
            console.error('Fehler beim Laden aller Templates:', error);
        }

        // Fallback: Lokaler Speicher
        return this.loadAllFromLocalStorage();
    }

    // Template löschen
    async deleteTemplate(name) {
        try {
            if (await this.checkConnection()) {
                const { error } = await window.supabaseClient
                    .from('templates')
                    .delete()
                    .eq('name', name);

                if (error) throw error;
            } else {
                this.queueChange('delete', { name });
                this.updateStatusIndicator();
            }
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            this.queueChange('delete', { name });
            this.updateStatusIndicator();
        }

        // Aus lokalem Speicher entfernen
        this.removeFromLocalStorage(name);
    }

    // Lokale Speicherung
    saveToLocalStorage(name, data) {
        const templates = JSON.parse(localStorage.getItem('emailTemplates') || '{}');
        templates[name] = data;
        localStorage.setItem('emailTemplates', JSON.stringify(templates));
    }

    // Aus lokalem Speicher laden
    loadFromLocalStorage(name) {
        const templates = JSON.parse(localStorage.getItem('emailTemplates') || '{}');
        return templates[name];
    }

    // Alle lokalen Templates laden
    loadAllFromLocalStorage() {
        const templates = JSON.parse(localStorage.getItem('emailTemplates') || '{}');
        return Object.values(templates);
    }

    // Aus lokalem Speicher entfernen
    removeFromLocalStorage(name) {
        const templates = JSON.parse(localStorage.getItem('emailTemplates') || '{}');
        delete templates[name];
        localStorage.setItem('emailTemplates', JSON.stringify(templates));
    }

    // Änderung in Warteschlange einreihen
    queueChange(action, data) {
        this.syncQueue.push({
            action,
            data,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
        this.updateStatusIndicator();
        console.log(`Änderung zur Warteschlange hinzugefügt (${action}):`, data);
    }

    // Warteschlange synchronisieren
    async syncQueuedChanges() {
        if (!this.isOnline) return;

        const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
        const newQueue = [];

        console.log(`Starte Synchronisierung von ${queue.length} Änderungen...`);

        for (const item of queue) {
            try {
                console.log(`Verarbeite ${item.action} für:`, item.data);
                
                if (item.action === 'save') {
                    const { error } = await window.supabaseClient
                        .from('templates')
                        .upsert([item.data], {
                            onConflict: 'name'
                        });
                    if (error) throw error;
                    console.log('Speichern erfolgreich');
                } else if (item.action === 'delete') {
                    const { error } = await window.supabaseClient
                        .from('templates')
                        .delete()
                        .eq('name', item.data.name);
                    if (error) throw error;
                    console.log('Löschen erfolgreich');
                }
            } catch (error) {
                console.error('Fehler bei der Synchronisation:', error);
                console.log('Behalte Änderung in der Warteschlange');
                newQueue.push(item);
            }
        }

        this.syncQueue = newQueue;
        localStorage.setItem('syncQueue', JSON.stringify(newQueue));
        this.updateUI();
        
        console.log(`Synchronisierung abgeschlossen. ${newQueue.length} Änderungen verbleiben in der Warteschlange.`);
    }
}

// Globale Instanz erstellen
window.storageManager = new StorageManager();