// ==UserScript==
// @name         （测试）隐藏/显示超星学习通作业答案
// @namespace    http://tampermonkey.net/
// @version      2.2.0
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
                    marginLeft: '10px',      // 按钮左外边距
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
                    marginTop: '10px',        // 按钮上外边距
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

            // ========== 保存笔记按钮配置 ==========
            saveNoteButton: {
                // --- 按钮位置配置 ---
                position: {
                    marginLeft: '5px',       // 按钮左外边距（与笔记按钮的间距）
                    marginRight: '0px',      // 按钮右外边距
                    marginTop: '10px',        // 按钮上外边距
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
                    background: '#38b2ac',   // 按钮背景色（青色）
                    textColor: 'white',      // 按钮文字颜色
                    hoverOpacity: '0.8'      // 鼠标悬停时的透明度
                },
                // --- 按钮文字配置 ---
                text: '💾 保存'           // 保存按钮文字
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
                width: '110%',                          // 编辑器宽度
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
                resize: 'vertical'                      // 调整大小方式（none/vertical/horizontal/both）
            },

            // ========== 用户设置默认值 ==========
            settings: {
                autoSave: false,                        // 是否开启自动保存（默认关闭）
                autoSaveDelay: 5000                     // 自动保存延迟时间（毫秒）
            },

            // ========== 控制面板按钮配置 ==========
            manageButton: {
                // --- 按钮位置配置 ---
                position: {
                    top: '35px',             // 距离容器顶部的距离（在全局按钮下方）
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
                    background: '#ed8936',   // 按钮背景色（橙色）
                    textColor: 'white',      // 按钮文字颜色
                    hoverOpacity: '0.8'      // 鼠标悬停时的透明度
                },
                // --- 按钮文字配置 ---
                text: '⚙️ 控制面板'    // 控制面板按钮文字
            },

            // ========== 控制面板保存按钮配置 ==========
            panelSaveButton: {
                // --- 按钮样式配置 ---
                style: {
                    padding: '10px 24px',       // 内边距（上下 左右）
                    borderRadius: '6px',        // 圆角半径
                    border: 'none',             // 边框样式
                    fontSize: '14px',           // 字体大小
                    fontWeight: '600',          // 字体粗细
                    cursor: 'pointer',          // 鼠标样式
                    transition: 'all 0.2s'      // 过渡动画
                },
                // --- 按钮颜色配置 ---
                colors: {
                    background: '#4299e1',          // 按钮背景色（蓝色）
                    hoverBackground: '#3182ce',     // 悬停时背景色
                    textColor: 'white',             // 按钮文字颜色
                    successBackground: '#48bb78',   // 保存成功背景色（绿色）
                    errorBackground: '#f56565',     // 保存失败背景色（红色）
                    boxShadow: '0 2px 4px rgba(66, 153, 225, 0.3)',           // 默认阴影
                    hoverBoxShadow: '0 4px 6px rgba(66, 153, 225, 0.4)'       // 悬停阴影
                },
                // --- 按钮文字配置 ---
                text: {
                    save: '💾 保存设置',      // 默认文字
                    success: '✅ 保存成功',   // 保存成功文字
                    error: '❌ 保存失败'      // 保存失败文字
                }
            },

            // ========== 数据库配置 ==========
            database: {
                name: 'ChaoxingNotesDB',     // IndexedDB 数据库名称
                version: 3,                   // 数据库版本号（v3：添加设置存储）
                stores: {
                    notes: 'notes',           // 笔记存储名称
                    attachments: 'attachments', // 附件存储名称
                    settings: 'settings'      // 用户设置存储名称
                }
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
                    const oldVersion = event.oldVersion;
                    
                    // 创建或升级笔记存储
                    if (!db.objectStoreNames.contains(this.config.get('database.stores.notes'))) {
                        const notesStore = db.createObjectStore(
                            this.config.get('database.stores.notes'),
                            { keyPath: 'id' }
                        );
                        notesStore.createIndex('workKey', 'workKey', { unique: false });
                        notesStore.createIndex('questionId', 'questionId', { unique: false });
                        notesStore.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                    
                    // v2: 创建附件存储（为未来图片等附件做准备）
                    if (oldVersion < 2 && !db.objectStoreNames.contains(this.config.get('database.stores.attachments'))) {
                        const attachmentsStore = db.createObjectStore(
                            this.config.get('database.stores.attachments'),
                            { keyPath: 'id' }
                        );
                        attachmentsStore.createIndex('noteId', 'noteId', { unique: false });
                        attachmentsStore.createIndex('workKey', 'workKey', { unique: false });
                        attachmentsStore.createIndex('type', 'type', { unique: false });
                        attachmentsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    }

                    // v3: 创建设置存储
                    if (oldVersion < 3 && !db.objectStoreNames.contains(this.config.get('database.stores.settings'))) {
                        db.createObjectStore(
                            this.config.get('database.stores.settings'),
                            { keyPath: 'key' }
                        );
                    }
                };
            });
        }

        async saveNote(workKey, questionId, content) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(
                    [this.config.get('database.stores.notes')],
                    'readwrite'
                );
                const objectStore = transaction.objectStore(this.config.get('database.stores.notes'));
                
                const id = `${workKey}_${questionId}`;
                const data = {
                    id,
                    workKey,
                    questionId,
                    content,
                    contentType: 'text',  // 内容类型：text, html等
                    hasAttachments: false, // 是否有附件
                    attachmentCount: 0,    // 附件数量
                    timestamp: Date.now(),
                    updatedAt: Date.now()
                };

                const request = objectStore.put(data);
                request.onsuccess = () => resolve(data);
                request.onerror = () => reject(request.error);
            });
        }        async getNote(workKey, questionId) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(
                    [this.config.get('database.stores.notes')],
                    'readonly'
                );
                const objectStore = transaction.objectStore(this.config.get('database.stores.notes'));
                
                const id = `${workKey}_${questionId}`;
                const request = objectStore.get(id);

                request.onsuccess = () => resolve(request.result?.content || '');
                request.onerror = () => reject(request.error);
            });
        }        async getAllNotes(workKey) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(
                    [this.config.get('database.stores.notes')],
                    'readonly'
                );
                const objectStore = transaction.objectStore(this.config.get('database.stores.notes'));
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
                    [this.config.get('database.stores.notes')],
                    'readwrite'
                );
                const objectStore = transaction.objectStore(this.config.get('database.stores.notes'));
                
                const id = `${workKey}_${questionId}`;
                const request = objectStore.delete(id);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * 批量删除笔记
         * @param {Array<string>} noteIds - 笔记ID数组
         */
        async deleteNotes(noteIds) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(
                    [this.config.get('database.stores.notes')],
                    'readwrite'
                );
                const objectStore = transaction.objectStore(this.config.get('database.stores.notes'));
                
                let completedCount = 0;
                const totalCount = noteIds.length;

                if (totalCount === 0) {
                    resolve(0);
                    return;
                }

                noteIds.forEach(id => {
                    const request = objectStore.delete(id);
                    request.onsuccess = () => {
                        completedCount++;
                        if (completedCount === totalCount) {
                            resolve(completedCount);
                        }
                    };
                    request.onerror = () => {
                        Logger.error(`删除笔记失败: ${id}`, request.error);
                        completedCount++;
                        if (completedCount === totalCount) {
                            resolve(completedCount);
                        }
                    };
                });
            });
        }

        /**
         * 获取数据库统计信息
         */
        async getStatistics() {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(
                    [this.config.get('database.stores.notes')],
                    'readonly'
                );
                const objectStore = transaction.objectStore(this.config.get('database.stores.notes'));
                const countRequest = objectStore.count();

                countRequest.onsuccess = () => {
                    resolve({
                        totalNotes: countRequest.result,
                        databaseName: this.config.get('database.name'),
                        version: this.config.get('database.version')
                    });
                };
                countRequest.onerror = () => reject(countRequest.error);
            });
        }

        /**
         * 保存设置
         * @param {string} key - 设置键
         * @param {any} value - 设置值
         */
        async saveSetting(key, value) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(
                    [this.config.get('database.stores.settings')],
                    'readwrite'
                );
                const objectStore = transaction.objectStore(this.config.get('database.stores.settings'));
                
                const data = { key, value, updatedAt: Date.now() };
                const request = objectStore.put(data);

                request.onsuccess = () => resolve(data);
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * 获取设置
         * @param {string} key - 设置键
         * @param {any} defaultValue - 默认值
         */
        async getSetting(key, defaultValue = null) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(
                    [this.config.get('database.stores.settings')],
                    'readonly'
                );
                const objectStore = transaction.objectStore(this.config.get('database.stores.settings'));
                const request = objectStore.get(key);

                request.onsuccess = () => {
                    const result = request.result;
                    resolve(result ? result.value : defaultValue);
                };
                request.onerror = () => reject(request.error);
            });
        }

        /**
         * 获取所有设置
         */
        async getAllSettings() {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(
                    [this.config.get('database.stores.settings')],
                    'readonly'
                );
                const objectStore = transaction.objectStore(this.config.get('database.stores.settings'));
                const request = objectStore.getAll();

                request.onsuccess = () => {
                    const settings = {};
                    request.result.forEach(item => {
                        settings[item.key] = item.value;
                    });
                    resolve(settings);
                };
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

    // ===================== 控制面板UI组件 =====================
    class ControlPanelUI {
        constructor(dbManager, workKey, config) {
            this.dbManager = dbManager;
            this.workKey = workKey;
            this.config = config;
            this.modal = null;
            this.notesList = [];
            this.selectedNotes = new Set();
            this.currentTab = 'settings'; // 'settings' 或 'notes'
            this.settings = {};
        }

        /**
         * 显示控制面板
         */
        async show() {
            await this._loadSettings();
            await this._loadNotes();
            this._createModal();
            this._renderContent();
        }

        /**
         * 加载用户设置
         */
        async _loadSettings() {
            try {
                this.settings = await this.dbManager.getAllSettings();
                // 填充默认值
                if (!('autoSave' in this.settings)) {
                    this.settings.autoSave = this.config.get('settings.autoSave');
                }
                if (!('autoSaveDelay' in this.settings)) {
                    this.settings.autoSaveDelay = this.config.get('settings.autoSaveDelay');
                }
            } catch (error) {
                Logger.error('加载设置失败', error);
                this.settings = {
                    autoSave: this.config.get('settings.autoSave'),
                    autoSaveDelay: this.config.get('settings.autoSaveDelay')
                };
            }
        }

        /**
         * 加载笔记数据
         */
        async _loadNotes() {
            try {
                this.notesList = await this.dbManager.getAllNotes(this.workKey);
                this.notesList.sort((a, b) => b.timestamp - a.timestamp);
            } catch (error) {
                Logger.error('加载笔记失败', error);
                this.notesList = [];
            }
        }

        /**
         * 创建模态框
         */
        _createModal() {
            // 创建遮罩层
            const overlay = DOMHelper.createElement('div', {
                style: {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: '99999',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }
            });

            // 创建主容器
            const mainContainer = DOMHelper.createElement('div', {
                style: {
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    width: '90%',
                    maxWidth: '900px',
                    height: '85vh',
                    display: 'flex',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                    overflow: 'hidden'
                }
            });

            // 创建左侧边栏
            const sidebar = this._createSidebar();
            mainContainer.appendChild(sidebar);

            // 创建右侧内容区
            const contentArea = DOMHelper.createElement('div', {
                id: 'panel-content-area',
                style: {
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#f7fafc'
                }
            });

            // 创建内容区标题栏
            const contentHeader = DOMHelper.createElement('div', {
                id: 'panel-content-header',
                style: {
                    padding: '20px 30px',
                    borderBottom: '1px solid #e2e8f0',
                    backgroundColor: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }
            });

            const headerTitle = DOMHelper.createElement('h2', {
                id: 'panel-header-title',
                innerText: '⚙️ 设置',
                style: {
                    margin: '0',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#2d3748'
                }
            });

            const closeBtn = DOMHelper.createElement('button', {
                innerText: '✕',
                style: {
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#718096',
                    padding: '0',
                    width: '30px',
                    height: '30px',
                    lineHeight: '30px',
                    textAlign: 'center',
                    borderRadius: '50%',
                    transition: 'background 0.2s'
                }
            });

            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.backgroundColor = '#e2e8f0';
            });

            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.backgroundColor = 'transparent';
            });

            closeBtn.addEventListener('click', () => this._close());

            contentHeader.appendChild(headerTitle);
            contentHeader.appendChild(closeBtn);
            contentArea.appendChild(contentHeader);

            // 创建内容主体
            const contentBody = DOMHelper.createElement('div', {
                id: 'panel-content-body',
                style: {
                    flex: '1',
                    overflow: 'auto',
                    padding: '30px'
                }
            });

            contentArea.appendChild(contentBody);
            mainContainer.appendChild(contentArea);
            overlay.appendChild(mainContainer);

            // 点击遮罩层关闭
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this._close();
                }
            });

            this.modal = overlay;
            document.body.appendChild(overlay);
        }

        /**
         * 创建左侧边栏
         */
        _createSidebar() {
            const sidebar = DOMHelper.createElement('div', {
                style: {
                    width: '220px',
                    backgroundColor: '#2d3748',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px 0'
                }
            });

            // 标题
            const title = DOMHelper.createElement('div', {
                innerText: '控制面板',
                style: {
                    padding: '0 20px 20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'white',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: '10px'
                }
            });

            sidebar.appendChild(title);

            // 菜单项
            const menuItems = [
                { id: 'settings', icon: '⚙️', text: '设置' },
                { id: 'notes', icon: '📝', text: '管理笔记' },
                { id: 'styles', icon: '🎨', text: '样式管理' }
            ];

            menuItems.forEach(item => {
                const menuItem = this._createMenuItem(item.id, item.icon, item.text);
                sidebar.appendChild(menuItem);
            });

            return sidebar;
        }

        /**
         * 创建菜单项
         */
        _createMenuItem(id, icon, text) {
            const isActive = this.currentTab === id;

            const menuItem = DOMHelper.createElement('div', {
                dataset: { tab: id },
                style: {
                    padding: '12px 20px',
                    cursor: 'pointer',
                    color: isActive ? 'white' : '#a0aec0',
                    backgroundColor: isActive ? '#4a5568' : 'transparent',
                    borderLeft: isActive ? '3px solid #4299e1' : '3px solid transparent',
                    transition: 'all 0.2s',
                    fontSize: '14px',
                    fontWeight: isActive ? 'bold' : 'normal',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }
            });

            const iconSpan = DOMHelper.createElement('span', {
                innerText: icon,
                style: { fontSize: '16px' }
            });

            const textSpan = DOMHelper.createElement('span', {
                innerText: text
            });

            menuItem.appendChild(iconSpan);
            menuItem.appendChild(textSpan);

            menuItem.addEventListener('mouseenter', () => {
                if (this.currentTab !== id) {
                    menuItem.style.backgroundColor = '#4a5568';
                    menuItem.style.color = '#e2e8f0';
                }
            });

            menuItem.addEventListener('mouseleave', () => {
                if (this.currentTab !== id) {
                    menuItem.style.backgroundColor = 'transparent';
                    menuItem.style.color = '#a0aec0';
                }
            });

            menuItem.addEventListener('click', () => {
                this.currentTab = id;
                this._updateSidebarState();
                this._renderContent();
            });

            return menuItem;
        }

        /**
         * 更新侧边栏状态
         */
        _updateSidebarState() {
            const menuItems = this.modal.querySelectorAll('[data-tab]');
            menuItems.forEach(item => {
                const isActive = item.dataset.tab === this.currentTab;
                item.style.color = isActive ? 'white' : '#a0aec0';
                item.style.backgroundColor = isActive ? '#4a5568' : 'transparent';
                item.style.borderLeft = isActive ? '3px solid #4299e1' : '3px solid transparent';
                item.style.fontWeight = isActive ? 'bold' : 'normal';
            });
        }

        /**
         * 渲染内容区
         */
        _renderContent() {
            const headerTitle = document.getElementById('panel-header-title');
            const contentBody = document.getElementById('panel-content-body');

            if (this.currentTab === 'settings') {
                headerTitle.innerText = '⚙️ 设置';
                this._renderSettingsPanel(contentBody);
            } else if (this.currentTab === 'notes') {
                headerTitle.innerText = '📝 管理笔记';
                this._renderNotesPanel(contentBody);
            } else if (this.currentTab === 'styles') {
                headerTitle.innerText = '🎨 样式管理';
                this._renderStylesPanel(contentBody);
            }
        }

        /**
         * 渲染设置面板
         */
        _renderSettingsPanel(container) {
            container.innerHTML = '';

            const settingsContainer = DOMHelper.createElement('div', {
                style: {
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    marginBottom: '20px'
                }
            });

            // 自动保存开关
            const autoSaveSection = this._createSettingItem(
                '自动保存',
                '开启后会在输入停止一段时间后自动保存笔记',
                'checkbox',
                'autoSave',
                this.settings.autoSave
            );

            settingsContainer.appendChild(autoSaveSection);

            // 自动保存延迟时间
            const delaySection = this._createSettingItem(
                '自动保存延迟',
                '输入停止后多久开始保存（毫秒）',
                'number',
                'autoSaveDelay',
                this.settings.autoSaveDelay
            );

            settingsContainer.appendChild(delaySection);

            container.appendChild(settingsContainer);

            // 添加保存按钮
            const saveButtonContainer = DOMHelper.createElement('div', {
                style: {
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px'
                }
            });

            const buttonConfig = this.config.get('panelSaveButton');
            const saveButton = DOMHelper.createElement('button', {
                innerText: buttonConfig.text.save,
                style: {
                    padding: buttonConfig.style.padding,
                    border: buttonConfig.style.border,
                    borderRadius: buttonConfig.style.borderRadius,
                    backgroundColor: buttonConfig.colors.background,
                    color: buttonConfig.colors.textColor,
                    fontSize: buttonConfig.style.fontSize,
                    fontWeight: buttonConfig.style.fontWeight,
                    cursor: buttonConfig.style.cursor,
                    transition: buttonConfig.style.transition,
                    boxShadow: buttonConfig.colors.boxShadow
                }
            });

            saveButton.addEventListener('mouseenter', () => {
                saveButton.style.backgroundColor = buttonConfig.colors.hoverBackground;
                saveButton.style.transform = 'translateY(-1px)';
                saveButton.style.boxShadow = buttonConfig.colors.hoverBoxShadow;
            });

            saveButton.addEventListener('mouseleave', () => {
                if (saveButton.innerText === buttonConfig.text.save) {
                    saveButton.style.backgroundColor = buttonConfig.colors.background;
                    saveButton.style.transform = 'translateY(0)';
                    saveButton.style.boxShadow = buttonConfig.colors.boxShadow;
                }
            });

            saveButton.addEventListener('click', async () => {
                try {
                    // 保存所有设置
                    await this.dbManager.saveSetting('autoSave', this.settings.autoSave);
                    await this.dbManager.saveSetting('autoSaveDelay', this.settings.autoSaveDelay);
                    
                    // 显示成功提示
                    saveButton.innerText = buttonConfig.text.success;
                    saveButton.style.backgroundColor = buttonConfig.colors.successBackground;
                    
                    setTimeout(() => {
                        saveButton.innerText = buttonConfig.text.save;
                        saveButton.style.backgroundColor = buttonConfig.colors.background;
                    }, 2000);
                    
                    Logger.success('设置已保存');
                } catch (error) {
                    Logger.error('保存设置失败', error);
                    saveButton.innerText = buttonConfig.text.error;
                    saveButton.style.backgroundColor = buttonConfig.colors.errorBackground;
                    
                    setTimeout(() => {
                        saveButton.innerText = buttonConfig.text.save;
                        saveButton.style.backgroundColor = buttonConfig.colors.background;
                    }, 2000);
                }
            });

            saveButtonContainer.appendChild(saveButton);
            container.appendChild(saveButtonContainer);
        }

        /**
         * 创建设置项
         */
        _createSettingItem(label, description, type, key, value) {
            const item = DOMHelper.createElement('div', {
                style: {
                    marginBottom: '24px',
                    paddingBottom: '24px',
                    borderBottom: '1px solid #e2e8f0'
                }
            });

            const labelEl = DOMHelper.createElement('div', {
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                }
            });

            const labelText = DOMHelper.createElement('span', {
                innerText: label,
                style: {
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2d3748'
                }
            });

            let input;
            if (type === 'checkbox') {
                input = DOMHelper.createElement('input', {
                    type: 'checkbox',
                    checked: value,
                    style: {
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer'
                    }
                });

                input.addEventListener('change', () => {
                    this.settings[key] = input.checked;
                });
            } else if (type === 'number') {
                input = DOMHelper.createElement('input', {
                    type: 'number',
                    value: value,
                    style: {
                        width: '120px',
                        padding: '6px 12px',
                        border: '1px solid #cbd5e0',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }
                });

                input.addEventListener('change', () => {
                    const numValue = parseInt(input.value);
                    if (numValue > 0) {
                        this.settings[key] = numValue;
                    }
                });
            }

            labelEl.appendChild(labelText);
            labelEl.appendChild(input);

            const desc = DOMHelper.createElement('div', {
                innerText: description,
                style: {
                    fontSize: '13px',
                    color: '#718096',
                    marginTop: '4px'
                }
            });

            item.appendChild(labelEl);
            item.appendChild(desc);

            return item;
        }

        /**
         * 渲染笔记管理面板
         */
        _renderNotesPanel(container) {
            container.innerHTML = '';
            container.style.padding = '0';

            if (this.notesList.length === 0) {
                const emptyMsg = DOMHelper.createElement('div', {
                    innerText: '📭 暂无笔记',
                    style: {
                        textAlign: 'center',
                        color: '#a0aec0',
                        padding: '60px 20px',
                        fontSize: '16px'
                    }
                });
                container.appendChild(emptyMsg);
                return;
            }

            // 操作栏
            const toolbar = DOMHelper.createElement('div', {
                style: {
                    padding: '15px 30px',
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }
            });

            const info = DOMHelper.createElement('span', {
                id: 'notes-info-text',
                innerText: `共 ${this.notesList.length} 条笔记`,
                style: {
                    fontSize: '14px',
                    color: '#718096'
                }
            });

            const actions = DOMHelper.createElement('div', {
                style: {
                    display: 'flex',
                    gap: '10px'
                }
            });

            const selectAllBtn = DOMHelper.createElement('button', {
                innerText: '全选',
                style: {
                    padding: '6px 14px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                }
            });

            const deleteBtn = DOMHelper.createElement('button', {
                innerText: '删除选中',
                style: {
                    padding: '6px 14px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: '#f56565',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                }
            });

            selectAllBtn.addEventListener('click', () => this._toggleSelectAll());
            deleteBtn.addEventListener('click', () => this._deleteSelected());

            actions.appendChild(selectAllBtn);
            actions.appendChild(deleteBtn);
            toolbar.appendChild(info);
            toolbar.appendChild(actions);

            // 笔记列表
            const notesList = DOMHelper.createElement('div', {
                id: 'notes-list-content',
                style: {
                    padding: '20px 30px',
                    overflow: 'auto',
                    flex: '1'
                }
            });

            this.notesList.forEach(note => {
                const noteItem = this._createNoteItem(note);
                notesList.appendChild(noteItem);
            });

            container.appendChild(toolbar);
            container.appendChild(notesList);
        }

        /**
         * 创建笔记项
         */
        _createNoteItem(note) {
            const item = DOMHelper.createElement('div', {
                style: {
                    padding: '16px',
                    marginBottom: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: this.selectedNotes.has(note.id) ? '#ebf8ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }
            });

            item.addEventListener('mouseenter', () => {
                if (!this.selectedNotes.has(note.id)) {
                    item.style.backgroundColor = '#f7fafc';
                }
            });

            item.addEventListener('mouseleave', () => {
                if (!this.selectedNotes.has(note.id)) {
                    item.style.backgroundColor = 'white';
                }
            });

            const header = DOMHelper.createElement('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '10px',
                    gap: '10px'
                }
            });

            const checkbox = DOMHelper.createElement('input', {
                type: 'checkbox',
                checked: this.selectedNotes.has(note.id),
                style: {
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer'
                }
            });

            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                if (checkbox.checked) {
                    this.selectedNotes.add(note.id);
                    item.style.backgroundColor = '#ebf8ff';
                } else {
                    this.selectedNotes.delete(note.id);
                    item.style.backgroundColor = 'white';
                }
                this._updateNotesInfo();
            });

            const questionId = DOMHelper.createElement('span', {
                innerText: note.questionId,
                style: {
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#4299e1',
                    flex: '1'
                }
            });

            const time = DOMHelper.createElement('span', {
                innerText: new Date(note.timestamp).toLocaleString('zh-CN'),
                style: {
                    fontSize: '12px',
                    color: '#a0aec0'
                }
            });

            header.appendChild(checkbox);
            header.appendChild(questionId);
            header.appendChild(time);

            const content = DOMHelper.createElement('div', {
                innerText: note.content || '(空笔记)',
                style: {
                    fontSize: '14px',
                    color: note.content ? '#2d3748' : '#a0aec0',
                    lineHeight: '1.6',
                    maxHeight: '80px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'pre-wrap'
                }
            });

            item.appendChild(header);
            item.appendChild(content);

            item.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });

            return item;
        }

        /**
         * 切换全选
         */
        _toggleSelectAll() {
            if (this.selectedNotes.size === this.notesList.length) {
                this.selectedNotes.clear();
            } else {
                this.notesList.forEach(note => this.selectedNotes.add(note.id));
            }
            this._renderContent();
        }

        /**
         * 删除选中的笔记
         */
        async _deleteSelected() {
            if (this.selectedNotes.size === 0) {
                alert('请先选择要删除的笔记');
                return;
            }

            if (!confirm(`确定要删除选中的 ${this.selectedNotes.size} 条笔记吗？\n此操作不可恢复！`)) {
                return;
            }

            try {
                const noteIds = Array.from(this.selectedNotes);
                await this.dbManager.deleteNotes(noteIds);
                Logger.success(`已删除 ${noteIds.length} 条笔记`);

                this.selectedNotes.clear();
                await this._loadNotes();
                this._renderContent();
            } catch (error) {
                Logger.error('删除笔记失败', error);
                alert('删除笔记失败，请查看控制台了解详情');
            }
        }

        /**
         * 更新笔记信息
         */
        _updateNotesInfo() {
            const info = document.getElementById('notes-info-text');
            if (info) {
                const selectedText = this.selectedNotes.size > 0 ? `，已选中 ${this.selectedNotes.size} 条` : '';
                info.innerText = `共 ${this.notesList.length} 条笔记${selectedText}`;
            }
        }

        /**
         * 渲染样式管理面板
         */
        async _renderStylesPanel(container) {
            container.innerHTML = '';

            // 样式配置的分类
            const styleCategories = [
                {
                    title: '答案按钮样式',
                    key: 'answerButton',
                    fields: [
                        { name: 'fontSize', label: '字体大小', type: 'text', path: 'style.fontSize' },
                        { name: 'padding', label: '内边距', type: 'text', path: 'style.padding' },
                        { name: 'borderRadius', label: '圆角半径', type: 'text', path: 'style.borderRadius' },
                        { name: 'showBackground', label: '显示按钮背景色', type: 'color', path: 'colors.showBackground' },
                        { name: 'hideBackground', label: '隐藏按钮背景色', type: 'color', path: 'colors.hideBackground' }
                    ]
                },
                {
                    title: '笔记按钮样式',
                    key: 'noteButton',
                    fields: [
                        { name: 'fontSize', label: '字体大小', type: 'text', path: 'style.fontSize' },
                        { name: 'padding', label: '内边距', type: 'text', path: 'style.padding' },
                        { name: 'showBackground', label: '显示按钮背景色', type: 'color', path: 'colors.showBackground' },
                        { name: 'hideBackground', label: '隐藏按钮背景色', type: 'color', path: 'colors.hideBackground' }
                    ]
                },
                {
                    title: '保存笔记按钮样式',
                    key: 'saveNoteButton',
                    fields: [
                        { name: 'fontSize', label: '字体大小', type: 'text', path: 'style.fontSize' },
                        { name: 'padding', label: '内边距', type: 'text', path: 'style.padding' },
                        { name: 'background', label: '背景色', type: 'color', path: 'colors.background' }
                    ]
                },
                {
                    title: '笔记编辑器样式',
                    key: 'noteEditor',
                    fields: [
                        { name: 'width', label: '宽度', type: 'text', path: 'width' },
                        { name: 'minHeight', label: '最小高度', type: 'text', path: 'minHeight' },
                        { name: 'maxHeight', label: '最大高度', type: 'text', path: 'maxHeight' },
                        { name: 'fontSize', label: '字体大小', type: 'text', path: 'fontSize' },
                        { name: 'backgroundColor', label: '背景色', type: 'color', path: 'backgroundColor' },
                        { name: 'borderColor', label: '边框颜色', type: 'color', path: 'borderColor' }
                    ]
                }
            ];

            // 加载已保存的样式配置
            const savedStyles = await this.dbManager.getSetting('customStyles', {});

            // 创建滚动容器
            const scrollContainer = DOMHelper.createElement('div', {
                style: {
                    overflow: 'auto',
                    padding: '20px'
                }
            });

            // 为每个分类创建配置区块
            styleCategories.forEach(category => {
                const section = this._createStyleSection(category, savedStyles);
                scrollContainer.appendChild(section);
            });

            container.appendChild(scrollContainer);

            // 添加保存和重置按钮
            const buttonContainer = DOMHelper.createElement('div', {
                style: {
                    padding: '20px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    backgroundColor: 'white'
                }
            });

            const resetButton = DOMHelper.createElement('button', {
                innerText: '🔄 重置为默认',
                style: {
                    padding: '10px 20px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#718096',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }
            });

            resetButton.addEventListener('click', async () => {
                if (confirm('确定要重置所有样式为默认值吗？')) {
                    await this.dbManager.saveSetting('customStyles', {});
                    Logger.success('样式已重置');
                    this._renderStylesPanel(container);
                }
            });

            const buttonConfig = this.config.get('panelSaveButton');
            const saveButton = DOMHelper.createElement('button', {
                innerText: buttonConfig.text.save,
                style: {
                    padding: buttonConfig.style.padding,
                    border: buttonConfig.style.border,
                    borderRadius: buttonConfig.style.borderRadius,
                    backgroundColor: buttonConfig.colors.background,
                    color: buttonConfig.colors.textColor,
                    fontSize: buttonConfig.style.fontSize,
                    fontWeight: buttonConfig.style.fontWeight,
                    cursor: buttonConfig.style.cursor,
                    transition: buttonConfig.style.transition,
                    boxShadow: buttonConfig.colors.boxShadow
                }
            });

            saveButton.addEventListener('click', async () => {
                try {
                    const customStyles = {};
                    
                    // 收集所有表单数据
                    styleCategories.forEach(category => {
                        category.fields.forEach(field => {
                            const input = document.getElementById(`style-${category.key}-${field.name}`);
                            if (input && input.value) {
                                if (!customStyles[category.key]) {
                                    customStyles[category.key] = {};
                                }
                                // 设置嵌套属性
                                const pathParts = field.path.split('.');
                                let target = customStyles[category.key];
                                for (let i = 0; i < pathParts.length - 1; i++) {
                                    if (!target[pathParts[i]]) {
                                        target[pathParts[i]] = {};
                                    }
                                    target = target[pathParts[i]];
                                }
                                target[pathParts[pathParts.length - 1]] = input.value;
                            }
                        });
                    });

                    await this.dbManager.saveSetting('customStyles', customStyles);
                    
                    saveButton.innerText = buttonConfig.text.success;
                    saveButton.style.backgroundColor = buttonConfig.colors.successBackground;
                    
                    setTimeout(() => {
                        saveButton.innerText = buttonConfig.text.save;
                        saveButton.style.backgroundColor = buttonConfig.colors.background;
                    }, 2000);
                    
                    Logger.success('样式已保存，刷新页面后生效');
                    
                } catch (error) {
                    Logger.error('保存样式失败', error);
                    saveButton.innerText = buttonConfig.text.error;
                    saveButton.style.backgroundColor = buttonConfig.colors.errorBackground;
                    
                    setTimeout(() => {
                        saveButton.innerText = buttonConfig.text.save;
                        saveButton.style.backgroundColor = buttonConfig.colors.background;
                    }, 2000);
                }
            });

            buttonContainer.appendChild(resetButton);
            buttonContainer.appendChild(saveButton);
            container.appendChild(buttonContainer);
        }

        /**
         * 创建样式配置区块
         */
        _createStyleSection(category, savedStyles) {
            const section = DOMHelper.createElement('div', {
                style: {
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }
            });

            const title = DOMHelper.createElement('h3', {
                innerText: category.title,
                style: {
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2d3748',
                    borderBottom: '2px solid #4299e1',
                    paddingBottom: '8px'
                }
            });

            section.appendChild(title);

            category.fields.forEach(field => {
                const fieldGroup = DOMHelper.createElement('div', {
                    style: {
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }
                });

                const label = DOMHelper.createElement('label', {
                    innerText: field.label,
                    style: {
                        fontSize: '14px',
                        color: '#4a5568',
                        fontWeight: '500',
                        flex: '1'
                    }
                });

                // 获取当前值（优先使用保存的值，否则使用默认配置值）
                let currentValue;
                if (savedStyles[category.key]) {
                    const pathParts = field.path.split('.');
                    let value = savedStyles[category.key];
                    for (let part of pathParts) {
                        value = value?.[part];
                    }
                    currentValue = value;
                }
                
                if (!currentValue) {
                    const pathParts = field.path.split('.');
                    let value = this.config.get(category.key);
                    for (let part of pathParts) {
                        value = value?.[part];
                    }
                    currentValue = value || '';
                }

                const input = DOMHelper.createElement('input', {
                    type: field.type,
                    value: currentValue,
                    id: `style-${category.key}-${field.name}`,
                    style: {
                        width: field.type === 'color' ? '60px' : '150px',
                        padding: '6px 10px',
                        border: '1px solid #cbd5e0',
                        borderRadius: '4px',
                        fontSize: '13px'
                    }
                });

                fieldGroup.appendChild(label);
                fieldGroup.appendChild(input);
                section.appendChild(fieldGroup);
            });

            return section;
        }

        /**
         * 关闭模态框
         */
        _close() {
            if (this.modal && this.modal.parentNode) {
                document.body.removeChild(this.modal);
                this.modal = null;
            }
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
         * 获取保存笔记按钮的样式
         * @returns {Object} 样式对象
         */
        getSaveNoteButtonStyle() {
            const position = this.config.get('saveNoteButton.position');
            const style = this.config.get('saveNoteButton.style');
            const colors = this.config.get('saveNoteButton.colors');

            return {
                marginLeft: position.marginLeft,
                marginRight: position.marginRight,
                marginTop: position.marginTop,
                marginBottom: position.marginBottom,
                verticalAlign: position.verticalAlign,
                padding: style.padding,
                border: style.border,
                borderRadius: style.borderRadius,
                background: colors.background,
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
                width: noteConfig.width || '100%',
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

        /**
         * 获取管理按钮的样式
         * @returns {Object} 样式对象
         */
        getManageButtonStyle() {
            const position = this.config.get('manageButton.position');
            const style = this.config.get('manageButton.style');
            const colors = this.config.get('manageButton.colors');

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
                background: colors.background
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
            this.saveNoteButton = null;
            this.noteEditor = null;
            this.buttonContainer = null;
            this.currentAnswerBlock = null;  // 跟踪当前显示的答案块
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
            this._hideBlockInitial();
            await this._createButtons();
            await this._createNoteEditor();
            return this.buttonContainer;
        }

        _hideBlockInitial() {
            // 初始化时删除原始答案块
            DOMHelper.removeElement(this.block);
            this.currentAnswerBlock = null;
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

            // 创建保存笔记按钮
            this._createSaveNoteButton();

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

        _createSaveNoteButton() {
            const buttonText = this.config.get('saveNoteButton.text');
            this.saveNoteButton = DOMHelper.createElement('button', {
                innerText: buttonText,
                style: this.styleGenerator.getSaveNoteButtonStyle(),
                title: '手动保存当前笔记'
            });

            this.saveNoteButton.addEventListener('click', async () => {
                await this.noteEditor.save();
                Logger.success('💾 笔记已保存');
            });
            this.buttonContainer.appendChild(this.saveNoteButton);
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
            // 如果已经有显示的答案块，先删除它（防止重复）
            if (this.currentAnswerBlock && this.currentAnswerBlock.parentNode) {
                DOMHelper.removeElement(this.currentAnswerBlock);
            }

            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = this.originalHTML;
            const restoredBlock = tempContainer.firstChild;

            // 保存对新创建的答案块的引用
            this.currentAnswerBlock = restoredBlock;

            // 插入到笔记编辑器之后（如果可见）或按钮容器之后
            const insertAfter = this.noteEditor.isVisible ?
                this.noteEditor.getElement().nextSibling :
                this.buttonContainer.nextSibling;
            DOMHelper.insertElement(restoredBlock, this.parent, insertAfter);
            this.isHidden = false;
        }

        _hideBlock() {
            // 删除当前显示的答案块
            if (this.currentAnswerBlock && this.currentAnswerBlock.parentNode) {
                DOMHelper.removeElement(this.currentAnswerBlock);
                this.currentAnswerBlock = null;
            }
            this.isHidden = true;
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
        constructor(container, controllers, config, styleGenerator, dbManager, workKey) {
            this.container = container;
            this.controllers = controllers;
            this.config = config;
            this.styleGenerator = styleGenerator;
            this.dbManager = dbManager;
            this.workKey = workKey;
            this.globalButton = null;
            this.manageButton = null;
        }

        initialize() {
            if (!this.container) return null;

            DOMHelper.ensureRelativePosition(this.container);
            this._createGlobalButton();
            this._createManageButton();
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

        _createManageButton() {
            const buttonText = this.config.get('manageButton.text');
            this.manageButton = DOMHelper.createElement('button', {
                innerText: buttonText,
                style: this.styleGenerator.getManageButtonStyle(),
                title: '打开控制面板：设置和笔记管理'
            });

            this.manageButton.addEventListener('click', () => this._handleManageClick());
            this.container.appendChild(this.manageButton);
        }

        _handleManageClick() {
            const controlPanel = new ControlPanelUI(this.dbManager, this.workKey, this.config);
            controlPanel.show();
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

                // 加载自定义样式配置
                await this._loadCustomStyles();

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

        async _loadCustomStyles() {
            try {
                const customStyles = await this.dbManager.getSetting('customStyles', {});
                if (customStyles && Object.keys(customStyles).length > 0) {
                    // 将自定义样式合并到配置中
                    this.config = new Config(this.config._deepMerge(this.config.config, customStyles));
                    this.styleGenerator = new StyleGenerator(this.config);
                    Logger.log('✨ 已加载自定义样式配置');
                }
            } catch (error) {
                Logger.error('加载自定义样式失败', error);
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
                this.styleGenerator,
                this.dbManager,
                this.workKey
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