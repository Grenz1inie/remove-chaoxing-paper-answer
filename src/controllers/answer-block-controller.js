/**
 * AnswerBlockController - 答案块控制器
 * 负责单个答案块的显示/隐藏、笔记、复制、AI问答等功能
 * @version 3.12.0
 */
class AnswerBlockController {
    constructor(block, config, styleGenerator, dbManager, workKey, appInstance) {
        this.block = block;
        this.config = config;
        this.styleGenerator = styleGenerator;
        this.dbManager = dbManager;
        this.workKey = workKey;
        this.appInstance = appInstance; // 保存应用实例引用，用于访问doubaoTabRef
        this.parent = block.parentNode;
        this.nextSibling = block.nextSibling;
        this.toggleButton = null;
        this.noteButton = null;
        this.saveNoteButton = null;
        this.mistakeButton = null;
        this.mistakeStarsContainer = null;
        this.mistakeContainer = null;
        this.noteEditor = null;
        this.buttonContainer = null;
        this.isHidden = false;
        this.questionId = this._extractQuestionId();
        this.questionNo = this._extractQuestionNo();
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

    _extractQuestionNo() {
        // 查找题目容器
        let questionContainer = null;
        const questionId = this.questionId;

        if (questionId && questionId.startsWith('question')) {
            questionContainer = document.getElementById(questionId);
        }

        // 如果没找到，尝试从 parent 向上查找
        if (!questionContainer && this.parent) {
            let element = this.parent;
            while (element && element !== document.body) {
                if (element.classList && (element.classList.contains('questionLi') || element.classList.contains('mark_item'))) {
                    questionContainer = element;
                    break;
                }
                element = element.parentElement;
            }
        }

        // 使用URLParser解析题号
        return questionContainer ? URLParser.parseQuestionNumber(questionContainer) : '999';
    }

    async initialize() {
        this._hideBlockInitial();
        await this._createButtons();
        await this._createNoteEditor();
        return this.buttonContainer;
    }

    _hideBlockInitial() {
        // 初始化时隐藏答案块（使用 display:none）
        this.block.style.display = 'none';
        this.isHidden = true;
    }

    async _createButtons() {
        // 创建按钮容器
        this.buttonContainer = DOMHelper.createElement('div', {
            style: {
                display: 'inline-block',
                marginLeft: this.config.get('answerButton.position.marginLeft'),
                marginRight: this.config.get('answerButton.position.marginLeft'), // 使右边距与左边距一致
                marginTop: this.config.get('answerButton.position.marginTop'),
                verticalAlign: this.config.get('answerButton.position.verticalAlign')
            }
        });

        // 创建错题按钮（定位到题目区域左上角）
        await this._createMistakeButton();

        // 创建复制按钮（定位到题目区域右上角）
        this._createCopyButton();

        // 创建问豆包按钮（定位到复制按钮下方）
        this._createAskDoubaoButton();

        // 创建答案切换按钮
        this._createAnswerToggleButton();

        // 创建笔记切换按钮
        this._createNoteToggleButton();

        // 创建编辑/预览切换按钮
        this._createEditModeToggleButton();

        // 创建保存笔记按钮
        this._createSaveNoteButton();

        // 插入按钮容器
        DOMHelper.insertElement(this.buttonContainer, this.parent, this.nextSibling);
    }

    async _createMistakeButton() {
        const buttonText = this.config.get('mistakeButton.text');
        const colors = this.config.get('mistakeButton.colors');
        const position = this.config.get('mistakeButton.position');
        const starsConfig = this.config.get('mistakeButton.stars');

        // 创建错题按钮容器（使用flexbox，星星在中间撑开空间）
        const mistakeContainer = DOMHelper.createElement('div', {
            style: {
                marginTop: position.marginTop,
                marginBottom: position.marginBottom,
                marginLeft: position.marginLeft,
                display: 'flex',
                flexDirection: 'column',   // 垂直排列
                alignItems: 'flex-start'   // 左对齐
            }
        });

        // 创建错题按钮
        this.mistakeButton = DOMHelper.createElement('button', {
            innerText: buttonText.add,
            style: this.styleGenerator.getMistakeButtonStyle(),
            title: '记录做错次数'
        });

        // 使用统一的悬停效果管理
        this.styleGenerator.addSimpleHoverEffect(this.mistakeButton, 'mistakeButton');

        this.mistakeButton.addEventListener('click', () => this._handleMistakeAdd());

        // 创建星星显示容器（弹性布局，会撑开空间）
        this.mistakeStarsContainer = DOMHelper.createElement('div', {
            style: {
                display: 'flex',
                flexWrap: 'wrap',
                maxWidth: `calc(${starsConfig.perRow} * (${starsConfig.fontSize} + ${starsConfig.gap}))`,
                gap: starsConfig.gap,
                fontSize: starsConfig.fontSize,
                lineHeight: '1',
                marginTop: starsConfig.marginTop,
                marginBottom: starsConfig.marginBottom
            }
        });

        // 将按钮和星星容器添加到容器（按钮在上，星星在下）
        mistakeContainer.appendChild(this.mistakeButton);
        mistakeContainer.appendChild(this.mistakeStarsContainer);

        // 保存容器引用
        this.mistakeContainer = mistakeContainer;

        // 查找题目容器中的mark_name元素
        let questionContainer = null;
        let markName = null;
        const questionId = this.questionId;

        if (questionId && questionId.startsWith('question')) {
            questionContainer = document.getElementById(questionId);
        }

        // 如果没找到，尝试从 parent 向上查找
        if (!questionContainer && this.parent) {
            let element = this.parent;
            while (element && element !== document.body) {
                if (element.classList && (element.classList.contains('questionLi') || element.classList.contains('mark_item'))) {
                    questionContainer = element;
                    break;
                }
                element = element.parentElement;
            }
        }

        // 查找mark_name元素并插入错题容器到其上方
        if (questionContainer) {
            markName = questionContainer.querySelector('.mark_name');
            if (markName) {
                // 插入到mark_name之前
                markName.parentNode.insertBefore(mistakeContainer, markName);
                
                // 加载已有的错题记录并显示星星
                await this._loadMistakeRecord();
            }
        }
    }

    async _loadMistakeRecord() {
        try {
            const mistake = await this.dbManager.getMistake(this.workKey, this.questionId, this.questionNo);
            if (mistake && mistake.count > 0) {
                this._renderStars(mistake.count);
            }
        } catch (error) {
            Logger.error('加载错题记录失败', error);
        }
    }

    async _handleMistakeAdd() {
        try {
            const mistake = await this.dbManager.addMistake(this.workKey, this.questionId, this.questionNo);
            this._renderStars(mistake.count);
            
            // 显示提示
            const originalText = this.mistakeButton.innerText;
            this.mistakeButton.innerText = '✅ 已记录';
            setTimeout(() => {
                this.mistakeButton.innerText = originalText;
            }, 1000);
        } catch (error) {
            Logger.error('添加错题记录失败', error);
        }
    }

    _renderStars(count) {
        const starsConfig = this.config.get('mistakeButton.stars');
        this.mistakeStarsContainer.innerHTML = '';
        
        if (count > 0) {
            // 显示星星容器（弹性布局会自动撑开空间）
            this.mistakeStarsContainer.style.display = 'flex';
            
            for (let i = 0; i < count; i++) {
                const star = DOMHelper.createElement('span', {
                    innerText: starsConfig.emoji
                });
                this.mistakeStarsContainer.appendChild(star);
            }
        } else {
            // 隐藏星星容器（不占空间）
            this.mistakeStarsContainer.style.display = 'none';
        }
    }

    _createCopyButton() {
        const buttonText = this.config.get('copyButton.text');
        const colors = this.config.get('copyButton.colors');

        this.copyButton = DOMHelper.createElement('button', {
            innerText: buttonText.copy,
            style: this.styleGenerator.getCopyButtonStyle(),
            title: '复制题目和选项（纯文本）'
        });

        // 添加悬停效果
        this.copyButton.addEventListener('mouseenter', () => {
            this.copyButton.style.background = colors.hoverBackground;
            this.copyButton.style.transform = 'translateY(-1px)';
        });
        this.copyButton.addEventListener('mouseleave', () => {
            this.copyButton.style.background = colors.background;
            this.copyButton.style.transform = 'translateY(0)';
        });

        this.copyButton.addEventListener('click', () => this._handleCopy());

        // 查找题目容器并插入复制按钮到右上角
        let questionContainer = null;
        const questionId = this.questionId;

        if (questionId && questionId.startsWith('question')) {
            questionContainer = document.getElementById(questionId);
        }

        // 如果没找到，尝试从 parent 向上查找
        if (!questionContainer && this.parent) {
            let element = this.parent;
            while (element && element !== document.body) {
                if (element.classList && (element.classList.contains('questionLi') || element.classList.contains('mark_item'))) {
                    questionContainer = element;
                    break;
                }
                element = element.parentElement;
            }
        }

        // 将复制按钮插入到题目容器
        if (questionContainer) {
            // 确保题目容器有相对定位
            const currentPosition = window.getComputedStyle(questionContainer).position;
            if (currentPosition === 'static') {
                questionContainer.style.position = 'relative';
            }
            questionContainer.appendChild(this.copyButton);
        } else {
            // 如果找不到题目容器，则添加到按钮容器中作为备选
            this.buttonContainer.appendChild(this.copyButton);
        }
    }

    _createAskDoubaoButton() {
        const buttonText = this.config.get('askDoubaoButton.text');
        const colors = this.config.get('askDoubaoButton.colors');

        this.askDoubaoButton = DOMHelper.createElement('button', {
            innerText: buttonText.ask,
            style: this.styleGenerator.getAskDoubaoButtonStyle(),
            title: '向豆包AI提问当前题目'
        });

        // 添加悬停效果
        this.askDoubaoButton.addEventListener('mouseenter', () => {
            this.askDoubaoButton.style.background = colors.hoverBackground;
            this.askDoubaoButton.style.transform = 'translateY(-1px)';
        });
        this.askDoubaoButton.addEventListener('mouseleave', () => {
            this.askDoubaoButton.style.background = colors.background;
            this.askDoubaoButton.style.transform = 'translateY(0)';
        });

        this.askDoubaoButton.addEventListener('click', () => this._handleAskDoubao());

        // 查找题目容器并插入问豆包按钮到右上角（复制按钮下方）
        let questionContainer = null;
        const questionId = this.questionId;

        if (questionId && questionId.startsWith('question')) {
            questionContainer = document.getElementById(questionId);
        }

        // 如果没找到，尝试从 parent 向上查找
        if (!questionContainer && this.parent) {
            let element = this.parent;
            while (element && element !== document.body) {
                if (element.classList && (element.classList.contains('questionLi') || element.classList.contains('mark_item'))) {
                    questionContainer = element;
                    break;
                }
                element = element.parentElement;
            }
        }

        // 将问豆包按钮插入到题目容器
        if (questionContainer) {
            // 确保题目容器有相对定位
            const currentPosition = window.getComputedStyle(questionContainer).position;
            if (currentPosition === 'static') {
                questionContainer.style.position = 'relative';
            }
            questionContainer.appendChild(this.askDoubaoButton);
        } else {
            // 如果找不到题目容器，则添加到按钮容器中作为备选
            this.buttonContainer.appendChild(this.askDoubaoButton);
        }
    }

    async _handleAskDoubao() {
        // 获取题目容器
        let questionContainer = null;
        const questionId = this.questionId;

        if (questionId && questionId.startsWith('question')) {
            questionContainer = document.getElementById(questionId);
        }

        // 如果没找到，尝试从 parent 向上查找
        if (!questionContainer && this.parent) {
            let element = this.parent;
            while (element && element !== document.body) {
                if (element.classList && (element.classList.contains('questionLi') || element.classList.contains('mark_item'))) {
                    questionContainer = element;
                    break;
                }
                element = element.parentElement;
            }
        }

        if (!questionContainer) {
            Logger.error('未找到题目容器');
            return;
        }

        // 提取题目文本
        let questionText = '';

        // 1. 获取题号和题型（如 "1. (单选题, 3分)"）
        const markName = questionContainer.querySelector('.mark_name');
        if (markName) {
            // 提取题号
            const firstTextNode = markName.childNodes[0];
            if (firstTextNode && firstTextNode.nodeType === Node.TEXT_NODE) {
                questionText += firstTextNode.textContent.trim();
            }

            // 提取题型和分值
            const colorShallow = markName.querySelector('.colorShallow');
            if (colorShallow) {
                questionText += ' ' + colorShallow.textContent.trim();
            }

            // 提取题干
            const qtContent = markName.querySelector('.qtContent');
            if (qtContent) {
                questionText += '\n' + qtContent.textContent.trim();
            }
            questionText += '\n\n';
        }

        // 2. 获取选项（单选/多选题）
        const markLetter = questionContainer.querySelector('ul.mark_letter');
        if (markLetter) {
            const options = markLetter.querySelectorAll('li');
            options.forEach(option => {
                questionText += option.textContent.trim() + '\n';
            });
        }

        // 3. 获取完型填空/填空题选项
        const markGestalt = questionContainer.querySelector('div.mark_gestalt');
        if (markGestalt) {
            const rows = markGestalt.querySelectorAll('.gestalt_row, dl');
            rows.forEach(row => {
                const dt = row.querySelector('dt');
                if (dt) {
                    questionText += dt.textContent.trim() + '\n';
                }
                const dds = row.querySelectorAll('dd');
                dds.forEach(dd => {
                    questionText += '  ' + dd.textContent.trim() + '\n';
                });
            });
        }

        // 使用 GM_setValue 存储题目内容（拼接好前后缀后存储）
        const storageKey = this.config.get('askDoubaoButton.storageKey');
        const doubaoBaseUrl = this.config.get('askDoubaoButton.doubaoUrl');

        try {
            // 从 IndexedDB 实时读取用户保存的配置
            let aiPromptPrefix = '';
            let aiPromptSuffix = '';
            let aiChatId = '';
            try {
                const savedPrefix = await this.dbManager.getSetting('aiPromptPrefix');
                const savedSuffix = await this.dbManager.getSetting('aiPromptSuffix');
                const savedChatId = await this.dbManager.getSetting('aiChatId');
                aiPromptPrefix = savedPrefix || '';
                aiPromptSuffix = savedSuffix || '';
                aiChatId = savedChatId || '';
                console.log('📖 从 IndexedDB 读取配置:');
                console.log('  前缀配置:', aiPromptPrefix || '(空)');
                console.log('  后缀配置:', aiPromptSuffix || '(空)');
                console.log('  会话ID:', aiChatId || '(空)');
            } catch (error) {
                console.warn('读取配置失败，使用默认值:', error);
            }

            // 处理转义符（\n -> 换行符）
            const processedPrefix = aiPromptPrefix.replace(/\\n/g, '\n');
            const processedSuffix = aiPromptSuffix.replace(/\\n/g, '\n');

            // 拼接完整内容（前缀 + 题目 + 后缀）
            const fullContent = processedPrefix + questionText.trim() + processedSuffix;

            // 存储完整内容到GM缓存
            GM_setValue(storageKey, fullContent);

            // 构建目标URL
            const targetUrl = aiChatId ? `https://www.doubao.com/chat/${aiChatId}` : doubaoBaseUrl;

            Logger.log('题目已保存，正在打开豆包AI...');
            console.log('📝 存储的完整内容:');
            console.log('  前缀:', processedPrefix ? `"${processedPrefix}"` : '(无)');
            console.log('  题目长度:', questionText.trim().length);
            console.log('  后缀:', processedSuffix ? `"${processedSuffix}"` : '(无)');
            console.log('  最终内容长度:', fullContent.length);
            console.log('  目标URL:', targetUrl);

            // 关闭旧的豆包AI标签页（如果存在）
            if (this.appInstance && this.appInstance.doubaoTabRef) {
                try {
                    this.appInstance.doubaoTabRef.close();
                    console.log('✅ 已关闭旧的豆包AI标签页');
                } catch (error) {
                    // 静默失败，可能已被用户手动关闭
                    console.log('ℹ️ 旧标签页已不存在或已关闭');
                }
                this.appInstance.doubaoTabRef = null;
            }

            // 打开豆包AI并保存引用
            const tabRef = GM_openInTab(targetUrl, {
                active: true,      // 激活标签页
                insert: true,      // 插入到当前标签页旁边
                setParent: true    // 设置父子关系
            });

            // 保存引用到应用实例
            if (this.appInstance) {
                this.appInstance.doubaoTabRef = tabRef;
                console.log('✅ 已保存新标签页引用');
            }
        } catch (error) {
            Logger.error('打开豆包AI失败', error);
        }
    }

    async _handleCopy() {
        const buttonText = this.config.get('copyButton.text');
        const colors = this.config.get('copyButton.colors');

        // 获取题目容器
        let questionContainer = null;
        const questionId = this.questionId;

        if (questionId && questionId.startsWith('question')) {
            questionContainer = document.getElementById(questionId);
        }

        // 如果没找到，尝试从 parent 向上查找
        if (!questionContainer && this.parent) {
            let element = this.parent;
            while (element && element !== document.body) {
                if (element.classList && (element.classList.contains('questionLi') || element.classList.contains('mark_item'))) {
                    questionContainer = element;
                    break;
                }
                element = element.parentElement;
            }
        }

        if (!questionContainer) {
            Logger.error('未找到题目容器');
            return;
        }

        try {
            // 克隆题目容器以避免修改原DOM
            const containerClone = questionContainer.cloneNode(true);

            // 移除不需要的元素
            const elementsToRemove = containerClone.querySelectorAll('.mark_answer, button, [contenteditable], .aiAssistant');
            elementsToRemove.forEach(el => el.remove());

            // 移除脚本添加的容器
            const scriptContainers = containerClone.querySelectorAll('div[style*="display: inline-block"], div[style*="display: none"]');
            scriptContainers.forEach(el => el.remove());

            // 提取纯文本内容
            let copyText = '';

            // 1. 获取题号和题型
            const markName = containerClone.querySelector('.mark_name');
            if (markName) {
                const firstTextNode = markName.childNodes[0];
                if (firstTextNode && firstTextNode.nodeType === Node.TEXT_NODE) {
                    copyText += firstTextNode.textContent.trim();
                }

                const colorShallow = markName.querySelector('.colorShallow');
                if (colorShallow) {
                    copyText += ' ' + colorShallow.textContent.trim();
                }

                const qtContent = markName.querySelector('.qtContent');
                if (qtContent) {
                    copyText += ' ' + qtContent.textContent.trim();
                }
                copyText += '\n';
            }

            // 2. 获取选项
            const markLetter = containerClone.querySelector('ul.mark_letter');
            if (markLetter) {
                const options = markLetter.querySelectorAll('li');
                options.forEach(option => {
                    copyText += option.textContent.trim() + '\n';
                });
            }

            // 3. 获取完型填空/填空题选项
            const markGestalt = containerClone.querySelector('div.mark_gestalt');
            if (markGestalt) {
                const rows = markGestalt.querySelectorAll('.gestalt_row, dl');
                rows.forEach(row => {
                    const dt = row.querySelector('dt');
                    if (dt) {
                        copyText += dt.textContent.trim() + '\n';
                    }
                    const dds = row.querySelectorAll('dd');
                    dds.forEach(dd => {
                        copyText += '  ' + dd.textContent.trim() + '\n';
                    });
                });
            }

            // 构建HTML内容（包含图片）
            let htmlContent = '<div style="font-family: Arial, sans-serif; font-size: 14px;">';

            // 添加题号和题型
            if (markName) {
                const firstTextNode = questionContainer.querySelector('.mark_name')?.childNodes[0];
                if (firstTextNode && firstTextNode.nodeType === Node.TEXT_NODE) {
                    htmlContent += '<p><strong>' + firstTextNode.textContent.trim();
                }

                const colorShallow = questionContainer.querySelector('.colorShallow');
                if (colorShallow) {
                    htmlContent += ' ' + colorShallow.textContent.trim();
                }
                htmlContent += '</strong></p>';

                // 添加题干（包含图片）
                const qtContent = questionContainer.querySelector('.qtContent');
                if (qtContent) {
                    const qtClone = qtContent.cloneNode(true);
                    // 处理图片：保留原始URL
                    const images = qtClone.querySelectorAll('img');
                    images.forEach(img => {
                        if (img.src) {
                            img.style.maxWidth = '100%';
                            img.style.height = 'auto';
                        }
                    });
                    htmlContent += '<p>' + qtClone.innerHTML + '</p>';
                }
            }

            // 添加选项（包含可能的图片）
            const originalMarkLetter = questionContainer.querySelector('ul.mark_letter');
            if (originalMarkLetter) {
                const letterClone = originalMarkLetter.cloneNode(true);
                const images = letterClone.querySelectorAll('img');
                images.forEach(img => {
                    if (img.src) {
                        img.style.maxWidth = '100%';
                        img.style.height = 'auto';
                    }
                });
                htmlContent += letterClone.outerHTML;
            }

            // 添加完型填空/填空题选项
            const originalMarkGestalt = questionContainer.querySelector('div.mark_gestalt');
            if (originalMarkGestalt) {
                const gestaltClone = originalMarkGestalt.cloneNode(true);
                const images = gestaltClone.querySelectorAll('img');
                images.forEach(img => {
                    if (img.src) {
                        img.style.maxWidth = '100%';
                        img.style.height = 'auto';
                    }
                });
                htmlContent += gestaltClone.outerHTML;
            }

            htmlContent += '</div>';

            // 获取配置的前缀和后缀
            const prefix = await this.dbManager.getSetting('copyPrefix', this.config.get('settings.copyPrefix'));
            const suffix = await this.dbManager.getSetting('copySuffix', this.config.get('settings.copySuffix'));

            // 处理前缀和后缀
            let finalText = copyText.trim();
            let finalHtml = htmlContent;

            if (prefix) {
                const processedPrefix = prefix.replace(/\\n/g, '\n');
                finalText = processedPrefix + finalText;
                finalHtml = '<p>' + processedPrefix.replace(/\n/g, '<br>') + '</p>' + finalHtml;
            }
            if (suffix) {
                const processedSuffix = suffix.replace(/\\n/g, '\n');
                finalText = finalText + processedSuffix;
                finalHtml = finalHtml + '<p>' + processedSuffix.replace(/\n/g, '<br>') + '</p>';
            }

            // 尝试使用现代剪贴板API复制（支持HTML和图片）
            if (navigator.clipboard && navigator.clipboard.write) {
                const htmlBlob = new Blob([finalHtml], { type: 'text/html' });
                const textBlob = new Blob([finalText], { type: 'text/plain' });

                const clipboardItem = new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob
                });

                await navigator.clipboard.write([clipboardItem]);

                // 复制成功
                this.copyButton.innerText = buttonText.copied;
                this.copyButton.style.background = colors.successBackground;

                setTimeout(() => {
                    this.copyButton.innerText = buttonText.copy;
                    this.copyButton.style.background = colors.background;
                }, 2000);
            } else {
                // 降级到纯文本复制
                await navigator.clipboard.writeText(finalText);

                this.copyButton.innerText = buttonText.copied;
                this.copyButton.style.background = colors.successBackground;

                setTimeout(() => {
                    this.copyButton.innerText = buttonText.copy;
                    this.copyButton.style.background = colors.background;
                }, 2000);
            }

        } catch (err) {
            console.error('复制失败:', err);

            // 最后的降级方案：使用传统方法复制纯文本
            try {
                let copyText = '';
                const markName = questionContainer.querySelector('.mark_name');
                if (markName) {
                    const firstTextNode = markName.childNodes[0];
                    if (firstTextNode && firstTextNode.nodeType === Node.TEXT_NODE) {
                        copyText += firstTextNode.textContent.trim();
                    }
                    const colorShallow = markName.querySelector('.colorShallow');
                    if (colorShallow) {
                        copyText += ' ' + colorShallow.textContent.trim();
                    }
                    const qtContent = markName.querySelector('.qtContent');
                    if (qtContent) {
                        copyText += ' ' + qtContent.textContent.trim();
                    }
                    copyText += '\n';
                }

                const markLetter = questionContainer.querySelector('ul.mark_letter');
                if (markLetter) {
                    const options = markLetter.querySelectorAll('li');
                    options.forEach(option => {
                        copyText += option.textContent.trim() + '\n';
                    });
                }

                const markGestalt = questionContainer.querySelector('div.mark_gestalt');
                if (markGestalt) {
                    const rows = markGestalt.querySelectorAll('.gestalt_row, dl');
                    rows.forEach(row => {
                        const dt = row.querySelector('dt');
                        if (dt) {
                            copyText += dt.textContent.trim() + '\n';
                        }
                        const dds = row.querySelectorAll('dd');
                        dds.forEach(dd => {
                            copyText += '  ' + dd.textContent.trim() + '\n';
                        });
                    });
                }

                const prefix = await this.dbManager.getSetting('copyPrefix', this.config.get('settings.copyPrefix'));
                const suffix = await this.dbManager.getSetting('copySuffix', this.config.get('settings.copySuffix'));

                let finalText = copyText.trim();
                if (prefix) {
                    const processedPrefix = prefix.replace(/\\n/g, '\n');
                    finalText = processedPrefix + finalText;
                }
                if (suffix) {
                    const processedSuffix = suffix.replace(/\\n/g, '\n');
                    finalText = finalText + processedSuffix;
                }

                const textarea = document.createElement('textarea');
                textarea.value = finalText;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();

                document.execCommand('copy');
                document.body.removeChild(textarea);

                this.copyButton.innerText = buttonText.copied;
                this.copyButton.style.background = colors.successBackground;

                setTimeout(() => {
                    this.copyButton.innerText = buttonText.copy;
                    this.copyButton.style.background = colors.background;
                }, 2000);
            } catch (e) {
                Logger.error('复制失败', e);
            }
        }
    }

    _createAnswerToggleButton() {
        const buttonText = this.config.get('answerButton.text');
        this.toggleButton = DOMHelper.createElement('button', {
            innerText: buttonText.show,
            style: this.styleGenerator.getAnswerButtonStyle(true),
            title: '点击显示/隐藏当前答案块',
            dataset: {
                isHidden: 'true'
            }
        });

        // 使用统一的悬停效果管理
        this.styleGenerator.addToggleHoverEffect(
            this.toggleButton,
            'answerButton',
            () => this.toggleButton.dataset.isHidden === 'true',
            'showHoverBackground', 'hideHoverBackground',
            'showBackground', 'hideBackground'
        );

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

        // 使用无颜色变化的悬停效果（仅动画）
        this.styleGenerator.addNoColorChangeHoverEffect(this.noteButton);

        this.noteButton.addEventListener('click', () => this._handleNoteToggle());
        this.buttonContainer.appendChild(this.noteButton);
    }

    _createEditModeToggleButton() {
        const buttonText = this.config.get('editModeButton.text');
        const colors = this.config.get('editModeButton.colors');
        const style = this.styleGenerator.getEditModeButtonStyle(false);
        style.display = 'none'; // 初始隐藏
        // 初始状态：预览模式，显示橙色"编辑"按钮
        style.backgroundColor = colors.previewBackground;

        this.editModeButton = DOMHelper.createElement('button', {
            innerText: buttonText.edit,
            style: style,
            title: '切换编辑/预览模式'
        });

        // 使用无颜色变化的悬停效果（仅动画）
        this.styleGenerator.addNoColorChangeHoverEffect(this.editModeButton);

        this.editModeButton.addEventListener('click', () => {
            const buttonText = this.config.get('editModeButton.text');
            const colors = this.config.get('editModeButton.colors');
            this.noteEditor.toggleEditMode();

            if (this.noteEditor.isEditMode) {
                // 编辑模式：绿色背景 + "预览"文字
                this.editModeButton.innerText = buttonText.preview;
                this.editModeButton.style.backgroundColor = colors.editBackground;
                // 编辑模式显示保存按钮
                this.saveNoteButton.style.display = 'inline-block';
            } else {
                // 预览模式：橙色背景 + "编辑"文字
                this.editModeButton.innerText = buttonText.edit;
                this.editModeButton.style.backgroundColor = colors.previewBackground;
                // 预览模式隐藏保存按钮
                this.saveNoteButton.style.display = 'none';
            }
        });

        this.buttonContainer.appendChild(this.editModeButton);
    }

    _createSaveNoteButton() {
        const buttonText = this.config.get('saveNoteButton.text');
        const colors = this.config.get('saveNoteButton.colors');
        const style = this.styleGenerator.getSaveNoteButtonStyle();
        style.display = 'none'; // 初始隐藏
        this.saveNoteButton = DOMHelper.createElement('button', {
            innerText: buttonText.save,
            style: style,
            title: '手动保存当前笔记'
        });

        // 使用统一的悬停效果管理
        this.styleGenerator.addSimpleHoverEffect(this.saveNoteButton, 'saveNoteButton');

        this.saveNoteButton.addEventListener('click', async () => {
            await this.noteEditor.save();
            Logger.success('💾 笔记已保存');

            // 点击反馈：文字和颜色变化
            this.saveNoteButton.innerText = buttonText.saved;
            this.saveNoteButton.style.background = colors.successBackground;

            // 2秒后恢复原状
            setTimeout(() => {
                this.saveNoteButton.innerText = buttonText.save;
                this.saveNoteButton.style.background = colors.background;
            }, 2000);
        });
        this.buttonContainer.appendChild(this.saveNoteButton);
    }

    async _createNoteEditor() {
        this.noteEditor = new NoteEditor(
            this.questionId,
            this.questionNo,
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
        this.isHidden = !this.isHidden;
        this._updateBlockVisibility();
        this._updateAnswerButtonState();
    }

    _updateBlockVisibility() {
        // 使用 display 属性控制显示/隐藏
        this.block.style.display = this.isHidden ? 'none' : '';
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

        // 联动控制编辑按钮的显示/隐藏
        if (this.noteEditor.isVisible) {
            this.editModeButton.style.display = 'inline-block';
            // 保存按钮只在编辑模式下显示
            if (this.noteEditor.isEditMode) {
                this.saveNoteButton.style.display = 'inline-block';
            } else {
                this.saveNoteButton.style.display = 'none';
            }
        } else {
            this.editModeButton.style.display = 'none';
            this.saveNoteButton.style.display = 'none';
        }
    }

    toggle() {
        this._handleAnswerToggle();
    }

    getState() {
        return this.isHidden;
    }
}


// 导出供其他模块使用
window.AnswerBlockController = AnswerBlockController;
