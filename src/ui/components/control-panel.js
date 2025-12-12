/**
 * ControlPanelUI - 控制面板UI组件
 * 提供设置、笔记管理、样式管理等功能的面板界面
 * @version 3.12.0
 */
class ControlPanelUI {
    constructor(dbManager, workKey, config) {
        this.dbManager = dbManager;
        this.workKey = workKey;
        this.config = config;
        this.modal = null;
        this.notesList = [];
        this.selectedNotes = new Set();
        this.notesScope = 'current'; // 'current', 'course', 'class', 'domain'
        this.currentTab = 'settings'; // 'settings', 'notes', 'styles'
        this.settings = {};
        this.notesMenuExpanded = false; // 管理笔记子菜单是否展开
        this.notesSortBy = 'time'; // 'time' 或 'alpha' (字母序)
        this.notesSortOrder = 'desc'; // 'asc' 升序 或 'desc' 降序

        // 解析 workKey 获取 courseId, classId, workId
        const parts = workKey.split('_');
        this.courseId = parts[0] || '';
        this.classId = parts[1] || '';
        this.workId = parts[2] || '';
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
            if (!('aiPromptPrefix' in this.settings)) {
                this.settings.aiPromptPrefix = this.config.get('settings.aiPromptPrefix');
            }
            if (!('aiPromptSuffix' in this.settings)) {
                this.settings.aiPromptSuffix = this.config.get('settings.aiPromptSuffix');
            }
            if (!('aiChatId' in this.settings)) {
                this.settings.aiChatId = this.config.get('settings.aiChatId');
            }
        } catch (error) {
            Logger.error('加载设置失败', error);
            this.settings = {
                autoSave: this.config.get('settings.autoSave'),
                autoSaveDelay: this.config.get('settings.autoSaveDelay'),
                aiPromptPrefix: this.config.get('settings.aiPromptPrefix'),
                aiPromptSuffix: this.config.get('settings.aiPromptSuffix'),
                aiChatId: this.config.get('settings.aiChatId')
            };
        }
    }

    /**
     * 加载笔记数据
     */
    async _loadNotes() {
        try {
            const allNotes = await this.dbManager.getAllDomainNotes();

            switch (this.notesScope) {
                case 'current':
                    // 当前页面：完全匹配 workKey
                    this.notesList = allNotes.filter(note => note.workKey === this.workKey);
                    break;
                case 'course':
                    // 当前课程：courseId 相同
                    this.notesList = allNotes.filter(note => {
                        const parts = note.workKey.split('_');
                        return parts[0] === this.courseId;
                    });
                    break;
                case 'class':
                    // 当前班级：courseId 和 classId 都相同
                    this.notesList = allNotes.filter(note => {
                        const parts = note.workKey.split('_');
                        return parts[0] === this.courseId && parts[1] === this.classId;
                    });
                    break;
                case 'domain':
                    // 整个域名：所有笔记
                    this.notesList = allNotes;
                    break;
                default:
                    this.notesList = allNotes.filter(note => note.workKey === this.workKey);
            }

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
                display: 'flex',
                flexDirection: 'column'
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
            { id: 'copy-config', icon: '📋', text: '复制内容管理' },
            { id: 'ai-prompt', icon: '🤖', text: 'AI提问管理' },
            { id: 'export', icon: '📄', text: '导出格式管理' },
            {
                id: 'notes',
                icon: '📝',
                text: '笔记管理',
                hasSubmenu: true,
                submenu: [
                    { id: 'notes-current', icon: '📄', text: '当前页面', scope: 'current' },
                    { id: 'notes-course', icon: '📚', text: '当前课程', scope: 'course' },
                    { id: 'notes-domain', icon: '🌐', text: '当前域名', scope: 'domain' }
                ]
            },
            { id: 'styles', icon: '🎨', text: '样式管理' }
        ];

        menuItems.forEach(item => {
            const menuItem = this._createMenuItem(item);
            sidebar.appendChild(menuItem);
        });

        return sidebar;
    }

    /**
     * 创建菜单项（支持子菜单）
     */
    _createMenuItem(item) {
        const container = DOMHelper.createElement('div');

        // 主菜单项
        const menuItem = DOMHelper.createElement('div', {
            dataset: { tab: item.id },
            style: {
                padding: '12px 20px',
                cursor: 'pointer',
                color: this.currentTab === item.id ? 'white' : '#a0aec0',
                backgroundColor: this.currentTab === item.id ? '#4a5568' : 'transparent',
                borderLeft: this.currentTab === item.id ? '3px solid #4299e1' : '3px solid transparent',
                fontWeight: this.currentTab === item.id ? 'bold' : 'normal',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                justifyContent: 'space-between'
            }
        });

        const leftContent = DOMHelper.createElement('div', {
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }
        });

        const iconSpan = DOMHelper.createElement('span', {
            innerText: item.icon,
            style: {
                fontSize: '16px'
            }
        });

        const textSpan = DOMHelper.createElement('span', {
            innerText: item.text,
            style: {
                fontSize: '14px'
            }
        });

        leftContent.appendChild(iconSpan);
        leftContent.appendChild(textSpan);
        menuItem.appendChild(leftContent);

        // 如果有子菜单，添加展开图标
        if (item.hasSubmenu) {
            const expandIcon = DOMHelper.createElement('span', {
                innerText: '▼',
                style: {
                    fontSize: '10px',
                    transition: 'transform 0.2s',
                    transform: this.notesMenuExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'
                }
            });
            menuItem.appendChild(expandIcon);

            // 创建子菜单容器
            const submenuContainer = DOMHelper.createElement('div', {
                style: {
                    display: this.notesMenuExpanded ? 'block' : 'none',
                    backgroundColor: '#1a202c'
                }
            });

            item.submenu.forEach(subItem => {
                const subMenuItem = this._createSubMenuItem(subItem);
                submenuContainer.appendChild(subMenuItem);
            });

            menuItem.addEventListener('click', () => {
                this.notesMenuExpanded = !this.notesMenuExpanded;
                expandIcon.style.transform = this.notesMenuExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
                submenuContainer.style.display = this.notesMenuExpanded ? 'block' : 'none';
            });

            container.appendChild(menuItem);
            container.appendChild(submenuContainer);
        } else {
            // 无子菜单的普通菜单项
            menuItem.addEventListener('mouseenter', () => {
                if (this.currentTab !== item.id) {
                    menuItem.style.backgroundColor = '#4a5568';
                    menuItem.style.color = '#e2e8f0';
                }
            });

            menuItem.addEventListener('mouseleave', () => {
                if (this.currentTab !== item.id) {
                    menuItem.style.backgroundColor = 'transparent';
                    menuItem.style.color = '#a0aec0';
                }
            });

            menuItem.addEventListener('click', () => {
                this.currentTab = item.id;
                this._updateSidebarState();
                this._renderContent();
            });

            container.appendChild(menuItem);
        }

        return container;
    }

    /**
     * 创建子菜单项
     */
    _createSubMenuItem(subItem) {
        const isActive = this.currentTab === 'notes' && this.notesScope === subItem.scope;

        const subMenuItem = DOMHelper.createElement('div', {
            dataset: { scope: subItem.scope },
            style: {
                padding: '10px 20px 10px 50px',
                cursor: 'pointer',
                color: isActive ? '#63b3ed' : '#718096',
                backgroundColor: isActive ? '#2d3748' : 'transparent',
                fontSize: '13px',
                fontWeight: isActive ? 'bold' : 'normal',
                textShadow: isActive ? '0 0 8px rgba(99, 179, 237, 0.5)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }
        });

        const icon = DOMHelper.createElement('span', {
            innerText: subItem.icon,
            style: {
                fontSize: '14px'
            }
        });

        const text = DOMHelper.createElement('span', {
            innerText: subItem.text
        });

        subMenuItem.appendChild(icon);
        subMenuItem.appendChild(text);

        subMenuItem.addEventListener('mouseenter', () => {
            if (!(this.currentTab === 'notes' && this.notesScope === subItem.scope)) {
                subMenuItem.style.backgroundColor = '#2d3748';
                subMenuItem.style.color = '#a0aec0';
            }
        });

        subMenuItem.addEventListener('mouseleave', () => {
            const isCurrentScope = this.currentTab === 'notes' && this.notesScope === subItem.scope;
            if (!isCurrentScope) {
                subMenuItem.style.backgroundColor = 'transparent';
                subMenuItem.style.color = '#718096';
            } else {
                subMenuItem.style.backgroundColor = '#2d3748';
                subMenuItem.style.color = '#63b3ed';
                subMenuItem.style.textShadow = '0 0 8px rgba(99, 179, 237, 0.5)';
            }
        });

        subMenuItem.addEventListener('click', async () => {
            this.currentTab = 'notes';
            this.notesScope = subItem.scope;
            this.selectedNotes.clear();
            await this._loadNotes();
            this._updateSidebarState();
            this._renderContent();
        });

        return subMenuItem;
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

        // 更新子菜单项状态
        const subMenuItems = this.modal.querySelectorAll('[data-scope]');
        subMenuItems.forEach(item => {
            const isActive = this.currentTab === 'notes' && this.notesScope === item.dataset.scope;
            item.style.color = isActive ? '#4299e1' : '#718096';
            item.style.backgroundColor = isActive ? '#2d3748' : 'transparent';
        });
    }

    /**
     * 创建统一的底部悬浮操作栏
     * @param {Object} options - 配置选项
     * @param {string} options.saveText - 保存按钮文字
     * @param {Function} options.onSave - 保存回调函数
     * @param {Function} options.onReset - 重置回调函数（可选）
     * @param {string} options.resetText - 重置按钮文字（可选）
     * @returns {HTMLElement} 操作栏元素
     */
    _createFloatingActionBar(options) {
        const {
            saveText = '💾 保存设置',
            onSave,
            onReset = null,
            resetText = '🔄 重置为默认'
        } = options;

        const buttonConfig = this.config.get('panelSaveButton');

        // 创建固定下边栏容器
        const actionBar = DOMHelper.createElement('div', {
            className: 'floating-action-bar',
            style: {
                position: 'sticky',
                bottom: '0',
                left: '0',
                right: '0',
                padding: '12px 24px',
                backgroundColor: 'white',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: onReset ? 'space-between' : 'flex-end',
                alignItems: 'center',
                boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
                zIndex: '100',
                marginTop: 'auto'
            }
        });

        // 创建重置按钮（如果提供了重置回调）
        if (onReset) {
            const resetButton = DOMHelper.createElement('button', {
                innerText: resetText,
                style: {
                    padding: '8px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#718096',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }
            });

            resetButton.addEventListener('mouseenter', () => {
                resetButton.style.backgroundColor = '#f7fafc';
                resetButton.style.borderColor = '#cbd5e0';
                resetButton.style.transform = 'translateY(-1px)';
                resetButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            });

            resetButton.addEventListener('mouseleave', () => {
                resetButton.style.backgroundColor = 'white';
                resetButton.style.borderColor = '#e2e8f0';
                resetButton.style.transform = 'translateY(0)';
                resetButton.style.boxShadow = 'none';
            });

            resetButton.addEventListener('click', onReset);
            actionBar.appendChild(resetButton);
        }

        // 创建保存按钮
        const saveButton = DOMHelper.createElement('button', {
            innerText: saveText,
            style: {
                padding: '8px 18px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: buttonConfig.colors.background,
                color: buttonConfig.colors.textColor,
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: buttonConfig.colors.boxShadow
            }
        });

        saveButton.addEventListener('mouseenter', () => {
            saveButton.style.backgroundColor = buttonConfig.colors.hoverBackground;
            saveButton.style.transform = 'translateY(-1px)';
            saveButton.style.boxShadow = buttonConfig.colors.hoverBoxShadow;
        });

        saveButton.addEventListener('mouseleave', () => {
            if (!saveButton.dataset.success && !saveButton.dataset.error) {
                saveButton.style.backgroundColor = buttonConfig.colors.background;
                saveButton.style.transform = 'translateY(0)';
                saveButton.style.boxShadow = buttonConfig.colors.boxShadow;
            }
        });

        // 封装保存逻辑
        saveButton.addEventListener('click', async () => {
            try {
                saveButton.disabled = true;
                saveButton.innerText = '⏳ 保存中...';

                await onSave();

                // 显示成功状态
                saveButton.dataset.success = 'true';
                saveButton.innerText = buttonConfig.text.success;
                saveButton.style.backgroundColor = buttonConfig.colors.successBackground;

                setTimeout(() => {
                    delete saveButton.dataset.success;
                    saveButton.innerText = saveText;
                    saveButton.style.backgroundColor = buttonConfig.colors.background;
                    saveButton.disabled = false;
                }, 2000);

            } catch (error) {
                Logger.error('保存失败', error);

                // 显示错误状态
                saveButton.dataset.error = 'true';
                saveButton.innerText = buttonConfig.text.error;
                saveButton.style.backgroundColor = buttonConfig.colors.errorBackground;

                setTimeout(() => {
                    delete saveButton.dataset.error;
                    saveButton.innerText = saveText;
                    saveButton.style.backgroundColor = buttonConfig.colors.background;
                    saveButton.disabled = false;
                }, 2000);
            }
        });

        actionBar.appendChild(saveButton);

        return actionBar;
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
        } else if (this.currentTab === 'copy-config') {
            headerTitle.innerText = '📋 复制内容前后缀管理';
            this._renderCopyConfigPanel(contentBody);
        } else if (this.currentTab === 'ai-prompt') {
            headerTitle.innerText = '🤖 AI提问管理';
            this._renderAIPromptPanel(contentBody);
        } else if (this.currentTab === 'export') {
            headerTitle.innerText = '📄 导出设置';
            this._renderExportSettingsPanel(contentBody);
        } else if (this.currentTab === 'notes') {
            headerTitle.innerText = '📝 笔记管理';
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
        container.style.padding = '0';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';

        // 创建内容包装器（有padding）
        const contentWrapper = DOMHelper.createElement('div', {
            style: {
                flex: '1',
                padding: '30px',
                overflow: 'auto'
            }
        });

        const settingsContainer = DOMHelper.createCard();

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

        // 危险操作区域
        const dangerZone = DOMHelper.createCard({
            border: '2px solid #feb2b2'
        });

        const dangerTitle = DOMHelper.createTitle('⚠️ 危险操作', {
            color: '#c53030'
        });

        const clearDbSection = DOMHelper.createElement('div', {
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px'
            }
        });

        const clearDbInfo = DOMHelper.createElement('div');

        const clearDbLabel = DOMHelper.createElement('div', {
            innerText: '清空所有数据',
            style: {
                fontSize: '14px',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '4px'
            }
        });

        const clearDbDesc = DOMHelper.createElement('div', {
            innerText: '删除所有笔记、设置和自定义样式，还原到初始状态。此操作不可恢复！',
            style: {
                fontSize: '13px',
                color: '#718096',
                lineHeight: '1.5'
            }
        });

        clearDbInfo.appendChild(clearDbLabel);
        clearDbInfo.appendChild(clearDbDesc);

        const clearDbBtn = DOMHelper.createElement('button', {
            innerText: '清空数据库',
            style: {
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#f56565',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
            }
        });

        clearDbBtn.addEventListener('mouseenter', () => {
            clearDbBtn.style.backgroundColor = '#e53e3e';
            clearDbBtn.style.transform = 'translateY(-1px)';
        });

        clearDbBtn.addEventListener('mouseleave', () => {
            clearDbBtn.style.backgroundColor = '#f56565';
            clearDbBtn.style.transform = 'translateY(0)';
        });

        clearDbBtn.addEventListener('click', async () => {
            const confirmText = '确认要清空所有数据吗？\n\n将删除：\n- 所有笔记\n- 所有设置\n- 所有自定义样式\n\n此操作不可恢复！\n\n请输入 "CLEAR" 确认操作：';
            const userInput = prompt(confirmText);

            if (userInput === 'CLEAR') {
                try {
                    clearDbBtn.disabled = true;
                    clearDbBtn.innerText = '清空中...';
                    clearDbBtn.style.backgroundColor = '#cbd5e0';

                    await this.dbManager.clearAllData();

                    alert('✅ 数据库已清空！\n\n页面将在 2 秒后刷新...');
                    Logger.success('数据库已成功清空');

                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } catch (error) {
                    Logger.error('清空数据库失败', error);
                    alert('❌ 清空失败，请查看控制台了解详情');
                    clearDbBtn.disabled = false;
                    clearDbBtn.innerText = '清空数据库';
                    clearDbBtn.style.backgroundColor = '#f56565';
                }
            } else if (userInput !== null) {
                alert('输入不正确，操作已取消');
            }
        });

        clearDbSection.appendChild(clearDbInfo);
        clearDbSection.appendChild(clearDbBtn);

        dangerZone.appendChild(dangerTitle);
        dangerZone.appendChild(clearDbSection);

        contentWrapper.appendChild(dangerZone);
        container.appendChild(contentWrapper);

        // 添加统一的底部操作栏
        const actionBar = this._createFloatingActionBar({
            saveText: '💾 保存基础设置',
            onSave: async () => {
                await this.dbManager.saveSetting('autoSave', this.settings.autoSave);
                await this.dbManager.saveSetting('autoSaveDelay', this.settings.autoSaveDelay);
                Logger.success('基础设置已保存');
            },
            onReset: async () => {
                if (confirm('确定要重置基础设置为默认值吗？')) {
                    const defaults = this.config.get('settings');
                    this.settings.autoSave = defaults.autoSave;
                    this.settings.autoSaveDelay = defaults.autoSaveDelay;
                    await this.dbManager.saveSetting('autoSave', defaults.autoSave);
                    await this.dbManager.saveSetting('autoSaveDelay', defaults.autoSaveDelay);
                    Logger.success('基础设置已重置');
                    this._renderSettingsPanel(container);
                }
            },
            resetText: '🔄 重置基础设置'
        });
        container.appendChild(actionBar);
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
     * 创建文本输入类型的设置项
     * @param {string} label - 设置项标签
     * @param {string} description - 设置项描述
     * @param {string} key - 设置项键名
     * @param {string} value - 当前值
     * @returns {HTMLElement} 设置项元素
     */
    _createTextSettingItem(label, description, key, value) {
        const item = DOMHelper.createElement('div', {
            style: {
                marginBottom: '20px'
            }
        });

        const labelEl = DOMHelper.createElement('label', {
            innerText: label,
            style: {
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '8px'
            }
        });

        // 根据key动态设置placeholder
        let placeholder = '留空则不添加前缀/后缀';
        if (key === 'aiChatId') {
            placeholder = '留空则每次新建标签页，示例：32898162890824194';
        }

        const input = DOMHelper.createElement('input', {
            type: 'text',
            value: value || '',
            placeholder: placeholder,
            style: {
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e0',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#2d3748',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
            }
        });

        // 聚焦效果
        input.addEventListener('focus', () => {
            input.style.borderColor = '#4299e1';
            input.style.outline = 'none';
            input.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)';
        });

        input.addEventListener('blur', () => {
            input.style.borderColor = '#cbd5e0';
            input.style.boxShadow = 'none';
        });

        // 实时保存
        input.addEventListener('input', () => {
            this.settings[key] = input.value;
        });

        const desc = DOMHelper.createElement('div', {
            innerText: description,
            style: {
                fontSize: '12px',
                color: '#718096',
                marginTop: '6px',
                lineHeight: '1.5'
            }
        });

        item.appendChild(labelEl);
        item.appendChild(input);
        item.appendChild(desc);

        return item;
    }

    /**
     * 创建文本域类型的设置项（支持多行输入）
     * @param {string} label - 设置项标签
     * @param {string} description - 设置项描述
     * @param {string} key - 设置项键名
     * @param {string} value - 当前值
     * @returns {HTMLElement} 设置项元素
     */
    _createTextareaSettingItem(label, description, key, value) {
        const item = DOMHelper.createElement('div', {
            style: {
                marginBottom: '24px'
            }
        });

        const labelEl = DOMHelper.createElement('label', {
            innerText: label,
            style: {
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '8px'
            }
        });

        const textarea = DOMHelper.createElement('textarea', {
            value: value || '',
            placeholder: '留空则不添加前缀/后缀。支持 \\n 换行符',
            rows: 3,
            style: {
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e0',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#2d3748',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                lineHeight: '1.5',
                resize: 'vertical',
                minHeight: '60px'
            }
        });

        // 设置初始值
        textarea.value = value || '';

        // 聚焦效果
        textarea.addEventListener('focus', () => {
            textarea.style.borderColor = '#4299e1';
            textarea.style.outline = 'none';
            textarea.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)';
        });

        textarea.addEventListener('blur', () => {
            textarea.style.borderColor = '#cbd5e0';
            textarea.style.boxShadow = 'none';
        });

        // 实时保存
        textarea.addEventListener('input', () => {
            this.settings[key] = textarea.value;
        });

        const desc = DOMHelper.createElement('div', {
            innerHTML: description,
            style: {
                fontSize: '12px',
                color: '#718096',
                marginTop: '6px',
                lineHeight: '1.5'
            }
        });

        // 字符计数提示
        const charCount = DOMHelper.createElement('div', {
            style: {
                fontSize: '11px',
                color: '#a0aec0',
                marginTop: '4px',
                textAlign: 'right'
            }
        });

        const updateCharCount = () => {
            const length = textarea.value.length;
            const displayValue = textarea.value.replace(/\\n/g, '\n');
            const actualLength = displayValue.length;
            charCount.innerText = `${length} 字符 (实际显示: ${actualLength} 字符)`;
        };

        updateCharCount();
        textarea.addEventListener('input', updateCharCount);

        item.appendChild(labelEl);
        item.appendChild(textarea);
        item.appendChild(desc);
        item.appendChild(charCount);

        return item;
    }

    /**
     * 通用的前后缀配置面板渲染方法（支持复制配置和AI提问管理复用）
     * @param {Object} options - 配置选项
     * @param {string} options.title - 面板标题
     * @param {string} options.prefixKey - 前缀配置键名
     * @param {string} options.suffixKey - 后缀配置键名
     * @param {string} options.prefixLabel - 前缀输入框标签
     * @param {string} options.suffixLabel - 后缀输入框标签
     * @param {string} options.prefixDesc - 前缀输入框描述
     * @param {string} options.suffixDesc - 后缀输入框描述
     * @param {string} options.sampleQuestion - 预览示例题目
     * @param {Function} options.onSave - 保存回调函数
     * @param {Function} options.onReset - 重置回调函数
     */
    _renderPrefixSuffixPanel(container, options) {
        container.innerHTML = '';
        container.style.padding = '0';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';

        // 创建内容包装器（有padding）
        const contentWrapper = DOMHelper.createElement('div', {
            style: {
                flex: '1',
                padding: '30px',
                overflow: 'auto'
            }
        });

        // 配置表单区域
        const configSection = DOMHelper.createCard();

        // 前缀设置
        const prefixSection = this._createTextareaSettingItem(
            options.prefixLabel,
            options.prefixDesc,
            options.prefixKey,
            this.settings[options.prefixKey] || ''
        );

        configSection.appendChild(prefixSection);

        // 后缀设置
        const suffixSection = this._createTextareaSettingItem(
            options.suffixLabel,
            options.suffixDesc,
            options.suffixKey,
            this.settings[options.suffixKey] || ''
        );

        configSection.appendChild(suffixSection);

        container.appendChild(configSection);

        // 示例预览区域
        const previewSection = DOMHelper.createCard();

        const previewTitle = DOMHelper.createTitle('💡 实时预览');

        const previewHint = DOMHelper.createDescription('以下是应用前缀和后缀后的效果：', {
            marginTop: '0',
            marginBottom: '12px'
        });

        const previewContent = DOMHelper.createElement('pre', {
            id: `${options.prefixKey}-preview`,
            style: {
                fontSize: '13px',
                color: '#2d3748',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                backgroundColor: '#f7fafc',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                margin: '0',
                overflow: 'auto',
                maxHeight: '300px'
            }
        });

        // 更新预览内容的函数（处理 \n 转义）
        const updatePreview = () => {
            const prefix = (this.settings[options.prefixKey] || '').replace(/\\n/g, '\n');
            const suffix = (this.settings[options.suffixKey] || '').replace(/\\n/g, '\n');
            previewContent.textContent = prefix + options.sampleQuestion + suffix;
        };

        // 初始预览
        updatePreview();

        // 监听输入变化更新预览
        const prefixTextarea = prefixSection.querySelector('textarea');
        const suffixTextarea = suffixSection.querySelector('textarea');

        if (prefixTextarea) {
            prefixTextarea.addEventListener('input', updatePreview);
        }
        if (suffixTextarea) {
            suffixTextarea.addEventListener('input', updatePreview);
        }

        previewSection.appendChild(previewTitle);
        previewSection.appendChild(previewHint);
        previewSection.appendChild(previewContent);
        
        contentWrapper.appendChild(configSection);
        contentWrapper.appendChild(previewSection);
        container.appendChild(contentWrapper);

        // 底部操作栏
        const actionBar = this._createFloatingActionBar({
            saveText: '💾 保存配置',
            onSave: options.onSave,
            resetText: '🔄 重置配置',
            onReset: options.onReset
        });

        container.appendChild(actionBar);
    }

    /**
     * 渲染复制配置面板
     */
    _renderCopyConfigPanel(container) {
        this._renderPrefixSuffixPanel(container, {
            title: '📋 复制内容管理',
            prefixKey: 'copyPrefix',
            suffixKey: 'copySuffix',
            prefixLabel: '复制内容前缀',
            suffixLabel: '复制内容后缀',
            prefixDesc: '复制题目时自动添加到内容前面的文字。支持 \\n 换行符（如："【题目】\\n"、"问："等）',
            suffixDesc: '复制题目时自动添加到内容后面的文字。支持 \\n 换行符（如："\\n---"、"\\n\\n来源：超星学习通"等）',
            sampleQuestion: '1. (单选题, 3分) 以下哪个是正确的？\nA. 选项A\nB. 选项B\nC. 选项C\nD. 选项D',
            onSave: async () => {
                // 保存配置
                try {
                    await this.dbManager.saveSetting('copyPrefix', this.settings.copyPrefix || '');
                    await this.dbManager.saveSetting('copySuffix', this.settings.copySuffix || '');
                } catch (error) {
                    console.error('保存失败:', error);
                    alert('❌ 保存失败，请重试');
                }
            },
            onReset: () => {
                // 重置配置
                if (confirm('确定要重置复制配置吗？')) {
                    this.settings.copyPrefix = '';
                    this.settings.copySuffix = '';
                    this.dbManager.saveSetting('copyPrefix', '');
                    this.dbManager.saveSetting('copySuffix', '');
                    this._renderCopyConfigPanel(container);
                }
            }
        });
    }

    /**
     * 渲染AI提问管理面板
     */
    _renderAIPromptPanel(container) {
        container.innerHTML = '';
        container.style.padding = '0';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';

        // 创建内容包装器（有padding）
        const contentWrapper = DOMHelper.createElement('div', {
            style: {
                flex: '1',
                padding: '30px',
                overflow: 'auto'
            }
        });

        // 配置表单区域
        const configSection = DOMHelper.createCard();

        // AI提问前缀设置
        const prefixSection = this._createTextareaSettingItem(
            '前缀提示词',
            '点击"问豆包"按钮时，自动添加到题目前面的提示词。支持 \\n 换行符（如："请帮我解答这道题目：\\n"、"【来自超星学习通】\\n\\n"等）',
            'aiPromptPrefix',
            this.settings.aiPromptPrefix || ''
        );

        configSection.appendChild(prefixSection);

        // AI提问后缀设置
        const suffixSection = this._createTextareaSettingItem(
            '后缀提示词',
            '点击"问豆包"按钮时，自动添加到题目后面的提示词。支持 \\n 换行符（如："\\n\\n请给出详细解释"、"\\n---\\n需要步骤讲解"等）',
            'aiPromptSuffix',
            this.settings.aiPromptSuffix || ''
        );

        configSection.appendChild(suffixSection);

        // 豆包会话ID设置
        const chatIdSection = this._createTextSettingItem(
            '会话ID（可选）',
            '配置固定的豆包会话ID，每次打开同一个会话（浏览器可能自动聚焦已有标签页）。留空则每次新建标签页。示例：从 https://www.doubao.com/chat/32898162890824194 提取数字ID：32898162890824194',
            'aiChatId',
            this.settings.aiChatId || ''
        );

        configSection.appendChild(chatIdSection);

        container.appendChild(configSection);

        // 示例预览区域
        const previewSection = DOMHelper.createCard();

        const previewTitle = DOMHelper.createTitle('💡 实时预览');

        const previewHint = DOMHelper.createDescription('以下是应用前缀和后缀后的效果：', {
            marginTop: '0',
            marginBottom: '12px'
        });

        const previewContent = DOMHelper.createElement('pre', {
            id: 'ai-prompt-preview',
            style: {
                fontSize: '13px',
                color: '#2d3748',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                backgroundColor: '#f7fafc',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                margin: '0',
                overflow: 'auto',
                maxHeight: '300px'
            }
        });

        // 更新预览内容的函数（处理 \n 转义）
        const updatePreview = () => {
            const prefix = (this.settings.aiPromptPrefix || '').replace(/\\n/g, '\n');
            const suffix = (this.settings.aiPromptSuffix || '').replace(/\\n/g, '\n');
            const sampleQuestion = '1. (单选题, 3分) 以下哪个是正确的？\nA. 选项A\nB. 选项B\nC. 选项C\nD. 选项D';
            previewContent.textContent = prefix + sampleQuestion + suffix;
        };

        // 初始预览
        updatePreview();

        // 监听输入变化更新预览
        const prefixTextarea = prefixSection.querySelector('textarea');
        const suffixTextarea = suffixSection.querySelector('textarea');

        if (prefixTextarea) {
            prefixTextarea.addEventListener('input', updatePreview);
        }
        if (suffixTextarea) {
            suffixTextarea.addEventListener('input', updatePreview);
        }

        previewSection.appendChild(previewTitle);
        previewSection.appendChild(previewHint);
        previewSection.appendChild(previewContent);
        
        contentWrapper.appendChild(configSection);
        contentWrapper.appendChild(previewSection);
        container.appendChild(contentWrapper);

        // 底部操作栏
        const actionBar = this._createFloatingActionBar({
            saveText: '💾 保存配置',
            onSave: async () => {
                // 保存配置
                try {
                    await this.dbManager.saveSetting('aiPromptPrefix', this.settings.aiPromptPrefix || '');
                    await this.dbManager.saveSetting('aiPromptSuffix', this.settings.aiPromptSuffix || '');
                    await this.dbManager.saveSetting('aiChatId', this.settings.aiChatId || '');
                    Logger.success('AI提问配置已保存');
                } catch (error) {
                    console.error('保存失败:', error);
                    alert('❌ 保存失败，请重试');
                }
            },
            resetText: '🔄 重置配置',
            onReset: () => {
                // 重置配置
                if (confirm('确定要重置AI提问配置吗？')) {
                    this.settings.aiPromptPrefix = '';
                    this.settings.aiPromptSuffix = '';
                    this.settings.aiChatId = '';
                    this.dbManager.saveSetting('aiPromptPrefix', '');
                    this.dbManager.saveSetting('aiPromptSuffix', '');
                    this.dbManager.saveSetting('aiChatId', '');
                    this._renderAIPromptPanel(container);
                }
            }
        });

        container.appendChild(actionBar);
    }

    /**
     * 渲染导出设置面板
     */
    _renderExportSettingsPanel(container) {
        container.innerHTML = '';
        container.style.padding = '0';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';

        // 创建内容包装器（有padding）
        const contentWrapper = DOMHelper.createElement('div', {
            style: {
                flex: '1',
                padding: '30px',
                overflow: 'auto'
            }
        });

        // 加载导出设置
        const exportDefaults = this.config.get('exportSettings');
        const exportSettings = {
            exportFormat: this.settings.exportFormat ?? exportDefaults.exportFormat,
            fontFamily: this.settings.exportFontFamily ?? exportDefaults.fontFamily,
            fontSize: this.settings.exportFontSize ?? exportDefaults.fontSize,
            titleFontSize: this.settings.exportTitleFontSize ?? exportDefaults.titleFontSize,
            lineHeight: this.settings.exportLineHeight ?? exportDefaults.lineHeight,
            pageMargin: this.settings.exportPageMargin ?? exportDefaults.pageMargin,
            // 导出内容选项
            exportMyAnswer: this.settings.exportMyAnswer ?? exportDefaults.exportMyAnswer,
            exportCorrectAnswer: this.settings.exportCorrectAnswer ?? exportDefaults.exportCorrectAnswer,
            exportScore: this.settings.exportScore ?? exportDefaults.exportScore,
            exportAnalysis: this.settings.exportAnalysis ?? exportDefaults.exportAnalysis
        };

        // 提示说明区域
        const tipContainer = DOMHelper.createElement('div', {
            style: {
                backgroundColor: '#ebf8ff',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                border: '1px solid #bee3f8'
            }
        });

        const tipText = DOMHelper.createElement('div', {
            innerHTML: '💡 <strong>提示：</strong>使用「📄 导出试题（无答案）」按钮导出不带答案的试卷，使用「📝 导出试题（含答案）」按钮导出带答案的试卷。下方「导出内容选项」仅在导出含答案时生效。',
            style: {
                fontSize: '14px',
                color: '#2b6cb0',
                lineHeight: '1.6'
            }
        });
        tipContainer.appendChild(tipText);
        container.appendChild(tipContainer);

        // ========== 导出格式选项区域 ==========
        const formatContainer = DOMHelper.createElement('div', {
            style: {
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                marginBottom: '20px'
            }
        });

        const formatTitle = DOMHelper.createElement('h3', {
            innerText: '📝 导出格式',
            style: {
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#2d3748',
                marginBottom: '16px'
            }
        });
        formatContainer.appendChild(formatTitle);

        // DOC 格式选项
        const docOption = DOMHelper.createElement('label', {
            style: {
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
            }
        });

        const docRadio = DOMHelper.createElement('input', {
            type: 'radio',
            name: 'exportFormat',
            value: 'doc',
            checked: exportSettings.exportFormat === 'doc',
            style: {
                marginRight: '8px',
                cursor: 'pointer'
            }
        });

        const docLabel = DOMHelper.createElement('span', {
            innerHTML: '<strong>DOC格式</strong> <span style="color: #718096; font-size: 13px;">（默认推荐，兼容性更好）</span>',
            style: {
                fontSize: '14px',
                color: '#2d3748'
            }
        });

        docOption.appendChild(docRadio);
        docOption.appendChild(docLabel);
        formatContainer.appendChild(docOption);

        // DOCX 格式选项
        const docxOption = DOMHelper.createElement('label', {
            style: {
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
            }
        });

        const docxRadio = DOMHelper.createElement('input', {
            type: 'radio',
            name: 'exportFormat',
            value: 'docx',
            checked: exportSettings.exportFormat === 'docx',
            style: {
                marginRight: '8px',
                cursor: 'pointer'
            }
        });

        const docxLabel = DOMHelper.createElement('span', {
            innerHTML: '<strong>DOCX格式</strong> <span style="color: #e53e3e; font-size: 13px;">（注意：在手机/平板上浏览docx可能出现空白或图片失效的bug）</span>',
            style: {
                fontSize: '14px',
                color: '#2d3748'
            }
        });

        docxOption.appendChild(docxRadio);
        docxOption.appendChild(docxLabel);
        formatContainer.appendChild(docxOption);

        // 监听格式选择变化
        docRadio.addEventListener('change', () => {
            if (docRadio.checked) {
                this.settings.exportFormat = 'doc';
            }
        });

        docxRadio.addEventListener('change', () => {
            if (docxRadio.checked) {
                this.settings.exportFormat = 'docx';
            }
        });

        // 悬停效果
        [docOption, docxOption].forEach(option => {
            option.addEventListener('mouseenter', () => {
                option.style.backgroundColor = '#f7fafc';
            });
            option.addEventListener('mouseleave', () => {
                option.style.backgroundColor = 'transparent';
            });
        });

        container.appendChild(formatContainer);

        // ========== 导出内容选项区域 ==========
        const contentContainer = DOMHelper.createElement('div', {
            style: {
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                marginBottom: '20px'
            }
        });

        const contentTitle = DOMHelper.createTitle('📋 导出内容选项', {
            marginBottom: '20px',
            paddingBottom: '10px',
            borderBottom: '2px solid #4299e1'
        });
        contentContainer.appendChild(contentTitle);

        const contentDesc = DOMHelper.createDescription('选择导出含答案时包含哪些内容（导出无答案时此选项不生效）', {
            marginTop: '0',
            marginBottom: '16px'
        });
        contentContainer.appendChild(contentDesc);

        // 创建勾选框容器
        const checkboxGrid = DOMHelper.createElement('div', {
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
            }
        });

        // 我的答案
        const myAnswerCheckbox = this._createExportCheckboxItem(
            '我的答案',
            '导出时包含"我的答案"信息',
            'exportMyAnswer',
            exportSettings.exportMyAnswer
        );
        checkboxGrid.appendChild(myAnswerCheckbox);

        // 正确答案
        const correctAnswerCheckbox = this._createExportCheckboxItem(
            '正确答案',
            '导出时包含"正确答案"信息',
            'exportCorrectAnswer',
            exportSettings.exportCorrectAnswer
        );
        checkboxGrid.appendChild(correctAnswerCheckbox);

        // 本题得分
        const scoreCheckbox = this._createExportCheckboxItem(
            '本题得分',
            '导出时包含本题得分信息',
            'exportScore',
            exportSettings.exportScore
        );
        checkboxGrid.appendChild(scoreCheckbox);

        // 答案解析
        const analysisCheckbox = this._createExportCheckboxItem(
            '答案解析',
            '导出时包含答案解析内容',
            'exportAnalysis',
            exportSettings.exportAnalysis
        );
        checkboxGrid.appendChild(analysisCheckbox);

        contentContainer.appendChild(checkboxGrid);
        container.appendChild(contentContainer);

        // 样式设置区域
        const styleContainer = DOMHelper.createElement('div', {
            style: {
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                marginBottom: '20px'
            }
        });

        const styleTitle = DOMHelper.createElement('div', {
            innerText: '🎨 样式设置',
            style: {
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#2d3748',
                marginBottom: '20px',
                paddingBottom: '10px',
                borderBottom: '2px solid #48bb78'
            }
        });
        styleContainer.appendChild(styleTitle);

        // 字体选择
        const fontFamilySection = this._createExportSettingItem(
            '字体',
            '导出文档使用的字体',
            'select',
            'exportFontFamily',
            exportSettings.fontFamily,
            [
                { value: '宋体', label: '宋体' },
                { value: '黑体', label: '黑体' },
                { value: '楷体', label: '楷体' },
                { value: '仿宋', label: '仿宋' },
                { value: '微软雅黑', label: '微软雅黑' },
                { value: 'Arial', label: 'Arial' },
                { value: 'Times New Roman', label: 'Times New Roman' }
            ]
        );
        styleContainer.appendChild(fontFamilySection);

        // 正文字号
        const fontSizeSection = this._createExportSettingItem(
            '正文字号',
            '导出文档正文的字体大小（pt）',
            'number',
            'exportFontSize',
            exportSettings.fontSize
        );
        styleContainer.appendChild(fontSizeSection);

        // 标题字号
        const titleFontSizeSection = this._createExportSettingItem(
            '标题字号',
            '导出文档标题的字体大小（pt）',
            'number',
            'exportTitleFontSize',
            exportSettings.titleFontSize
        );
        styleContainer.appendChild(titleFontSizeSection);

        // 行高
        const lineHeightSection = this._createExportSettingItem(
            '行高',
            '行与行之间的间距倍数',
            'number',
            'exportLineHeight',
            exportSettings.lineHeight,
            null,
            0.1  // step
        );
        styleContainer.appendChild(lineHeightSection);

        // 页边距
        const marginSection = this._createExportSettingItem(
            '页边距',
            '导出文档的页边距（格式：上 右 下 左）',
            'text',
            'exportPageMargin',
            exportSettings.pageMargin
        );
        styleContainer.appendChild(marginSection);

        contentWrapper.appendChild(contentContainer);
        contentWrapper.appendChild(styleContainer);
        container.appendChild(contentWrapper);

        // 添加统一的底部操作栏
        const actionBar = this._createFloatingActionBar({
            saveText: '💾 保存导出设置',
            onSave: async () => {
                // 保存导出格式
                await this.dbManager.saveSetting('exportFormat', this.settings.exportFormat ?? exportSettings.exportFormat);
                // 保存样式设置
                await this.dbManager.saveSetting('exportFontFamily', this.settings.exportFontFamily ?? exportSettings.fontFamily);
                await this.dbManager.saveSetting('exportFontSize', this.settings.exportFontSize ?? exportSettings.fontSize);
                await this.dbManager.saveSetting('exportTitleFontSize', this.settings.exportTitleFontSize ?? exportSettings.titleFontSize);
                await this.dbManager.saveSetting('exportLineHeight', this.settings.exportLineHeight ?? exportSettings.lineHeight);
                await this.dbManager.saveSetting('exportPageMargin', this.settings.exportPageMargin ?? exportSettings.pageMargin);
                // 保存导出内容选项
                await this.dbManager.saveSetting('exportMyAnswer', this.settings.exportMyAnswer ?? exportSettings.exportMyAnswer);
                await this.dbManager.saveSetting('exportCorrectAnswer', this.settings.exportCorrectAnswer ?? exportSettings.exportCorrectAnswer);
                await this.dbManager.saveSetting('exportScore', this.settings.exportScore ?? exportSettings.exportScore);
                await this.dbManager.saveSetting('exportAnalysis', this.settings.exportAnalysis ?? exportSettings.exportAnalysis);
                Logger.success('导出设置已保存');
            },
            onReset: async () => {
                if (confirm('确定要重置导出设置为默认值吗？')) {
                    const defaults = this.config.get('exportSettings');
                    // 重置导出格式
                    this.settings.exportFormat = defaults.exportFormat;
                    // 重置样式设置
                    this.settings.exportFontFamily = defaults.fontFamily;
                    this.settings.exportFontSize = defaults.fontSize;
                    this.settings.exportTitleFontSize = defaults.titleFontSize;
                    this.settings.exportLineHeight = defaults.lineHeight;
                    this.settings.exportPageMargin = defaults.pageMargin;
                    // 重置导出内容选项
                    this.settings.exportMyAnswer = defaults.exportMyAnswer;
                    this.settings.exportCorrectAnswer = defaults.exportCorrectAnswer;
                    this.settings.exportScore = defaults.exportScore;
                    this.settings.exportAnalysis = defaults.exportAnalysis;
                    await this.dbManager.saveSetting('exportFontFamily', defaults.fontFamily);
                    await this.dbManager.saveSetting('exportFontSize', defaults.fontSize);
                    await this.dbManager.saveSetting('exportTitleFontSize', defaults.titleFontSize);
                    await this.dbManager.saveSetting('exportLineHeight', defaults.lineHeight);
                    await this.dbManager.saveSetting('exportPageMargin', defaults.pageMargin);
                    await this.dbManager.saveSetting('exportMyAnswer', defaults.exportMyAnswer);
                    await this.dbManager.saveSetting('exportCorrectAnswer', defaults.exportCorrectAnswer);
                    await this.dbManager.saveSetting('exportScore', defaults.exportScore);
                    await this.dbManager.saveSetting('exportAnalysis', defaults.exportAnalysis);
                    Logger.success('导出设置已重置');
                    this._renderExportSettingsPanel(container);
                }
            },
            resetText: '🔄 重置导出设置'
        });
        container.appendChild(actionBar);
    }

    /**
     * 创建导出内容勾选框项
     */
    _createExportCheckboxItem(label, description, key, checked) {
        const item = DOMHelper.createElement('div', {
            style: {
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: '#f7fafc',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '1px solid #e2e8f0'
            }
        });

        const checkbox = DOMHelper.createElement('input', {
            type: 'checkbox',
            checked: checked,
            style: {
                width: '18px',
                height: '18px',
                marginRight: '12px',
                cursor: 'pointer',
                accentColor: '#4299e1'
            }
        });

        const textContainer = DOMHelper.createElement('div', {
            style: {
                flex: '1'
            }
        });

        const labelText = DOMHelper.createElement('div', {
            innerText: label,
            style: {
                fontSize: '14px',
                fontWeight: '600',
                color: '#2d3748'
            }
        });

        const descText = DOMHelper.createElement('div', {
            innerText: description,
            style: {
                fontSize: '12px',
                color: '#718096',
                marginTop: '2px'
            }
        });

        textContainer.appendChild(labelText);
        textContainer.appendChild(descText);

        // 点击整个项切换勾选状态
        item.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            this.settings[key] = checkbox.checked;
            item.style.backgroundColor = checkbox.checked ? '#ebf8ff' : '#f7fafc';
            item.style.borderColor = checkbox.checked ? '#4299e1' : '#e2e8f0';
        });

        checkbox.addEventListener('change', () => {
            this.settings[key] = checkbox.checked;
            item.style.backgroundColor = checkbox.checked ? '#ebf8ff' : '#f7fafc';
            item.style.borderColor = checkbox.checked ? '#4299e1' : '#e2e8f0';
        });

        // 初始样式
        if (checked) {
            item.style.backgroundColor = '#ebf8ff';
            item.style.borderColor = '#4299e1';
        }

        // 悬停效果
        item.addEventListener('mouseenter', () => {
            item.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.boxShadow = 'none';
        });

        item.appendChild(checkbox);
        item.appendChild(textContainer);

        return item;
    }

    /**
     * 创建导出设置项
     */
    _createExportSettingItem(label, description, type, key, value, options = null, step = 1) {
        const item = DOMHelper.createElement('div', {
            style: {
                marginBottom: '20px',
                paddingBottom: '20px',
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
                fontSize: '14px',
                fontWeight: '600',
                color: '#2d3748'
            }
        });

        let input;
        if (type === 'select' && options) {
            input = DOMHelper.createElement('select', {
                style: {
                    width: '160px',
                    padding: '6px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: 'white'
                }
            });

            options.forEach(opt => {
                const option = DOMHelper.createElement('option', {
                    value: opt.value,
                    innerText: opt.label
                });
                if (opt.value === value) {
                    option.selected = true;
                }
                input.appendChild(option);
            });

            input.addEventListener('change', () => {
                this.settings[key] = input.value;
            });
        } else if (type === 'number') {
            input = DOMHelper.createElement('input', {
                type: 'number',
                value: value,
                step: step,
                style: {
                    width: '100px',
                    padding: '6px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    textAlign: 'center'
                }
            });

            input.addEventListener('change', () => {
                const numValue = parseFloat(input.value);
                if (numValue > 0) {
                    this.settings[key] = numValue;
                }
            });
        } else if (type === 'text') {
            input = DOMHelper.createElement('input', {
                type: 'text',
                value: value,
                style: {
                    width: '200px',
                    padding: '6px 12px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                    fontSize: '14px'
                }
            });

            input.addEventListener('change', () => {
                this.settings[key] = input.value;
            });
        }

        labelEl.appendChild(labelText);
        labelEl.appendChild(input);

        const desc = DOMHelper.createElement('div', {
            innerText: description,
            style: {
                fontSize: '12px',
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

        // 时间排序按钮
        const timeSortBtn = DOMHelper.createElement('button', {
            innerText: this.notesSortBy === 'time'
                ? (this.notesSortOrder === 'desc' ? '🕒 时间 ↓' : '🕒 时间 ↑')
                : '🕒 时间',
            style: {
                padding: '6px 12px',
                border: '1px solid #cbd5e0',
                borderRadius: '4px',
                backgroundColor: this.notesSortBy === 'time' ? '#4299e1' : 'white',
                color: this.notesSortBy === 'time' ? 'white' : '#4a5568',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s'
            }
        });

        timeSortBtn.addEventListener('mouseenter', () => {
            timeSortBtn.style.transform = 'translateY(-1px)';
            timeSortBtn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });

        timeSortBtn.addEventListener('mouseleave', () => {
            timeSortBtn.style.transform = 'translateY(0)';
            timeSortBtn.style.boxShadow = 'none';
        });

        timeSortBtn.addEventListener('click', () => {
            if (this.notesSortBy === 'time') {
                // 已经是时间排序，切换升降序
                this.notesSortOrder = this.notesSortOrder === 'desc' ? 'asc' : 'desc';
            } else {
                // 切换到时间排序，默认降序（最新在前）
                this.notesSortBy = 'time';
                this.notesSortOrder = 'desc';
            }
            this._sortNotes();
            this._renderContent();
        });

        // 字母排序按钮
        const alphaSortBtn = DOMHelper.createElement('button', {
            innerText: this.notesSortBy === 'alpha'
                ? (this.notesSortOrder === 'asc' ? '🔤 字母 ↑' : '🔤 字母 ↓')
                : '🔤 字母',
            style: {
                padding: '6px 12px',
                border: '1px solid #cbd5e0',
                borderRadius: '4px',
                backgroundColor: this.notesSortBy === 'alpha' ? '#48bb78' : 'white',
                color: this.notesSortBy === 'alpha' ? 'white' : '#4a5568',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s'
            }
        });

        alphaSortBtn.addEventListener('mouseenter', () => {
            alphaSortBtn.style.transform = 'translateY(-1px)';
            alphaSortBtn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });

        alphaSortBtn.addEventListener('mouseleave', () => {
            alphaSortBtn.style.transform = 'translateY(0)';
            alphaSortBtn.style.boxShadow = 'none';
        });

        alphaSortBtn.addEventListener('click', () => {
            if (this.notesSortBy === 'alpha') {
                // 已经是字母排序，切换升降序
                this.notesSortOrder = this.notesSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                // 切换到字母排序，默认升序（A-Z）
                this.notesSortBy = 'alpha';
                this.notesSortOrder = 'asc';
            }
            this._sortNotes();
            this._renderContent();
        });

        const selectAllBtn = DOMHelper.createElement('button', {
            innerText: '全选',
            style: {
                padding: '6px 12px',
                border: '1px solid #cbd5e0',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s'
            }
        });

        selectAllBtn.addEventListener('mouseenter', () => {
            selectAllBtn.style.transform = 'translateY(-1px)';
            selectAllBtn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });

        selectAllBtn.addEventListener('mouseleave', () => {
            selectAllBtn.style.transform = 'translateY(0)';
            selectAllBtn.style.boxShadow = 'none';
        });

        const deleteBtn = DOMHelper.createElement('button', {
            innerText: '删除选中',
            style: {
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#f56565',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s'
            }
        });

        deleteBtn.addEventListener('mouseenter', () => {
            deleteBtn.style.backgroundColor = '#e53e3e';
            deleteBtn.style.transform = 'translateY(-1px)';
        });

        deleteBtn.addEventListener('mouseleave', () => {
            deleteBtn.style.backgroundColor = '#f56565';
            deleteBtn.style.transform = 'translateY(0)';
        });

        selectAllBtn.addEventListener('click', () => this._toggleSelectAll());
        deleteBtn.addEventListener('click', () => this._deleteSelected());

        actions.appendChild(timeSortBtn);
        actions.appendChild(alphaSortBtn);
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

        if (this.notesScope === 'current') {
            // 当前页面：直接显示笔记列表
            this.notesList.forEach(note => {
                const noteItem = this._createNoteItem(note);
                notesList.appendChild(noteItem);
            });
        } else {
            // 其他范围：按 workKey 分组显示
            const groupedNotes = this._groupNotesByWorkKey(this.notesList);
            Object.entries(groupedNotes).forEach(([workKey, notes]) => {
                const group = this._createNotesGroup(workKey, notes);
                notesList.appendChild(group);
            });
        }

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

        // 格式化题目标题（包含题号）
        const questionNo = note.questionNo || '999';
        const questionIdShort = note.questionId.replace('question', 'Question');
        const questionTitle = `${questionIdShort}_No${questionNo}`;
        
        const questionId = DOMHelper.createElement('span', {
            innerText: questionTitle,
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
     * 按 workKey 分组笔记
     */
    _groupNotesByWorkKey(notes) {
        const groups = {};
        notes.forEach(note => {
            if (!groups[note.workKey]) {
                groups[note.workKey] = [];
            }
            groups[note.workKey].push(note);
        });
        // 按时间戳排序每个组
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => b.timestamp - a.timestamp);
        });
        return groups;
    }

    /**
     * 排序笔记
     */
    _sortNotes() {
        if (this.notesSortBy === 'time') {
            // 按时间排序
            if (this.notesSortOrder === 'desc') {
                // 降序：最新在前
                this.notesList.sort((a, b) => b.timestamp - a.timestamp);
            } else {
                // 升序：最旧在前
                this.notesList.sort((a, b) => a.timestamp - b.timestamp);
            }
        } else {
            // 按 questionId 字母序
            this.notesList.sort((a, b) => {
                const idA = a.questionId.toLowerCase();
                const idB = b.questionId.toLowerCase();
                if (this.notesSortOrder === 'asc') {
                    // 升序：A-Z
                    return idA.localeCompare(idB);
                } else {
                    // 降序：Z-A
                    return idB.localeCompare(idA);
                }
            });
        }
    }

    /**
     * 创建笔记组（用于域名模式）
     */
    _createNotesGroup(workKey, notes) {
        const group = DOMHelper.createElement('div', {
            style: {
                marginBottom: '30px'
            }
        });

        // 组标题
        const groupHeader = DOMHelper.createElement('div', {
            style: {
                padding: '12px 16px',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }
        });

        const headerLeft = DOMHelper.createElement('div', {
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }
        });

        const collapseIcon = DOMHelper.createElement('span', {
            innerText: '▼',
            style: {
                fontSize: '12px',
                color: '#1976d2',
                transition: 'transform 0.2s'
            }
        });

        // 格式化 workKey 显示
        const parts = workKey.split('_');
        let displayText = '📄 ';
        if (parts.length === 3) {
            displayText += `Course${parts[0]}_Class${parts[1]}_Work${parts[2]}`;
        } else {
            displayText += workKey;
        }

        const groupTitle = DOMHelper.createElement('span', {
            innerText: displayText,
            style: {
                fontSize: '14px',
                fontWeight: '600',
                color: '#1976d2'
            }
        });

        const groupCount = DOMHelper.createElement('span', {
            innerText: `(${notes.length} 条)`,
            style: {
                fontSize: '13px',
                color: '#64b5f6',
                marginLeft: '8px'
            }
        });

        headerLeft.appendChild(collapseIcon);
        headerLeft.appendChild(groupTitle);
        headerLeft.appendChild(groupCount);

        // 全选此组的按钮
        const selectGroupBtn = DOMHelper.createElement('button', {
            innerText: '全选',
            style: {
                padding: '4px 10px',
                border: '1px solid #2196f3',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: '#2196f3',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s'
            }
        });

        selectGroupBtn.addEventListener('mouseenter', () => {
            selectGroupBtn.style.transform = 'translateY(-1px)';
            selectGroupBtn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });

        selectGroupBtn.addEventListener('mouseleave', () => {
            selectGroupBtn.style.transform = 'translateY(0)';
            selectGroupBtn.style.boxShadow = 'none';
        });

        selectGroupBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const allSelected = notes.every(note => this.selectedNotes.has(note.id));
            if (allSelected) {
                notes.forEach(note => this.selectedNotes.delete(note.id));
                selectGroupBtn.innerText = '全选';
            } else {
                notes.forEach(note => this.selectedNotes.add(note.id));
                selectGroupBtn.innerText = '取消';
            }
            this._renderContent();
        });

        groupHeader.appendChild(headerLeft);
        groupHeader.appendChild(selectGroupBtn);

        // 笔记列表容器
        const notesContainer = DOMHelper.createElement('div', {
            style: {
                display: 'block',
                paddingLeft: '20px'
            }
        });

        notes.forEach(note => {
            const noteItem = this._createNoteItem(note);
            notesContainer.appendChild(noteItem);
        });

        // 折叠/展开功能
        let isCollapsed = false;
        groupHeader.addEventListener('click', (e) => {
            if (e.target === selectGroupBtn) return;
            isCollapsed = !isCollapsed;
            notesContainer.style.display = isCollapsed ? 'none' : 'block';
            collapseIcon.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
        });

        group.appendChild(groupHeader);
        group.appendChild(notesContainer);

        return group;
    }

    /**
     * 渲染样式管理面板
     */
    async _renderStylesPanel(container) {
        container.innerHTML = '';
        container.style.padding = '0';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';

        // 样式配置的分类
        const styleCategories = [
            {
                title: '答案按钮样式',
                key: 'answerButton',
                fields: [
                    // 位置配置
                    { name: 'marginLeft', label: '左边距', type: 'text', path: 'position.marginLeft' },
                    { name: 'marginTop', label: '上边距', type: 'text', path: 'position.marginTop' },
                    // 尺寸配置
                    { name: 'fontSize', label: '字体大小', type: 'text', path: 'style.fontSize' },
                    { name: 'padding', label: '内边距', type: 'text', path: 'style.padding' },
                    { name: 'borderRadius', label: '圆角半径', type: 'text', path: 'style.borderRadius' },
                    { name: 'fontWeight', label: '字体粗细', type: 'text', path: 'style.fontWeight' },
                    // 颜色配置
                    { name: 'showBackground', label: '显示按钮背景色', type: 'color', path: 'colors.showBackground' },
                    { name: 'hideBackground', label: '隐藏按钮背景色', type: 'color', path: 'colors.hideBackground' },
                    { name: 'showHoverBackground', label: '显示按钮悬停色', type: 'color', path: 'colors.showHoverBackground' },
                    { name: 'hideHoverBackground', label: '隐藏按钮悬停色', type: 'color', path: 'colors.hideHoverBackground' }
                ]
            },
            {
                title: '笔记按钮样式',
                key: 'noteButton',
                fields: [
                    // 位置配置
                    { name: 'marginLeft', label: '左边距', type: 'text', path: 'position.marginLeft' },
                    { name: 'marginTop', label: '上边距', type: 'text', path: 'position.marginTop' },
                    // 尺寸配置
                    { name: 'fontSize', label: '字体大小', type: 'text', path: 'style.fontSize' },
                    { name: 'padding', label: '内边距', type: 'text', path: 'style.padding' },
                    { name: 'borderRadius', label: '圆角半径', type: 'text', path: 'style.borderRadius' },
                    { name: 'fontWeight', label: '字体粗细', type: 'text', path: 'style.fontWeight' },
                    // 颜色配置
                    { name: 'showBackground', label: '显示按钮背景色', type: 'color', path: 'colors.showBackground' },
                    { name: 'hideBackground', label: '隐藏按钮背景色', type: 'color', path: 'colors.hideBackground' },
                    { name: 'showHoverBackground', label: '显示按钮悬停色', type: 'color', path: 'colors.showHoverBackground' },
                    { name: 'hideHoverBackground', label: '隐藏按钮悬停色', type: 'color', path: 'colors.hideHoverBackground' }
                ]
            },
            {
                title: '编辑按钮样式',
                key: 'editModeButton',
                fields: [
                    // 位置配置
                    { name: 'marginLeft', label: '左边距', type: 'text', path: 'position.marginLeft' },
                    { name: 'marginTop', label: '上边距', type: 'text', path: 'position.marginTop' },
                    // 尺寸配置
                    { name: 'fontSize', label: '字体大小', type: 'text', path: 'style.fontSize' },
                    { name: 'padding', label: '内边距', type: 'text', path: 'style.padding' },
                    { name: 'borderRadius', label: '圆角半径', type: 'text', path: 'style.borderRadius' },
                    { name: 'fontWeight', label: '字体粗细', type: 'text', path: 'style.fontWeight' },
                    // 颜色配置
                    { name: 'editBackground', label: '编辑模式背景色', type: 'color', path: 'colors.editBackground' },
                    { name: 'previewBackground', label: '预览模式背景色', type: 'color', path: 'colors.previewBackground' },
                    { name: 'editHoverBackground', label: '编辑模式悬停色', type: 'color', path: 'colors.editHoverBackground' },
                    { name: 'previewHoverBackground', label: '预览模式悬停色', type: 'color', path: 'colors.previewHoverBackground' }
                ]
            },
            {
                title: '保存按钮样式',
                key: 'saveNoteButton',
                fields: [
                    // 位置配置
                    { name: 'marginLeft', label: '左边距', type: 'text', path: 'position.marginLeft' },
                    { name: 'marginTop', label: '上边距', type: 'text', path: 'position.marginTop' },
                    // 尺寸配置
                    { name: 'fontSize', label: '字体大小', type: 'text', path: 'style.fontSize' },
                    { name: 'padding', label: '内边距', type: 'text', path: 'style.padding' },
                    { name: 'borderRadius', label: '圆角半径', type: 'text', path: 'style.borderRadius' },
                    { name: 'fontWeight', label: '字体粗细', type: 'text', path: 'style.fontWeight' },
                    // 颜色配置
                    { name: 'background', label: '背景色', type: 'color', path: 'colors.background' },
                    { name: 'hoverBackground', label: '悬停背景色', type: 'color', path: 'colors.hoverBackground' }
                ]
            },
            {
                title: '全局按钮样式',
                key: 'globalButton',
                fields: [
                    // 位置配置
                    { name: 'top', label: '距顶部距离', type: 'text', path: 'position.top' },
                    { name: 'right', label: '距右侧距离', type: 'text', path: 'position.right' },
                    // 尺寸配置
                    { name: 'fontSize', label: '字体大小', type: 'text', path: 'style.fontSize' },
                    { name: 'padding', label: '内边距', type: 'text', path: 'style.padding' },
                    { name: 'borderRadius', label: '圆角半径', type: 'text', path: 'style.borderRadius' },
                    { name: 'fontWeight', label: '字体粗细', type: 'text', path: 'style.fontWeight' },
                    // 颜色配置
                    { name: 'showAllBackground', label: '显示全部背景色', type: 'color', path: 'colors.showAllBackground' },
                    { name: 'hideAllBackground', label: '隐藏全部背景色', type: 'color', path: 'colors.hideAllBackground' },
                    { name: 'showAllHoverBackground', label: '显示全部悬停色', type: 'color', path: 'colors.showAllHoverBackground' },
                    { name: 'hideAllHoverBackground', label: '隐藏全部悬停色', type: 'color', path: 'colors.hideAllHoverBackground' }
                ]
            },
            {
                title: '控制面板按钮样式',
                key: 'manageButton',
                fields: [
                    // 位置配置
                    { name: 'top', label: '距顶部距离', type: 'text', path: 'position.top' },
                    { name: 'right', label: '距右侧距离', type: 'text', path: 'position.right' },
                    // 尺寸配置
                    { name: 'fontSize', label: '字体大小', type: 'text', path: 'style.fontSize' },
                    { name: 'padding', label: '内边距', type: 'text', path: 'style.padding' },
                    { name: 'borderRadius', label: '圆角半径', type: 'text', path: 'style.borderRadius' },
                    { name: 'fontWeight', label: '字体粗细', type: 'text', path: 'style.fontWeight' },
                    // 颜色配置
                    { name: 'background', label: '背景色', type: 'color', path: 'colors.background' },
                    { name: 'hoverBackground', label: '悬停背景色', type: 'color', path: 'colors.hoverBackground' }
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

        // 添加统一的底部操作栏
        const actionBar = this._createFloatingActionBar({
            saveText: '💾 保存样式设置',
            onSave: async () => {
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
                Logger.success('样式已保存，刷新页面后生效');
            },
            onReset: async () => {
                if (confirm('确定要重置所有样式为默认值吗？')) {
                    await this.dbManager.saveSetting('customStyles', {});
                    Logger.success('样式已重置');
                    this._renderStylesPanel(container);
                }
            },
            resetText: '🔄 重置样式设置'
        });
        container.appendChild(actionBar);
    }

    /**
     * 创建样式配置区块
     */
    _createStyleSection(category, savedStyles) {
        const section = DOMHelper.createCard({
            padding: '20px'
        });

        const title = DOMHelper.createTitle(category.title, {
            tag: 'h3',
            margin: '0 0 16px 0',
            fontWeight: '600',
            borderBottom: '2px solid #4299e1',
            paddingBottom: '8px'
        });

        section.appendChild(title);

        category.fields.forEach(field => {
            const fieldGroup = DOMHelper.createFlexContainer({
                justify: 'space-between',
                marginBottom: '16px'
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


// 导出供其他模块使用
window.ControlPanelUI = ControlPanelUI;
