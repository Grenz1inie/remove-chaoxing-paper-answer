/**
 * NoteEditor - 富文本笔记编辑器
 * 提供所见即所得的笔记编辑功能
 * @version 3.12.0.3
 */
class NoteEditor {
    constructor(questionId, questionNo, workKey, dbManager, config, styleGenerator) {
        this.questionId = questionId;
        this.questionNo = questionNo;
        this.workKey = workKey;
        this.dbManager = dbManager;
        this.config = config;
        this.styleGenerator = styleGenerator;
        this.container = null;
        this.editor = null;
        this.toolbar = null;
        this.saveTimer = null;
        this.isVisible = false;
        this.isEditMode = false; // 初始为预览模式
        this.toolbarButtons = new Map(); // 存储按钮引用
    }

    async create() {
        const noteConfig = this.config.get('noteEditor');

        // 创建容器
        this.container = DOMHelper.createElement('div', {
            style: {
                display: 'none',
                marginTop: '12px'
            }
        });

        // 创建工具栏
        this.toolbar = this._createToolbar();
        this.container.appendChild(this.toolbar);

        // 创建编辑器（初始为预览模式）
        this.editor = DOMHelper.createElement('div', {
            contentEditable: 'false',
            style: {
                width: noteConfig.width || '100%',
                minHeight: noteConfig.minHeight,
                maxHeight: noteConfig.maxHeight,
                padding: noteConfig.padding,
                fontSize: noteConfig.fontSize,
                border: `${noteConfig.borderWidth} ${noteConfig.borderStyle} ${noteConfig.borderColor}`,
                borderRadius: noteConfig.borderRadius,
                backgroundColor: noteConfig.backgroundColor,
                color: noteConfig.textColor,
                fontFamily: noteConfig.fontFamily,
                overflowY: 'auto',
                overflowX: 'auto',
                outline: 'none',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                cursor: 'default'
            }
        });

        this.editor.setAttribute('data-placeholder', noteConfig.placeholder);

        // 添加占位符样式
        const style = document.createElement('style');
        style.textContent = `
            [contenteditable][data-placeholder]:empty:before {
                content: attr(data-placeholder);
                color: #a0aec0;
                cursor: text;
            }
            [contenteditable] h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
            [contenteditable] h2 { font-size: 1.5em; font-weight: bold; margin: 0.75em 0; }
            [contenteditable] h3 { font-size: 1.17em; font-weight: bold; margin: 0.83em 0; }
            [contenteditable] ul, [contenteditable] ol { margin: 1em 0; padding-left: 2em; }
            [contenteditable] li { margin: 0.5em 0; }
            [contenteditable] blockquote { 
                border-left: 4px solid #cbd5e0; 
                padding-left: 1em; 
                margin: 1em 0;
                color: #718096;
                font-style: italic;
            }
            [contenteditable] code {
                background: #f7fafc;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
            }
            [contenteditable] pre {
                background: #2d3748;
                color: #e2e8f0;
                padding: 12px;
                border-radius: 4px;
                overflow-x: auto;
                margin: 1em 0;
            }
            [contenteditable] a {
                color: #4299e1;
                text-decoration: underline;
            }
            [contenteditable] hr {
                border: none;
                border-top: 2px solid #e2e8f0;
                margin: 1.5em 0;
            }
        `;
        document.head.appendChild(style);

        // 加载已保存的笔记
        try {
            const savedContent = await this.dbManager.getNote(this.workKey, this.questionId, this.questionNo);
            if (savedContent) {
                this.editor.innerHTML = this._sanitizeHTML(savedContent);
            }
        } catch (error) {
            Logger.error(this.config.get('messages.noteLoadError'), error);
        }

        // 监听输入事件
        this.editor.addEventListener('input', () => {
            this._scheduleAutoSave();
        });

        // 监听光标移动和选择变化
        this.editor.addEventListener('mouseup', () => this._updateToolbarState());
        this.editor.addEventListener('keyup', () => this._updateToolbarState());
        this.editor.addEventListener('click', () => this._updateToolbarState());

        // 移除自动进入编辑模式的焦点事件处理
        // 编辑/预览模式切换将由切换按钮控制

        // 处理快捷键
        this.editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this._execCommand('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this._execCommand('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this._execCommand('underline');
                        break;
                }
            }
        });

        this.container.appendChild(this.editor);
        return this.container;
    }

    _createToolbar() {
        const toolbar = DOMHelper.createElement('div', {
            style: {
                display: 'none',
                flexWrap: 'wrap',
                gap: '4px',
                padding: '8px',
                backgroundColor: '#f7fafc',
                borderRadius: '6px 6px 0 0',
                border: '1px solid #e2e8f0',
                borderBottom: 'none'
            }
        });

        const buttons = [
            { icon: '𝐁', title: '粗体 (Ctrl+B)', command: 'bold' },
            { icon: '𝐼', title: '斜体 (Ctrl+I)', command: 'italic', style: 'font-style: italic;' },
            { icon: 'U̲', title: '下划线 (Ctrl+U)', command: 'underline', style: 'text-decoration: underline;' },
            { icon: 'S̶', title: '删除线', command: 'strikeThrough', style: 'text-decoration: line-through;' },
            { type: 'separator' },
            { icon: 'H1', title: '标题1', command: 'formatBlock', value: '<h1>' },
            { icon: 'H2', title: '标题2', command: 'formatBlock', value: '<h2>' },
            { icon: 'H3', title: '标题3', command: 'formatBlock', value: '<h3>' },
            { type: 'separator' },
            { icon: '•', title: '无序列表', command: 'insertUnorderedList' },
            { icon: '1.', title: '有序列表', command: 'insertOrderedList' },
            { icon: '"', title: '引用', command: 'formatBlock', value: '<blockquote>' },
            { type: 'separator' },
            { icon: '🔗', title: '插入链接', command: 'createLink', prompt: true },
            { icon: '</>', title: '代码', command: 'code' },
            { icon: '—', title: '分隔线', command: 'insertHorizontalRule' },
            { type: 'separator' },
            { icon: '↶', title: '撤销', command: 'undo' },
            { icon: '↷', title: '重做', command: 'redo' },
            { icon: '🗑', title: '清除格式', command: 'removeFormat' }
        ];

        buttons.forEach(btn => {
            if (btn.type === 'separator') {
                const separator = DOMHelper.createElement('div', {
                    style: {
                        width: '1px',
                        height: '20px',
                        backgroundColor: '#cbd5e0',
                        margin: '0 4px'
                    }
                });
                toolbar.appendChild(separator);
            } else {
                const button = DOMHelper.createElement('button', {
                    innerHTML: btn.icon,
                    title: btn.title,
                    style: {
                        padding: '6px 10px',
                        border: '1px solid #cbd5e0',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                        ...(btn.style ? this._parseStyle(btn.style) : {})
                    }
                });

                button.addEventListener('mouseenter', () => {
                    const isActive = button.style.backgroundColor === 'rgb(66, 153, 225)' ||
                        button.style.backgroundColor === '#4299e1';
                    if (!isActive) {
                        button.style.backgroundColor = '#e2e8f0';
                    }
                });

                button.addEventListener('mouseleave', () => {
                    const isActive = button.style.color === 'white';
                    if (!isActive) {
                        button.style.backgroundColor = 'white';
                    }
                });

                button.addEventListener('mousedown', (e) => {
                    e.preventDefault();

                    // 保存当前选区
                    const selection = window.getSelection();
                    let savedRange = null;
                    if (selection.rangeCount > 0) {
                        savedRange = selection.getRangeAt(0);
                    }

                    if (btn.prompt) {
                        // 处理链接插入
                        const url = prompt('请输入链接地址:');
                        if (url) {
                            // 恢复选区
                            if (savedRange) {
                                selection.removeAllRanges();
                                selection.addRange(savedRange);
                            }
                            this._execCommand(btn.command, url);
                        }
                    } else if (btn.value) {
                        // 恢复选区
                        if (savedRange) {
                            selection.removeAllRanges();
                            selection.addRange(savedRange);
                        }
                        this._execCommand(btn.command, btn.value);
                    } else if (btn.command === 'code') {
                        // 恢复选区
                        if (savedRange) {
                            selection.removeAllRanges();
                            selection.addRange(savedRange);
                        }
                        this._toggleCodeStyle();
                    } else if (btn.command) {
                        // 恢复选区
                        if (savedRange) {
                            selection.removeAllRanges();
                            selection.addRange(savedRange);
                        }
                        this._execCommand(btn.command);
                    }

                    // 确保编辑器获得焦点
                    setTimeout(() => {
                        this.editor.focus();
                        this._updateToolbarState();
                    }, 10);
                });

                // 保存按钮引用
                if (btn.command) {
                    this.toolbarButtons.set(btn.command, button);
                }

                toolbar.appendChild(button);
            }
        });

        return toolbar;
    }

    _parseStyle(styleString) {
        const styles = {};
        styleString.split(';').forEach(rule => {
            const [key, value] = rule.split(':').map(s => s.trim());
            if (key && value) {
                const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                styles[camelKey] = value;
            }
        });
        return styles;
    }

    _execCommand(command, value = null) {
        document.execCommand(command, false, value);
        this._updateToolbarState();
    }

    _updateToolbarState() {
        // 更新可切换状态的按钮
        const commands = ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'];

        commands.forEach(command => {
            const button = this.toolbarButtons.get(command);
            if (button) {
                const isActive = document.queryCommandState(command);
                if (isActive) {
                    button.style.backgroundColor = '#4299e1';
                    button.style.color = 'white';
                    button.style.borderColor = '#3182ce';
                } else {
                    button.style.backgroundColor = 'white';
                    button.style.color = 'inherit';
                    button.style.borderColor = '#cbd5e0';
                }
            }
        });
    }

    _toggleCodeStyle() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        if (selectedText) {
            const code = document.createElement('code');
            code.textContent = selectedText;

            try {
                range.deleteContents();
                range.insertNode(code);

                // 恢复光标位置到代码块之后
                range.setStartAfter(code);
                range.setEndAfter(code);
                selection.removeAllRanges();
                selection.addRange(range);

                this.editor.focus();
            } catch (error) {
                Logger.error('插入代码失败', error);
            }
        } else {
            // 如果没有选中文本，在光标位置插入代码标记
            const code = document.createElement('code');
            code.textContent = '代码';

            try {
                range.insertNode(code);
                range.setStartAfter(code);
                range.setEndAfter(code);
                selection.removeAllRanges();
                selection.addRange(range);
                this.editor.focus();
            } catch (error) {
                Logger.error('插入代码失败', error);
            }
        }
    }

    _sanitizeHTML(html) {
        // 基本的 HTML 清理，防止 XSS
        const div = document.createElement('div');
        div.innerHTML = html;

        // 移除危险的标签和属性
        const scripts = div.querySelectorAll('script, iframe, object, embed');
        scripts.forEach(el => el.remove());

        return div.innerHTML;
    }

    _scheduleAutoSave() {
        // 检查自动保存是否启用
        this.dbManager.getSetting('autoSave', this.config.get('settings.autoSave'))
            .then(autoSaveEnabled => {
                if (!autoSaveEnabled) return;

                if (this.saveTimer) {
                    clearTimeout(this.saveTimer);
                }

                this.dbManager.getSetting('autoSaveDelay', this.config.get('settings.autoSaveDelay'))
                    .then(delay => {
                        this.saveTimer = setTimeout(async () => {
                            await this.save();
                        }, delay);
                    });
            });
    }

    async save() {
        try {
            const content = this.editor.innerHTML;
            await this.dbManager.saveNote(this.workKey, this.questionId, this.questionNo, content);
        } catch (error) {
            Logger.error('保存笔记失败', error);
        }
    }

    show() {
        this.container.style.display = 'block';
        this.isVisible = true;
    }

    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;

        if (this.isEditMode) {
            // 切换到编辑模式
            this.editor.contentEditable = 'true';
            this.editor.style.cursor = 'text';
            this.toolbar.style.display = 'flex';
            this.editor.style.borderColor = this.config.get('noteEditor.focusBorderColor');
            this.editor.focus();
            this._updateToolbarState();
        } else {
            // 切换到预览模式
            this.editor.contentEditable = 'false';
            this.editor.style.cursor = 'default';
            this.toolbar.style.display = 'none';
            this.editor.style.borderColor = this.config.get('noteEditor.borderColor');
            this.editor.blur();
        }
    }

    getElement() {
        return this.container;
    }
}

// 导出供其他模块使用
window.NoteEditor = NoteEditor;
