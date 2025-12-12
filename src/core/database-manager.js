/**
 * DatabaseManager - IndexedDB数据库管理器
 * 负责笔记、设置、错题集等数据的持久化存储
 * @version 3.12.0.5
 */
class DatabaseManager {
    constructor(config) {
        this.config = config;
        this.db = null;
        this.dbName = config.get('database.name');
        this.dbVersion = config.get('database.version');
    }

    /**
     * 初始化数据库连接
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this._createStores(db);
            };
        });
    }

    /**
     * 创建对象存储（表）
     */
    _createStores(db) {
        // 笔记存储（按 workKey + questionId 索引）
        if (!db.objectStoreNames.contains('notes')) {
            const notesStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
            notesStore.createIndex('workKey', 'workKey', { unique: false });
            notesStore.createIndex('questionId', 'questionId', { unique: false });
            notesStore.createIndex('workKey_questionId', ['workKey', 'questionId'], { unique: true });
        }

        // 设置存储（全局配置）
        if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
        }

        // 错题集存储
        if (!db.objectStoreNames.contains('mistakes')) {
            const mistakesStore = db.createObjectStore('mistakes', { keyPath: 'id', autoIncrement: true });
            mistakesStore.createIndex('workKey', 'workKey', { unique: false });
            mistakesStore.createIndex('questionId', 'questionId', { unique: false });
            mistakesStore.createIndex('workKey_questionId', ['workKey', 'questionId'], { unique: true });
        }
    }

    // ===================== 笔记操作 =====================

    /**
     * 保存笔记（新增或更新）
     */
    async saveNote(workKey, questionId, content) {
        const store = this._getStore('notes', 'readwrite');
        const index = store.index('workKey_questionId');

        return new Promise((resolve, reject) => {
            const getRequest = index.get([workKey, questionId]);

            getRequest.onsuccess = () => {
                const existing = getRequest.result;
                const noteData = {
                    workKey,
                    questionId,
                    content,
                    updatedAt: new Date().toISOString()
                };

                if (existing) {
                    noteData.id = existing.id;
                    noteData.createdAt = existing.createdAt;
                } else {
                    noteData.createdAt = new Date().toISOString();
                }

                const putRequest = store.put(noteData);
                putRequest.onsuccess = () => resolve(noteData);
                putRequest.onerror = () => reject(putRequest.error);
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * 获取特定题目的笔记
     */
    async getNote(workKey, questionId) {
        const store = this._getStore('notes', 'readonly');
        const index = store.index('workKey_questionId');

        return new Promise((resolve, reject) => {
            const request = index.get([workKey, questionId]);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 删除特定笔记
     */
    async deleteNote(workKey, questionId) {
        const store = this._getStore('notes', 'readwrite');
        const index = store.index('workKey_questionId');

        return new Promise((resolve, reject) => {
            const getRequest = index.get([workKey, questionId]);

            getRequest.onsuccess = () => {
                const existing = getRequest.result;
                if (existing) {
                    const deleteRequest = store.delete(existing.id);
                    deleteRequest.onsuccess = () => resolve(true);
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                } else {
                    resolve(false);
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * 获取当前作业的所有笔记
     */
    async getNotesByWorkKey(workKey) {
        const store = this._getStore('notes', 'readonly');
        const index = store.index('workKey');

        return new Promise((resolve, reject) => {
            const request = index.getAll(workKey);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取所有笔记（用于导出）
     */
    async getAllNotes() {
        const store = this._getStore('notes', 'readonly');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 批量导入笔记
     */
    async importNotes(notes) {
        const store = this._getStore('notes', 'readwrite');
        const results = [];

        for (const note of notes) {
            try {
                await new Promise((resolve, reject) => {
                    // 先检查是否存在
                    const index = store.index('workKey_questionId');
                    const getRequest = index.get([note.workKey, note.questionId]);

                    getRequest.onsuccess = () => {
                        const existing = getRequest.result;
                        const noteData = {
                            workKey: note.workKey,
                            questionId: note.questionId,
                            content: note.content,
                            createdAt: note.createdAt || new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };

                        if (existing) {
                            noteData.id = existing.id;
                        }

                        const putRequest = store.put(noteData);
                        putRequest.onsuccess = () => {
                            results.push({ success: true, note: noteData });
                            resolve();
                        };
                        putRequest.onerror = () => {
                            results.push({ success: false, note, error: putRequest.error });
                            resolve();
                        };
                    };

                    getRequest.onerror = () => {
                        results.push({ success: false, note, error: getRequest.error });
                        resolve();
                    };
                });
            } catch (error) {
                results.push({ success: false, note, error });
            }
        }

        return results;
    }

    // ===================== 设置操作 =====================

    /**
     * 保存设置项
     */
    async saveSetting(key, value) {
        const store = this._getStore('settings', 'readwrite');

        return new Promise((resolve, reject) => {
            const request = store.put({ key, value, updatedAt: new Date().toISOString() });
            request.onsuccess = () => resolve({ key, value });
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取设置项
     */
    async getSetting(key, defaultValue = null) {
        const store = this._getStore('settings', 'readonly');

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : defaultValue);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 删除设置项
     */
    async deleteSetting(key) {
        const store = this._getStore('settings', 'readwrite');

        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取所有设置
     */
    async getAllSettings() {
        const store = this._getStore('settings', 'readonly');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const settings = {};
                (request.result || []).forEach(item => {
                    settings[item.key] = item.value;
                });
                resolve(settings);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ===================== 错题集操作 =====================

    /**
     * 添加到错题集
     */
    async addMistake(workKey, questionId, questionData) {
        const store = this._getStore('mistakes', 'readwrite');
        const index = store.index('workKey_questionId');

        return new Promise((resolve, reject) => {
            const getRequest = index.get([workKey, questionId]);

            getRequest.onsuccess = () => {
                const existing = getRequest.result;
                const mistakeData = {
                    workKey,
                    questionId,
                    ...questionData,
                    addedAt: existing?.addedAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                if (existing) {
                    mistakeData.id = existing.id;
                }

                const putRequest = store.put(mistakeData);
                putRequest.onsuccess = () => resolve(mistakeData);
                putRequest.onerror = () => reject(putRequest.error);
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * 从错题集移除
     */
    async removeMistake(workKey, questionId) {
        const store = this._getStore('mistakes', 'readwrite');
        const index = store.index('workKey_questionId');

        return new Promise((resolve, reject) => {
            const getRequest = index.get([workKey, questionId]);

            getRequest.onsuccess = () => {
                const existing = getRequest.result;
                if (existing) {
                    const deleteRequest = store.delete(existing.id);
                    deleteRequest.onsuccess = () => resolve(true);
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                } else {
                    resolve(false);
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * 检查是否在错题集中
     */
    async isMistake(workKey, questionId) {
        const store = this._getStore('mistakes', 'readonly');
        const index = store.index('workKey_questionId');

        return new Promise((resolve, reject) => {
            const request = index.get([workKey, questionId]);
            request.onsuccess = () => resolve(!!request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取所有错题
     */
    async getAllMistakes() {
        const store = this._getStore('mistakes', 'readonly');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取特定作业的错题
     */
    async getMistakesByWorkKey(workKey) {
        const store = this._getStore('mistakes', 'readonly');
        const index = store.index('workKey');

        return new Promise((resolve, reject) => {
            const request = index.getAll(workKey);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    // ===================== 工具方法 =====================

    /**
     * 获取对象存储
     */
    _getStore(storeName, mode) {
        const transaction = this.db.transaction([storeName], mode);
        return transaction.objectStore(storeName);
    }

    /**
     * 清空所有数据
     */
    async clearAll() {
        const stores = ['notes', 'settings', 'mistakes'];

        for (const storeName of stores) {
            const store = this._getStore(storeName, 'readwrite');
            await new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        return true;
    }
}

// 导出供其他模块使用
window.DatabaseManager = DatabaseManager;
