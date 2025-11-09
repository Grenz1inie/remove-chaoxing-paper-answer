// ==UserScript==
// @name         隐藏/显示超星学习通作业答案
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
            selectors: {
                answerBlock: 'div.mark_answer',
                container: 'div.topicNumber',
                questionItem: 'div.mark_item'
            },
            delays: {
                initialization: 800
            },
            button: {
                position: {
                    marginLeft: '20px',
                    marginRight: '0px',
                    marginTop: '10px',
                    marginBottom: '0px',
                    verticalAlign: 'middle'
                },
                style: {
                    fontSize: '12px',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    primaryColor: '#4299e1',   // 显示按钮颜色
                    secondaryColor: '#9f7aea', // 隐藏按钮颜色
                    noteColor: '#48bb78'       // 笔记按钮颜色
                },
                text: {
                    show: '显示答案',
                    hide: '隐藏答案',
                    showAll: '显示全部答案',
                    hideAll: '隐藏全部答案',
                    showNote: '显示笔记',
                    hideNote: '隐藏笔记'
                }
            },
            note: {
                placeholder: '在这里记录你的笔记...',
                minHeight: '60px',
                maxHeight: '400px',
                fontSize: '14px',
                padding: '10px',
                borderRadius: '4px',
                borderColor: '#cbd5e0',
                backgroundColor: '#f7fafc',
                autoSaveDelay: 1000  // 自动保存延迟（毫秒）
            },
            database: {
                name: 'ChaoxingNotesDB',
                version: 1,
                storeName: 'notes'
            },
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
                noContainer: 'ℹ️ 未找到容器模块，仅启用单个答案块隐藏功能',
                success: '✅ 超星作业答案块隐藏工具执行完成！',
                hiddenCount: (count) => `- 已隐藏 ${count} 个答案内容块，每个块已添加独立显示按钮`,
                globalButton: (hasContainer) => `- ${hasContainer ? '已在容器右上角添加全局控制按钮' : '未找到容器模块，未添加全局按钮'}`
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
        constructor(questionId, workKey, dbManager, config) {
            this.questionId = questionId;
            this.workKey = workKey;
            this.dbManager = dbManager;
            this.config = config;
            this.editor = null;
            this.saveTimer = null;
            this.isVisible = false;
        }

        async create() {
            const noteConfig = this.config.get('note');
            
            this.editor = DOMHelper.createElement('textarea', {
                placeholder: noteConfig.placeholder,
                style: {
                    width: '100%',
                    minHeight: noteConfig.minHeight,
                    maxHeight: noteConfig.maxHeight,
                    padding: noteConfig.padding,
                    fontSize: noteConfig.fontSize,
                    border: `1px solid ${noteConfig.borderColor}`,
                    borderRadius: noteConfig.borderRadius,
                    backgroundColor: noteConfig.backgroundColor,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    outline: 'none',
                    marginTop: '10px',
                    marginBottom: '10px',
                    display: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                }
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
                this.editor.style.borderColor = this.config.get('button.style.primaryColor');
            });

            this.editor.addEventListener('blur', () => {
                this.editor.style.borderColor = this.config.get('note.borderColor');
            });

            return this.editor;
        }

        _adjustHeight() {
            // 重置高度以获取正确的 scrollHeight
            this.editor.style.height = 'auto';
            const noteConfig = this.config.get('note');
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
            }, this.config.get('note.autoSaveDelay'));
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

        getSingleButtonStyle() {
            const { position, style } = this.config.get('button');
            return {
                marginLeft: position.marginLeft,
                marginRight: position.marginRight,
                marginTop: position.marginTop,
                marginBottom: position.marginBottom,
                verticalAlign: position.verticalAlign,
                padding: '2px 8px',
                border: 'none',
                borderRadius: '3px',
                background: style.primaryColor,
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'inline-block'
            };
        }

        getGlobalButtonStyle() {
            const { style } = this.config.get('button');
            return {
                position: 'absolute',
                top: '8px',
                right: '8px',
                border: 'none',
                borderRadius: style.borderRadius,
                padding: style.padding,
                fontSize: style.fontSize,
                color: 'white',
                cursor: 'pointer',
                transition: 'background 0.2s',
                zIndex: '9999',
                background: style.primaryColor
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
                    marginLeft: this.config.get('button.position.marginLeft'),
                    marginTop: this.config.get('button.position.marginTop'),
                    verticalAlign: this.config.get('button.position.verticalAlign')
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
            const buttonText = this.config.get('button.text');
            this.toggleButton = DOMHelper.createElement('button', {
                innerText: buttonText.show,
                style: this.styleGenerator.getSingleButtonStyle(),
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
            const buttonText = this.config.get('button.text');
            const noteStyle = { ...this.styleGenerator.getSingleButtonStyle() };
            noteStyle.background = this.config.get('button.style.noteColor');
            noteStyle.marginLeft = '5px';

            this.noteButton = DOMHelper.createElement('button', {
                innerText: buttonText.showNote,
                style: noteStyle,
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
                this.config
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
            const buttonText = this.config.get('button.text');
            const colors = this.config.get('button.style');
            
            this.toggleButton.innerText = this.isHidden ? buttonText.show : buttonText.hide;
            this.toggleButton.style.background = this.isHidden ? colors.primaryColor : colors.secondaryColor;
            this.toggleButton.dataset.isHidden = String(this.isHidden);
        }

        _handleNoteToggle() {
            this.noteEditor.toggle();
            this._updateNoteButtonState();
        }

        _updateNoteButtonState() {
            const buttonText = this.config.get('button.text');
            const colors = this.config.get('button.style');
            
            this.noteButton.innerText = this.noteEditor.isVisible ? buttonText.hideNote : buttonText.showNote;
            this.noteButton.style.background = this.noteEditor.isVisible ? colors.secondaryColor : colors.noteColor;
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
            const buttonText = this.config.get('button.text');
            this.globalButton = DOMHelper.createElement('button', {
                innerText: buttonText.showAll,
                style: this.styleGenerator.getGlobalButtonStyle(),
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
            const buttonText = this.config.get('button.text');
            const colors = this.config.get('button.style');
            
            this.globalButton.innerText = allHidden ? buttonText.showAll : buttonText.hideAll;
            this.globalButton.style.background = allHidden ? colors.primaryColor : colors.secondaryColor;
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