// Configure Monaco environment for web workers
window.MonacoEnvironment = {
    getWorkerUrl: function(workerId, label) {
        return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
            self.MonacoEnvironment = {
                baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/'
            };
            importScripts('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/base/worker/workerMain.js');`
        )}`;
    }
};

// Global variables
let editor;
let templatesModal;
let toastContainer;

// Initialize Toast Container
function initToasts() {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
}

// Show Toast Message
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => toastContainer.removeChild(toast), 300);
    }, 3000);
}

// Button Loading State
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        const spinner = document.createElement('span');
        spinner.className = 'loading-spinner';
        button.prepend(spinner);
    } else {
        button.disabled = false;
        const spinner = button.querySelector('.loading-spinner');
        if (spinner) button.removeChild(spinner);
    }
}

// Initialize Monaco Editor
function initMonaco() {
    try {
        // Create editor instance
        editor = monaco.editor.create(document.getElementById('editor-container'), {
            value: defaultTemplate,
            language: 'html',
            wordWrap: 'on',
            wrappingIndent: 'indent',
            autoIndent: 'full',
            formatOnType: true,
            formatOnPaste: true,
            tabSize: 4,
            insertSpaces: true,
            detectIndentation: true,
            trimAutoWhitespace: true,
            theme: 'vs-light',
            minimap: { enabled: false },
            automaticLayout: true,
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            roundedSelection: false,
            occurrencesHighlight: false
        });

        // Setup Undo/Redo keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
            editor.trigger('keyboard', 'undo', null);
            showToast('Änderung rückgängig gemacht', 'info');
        });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
            editor.trigger('keyboard', 'redo', null);
            showToast('Änderung wiederhergestellt', 'info');
        });

        // Additional keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            saveTemplate();
        });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
            beautifyCode();
        });

        // Set up real-time preview
        editor.onDidChangeModelContent(() => {
            updatePreview();
        });

        return true;
    } catch (error) {
        console.error('Monaco initialization error:', error);
        showToast('Editor-Initialisierung fehlgeschlagen', 'error');
        return false;
    }
}

// Initialize application
async function initApp() {
    try {
        // Initialize Toast Container
        initToasts();

        // Initialize Split.js
        Split(['#editor-container', '#preview-container'], {
            sizes: [50, 50],
            minSize: 300,
            gutterSize: 10,
            cursor: 'col-resize'
        });

        // Initialize Bootstrap modal
        templatesModal = new bootstrap.Modal(document.getElementById('templatesModal'));
        
        // Initialize Monaco Editor
        const editorInitialized = initMonaco();
        if (!editorInitialized) {
            throw new Error('Editor initialization failed');
        }

        // Initial preview update
        updatePreview();

        // Set up buttons
        const beautifyBtn = document.getElementById('beautifyBtn');
        const saveBtn = document.getElementById('saveBtn');
        const loadBtn = document.getElementById('loadBtn');
        
        // Add Export Button
        const exportBtn = document.createElement('button');
        exportBtn.id = 'exportBtn';
        exportBtn.className = 'btn btn-outline-light me-2';
        exportBtn.textContent = 'Export';
        exportBtn.title = 'Als HTML-Datei exportieren';
        document.querySelector('.d-flex').insertBefore(exportBtn, document.getElementById('statusIndicator'));

        // Beautify Button
        beautifyBtn.addEventListener('click', async () => {
            setButtonLoading(beautifyBtn, true);
            try {
                beautifyCode();
                showToast('Code formatiert', 'success');
            } catch (error) {
                console.error('Fehler beim Formatieren:', error);
                showToast('Fehler beim Formatieren', 'error');
            } finally {
                setButtonLoading(beautifyBtn, false);
            }
        });

        // Save Button
        saveBtn.addEventListener('click', async () => {
            setButtonLoading(saveBtn, true);
            try {
                const result = await saveTemplate();
                if (result) {
                    showToast(result.status, result.success ? 'success' : 'warning');
                }
            } catch (error) {
                console.error('Fehler beim Speichern:', error);
                showToast('Fehler beim Speichern', 'error');
            } finally {
                setButtonLoading(saveBtn, false);
            }
        });

        // Load Button
        loadBtn.addEventListener('click', async () => {
            setButtonLoading(loadBtn, true);
            try {
                const result = await loadTemplates();
                if (result) {
                    showToast(result.status, result.success ? 'success' : 'warning');
                }
            } catch (error) {
                console.error('Fehler beim Laden:', error);
                showToast('Fehler beim Laden', 'error');
            } finally {
                setButtonLoading(loadBtn, false);
            }
        });

        // Export Button
        exportBtn.addEventListener('click', async () => {
            setButtonLoading(exportBtn, true);
            try {
                const content = editor.getValue();
                const templateName = document.title || 'signature';
                const result = await window.storageManager.exportTemplate(templateName, content);
                showToast(result.status, result.success ? 'success' : 'warning');
            } catch (error) {
                console.error('Fehler beim Exportieren:', error);
                showToast('Fehler beim Exportieren', 'error');
            } finally {
                setButtonLoading(exportBtn, false);
            }
        });

    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Fehler bei der Initialisierung', 'error');
    }
}

// Update preview iframe
function updatePreview() {
    const previewFrame = document.getElementById('preview-frame');
    const content = editor.getValue();
    const previewDocument = previewFrame.contentDocument || previewFrame.contentWindow.document;
    
    // Handle email signature preview with proper XML and DOCTYPE
    const styledContent = content.trim().startsWith('<?xml') ? content : `
        <?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <style type="text/css">
                body {
                    margin: 20px;
                    font-family: Arial, sans-serif;
                    line-height: 1.4;
                }
                .signature {
                    max-width: 600px;
                    margin: 0 auto;
                }
                a {
                    color: inherit;
                    text-decoration: none;
                }
                img {
                    border: 0;
                    display: inline-block;
                    vertical-align: middle;
                }
            </style>
        </head>
        <body>${content}</body>
        </html>
    `;
    
    previewDocument.open();
    previewDocument.write(styledContent);
    previewDocument.close();
}

// Beautify code
function beautifyCode() {
    const content = editor.getValue();
    const beautifiedContent = html_beautify(content, {
        indent_size: 4,
        indent_char: ' ',
        max_preserve_newlines: 2,
        preserve_newlines: true,
        keep_array_indentation: false,
        break_chained_methods: false,
        indent_scripts: 'normal',
        brace_style: 'collapse',
        space_before_conditional: true,
        unescape_strings: false,
        jslint_happy: false,
        end_with_newline: false,
        wrap_line_length: 0,
        indent_inner_html: false,
        comma_first: false,
        e4x: false,
        indent_empty_lines: false
    });
    editor.setValue(beautifiedContent);
}

// Save template
async function saveTemplate() {
    const templateName = prompt('Template-Namen eingeben:');
    if (templateName) {
        return await window.storageManager.saveTemplate(templateName, editor.getValue());
    }
    return null;
}

// Load templates
async function loadTemplates() {
    const templatesList = document.getElementById('templatesList');
    templatesList.innerHTML = '<div class="text-center"><span class="loading-spinner"></span> Lade Templates...</div>';

    try {
        const result = await window.storageManager.loadAllTemplates();
        templatesList.innerHTML = '';

        if (!result.success || !result.data || result.data.length === 0) {
            templatesList.innerHTML = '<div class="text-center text-muted">Keine Templates gefunden</div>';
            return result;
        }

        result.data.forEach(template => {
            const item = document.createElement('button');
            item.className = 'list-group-item list-group-item-action';
            item.innerHTML = `
                <div>
                    <strong>${template.name}</strong>
                    <div class="template-info">
                        Kategorie: ${template.category}
                        ${template.tags?.length ? `• Tags: ${template.tags.join(', ')}` : ''}
                        • Zuletzt bearbeitet: ${new Date(template.updated_at).toLocaleString()}
                    </div>
                </div>
            `;
            
            item.addEventListener('click', async () => {
                try {
                    const loadResult = await window.storageManager.loadTemplate(template.name);
                    if (loadResult.success && loadResult.data) {
                        editor.setValue(loadResult.data.content);
                        templatesModal.hide();
                        updatePreview();
                        showToast(loadResult.status, 'success');
                    } else {
                        showToast(loadResult.status, 'error');
                    }
                } catch (error) {
                    console.error('Fehler beim Laden:', error);
                    showToast('Fehler beim Laden des Templates', 'error');
                }
            });
            
            templatesList.appendChild(item);
        });
        
        templatesModal.show();
        return result;
    } catch (error) {
        console.error('Fehler beim Laden der Templates:', error);
        templatesList.innerHTML = '<div class="text-center text-danger">Fehler beim Laden der Templates</div>';
        return { success: false, status: 'Fehler beim Laden der Templates' };
    }
}

// Default template
const defaultTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <style type="text/css">body{font-family:Helvetica,Arial;font-size:13px}</style>
        <title></title>
    </head>
    <body>
        <div id="bloop_customfont" style="font-family:Helvetica,Arial;font-size:13px; margin: 0px; line-height: auto;">
            <br />
        </div>
        <br />
        <div class="bloop_sign" id="bloop_sign_1737578403264212224">
            <div>
                <br />
            </div>
            <div style="font-size: 16px; line-height: 18px; letter-spacing: 0.1px">
                <b>sonder studio</b>
            </div>
            <div style="font-size: 12px; line-height: 18px; letter-spacing: 0.1px">Here to point out you're special.
</div>
            <div style="font-size: 12px; line-height: 18px; letter-spacing: 0.1px">Branding &amp; Websites
</div>
            <br />
            <div style="font-size: 12px; line-height: 18px; letter-spacing: 0.1px">
                <b>Heiko Dietze</b>
            </div>
            <div style="font-size: 12px; line-height: 18px; letter-spacing: 0.1px">Inhaber
</div>
            <br />
            <div style="font-size: 12px; line-height: 17px; letter-spacing: 0.1px">t             <a href="tel:+4915773272022" style="color: black; text-decoration: none;">+49 1577 32 72 022</a>
                
</div>
            <div style="font-size: 12px; line-height: 17px; letter-spacing: 0.1px">w            <a href="https://sonder.design/?utm_source=Email-Footer&amp;utm_medium=Email" style="color: black; text-decoration: none;">sonder.design</a>
                
</div>
            <div style="font-size: 12px; line-height: 17px; letter-spacing: 0.1px">m            <a href="mailto:heiko@sonder.design" style="color: black; text-decoration: none;">heiko@sonder.design</a>
                
</div>
            <div style="font-size: 12px; line-height: 17px; letter-spacing: 0.1px">s             <a href="https://www.instagram.co%C2%A0m/sonder.baby/?hl=de" style="color: black; text-decoration: none;">Instagram</a>
                        <a href="https://www.linkedin.com/in/heiko-dietze/" style="color: black; text-decoration: none;">LinkedIn</a>
                
</div>
            <div style="font-size: 12px; line-height: 18px; letter-spacing: 0.1px">a             <a href="https://maps.app.goo.gl/2jXD6fAwMQ3kDHvB9" style="color: black; text-decoration: none;">Spreestudios, Köpenicker Chaussee 4, 10317 Berlin <span style="text-decoration: underline">(zur Route)</span>
                </a>
                
</div>
            <br />
            <div style="font-size: 12px; line-height: 18px; letter-spacing: 0.1px; display: flex; align-items: center;">
                <img src="https://i.postimg.cc/d3TD6Jhv/Signet-Sonder-Studio.png" alt="Signet Sonder Studio" style="width: 18px; margin-top: 0px; margin-right: 8px" />
                 Neueste Cases: <a href="https://hpt-event.de" style="color: black;">HPT Event</a>
                  und <a href="https://dinabios.com" style="color: black;">DiNABIOS</a>
                 .
</div>
            <div style="font-size: 12px; line-height: 18px; letter-spacing: 0.1px; margin-top: 8px; display: flex; align-items: center;">
                <img src="https://i.postimg.cc/C17R5cWT/Logo-ADC.png" alt="Signet Sonder Studio" style="width: 20px; margin-top: 0px; margin-right: 8px" />
                 2x ausgezeichnet vom ADC (Art Directors Club) 2023.
</div>
            <div style="font-size: 12px; line-height: 18px; letter-spacing: 0.1px; margin-top: 8px; display: flex; align-items: center;">
                <img src="https://i.postimg.cc/y6rFTNbq/Logo-Berliner-Marketingclub.png" alt="Signet Sonder Studio" style="width: 18px; margin-top: 0px; margin-right: 10px" />
                 Silber beim Berliner Marketingpreis 2022 und 2023.
</div>
        </div>
    </body>
</html>`;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
