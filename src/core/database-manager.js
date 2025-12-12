/**
 * DatabaseManager - IndexedDB数据库管理器
 * 负责笔记、设置、错题集等数据的持久化存储
 * @version 3.12.0.9
 * 
 * 数据库结构（v2 简化版，不兼容旧版）：
 * - notes: { id: 'workKey_questionId', workKey, questionId, questionNo, content, createdAt, updatedAt }
 * - settings: { key, value }
 * - mistakes: { id: 'workKey_questionId_mistake', workKey, questionId, questionNo, count, createdAt, updatedAt }
 */
class DatabaseManager {
    constructor(config) {
        this.config = config;
        this.db = null;
        this.dbName = 'ChaoxingNotesDB_v2'; // 使用新数据库名，与旧版完全隔离
        this.dbVersion = 1;
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
     * 使用组合键作为主键，简化查询逻辑
     */
    _createStores(db) {
        // 笔记存储 - 主键: workKey_questionId
        if (!db.objectStoreNames.contains('notes')) {
            const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
            notesStore.createIndex('workKey', 'workKey', { unique: false });
        }

        // 设置存储
        if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
        }

        // 错题集存储 - 主键: workKey_questionId_mistake
        if (!db.objectStoreNames.contains('mistakes')) {
            const mistakesStore = db.createObjectStore('mistakes', { keyPath: 'id' });
            mistakesStore.createIndex('workKey', 'workKey', { unique: false });
        }
    }

    // ===================== 笔记操作 =====================

    /**
     * 生成笔记ID
     */
    _getNoteId(workKey, questionId) {
        return `${workKey}_${questionId}`;
    }

    /**
     * 保存笔记（新增或更新）
     */
    async saveNote(workKey, questionId, content, questionNo = '999') {
        const store = this._getStore('notes', 'readwrite');
        const id = this._getNoteId(workKey, questionId);

        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const existing = getRequest.result;
                const noteData = {
                    id,
                    workKey,
                    questionId,
                    questionNo,
                    content,
                    createdAt: existing?.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

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
        const id = this._getNoteId(workKey, questionId);

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 删除特定笔记
     */
    async deleteNote(workKey, questionId) {
        const store = this._getStore('notes', 'readwrite');
        const id = this._getNoteId(workKey, questionId);

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 批量删除笔记（通过ID列表）
     */
    async deleteNotes(noteIds) {
        const store = this._getStore('notes', 'readwrite');
        const results = { success: 0, failed: 0 };

        for (const noteId of noteIds) {
            try {
                await new Promise((resolve, reject) => {
                    const request = store.delete(noteId);
                    request.onsuccess = () => {
                        results.success++;
                        resolve();
                    };
                    request.onerror = () => {
                        results.failed++;
                        reject(request.error);
                    };
                });
            } catch (error) {
                results.failed++;
                console.error(`删除笔记失败 ${noteId}:`, error);
            }
        }

        return results;
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
     * 获取所有笔记（用于导出和控制面板）
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
     * 获取所有域名下的笔记（兼容控制面板调用）
     */
    async getAllDomainNotes() {
        return this.getAllNotes();
    }

    /**
     * 批量导入笔记
     */
    async importNotes(notes) {
        const store = this._getStore('notes', 'readwrite');
        const results = [];

        for (const note of notes) {
            try {
                const id = this._getNoteId(note.workKey, note.questionId);
                const noteData = {
                    id,
                    workKey: note.workKey,
                    questionId: note.questionId,
                    content: note.content,
                    createdAt: note.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                await new Promise((resolve, reject) => {
                    const putRequest = store.put(noteData);
                    putRequest.onsuccess = () => {
                        results.push({ success: true, note: noteData });
                        resolve();
                    };
                    putRequest.onerror = () => {
                        results.push({ success: false, note, error: putRequest.error });
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
            const request = store.put({ key, value });
            request.onsuccess = () => resolve(value);
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
            request.onsuccess = () => resolve(request.result?.value ?? defaultValue);
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

    // ===================== 错题操作 =====================

    /**
     * 生成错题ID
     */
    _getMistakeId(workKey, questionId) {
        return `${workKey}_${questionId}_mistake`;
    }

    /**
     * 获取特定题目的错题记录
     */
    async getMistake(workKey, questionId, questionNo) {
        const store = this._getStore('mistakes', 'readonly');
        const id = this._getMistakeId(workKey, questionId);

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 添加错题记录（增加计数）
     */
    async addMistake(workKey, questionId, questionNo) {
        const store = this._getStore('mistakes', 'readwrite');
        const id = this._getMistakeId(workKey, questionId);

        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const existing = getRequest.result;
                const mistakeData = {
                    id,
                    workKey,
                    questionId,
                    questionNo,
                    count: (existing?.count || 0) + 1,
                    createdAt: existing?.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const putRequest = store.put(mistakeData);
                putRequest.onsuccess = () => resolve(mistakeData);
                putRequest.onerror = () => reject(putRequest.error);
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * 重置错题计数
     */
    async resetMistake(workKey, questionId) {
        const store = this._getStore('mistakes', 'readwrite');
        const id = this._getMistakeId(workKey, questionId);

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
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

    /**
     * 导出所有数据（用于备份）
     */
    async exportAllData() {
        const notes = await this.getAllNotes();
        const settings = await this.getAllSettings();
        const mistakes = await this.getAllMistakes();

        return {
            version: this.dbVersion,
            exportedAt: new Date().toISOString(),
            data: { notes, settings, mistakes }
        };
    }

    /**
     * 导入数据（用于恢复）
     */
    async importAllData(data) {
        if (data.data?.notes) {
            await this.importNotes(data.data.notes);
        }
        
        if (data.data?.settings) {
            for (const [key, value] of Object.entries(data.data.settings)) {
                await this.saveSetting(key, value);
            }
        }

        if (data.data?.mistakes) {
            const store = this._getStore('mistakes', 'readwrite');
            for (const mistake of data.data.mistakes) {
                const id = this._getMistakeId(mistake.workKey, mistake.questionId);
                await new Promise((resolve, reject) => {
                    const putRequest = store.put({ ...mistake, id });
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                });
            }
        }

        return true;
    }
}

// 导出供其他模块使用
window.DatabaseManager = DatabaseManager;
