// Supabase Client Konfiguration
const supabaseUrl = 'https://fwqaogdvoalqdfiqnhfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3cWFvZ2R2b2FscWRmaXFuaGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4OTU3MzAsImV4cCI6MjA1MzQ3MTczMH0.NZ0QYOj-15KTbT-ZlfRh9Le6JquI3gC7JPWmvDWDXvQ';

// Warte auf DOM-Laden
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisiere Supabase...');
    console.log('Supabase verfügbar:', !!window.supabase);
    
    try {
        // Erstelle Supabase Client
        window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('Supabase Client erstellt:', !!window.supabaseClient);
        
        // Test-Query
        window.supabaseClient
            .from('templates')
            .select('count')
            .then(response => {
                console.log('Supabase Test-Query:', response);
            })
            .catch(error => {
                console.error('Supabase Test-Query Fehler:', error);
            });
    } catch (error) {
        console.error('Supabase Initialisierungsfehler:', error);
    }
});