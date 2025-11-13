// ==UserScript==
// @name         （测试）隐藏/显示超星学习通作业答案
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  一键隐藏超星学习通作业页面中所有 div.mark_answer 答案块，支持单个控制和全局控制，支持为每道题添加笔记。
// @author       You
// @match        https://*.chaoxing.com/mooc-ans/mooc2/work/view*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chaoxing.com
// @grant        none
// @run-at       document-end
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    // ===================== 配置管理模块 =====================
    class Config {
        static DEFAULT = {
            // ========== DOM 选择器配置 ==========
            selectors: {
                answerBlock: 'div.mark_answer',    // 答案块的选择器
                container: 'div.topicNumber',      // 题目容器的选择器
                questionItem: 'div.mark_item'      // 题目项的选择器
            },

            // ========== 延迟配置 ==========
            delays: {
                initialization: 800  // 脚本初始化延迟时间（毫秒），确保页面加载完成
            },

            // ========== 单个答案控制按钮配置 ==========
            answerButton: {
                // --- 按钮位置配置 ---
                position: {
                    marginLeft: '20px',      // 按钮左外边距
                    marginRight: '0px',      // 按钮右外边距
                    marginTop: '10px',       // 按钮上外边距
                    marginBottom: '0px',     // 按钮下外边距
                    verticalAlign: 'middle'  // 垂直对齐方式（top/middle/bottom）
                },
                // --- 按钮样式配置 ---
                style: {
                    fontSize: '12px',        // 字体大小
                    padding: '2px 8px',      // 内边距（上下 左右）
                    borderRadius: '3px',     // 圆角半径
                    border: 'none',          // 边框样式
                    fontWeight: 'normal',    // 字体粗细（normal/bold/100-900）
                    cursor: 'pointer',       // 鼠标样式
                    transition: 'background 0.2s'  // 过渡动画
                },
                // --- 按钮颜色配置 ---
                colors: {
                    showBackground: '#4299e1',     // "显示答案"按钮背景色（蓝色）
                    hideBackground: '#9f7aea',     // "隐藏答案"按钮背景色（紫色）
                    textColor: 'white',            // 按钮文字颜色
                    hoverOpacity: '0.8'            // 鼠标悬停时的透明度
                },
                // --- 按钮文字配置 ---
                text: {
                    show: '显示答案',   // "显示答案"按钮文字
                    hide: '隐藏答案'    // "隐藏答案"按钮文字
                }
            },

            // ========== 笔记控制按钮配置 ==========
            noteButton: {
                // --- 按钮位置配置 ---
                position: {
                    marginLeft: '5px',       // 按钮左外边距（与答案按钮的间距）
                    marginRight: '0px',      // 按钮右外边距
                    marginTop: '0px',        // 按钮上外边距
                    marginBottom: '0px',     // 按钮下外边距
                    verticalAlign: 'middle'  // 垂直对齐方式
                },
                // --- 按钮样式配置 ---
                style: {
                    fontSize: '12px',        // 字体大小
                    padding: '2px 8px',      // 内边距（上下 左右）
                    borderRadius: '3px',     // 圆角半径
                    border: 'none',          // 边框样式
                    fontWeight: 'normal',    // 字体粗细
                    cursor: 'pointer',       // 鼠标样式
                    transition: 'background 0.2s'  // 过渡动画
                },
                // --- 按钮颜色配置 ---
                colors: {
                    showBackground: '#48bb78',     // "显示笔记"按钮背景色（绿色）
                    hideBackground: '#9f7aea',     // "隐藏笔记"按钮背景色（紫色）
                    textColor: 'white',            // 按钮文字颜色
                    hoverOpacity: '0.8'            // 鼠标悬停时的透明度
                },
                // --- 按钮文字配置 ---
                text: {
                    show: '显示笔记',   // "显示笔记"按钮文字
                    hide: '隐藏笔记'    // "隐藏笔记"按钮文字
                }
            },

            // ========== 全局控制按钮配置 ==========
            globalButton: {
                // --- 按钮位置配置 ---
                position: {
                    top: '8px',              // 距离容器顶部的距离
                    right: '8px',            // 距离容器右侧的距离
                    zIndex: '9999'           // 层级（确保在最上层）
                },
                // --- 按钮样式配置 ---
                style: {
                    fontSize: '12px',        // 字体大小
                    padding: '3px 10px',     // 内边距（上下 左右）
                    borderRadius: '4px',     // 圆角半径
                    border: 'none',          // 边框样式
                    fontWeight: 'normal',    // 字体粗细
                    cursor: 'pointer',       // 鼠标样式
                    transition: 'background 0.2s'  // 过渡动画
                },
                // --- 按钮颜色配置 ---
                colors: {
                    showAllBackground: '#4299e1',  // "显示全部答案"按钮背景色（蓝色）
                    hideAllBackground: '#9f7aea',  // "隐藏全部答案"按钮背景色（紫色）
                    textColor: 'white',            // 按钮文字颜色
                    hoverOpacity: '0.8'            // 鼠标悬停时的透明度
                },
                // --- 按钮文字配置 ---
                text: {
                    showAll: '显示全部答案',   // "显示全部答案"按钮文字
                    hideAll: '隐藏全部答案'    // "隐藏全部答案"按钮文字
                }
            },

            // ========== 笔记编辑器配置 ==========
            noteEditor: {
                placeholder: '在这里记录你的笔记...',  // 编辑器占位符文字
                minHeight: '60px',                      // 编辑器最小高度
                maxHeight: '400px',                     // 编辑器最大高度（超出滚动）
                fontSize: '14px',                       // 编辑器字体大小
                padding: '10px',                        // 编辑器内边距
                marginTop: '10px',                      // 编辑器上外边距
                marginBottom: '10px',                   // 编辑器下外边距
                borderRadius: '4px',                    // 编辑器圆角半径
                borderWidth: '1px',                     // 编辑器边框宽度
                borderStyle: 'solid',                   // 编辑器边框样式
                borderColor: '#cbd5e0',                 // 编辑器边框颜色（默认）
                focusBorderColor: '#4299e1',            // 编辑器获得焦点时的边框颜色
                backgroundColor: '#f7fafc',             // 编辑器背景颜色
                textColor: '#2d3748',                   // 编辑器文字颜色
                fontFamily: 'inherit',                  // 编辑器字体（继承父元素）
                resize: 'vertical',                     // 调整大小方式（none/vertical/horizontal/both）
                autoSaveDelay: 1000                     // 自动保存延迟时间（毫秒）
            },

            // ========== 数据库配置 ==========
            database: {
                name: 'ChaoxingNotesDB',  // IndexedDB 数据库名称
                version: 1,                // 数据库版本号
                storeName: 'notes'         // 对象存储名称
            },

            // ========== 提示消息配置 ==========
            messages: {
                noAnswerBlocks: 'ℹ️ 未找到答案块（可能页面未完全加载，可刷新重试）',
                noContainer: 'ℹ️ 未找到容器模块，仅启用单个答案块隐藏功能',
                success: '✅ 超星作业答案块隐藏工具执行完成！',
                hiddenCount: (count) => `- 已隐藏 ${count} 个答案内容块，每个块已添加独立显示按钮`,
                globalButton: (hasContainer) => `- ${hasContainer ? '已在容器右上角添加全局控制按钮' : '未找到容器模块，未添加全局按钮'}`,
                noteSaved: '💾 笔记已自动保存',
                noteLoadError: '⚠️ 加载笔记失败'
            }
        };

        constructor(customConfig = {}) {
            this.config = this._deepMerge(Config.DEFAULT, customConfig);
        }

        get(path) {
            return path.split('.').reduce((obj, key) => obj?.[key], this.config);
        }

        _deepMerge(target, source) {
            const result = { ...target };
            for (const key in source) {
                if (source[key] instanceof Object && key in target) {
                    result[key] = this._deepMerge(target[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
            return result;
        }
    }

    // ===================== 日志管理模块 =====================
    class Logger {
        static log(message, type = 'info') {
            const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
            console.log(`${prefix} ${message}`);
        }

        static success(message) {
            console.log(`✅ ${message}`);
        }

        static error(message, error) {
            console.error(`❌ ${message}`, error);
        }
    }

    // ===================== URL 解析器 =====================
    class URLParser {
        static parseWorkInfo() {
            const url = new URL(window.location.href);
            return {
                courseId: url.searchParams.get('courseId') || '',
                classId: url.searchParams.get('classId') || '',
                workId: url.searchParams.get('workId') || ''
            };
        }

        static getWorkKey() {
            const { courseId, classId, workId } = this.parseWorkInfo();
            return `${courseId}_${classId}_${workId}`;
        }
    }

    // ===================== IndexedDB 管理器 =====================
    class DatabaseManager {
        constructor(config) {
            this.config = config;
            this.db = null;
        }

        async init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(
                    this.config.get('database.name'),
                    this.config.get('database.version')
                );

                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(this.config.get('database.storeName'))) {
                        const objectStore = db.createObjectStore(
                            this.config.get('database.storeName'),
                            { keyPath: 'id' }
                        );
                        objectStore.createIndex('workKey', 'workKey', { unique: false });
                        objectStore.createIndex('questionId', 'questionId', { unique: false });
                    }
                };
            });
        }

        async saveNote(workKey, questionId, content) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(
                    [this.config.get('database.storeName')],
                    'readwrite'
                );
                const objectStore = transaction.objectStore(this.config.get('database.storeName'));
                
                const id = `${workKey}_${questionId}`;
                const data = {
                    id,
                    workKey,
                    questionId,
                    content,
                    timestamp: Date.now()
                };

                const request = objectStore.put(data);
                request.onsuccess = () => resolve(data);
                request.onerror = () => reject(request.error);
            });
        }

        async getNote(workKey, questionId) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(
                    [this.config.get('database.storeName')],
                    'readonly'
                );
                const objectStore = transaction.objectStore(this.config.get('database.storeName'));
                
                const id = `${workKey}_${questionId}`;
                const request = objectStore.get(id);

                request.onsuccess = () => resolve(request.result?.content || '');
                request.onerror = () => reject(request.error);
            });
        }

        async getAllNotes(workKey) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(
                    [this.config.get('database.storeName')],
                    'readonly'
                );
                const objectStore = transaction.objectStore(this.config.get('database.storeName'));
                const index = objectStore.index('workKey');
                const request = index.getAll(workKey);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async deleteNote(workKey, questionId) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(
                    [this.config.get('database.storeName')],
                    'readwrite'
                );
                const objectStore = transaction.objectStore(this.config.get('database.storeName'));
                
                const id = `${workKey}_${questionId}`;
                const request = objectStore.delete(id);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }

    // ===================== 笔记编辑器组件 =====================
    class NoteEditor {
        constructor(questionId, workKey, dbManager, config, styleGenerator) {
            this.questionId = questionId;
            this.workKey = workKey;
            this.dbManager = dbManager;
            this.config = config;
            this.styleGenerator = styleGenerator;
            this.editor = null;
            this.saveTimer = null;
            this.isVisible = false;
        }

        async create() {
            const noteConfig = this.config.get('noteEditor');
            
            this.editor = DOMHelper.createElement('textarea', {
                placeholder: noteConfig.placeholder,
                style: this.styleGenerator.getNoteEditorStyle()
            });

            // 加载已保存的笔记
            try {
                const savedContent = await this.dbManager.getNote(this.workKey, this.questionId);
                if (savedContent) {
                    this.editor.value = savedContent;
                    this._adjustHeight();
                }
            } catch (error) {
                Logger.error(this.config.get('messages.noteLoadError'), error);
            }

            // 监听输入事件，自动调整高度和保存
            this.editor.addEventListener('input', () => {
                this._adjustHeight();
                this._scheduleAutoSave();
            });

            // 获得焦点时改变边框颜色
            this.editor.addEventListener('focus', () => {
                this.editor.style.borderColor = this.config.get('noteEditor.focusBorderColor');
            });

            this.editor.addEventListener('blur', () => {
                this.editor.style.borderColor = this.config.get('noteEditor.borderColor');
            });

            return this.editor;
        }

        _adjustHeight() {
            // 重置高度以获取正确的 scrollHeight
            this.editor.style.height = 'auto';
            const noteConfig = this.config.get('noteEditor');
            const minHeight = parseInt(noteConfig.minHeight);
            const maxHeight = parseInt(noteConfig.maxHeight);
            const newHeight = Math.min(Math.max(this.editor.scrollHeight, minHeight), maxHeight);
            this.editor.style.height = `${newHeight}px`;
        }

        _scheduleAutoSave() {
            if (this.saveTimer) {
                clearTimeout(this.saveTimer);
            }

            this.saveTimer = setTimeout(async () => {
                await this.save();
            }, this.config.get('noteEditor.autoSaveDelay'));
        }

        async save() {
            try {
                const content = this.editor.value.trim();
                await this.dbManager.saveNote(this.workKey, this.questionId, content);
            } catch (error) {
                Logger.error('保存笔记失败', error);
            }
        }

        show() {
            this.editor.style.display = 'block';
            this.isVisible = true;
            this._adjustHeight();
        }

        hide() {
            this.editor.style.display = 'none';
            this.isVisible = false;
        }

        toggle() {
            if (this.isVisible) {
                this.hide();
            } else {
                this.show();
            }
        }

        getElement() {
            return this.editor;
        }
    }

    // ===================== DOM 工具类 =====================
    class DOMHelper {
        static createElement(tag, attributes = {}) {
            const element = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else if (key === 'dataset' && typeof value === 'object') {
                    Object.entries(value).forEach(([dataKey, dataValue]) => {
                        element.dataset[dataKey] = dataValue;
                    });
                } else {
                    element[key] = value;
                }
            });
            return element;
        }

        static insertElement(element, parent, nextSibling = null) {
            if (nextSibling) {
                parent.insertBefore(element, nextSibling);
            } else {
                parent.appendChild(element);
            }
        }

        static removeElement(element) {
            element?.parentNode?.removeChild(element);
        }

        static ensureRelativePosition(element) {
            if (getComputedStyle(element).position === 'static') {
                element.style.position = 'relative';
            }
        }
    }

    // ===================== 样式生成器 =====================
    class StyleGenerator {
        constructor(config) {
            this.config = config;
        }

        /**
         * 获取单个答案按钮的样式
         * @param {boolean} isHidden - 是否为隐藏状态
         * @returns {Object} 样式对象
         */
        getAnswerButtonStyle(isHidden = true) {
            const position = this.config.get('answerButton.position');
            const style = this.config.get('answerButton.style');
            const colors = this.config.get('answerButton.colors');
            
            return {
                marginLeft: position.marginLeft,
                marginRight: position.marginRight,
                marginTop: position.marginTop,
                marginBottom: position.marginBottom,
                verticalAlign: position.verticalAlign,
                padding: style.padding,
                border: style.border,
                borderRadius: style.borderRadius,
                background: isHidden ? colors.showBackground : colors.hideBackground,
                color: colors.textColor,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                cursor: style.cursor,
                transition: style.transition,
                display: 'inline-block'
            };
        }

        /**
         * 获取笔记按钮的样式
         * @param {boolean} isVisible - 笔记是否可见
         * @returns {Object} 样式对象
         */
        getNoteButtonStyle(isVisible = false) {
            const position = this.config.get('noteButton.position');
            const style = this.config.get('noteButton.style');
            const colors = this.config.get('noteButton.colors');
            
            return {
                marginLeft: position.marginLeft,
                marginRight: position.marginRight,
                marginTop: position.marginTop,
                marginBottom: position.marginBottom,
                verticalAlign: position.verticalAlign,
                padding: style.padding,
                border: style.border,
                borderRadius: style.borderRadius,
                background: isVisible ? colors.hideBackground : colors.showBackground,
                color: colors.textColor,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                cursor: style.cursor,
                transition: style.transition,
                display: 'inline-block'
            };
        }

        /**
         * 获取全局按钮的样式
         * @param {boolean} isHidden - 是否为全部隐藏状态
         * @returns {Object} 样式对象
         */
        getGlobalButtonStyle(isHidden = true) {
            const position = this.config.get('globalButton.position');
            const style = this.config.get('globalButton.style');
            const colors = this.config.get('globalButton.colors');
            
            return {
                position: 'absolute',
                top: position.top,
                right: position.right,
                zIndex: position.zIndex,
                border: style.border,
                borderRadius: style.borderRadius,
                padding: style.padding,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                color: colors.textColor,
                cursor: style.cursor,
                transition: style.transition,
                background: isHidden ? colors.showAllBackground : colors.hideAllBackground
            };
        }

        /**
         * 获取笔记编辑器的样式
         * @returns {Object} 样式对象
         */
        getNoteEditorStyle() {
            const noteConfig = this.config.get('noteEditor');
            
            return {
                width: '100%',
                minHeight: noteConfig.minHeight,
                maxHeight: noteConfig.maxHeight,
                padding: noteConfig.padding,
                marginTop: noteConfig.marginTop,
                marginBottom: noteConfig.marginBottom,
                fontSize: noteConfig.fontSize,
                border: `${noteConfig.borderWidth} ${noteConfig.borderStyle} ${noteConfig.borderColor}`,
                borderRadius: noteConfig.borderRadius,
                backgroundColor: noteConfig.backgroundColor,
                color: noteConfig.textColor,
                resize: noteConfig.resize,
                fontFamily: noteConfig.fontFamily,
                outline: 'none',
                display: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
            };
        }
    }

    // ===================== 答案块控制器 =====================
    class AnswerBlockController {
        constructor(block, config, styleGenerator, dbManager, workKey) {
            this.block = block;
            this.config = config;
            this.styleGenerator = styleGenerator;
            this.dbManager = dbManager;
            this.workKey = workKey;
            this.parent = block.parentNode;
            this.nextSibling = block.nextSibling;
            this.originalHTML = block.outerHTML;
            this.toggleButton = null;
            this.noteButton = null;
            this.noteEditor = null;
            this.buttonContainer = null;
            this.isHidden = false;
            this.questionId = this._extractQuestionId();
        }

        _extractQuestionId() {
            // 从父元素中查找包含 question 的 id
            let element = this.block;
            while (element && element !== document.body) {
                if (element.id && element.id.startsWith('question')) {
                    return element.id;
                }
                element = element.parentElement;
            }
            // 如果没找到，生成一个唯一标识
            return `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        async initialize() {
            this._hideBlock();
            await this._createButtons();
            await this._createNoteEditor();
            return this.buttonContainer;
        }

        _hideBlock() {
            DOMHelper.removeElement(this.block);
            this.isHidden = true;
        }

        async _createButtons() {
            // 创建按钮容器
            this.buttonContainer = DOMHelper.createElement('div', {
                style: {
                    display: 'inline-block',
                    marginLeft: this.config.get('answerButton.position.marginLeft'),
                    marginTop: this.config.get('answerButton.position.marginTop'),
                    verticalAlign: this.config.get('answerButton.position.verticalAlign')
                }
            });

            // 创建答案切换按钮
            this._createAnswerToggleButton();
            
            // 创建笔记切换按钮
            this._createNoteToggleButton();

            // 插入按钮容器
            DOMHelper.insertElement(this.buttonContainer, this.parent, this.nextSibling);
        }

        _createAnswerToggleButton() {
            const buttonText = this.config.get('answerButton.text');
            this.toggleButton = DOMHelper.createElement('button', {
                innerText: buttonText.show,
                style: this.styleGenerator.getAnswerButtonStyle(true),
                title: '点击显示/隐藏当前答案块',
                dataset: {
                    isHidden: 'true',
                    originalHTML: this.originalHTML
                }
            });

            this.toggleButton.addEventListener('click', () => this._handleAnswerToggle());
            this.buttonContainer.appendChild(this.toggleButton);
        }

        _createNoteToggleButton() {
            const buttonText = this.config.get('noteButton.text');
            this.noteButton = DOMHelper.createElement('button', {
                innerText: buttonText.show,
                style: this.styleGenerator.getNoteButtonStyle(false),
                title: '点击显示/隐藏笔记编辑器',
                dataset: {
                    isVisible: 'false'
                }
            });

            this.noteButton.addEventListener('click', () => this._handleNoteToggle());
            this.buttonContainer.appendChild(this.noteButton);
        }

        async _createNoteEditor() {
            this.noteEditor = new NoteEditor(
                this.questionId,
                this.workKey,
                this.dbManager,
                this.config,
                this.styleGenerator
            );
            
            const editorElement = await this.noteEditor.create();
            
            // 将编辑器插入到按钮容器之后
            DOMHelper.insertElement(editorElement, this.parent, this.buttonContainer.nextSibling);
        }

        _handleAnswerToggle() {
            if (this.isHidden) {
                this._showBlock();
            } else {
                this._hideBlock();
            }
            this._updateAnswerButtonState();
        }

        _showBlock() {
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = this.originalHTML;
            const restoredBlock = tempContainer.firstChild;
            // 插入到笔记编辑器之后（如果可见）或按钮容器之后
            const insertAfter = this.noteEditor.isVisible ? 
                this.noteEditor.getElement().nextSibling : 
                this.buttonContainer.nextSibling;
            DOMHelper.insertElement(restoredBlock, this.parent, insertAfter);
            this.isHidden = false;
        }

        _updateAnswerButtonState() {
            const buttonText = this.config.get('answerButton.text');
            const colors = this.config.get('answerButton.colors');
            
            this.toggleButton.innerText = this.isHidden ? buttonText.show : buttonText.hide;
            this.toggleButton.style.background = this.isHidden ? colors.showBackground : colors.hideBackground;
            this.toggleButton.dataset.isHidden = String(this.isHidden);
        }

        _handleNoteToggle() {
            this.noteEditor.toggle();
            this._updateNoteButtonState();
        }

        _updateNoteButtonState() {
            const buttonText = this.config.get('noteButton.text');
            const colors = this.config.get('noteButton.colors');
            
            this.noteButton.innerText = this.noteEditor.isVisible ? buttonText.hide : buttonText.show;
            this.noteButton.style.background = this.noteEditor.isVisible ? colors.hideBackground : colors.showBackground;
            this.noteButton.dataset.isVisible = String(this.noteEditor.isVisible);
        }

        toggle() {
            this._handleAnswerToggle();
        }

        getState() {
            return this.isHidden;
        }
    }

    // ===================== 全局控制器 =====================
    class GlobalController {
        constructor(container, controllers, config, styleGenerator) {
            this.container = container;
            this.controllers = controllers;
            this.config = config;
            this.styleGenerator = styleGenerator;
            this.globalButton = null;
        }

        initialize() {
            if (!this.container) return null;

            DOMHelper.ensureRelativePosition(this.container);
            this._createGlobalButton();
            return this.globalButton;
        }

        _createGlobalButton() {
            const buttonText = this.config.get('globalButton.text');
            this.globalButton = DOMHelper.createElement('button', {
                innerText: buttonText.showAll,
                style: this.styleGenerator.getGlobalButtonStyle(true),
                title: '点击一键显示/隐藏所有答案块'
            });

            this.globalButton.addEventListener('click', () => this._handleGlobalToggle());
            this.container.appendChild(this.globalButton);
        }

        _handleGlobalToggle() {
            const allHidden = this.controllers.every(ctrl => ctrl.getState());
            
            this.controllers.forEach(controller => {
                const shouldToggle = allHidden ? controller.getState() : !controller.getState();
                if (shouldToggle) {
                    controller.toggle();
                }
            });

            this._updateGlobalButtonState(!allHidden);
        }

        _updateGlobalButtonState(allHidden) {
            const buttonText = this.config.get('globalButton.text');
            const colors = this.config.get('globalButton.colors');
            
            this.globalButton.innerText = allHidden ? buttonText.showAll : buttonText.hideAll;
            this.globalButton.style.background = allHidden ? colors.showAllBackground : colors.hideAllBackground;
        }
    }

    // ===================== 主应用类 =====================
    class ChaoxingAnswerHider {
        constructor(customConfig = {}) {
            this.config = new Config(customConfig);
            this.styleGenerator = new StyleGenerator(this.config);
            this.dbManager = new DatabaseManager(this.config);
            this.answerControllers = [];
            this.globalController = null;
            this.workKey = URLParser.getWorkKey();
        }

        async initialize() {
            try {
                // 初始化数据库
                await this.dbManager.init();
                Logger.success('数据库初始化成功');

                await this._waitForPageLoad();
                const elements = this._findElements();
                
                if (!this._validateElements(elements)) {
                    return;
                }

                await this._initializeAnswerBlocks(elements.answerBlocks);
                this._initializeGlobalControl(elements.container);
                this._logSuccess(elements.answerBlocks.length, !!elements.container);
            } catch (error) {
                Logger.error('初始化失败', error);
            }
        }

        _waitForPageLoad() {
            const delay = this.config.get('delays.initialization');
            return new Promise(resolve => setTimeout(resolve, delay));
        }

        _findElements() {
            return {
                container: document.querySelector(this.config.get('selectors.container')),
                answerBlocks: document.querySelectorAll(this.config.get('selectors.answerBlock'))
            };
        }

        _validateElements({ container, answerBlocks }) {
            if (answerBlocks.length === 0) {
                Logger.log(this.config.get('messages.noAnswerBlocks'));
                return false;
            }
            
            if (!container) {
                Logger.log(this.config.get('messages.noContainer'), 'warn');
            }
            
            return true;
        }

        async _initializeAnswerBlocks(blocks) {
            for (const block of blocks) {
                const controller = new AnswerBlockController(
                    block, 
                    this.config, 
                    this.styleGenerator,
                    this.dbManager,
                    this.workKey
                );
                await controller.initialize();
                this.answerControllers.push(controller);
            }
        }

        _initializeGlobalControl(container) {
            this.globalController = new GlobalController(
                container,
                this.answerControllers,
                this.config,
                this.styleGenerator
            );
            this.globalController.initialize();
        }

        _logSuccess(count, hasContainer) {
            Logger.success(this.config.get('messages.success'));
            Logger.log(this.config.get('messages.hiddenCount')(count));
            Logger.log(this.config.get('messages.globalButton')(hasContainer));
            Logger.log(`📝 笔记功能已启用，数据存储标识: ${this.workKey}`);
        }
    }

    // ===================== 启动应用 =====================
    const app = new ChaoxingAnswerHider();
    app.initialize();
})();