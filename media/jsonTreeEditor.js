// @ts-check

// Script run within the webview itself.
(function () {
    // Get a reference to the VS Code webview api.
    const vscode = acquireVsCodeApi();

    let jsonData = {};
    let expandedNodes = new Set();

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update':
                updateContent(message.text);
                break;
        }
    });

    function updateContent(text) {
        try {
            // Handle empty or whitespace-only text
            const trimmedText = (text || '').trim();
            if (!trimmedText) {
                jsonData = {};
            } else {
                jsonData = JSON.parse(trimmedText);
            }
            hideError();
            renderTree();
        } catch (error) {
            showError('Invalid JSON: ' + error.message);
            // Fallback to empty object on parse error
            jsonData = {};
            renderTree();
        }
    }

    function showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    function hideError() {
        const errorElement = document.getElementById('errorMessage');
        errorElement.style.display = 'none';
    }

    function renderTree() {
        const treeContainer = document.getElementById('jsonTree');
        treeContainer.innerHTML = '';
        
        // Check if jsonData is empty (works for objects, arrays, and other types)
        const isEmpty = jsonData === null || 
                       jsonData === undefined || 
                       (typeof jsonData === 'object' && 
                        ((Array.isArray(jsonData) && jsonData.length === 0) ||
                         (!Array.isArray(jsonData) && Object.keys(jsonData).length === 0)));
        
        if (isEmpty) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'Empty JSON object. Click "添加根属性" to start.';
            emptyMessage.style.color = 'var(--vscode-editor-foreground)';
            emptyMessage.style.fontStyle = 'italic';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '20px';
            treeContainer.appendChild(emptyMessage);
            return;
        }

        // Handle root level arrays and primitive values
        if (Array.isArray(jsonData)) {
            jsonData.forEach((item, index) => {
                const nodeElement = createTreeNode(index.toString(), item, index.toString(), 0, jsonData);
                treeContainer.appendChild(nodeElement);
            });
        } else if (typeof jsonData === 'object' && jsonData !== null) {
            renderObject(jsonData, treeContainer, '', 0);
        } else {
            // Handle primitive root values
            const nodeElement = createTreeNode('root', jsonData, 'root', 0, { root: jsonData });
            treeContainer.appendChild(nodeElement);
        }
    }

    function renderObject(obj, container, path, depth) {
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const currentPath = path ? `${path}.${key}` : key;
            const nodeElement = createTreeNode(key, value, currentPath, depth, obj);
            container.appendChild(nodeElement);
        });
    }

    function createTreeNode(key, value, path, depth, parent) {
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'tree-node';
        nodeDiv.dataset.path = path;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'tree-node-content';

        // Indentation
        for (let i = 0; i < depth; i++) {
            const indent = document.createElement('span');
            indent.className = 'tree-node-indent';
            contentDiv.appendChild(indent);
        }

        // Toggle button for objects and arrays
        const toggle = document.createElement('span');
        toggle.className = 'tree-node-toggle';
        
        const isExpandable = typeof value === 'object' && value !== null;
        if (isExpandable) {
            const isExpanded = expandedNodes.has(path);
            toggle.className += isExpanded ? ' expanded' : ' collapsed';
            toggle.addEventListener('click', () => toggleNode(path));
        } else {
            toggle.className += ' leaf';
        }
        contentDiv.appendChild(toggle);

        // Key
        const keySpan = document.createElement('span');
        keySpan.className = 'tree-node-key';
        
        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.value = key;
        keyInput.addEventListener('blur', () => {
            const newKey = keyInput.value.trim();
            if (newKey && newKey !== key) {
                renameProperty(parent, key, newKey);
            } else {
                keyInput.value = key; // Revert if invalid
            }
        });
        keyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                keyInput.blur();
            }
        });
        keySpan.appendChild(keyInput);
        contentDiv.appendChild(keySpan);

        // Colon
        const colon = document.createElement('span');
        colon.textContent = ': ';
        colon.style.color = 'var(--vscode-editor-foreground)';
        contentDiv.appendChild(colon);

        // Value
        const valueSpan = document.createElement('span');
        valueSpan.className = 'tree-node-value';
        
        if (typeof value === 'object' && value !== null) {
            const objectLabel = document.createElement('span');
            objectLabel.textContent = Array.isArray(value) ? `Array[${value.length}]` : `Object{${Object.keys(value).length}}`;
            objectLabel.style.color = '#4ec9b0';
            objectLabel.style.fontStyle = 'italic';
            valueSpan.appendChild(objectLabel);
        } else {
            const valueInput = createValueInput(value, (newValue) => {
                updateValue(parent, key, newValue);
            });
            valueSpan.appendChild(valueInput);
        }
        contentDiv.appendChild(valueSpan);

        // Type indicator
        const typeSpan = document.createElement('span');
        typeSpan.className = 'tree-node-type';
        typeSpan.textContent = getValueType(value);
        contentDiv.appendChild(typeSpan);

        // Actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'tree-node-actions';
        
        if (typeof value === 'object' && value !== null) {
            const addBtn = document.createElement('button');
            addBtn.className = 'action-btn add';
            addBtn.innerHTML = '+';
            addBtn.title = 'Add property';
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                addProperty(value, path);
            });
            actionsDiv.appendChild(addBtn);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Delete property';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteProperty(parent, key);
        });
        actionsDiv.appendChild(deleteBtn);

        contentDiv.appendChild(actionsDiv);
        nodeDiv.appendChild(contentDiv);

        // Children
        if (isExpandable && expandedNodes.has(path)) {
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'tree-node-children';
            
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    const childPath = `${path}[${index}]`;
                    const childNode = createTreeNode(index.toString(), item, childPath, depth + 1, value);
                    childrenDiv.appendChild(childNode);
                });
            } else {
                renderObject(value, childrenDiv, path, depth + 1);
            }
            
            nodeDiv.appendChild(childrenDiv);
        }

        return nodeDiv;
    }

    function createValueInput(value, onChange) {
        const type = typeof value;
        
        if (type === 'string' && value.includes('\n')) {
            const textarea = document.createElement('textarea');
            textarea.value = value;
            textarea.rows = Math.min(value.split('\n').length, 10);
            textarea.addEventListener('blur', () => onChange(textarea.value));
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    textarea.blur();
                }
            });
            return textarea;
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value === null ? 'null' : value.toString();
            input.className = `value-${type === 'object' && value === null ? 'null' : type}`;
            
            input.addEventListener('blur', () => {
                let newValue;
                const inputValue = input.value.trim();
                
                if (inputValue === 'null') {
                    newValue = null;
                } else if (inputValue === 'true') {
                    newValue = true;
                } else if (inputValue === 'false') {
                    newValue = false;
                } else if (!isNaN(inputValue) && inputValue !== '') {
                    newValue = Number(inputValue);
                } else {
                    newValue = inputValue;
                }
                
                onChange(newValue);
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });
            
            return input;
        }
    }

    function getValueType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    function toggleNode(path) {
        if (expandedNodes.has(path)) {
            expandedNodes.delete(path);
        } else {
            expandedNodes.add(path);
        }
        renderTree();
    }

    function renameProperty(parent, oldKey, newKey) {
        if (parent.hasOwnProperty(newKey)) {
            alert('Property already exists!');
            return;
        }
        
        const value = parent[oldKey];
        delete parent[oldKey];
        parent[newKey] = value;
        
        saveChanges();
    }

    function updateValue(parent, key, newValue) {
        parent[key] = newValue;
        saveChanges();
    }

    // Custom modal dialog functions
    function showCustomPrompt(message, defaultValue = '', callback) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">${message}</div>
                <input type="text" class="modal-input" value="${defaultValue}" />
                <div class="modal-buttons">
                    <button class="modal-btn modal-ok">确定</button>
                    <button class="modal-btn modal-cancel">取消</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const input = modal.querySelector('.modal-input');
        const okBtn = modal.querySelector('.modal-ok');
        const cancelBtn = modal.querySelector('.modal-cancel');
        
        input.focus();
        input.select();
        
        const cleanup = () => {
            document.body.removeChild(modal);
        };
        
        okBtn.addEventListener('click', () => {
            const value = input.value.trim();
            cleanup();
            callback(value);
        });
        
        cancelBtn.addEventListener('click', () => {
            cleanup();
            callback(null);
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const value = input.value.trim();
                cleanup();
                callback(value);
            } else if (e.key === 'Escape') {
                cleanup();
                callback(null);
            }
        });
    }
    
    function showCustomAlert(message, callback) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">${message}</div>
                <div class="modal-buttons">
                    <button class="modal-btn modal-ok">确定</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const okBtn = modal.querySelector('.modal-ok');
        
        const cleanup = () => {
            document.body.removeChild(modal);
            if (callback) callback();
        };
        
        okBtn.addEventListener('click', cleanup);
        okBtn.focus();
        
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                cleanup();
            }
        });
    }
    
    function showCustomConfirm(message, callback) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">${message}</div>
                <div class="modal-buttons">
                    <button class="modal-btn modal-ok">确定</button>
                    <button class="modal-btn modal-cancel">取消</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const okBtn = modal.querySelector('.modal-ok');
        const cancelBtn = modal.querySelector('.modal-cancel');
        
        const cleanup = (result) => {
            document.body.removeChild(modal);
            callback(result);
        };
        
        okBtn.addEventListener('click', () => cleanup(true));
        cancelBtn.addEventListener('click', () => cleanup(false));
        okBtn.focus();
        
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                cleanup(true);
            } else if (e.key === 'Escape') {
                cleanup(false);
            }
        });
    }

    function addProperty(parent, parentPath) {
        showCustomPrompt('输入属性名称:', '', (key) => {
            if (!key || key.trim() === '') return;
            
            const trimmedKey = key.trim();
            if (parent.hasOwnProperty(trimmedKey)) {
                showCustomAlert('属性已存在!');
                return;
            }
            
            showCustomPrompt('输入值类型 (string, number, boolean, object, array, null):', 'string', (type) => {
                if (!type) return;
                
                let defaultValue;
                
                switch (type) {
                    case 'string':
                        defaultValue = '';
                        break;
                    case 'number':
                        defaultValue = 0;
                        break;
                    case 'boolean':
                        defaultValue = false;
                        break;
                    case 'object':
                        defaultValue = {};
                        break;
                    case 'array':
                        defaultValue = [];
                        break;
                    case 'null':
                        defaultValue = null;
                        break;
                    default:
                        defaultValue = '';
                }
                
                parent[trimmedKey] = defaultValue;
                
                // Auto-expand parent if it's an object/array
                if (parentPath) {
                    expandedNodes.add(parentPath);
                }
                
                saveChanges();
            });
        });
    }

    function deleteProperty(parent, key) {
        showCustomConfirm(`确定要删除 "${key}" 吗?`, (confirmed) => {
            if (confirmed) {
                if (Array.isArray(parent)) {
                    parent.splice(parseInt(key), 1);
                } else {
                    delete parent[key];
                }
                saveChanges();
            }
        });
    }



    function saveChanges() {
        vscode.postMessage({
            type: 'save',
            json: jsonData
        });
        renderTree();
    }

    function expandAll() {
        function addAllPaths(obj, path = '') {
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                const currentPath = path ? `${path}.${key}` : key;
                
                if (typeof value === 'object' && value !== null) {
                    expandedNodes.add(currentPath);
                    if (Array.isArray(value)) {
                        value.forEach((item, index) => {
                            if (typeof item === 'object' && item !== null) {
                                addAllPaths({[index]: item}, currentPath);
                            }
                        });
                    } else {
                        addAllPaths(value, currentPath);
                    }
                }
            });
        }
        
        addAllPaths(jsonData);
        renderTree();
    }

    function collapseAll() {
        expandedNodes.clear();
        renderTree();
    }

    function addRootProperty() {
        addProperty(jsonData, '');
    }

    // Event listeners
    document.getElementById('saveBtn').addEventListener('click', () => {
        vscode.postMessage({
            type: 'save',
            json: jsonData
        });
    });


    document.getElementById('expandAllBtn').addEventListener('click', expandAll);
    document.getElementById('collapseAllBtn').addEventListener('click', collapseAll);
    document.getElementById('addRootBtn').addEventListener('click', addRootProperty);

    // Initialize
    updateContent('{}');
})();