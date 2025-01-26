class StorageManager {
    constructor() {
        this.isOnline = false;
        this.initialized = false;
        this.statusIndicator = document.getElementById('statusIndicator');
        
        // Warte auf DOMContentLoaded und Supabase-Initialisierung
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeWhenReady();
        });
    }

    // Warte auf Supabase-Client
    async initializeWhenReady() {
        console.log('StorageManager: Warte auf Supabase-Client...');
        
        // Maximal 10 Versuche, alle 500ms
        for (let i = 0; i < 10; i++) {
            if (window.supabaseClient) {
                await this.init();
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!this.initialized) {
            console.error('StorageManager: Timeout beim Warten auf Supabase-Client');
            this.updateUI('Offline (Timeout)');
        }
    }

    // Status-Indikator aktualisieren
    updateUI(status = '') {
        if (!this.statusIndicator) return;
        
        this.statusIndicator.className = `status-indicator ${this.isOnline ? 'status-online' : 'status-offline'}`;
        this.statusIndicator.innerHTML = status || (this.isOnline ? 'Online' : 'Offline');
    }

    // Initialisierung
    async init() {
        console.log('StorageManager: Initialisierung...');
        if (!window.supabaseClient) {
            console.error('StorageManager: Supabase Client nicht verfügbar');
            this.isOnline = false;
            this.updateUI('Offline (Kein Client)');
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
            this.updateUI();
        } catch (error) {
            console.error('StorageManager: Initialisierungsfehler:', error);
            this.isOnline = false;
            this.updateUI('Offline (Fehler)');
        }
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

        // Immer zuerst lokal speichern
        this.saveToLocalStorage(name, templateData);
        let status = 'Lokal gespeichert';

        // Versuche in Supabase zu speichern
        if (await this.checkConnection()) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('templates')
                    .upsert([templateData], {
                        onConflict: 'name',
                        returning: true
                    });

                if (error) throw error;
                status = 'Template gespeichert';
                return { success: true, data: data[0], status };
            } catch (error) {
                console.error('Fehler beim Speichern in Supabase:', error);
                return { success: false, data: templateData, status };
            }
        }

        return { success: false, data: templateData, status };
    }

    // Template laden
    async loadTemplate(name) {
        // Zuerst aus lokalem Speicher laden
        const localTemplate = this.loadFromLocalStorage(name);
        
        // Wenn online, versuche aktuellere Version von Supabase zu laden
        if (await this.checkConnection()) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('templates')
                    .select('*')
                    .eq('name', name)
                    .single();

                if (error) throw error;
                if (data) {
                    // Lokalen Speicher aktualisieren
                    this.saveToLocalStorage(name, data);
                    return { success: true, data, status: 'Template geladen' };
                }
            } catch (error) {
                console.error('Fehler beim Laden von Supabase:', error);
            }
        }

        // Fallback: Lokale Version
        return localTemplate ? 
            { success: true, data: localTemplate, status: 'Lokale Version geladen' } :
            { success: false, status: 'Template nicht gefunden' };
    }

    // Alle Templates laden
    async loadAllTemplates() {
        // Zuerst lokale Templates laden
        const localTemplates = this.loadAllFromLocalStorage();
        
        // Wenn online, versuche Templates von Supabase zu laden
        if (await this.checkConnection()) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('templates')
                    .select('*')
                    .order('name');

                if (error) throw error;
                if (data) {
                    // Lokalen Speicher aktualisieren
                    data.forEach(template => {
                        this.saveToLocalStorage(template.name, template);
                    });
                    return { success: true, data, status: 'Templates geladen' };
                }
            } catch (error) {
                console.error('Fehler beim Laden aller Templates:', error);
            }
        }

        // Fallback: Lokale Templates
        return { 
            success: true, 
            data: localTemplates, 
            status: this.isOnline ? 'Templates geladen' : 'Lokale Templates geladen'
        };
    }

    // Template löschen
    async deleteTemplate(name) {
        // Bestätigungsdialog
        if (!confirm(`Möchten Sie das Template "${name}" wirklich löschen?`)) {
            return { success: false, status: 'Löschen abgebrochen' };
        }

        // Aus lokalem Speicher entfernen
        this.removeFromLocalStorage(name);
        let status = 'Lokal gelöscht';

        // Wenn online, auch aus Supabase löschen
        if (await this.checkConnection()) {
            try {
                const { error } = await window.supabaseClient
                    .from('templates')
                    .delete()
                    .eq('name', name);

                if (error) throw error;
                status = 'Template gelöscht';
                return { success: true, status };
            } catch (error) {
                console.error('Fehler beim Löschen aus Supabase:', error);
                return { success: false, status };
            }
        }

        return { success: true, status };
    }

    // Template als HTML-Datei exportieren
    exportTemplate(name, content) {
        const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return { success: true, status: 'Template exportiert' };
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
}

// Globale Instanz erstellen
window.storageManager = new StorageManager();