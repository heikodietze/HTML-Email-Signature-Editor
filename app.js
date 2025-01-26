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
            showToast('Template gespeichert', 'success');
        });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
            beautifyCode();
            showToast('Code formatiert', 'success');
        });

        // Set up real-time preview
        editor.onDidChangeModelContent(() => {
            updatePreview();
            showToast('Vorschau aktualisiert', 'info');
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

        // Set up button event listeners
        document.getElementById('beautifyBtn').addEventListener('click', () => {
            beautifyCode();
            showToast('Code formatiert', 'success');
        });
        document.getElementById('saveBtn').addEventListener('click', () => {
            saveTemplate();
            showToast('Template gespeichert', 'success');
        });
        document.getElementById('loadBtn').addEventListener('click', loadTemplates);

        // Check storage connection
        const isOnline = await storageManager.checkConnection();
        showToast(`Storage: ${isOnline ? 'Online' : 'Offline'}`, isOnline ? 'success' : 'info');

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
        try {
            await window.storageManager.saveTemplate(templateName, editor.getValue());
            showToast(`Template "${templateName}" gespeichert`, 'success');
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            showToast('Fehler beim Speichern', 'error');
        }
    }
}

// Load templates
async function loadTemplates() {
    const templatesList = document.getElementById('templatesList');
    templatesList.innerHTML = '';

    try {
        const templates = await window.storageManager.loadAllTemplates();
        templates.forEach(template => {
            const item = document.createElement('button');
            item.className = 'list-group-item list-group-item-action';
            item.textContent = template.name;
            item.addEventListener('click', async () => {
                try {
                    const fullTemplate = await storageManager.loadTemplate(template.name);
                    if (fullTemplate) {
                        editor.setValue(fullTemplate.content);
                        templatesModal.hide();
                        updatePreview();
                        showToast(`Template "${template.name}" geladen`, 'success');
                    }
                } catch (error) {
                    console.error('Fehler beim Laden:', error);
                    showToast('Fehler beim Laden des Templates', 'error');
                }
            });
            templatesList.appendChild(item);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Templates:', error);
        showToast('Fehler beim Laden der Templates', 'error');
    }
    
    templatesModal.show();
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
