// Configure Monaco loader
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }});
window.MonacoEnvironment = {
    getWorkerUrl: function() {
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

// Initialize Monaco Editor
function initMonaco() {
    return new Promise(resolve => {
        require(['vs/editor/editor.main'], function() {
            editor = monaco.editor.create(document.getElementById('editor-container'), {
                value: `<?xml version="1.0" encoding="UTF-8"?>
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
</html>`,
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
                wordWrap: 'on',
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                roundedSelection: false,
                occurrencesHighlight: false,
                formatOnPaste: true,
                formatOnType: true
            });
            resolve();
        });
    });
}

// Initialize application
async function initApp() {
    try {
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
        await initMonaco();

        // Set up real-time preview
        editor.onDidChangeModelContent(updatePreview);
        updatePreview();

        // Set up button event listeners
        document.getElementById('beautifyBtn').addEventListener('click', beautifyCode);
        document.getElementById('saveBtn').addEventListener('click', saveTemplate);
        document.getElementById('loadBtn').addEventListener('click', loadTemplates);

    } catch (error) {
        console.error('Initialization error:', error);
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
function saveTemplate() {
    const templateName = prompt('Enter template name:');
    if (templateName) {
        const templates = JSON.parse(localStorage.getItem('emailTemplates') || '{}');
        templates[templateName] = {
            content: editor.getValue(),
            created: new Date().toISOString()
        };
        localStorage.setItem('emailTemplates', JSON.stringify(templates));
    }
}

// Load templates
function loadTemplates() {
    const templatesList = document.getElementById('templatesList');
    const templates = JSON.parse(localStorage.getItem('emailTemplates') || '{}');
    
    templatesList.innerHTML = '';
    Object.entries(templates).forEach(([name, template]) => {
        const item = document.createElement('button');
        item.className = 'list-group-item list-group-item-action';
        item.textContent = name;
        item.addEventListener('click', () => {
            editor.setValue(template.content);
            templatesModal.hide();
            updatePreview();
        });
        templatesList.appendChild(item);
    });
    
    templatesModal.show();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
