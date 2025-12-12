/**
 * GlobalController - 全局控制器
 * 负责全局按钮（显示全部/隐藏全部、控制面板、导出）的创建和管理
 * @version 3.12.0.9
 */
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
        this.exportButton = null;
        this.buttonContainer = null;
    }

    initialize() {
        if (!this.container) return null;

        // 将按钮放到 fanyaMarking_right 的右侧外部
        this._createButtonContainer();
        // 注意：按钮创建顺序决定显示顺序（上到下/左到右）
        this._createManageButton();     // 控制面板在最上面
        this._createGlobalButton();     // 显示全部答案在第二
        this._createExportButton();     // 导出按钮在下面
        return this.globalButton;
    }

    _createButtonContainer() {
        // 使用统一的选择器配置获取 fanyaMarking_right
        const sidePanelSelector = this.config.get('selectors.sidePanel');
        const fanyaMarkingRight = document.querySelector(sidePanelSelector) || this.container.parentNode;

        // 检测是否为竖屏模式
        const isPortrait = () => window.innerHeight > window.innerWidth;

        // 按钮最小宽度配置（用于空间检测）
        const BUTTON_MIN_WIDTH = 140;  // 单个按钮的最小宽度
        const BUTTON_GAP = 8;          // 按钮间距
        const SIDE_MARGIN = 10;        // 侧边距
        const SAFETY_MARGIN = 20;      // 安全边距（防止按钮贴边或被截断）
        const REQUIRED_SPACE = BUTTON_MIN_WIDTH + SIDE_MARGIN * 2 + SAFETY_MARGIN; // 所需最小空间

        // 创建按钮容器，使用固定定位
        this.buttonContainer = DOMHelper.createElement('div', {
            style: {
                position: 'fixed',
                display: 'flex',
                gap: BUTTON_GAP + 'px',
                zIndex: '9999',
                transition: 'all 0.3s ease' // 添加平滑过渡效果
            }
        });

        // 将按钮容器添加到 body
        document.body.appendChild(this.buttonContainer);

        /**
         * 检测右侧是否有足够空间显示按钮
         * @param {DOMRect} rect - 侧边栏的位置信息
         * @returns {boolean} true表示有足够空间，false表示空间不足
         */
        const hasEnoughRightSpace = (rect) => {
            const windowWidth = window.innerWidth;
            const rightEdge = rect.right;
            const availableSpace = windowWidth - rightEdge;

            // 调试日志
            console.log('[按钮布局检测]', {
                窗口宽度: windowWidth,
                侧边栏右边缘: rightEdge,
                可用空间: availableSpace,
                所需空间: REQUIRED_SPACE,
                是否充足: availableSpace >= REQUIRED_SPACE
            });

            return availableSpace >= REQUIRED_SPACE;
        };

        /**
         * 更新按钮位置和布局
         * 智能布局逻辑：
         * 1. 竖屏模式：始终在下方横向排列
         * 2. 横屏模式：
         *    - 右侧空间充足：在右侧纵向排列
         *    - 右侧空间不足：在下方纵向排列（从上到下）
         */
        const updatePosition = () => {
            const rect = fanyaMarkingRight.getBoundingClientRect();

            if (isPortrait()) {
                // 竖屏模式：按钮横向排列在侧边栏下方
                this.buttonContainer.style.flexDirection = 'row';
                this.buttonContainer.style.flexWrap = 'wrap';
                this.buttonContainer.style.top = (rect.bottom + SIDE_MARGIN) + 'px';
                this.buttonContainer.style.left = rect.left + 'px';
                this.buttonContainer.style.right = 'auto';
                this.buttonContainer.style.maxWidth = rect.width + 'px';
                this.buttonContainer.style.justifyContent = 'flex-start';
                this.buttonContainer.style.alignItems = 'flex-start';

                console.log('[按钮布局] 竖屏模式：下方横向排列');
            } else {
                // 横屏模式：根据右侧空间决定布局
                const hasSpace = hasEnoughRightSpace(rect);

                if (hasSpace) {
                    // 右侧空间充足：按钮纵向排列在侧边栏右边
                    this.buttonContainer.style.flexDirection = 'column';
                    this.buttonContainer.style.flexWrap = 'nowrap';
                    this.buttonContainer.style.top = rect.top + 'px';
                    this.buttonContainer.style.left = (rect.right + SIDE_MARGIN) + 'px';
                    this.buttonContainer.style.right = 'auto';
                    this.buttonContainer.style.maxWidth = 'none';
                    this.buttonContainer.style.justifyContent = 'flex-start';
                    this.buttonContainer.style.alignItems = 'stretch';

                    console.log('[按钮布局] 横屏模式：右侧空间充足，右侧纵向排列');
                } else {
                    // 右侧空间不足：按钮纵向排列在侧边栏下方（从上到下）
                    // 关键修复：确保纵向排列，不换行
                    this.buttonContainer.style.flexDirection = 'column';
                    this.buttonContainer.style.flexWrap = 'nowrap';
                    this.buttonContainer.style.top = (rect.bottom + SIDE_MARGIN) + 'px';
                    this.buttonContainer.style.left = rect.left + 'px';
                    this.buttonContainer.style.right = 'auto';
                    this.buttonContainer.style.maxWidth = rect.width + 'px';
                    this.buttonContainer.style.justifyContent = 'flex-start';
                    this.buttonContainer.style.alignItems = 'stretch'; // 修改为 stretch 使按钮占满宽度

                    console.log('[按钮布局] 横屏模式：右侧空间不足，下方纵向排列');
                }
            }
        };

        // 初始更新位置（延迟确保DOM完全渲染）
        setTimeout(updatePosition, 100);

        // 滚动和窗口变化时更新位置
        window.addEventListener('scroll', updatePosition, { passive: true });
        window.addEventListener('resize', updatePosition);

        // 监听屏幕方向变化（移动设备）
        if (window.matchMedia) {
            window.matchMedia('(orientation: portrait)').addEventListener('change', updatePosition);
        }

        // 使用 ResizeObserver 监听侧边栏大小变化（更精确的响应式）
        if (typeof ResizeObserver !== 'undefined') {
            const resizeObserver = new ResizeObserver(() => {
                updatePosition();
            });
            resizeObserver.observe(fanyaMarkingRight);
        }
    }

    _createGlobalButton() {
        const buttonText = this.config.get('globalButton.text');
        this.globalButton = DOMHelper.createElement('button', {
            innerText: buttonText.showAll,
            style: this.styleGenerator.getGlobalButtonStyle(true),
            title: '点击一键显示/隐藏所有答案块'
        });

        // 使用统一的悬停效果管理
        this.styleGenerator.addToggleHoverEffect(
            this.globalButton,
            'globalButton',
            () => this.controllers.every(ctrl => ctrl.getState()),
            'showAllHoverBackground', 'hideAllHoverBackground',
            'showAllBackground', 'hideAllBackground'
        );

        this.globalButton.addEventListener('click', () => this._handleGlobalToggle());
        this.buttonContainer.appendChild(this.globalButton);
    }

    _createManageButton() {
        const buttonText = this.config.get('manageButton.text');
        this.manageButton = DOMHelper.createElement('button', {
            innerText: buttonText,
            style: this.styleGenerator.getManageButtonStyle(),
            title: '打开控制面板：设置和笔记管理'
        });

        // 使用统一的悬停效果管理
        this.styleGenerator.addSimpleHoverEffect(this.manageButton, 'manageButton');

        this.manageButton.addEventListener('click', () => this._handleManageClick());
        this.buttonContainer.appendChild(this.manageButton);
    }

    _createExportButton() {
        const buttonText = this.config.get('exportButton.text');
        const buttonTextWithAnswer = this.config.get('exportButton.textWithAnswer');
        const colors = this.config.get('exportButton.colors');

        // 创建导出试题按钮（不带答案）
        this.exportButton = DOMHelper.createElement('button', {
            innerText: buttonText,
            style: this.styleGenerator.getExportButtonStyle(),
            title: '导出试题为Word文档（不含答案）'
        });

        // 使用统一的悬停效果管理
        this.styleGenerator.addSimpleHoverEffect(this.exportButton, 'exportButton');

        this.exportButton.addEventListener('click', () => this._handleExport(false));
        this.buttonContainer.appendChild(this.exportButton);

        // 创建导出答案按钮（带答案）
        const exportWithAnswerStyle = this.styleGenerator.getExportButtonStyle();
        exportWithAnswerStyle.background = colors.withAnswerBackground;

        this.exportWithAnswerButton = DOMHelper.createElement('button', {
            innerText: buttonTextWithAnswer,
            style: exportWithAnswerStyle,
            title: '导出试题为Word文档（含答案）'
        });

        // 手动添加悬停效果（使用紫色）
        this.exportWithAnswerButton.addEventListener('mouseenter', () => {
            this.exportWithAnswerButton.style.background = colors.withAnswerHoverBackground;
            this.exportWithAnswerButton.style.transform = 'translateY(-1px)';
        });
        this.exportWithAnswerButton.addEventListener('mouseleave', () => {
            this.exportWithAnswerButton.style.background = colors.withAnswerBackground;
            this.exportWithAnswerButton.style.transform = 'translateY(0)';
        });

        this.exportWithAnswerButton.addEventListener('click', () => this._handleExport(true));
        this.buttonContainer.appendChild(this.exportWithAnswerButton);
    }

    async _handleExport(includeAnswer = false) {
        // 确定当前操作的按钮
        const currentButton = includeAnswer ? this.exportWithAnswerButton : this.exportButton;
        const originalText = currentButton.innerText;

        try {
            // 显示导出中状态
            currentButton.innerText = '⏳ 导出中...';
            currentButton.disabled = true;

            // 从控制器中获取答案信息
            if (this.controllers.length === 0) {
                alert('未找到任何试题');
                currentButton.innerText = originalText;
                currentButton.disabled = false;
                return;
            }

            // 解析题目内容（使用控制器中保存的原始答案）
            const docContent = this._parseQuestionsToDocx();

            if (!docContent.questions || docContent.questions.length === 0) {
                alert('未能解析到试题内容');
                currentButton.innerText = originalText;
                currentButton.disabled = false;
                return;
            }

            // 从数据库读取用户配置的导出格式
            const exportDefaults = this.config.get('exportSettings');
            let format = 'doc'; // 默认doc格式
            try {
                const savedFormat = await this.dbManager.getSetting('exportFormat');
                format = savedFormat ?? exportDefaults.exportFormat ?? 'doc';
            } catch (e) {
                console.warn('读取导出格式配置失败，使用默认值:', e);
                format = exportDefaults.exportFormat ?? 'doc';
            }

            // 根据格式调用不同的生成方法
            if (format === 'docx') {
                await this._generateDocx(docContent, includeAnswer);
            } else {
                await this._generateDoc(docContent, includeAnswer);
            }

            // 恢复按钮状态
            currentButton.innerText = originalText;
            currentButton.disabled = false;
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败，请重试');
            currentButton.innerText = originalText;
            currentButton.disabled = false;
        }
    }

    _parseQuestionsToDocx() {
        const content = [];

        // 获取文档标题（从 mark_title 获取）
        const markTitle = document.querySelector('.mark_title');
        const docTitle = markTitle ? markTitle.innerText.trim() : '试题导出';

        this.controllers.forEach((controller, index) => {
            // 从答案块获取原始HTML（保留完整HTML结构）
            const answerHTML = controller.block.outerHTML;

            // 获取题目信息 - 找到完整的题目容器
            let questionHTML = '';
            let titleText = `第${index + 1}题`;

            // 使用 questionId 找到完整的题目容器
            const questionId = controller.questionId;
            let questionContainer = null;

            if (questionId && questionId.startsWith('question')) {
                questionContainer = document.getElementById(questionId);
            }

            // 如果没找到，尝试从 parent 向上查找
            if (!questionContainer && controller.parent) {
                let element = controller.parent;
                while (element && element !== document.body) {
                    if (element.classList && (element.classList.contains('questionLi') || element.classList.contains('mark_item'))) {
                        questionContainer = element;
                        break;
                    }
                    element = element.parentElement;
                }
            }

            if (questionContainer) {
                // 克隆元素以避免影响原始DOM
                const containerClone = questionContainer.cloneNode(true);

                // 移除答案块（我们单独处理答案）
                const answerBlocks = containerClone.querySelectorAll('.mark_answer');
                answerBlocks.forEach(block => block.remove());

                // 移除脚本添加的按钮
                const buttons = containerClone.querySelectorAll('button');
                buttons.forEach(btn => btn.remove());

                // 移除脚本添加的编辑器容器
                const editDivs = containerClone.querySelectorAll('div[contenteditable]');
                editDivs.forEach(div => {
                    const parent = div.closest('div[style*="display: none"]') || div.closest('div[style*="margin-top: 12px"]');
                    if (parent) parent.remove();
                });

                // 移除按钮容器（脚本添加的inline-block div）
                const inlineBlockDivs = containerClone.querySelectorAll('div[style*="display: inline-block"]');
                inlineBlockDivs.forEach(div => div.remove());

                // 获取题号和题目内容
                const markName = containerClone.querySelector('.mark_name');
                if (markName) {
                    // 提取题号文本（如 "1. (单选题, 4分)"）
                    const colorShallow = markName.querySelector('.colorShallow');
                    const firstTextNode = markName.childNodes[0];
                    if (firstTextNode && firstTextNode.nodeType === Node.TEXT_NODE) {
                        titleText = firstTextNode.textContent.trim();
                    }
                    if (colorShallow) {
                        titleText += ' ' + colorShallow.textContent.trim();
                    }

                    // 获取题目正文HTML（在 qtContent 中）
                    const qtContent = markName.querySelector('.qtContent');
                    if (qtContent) {
                        questionHTML = qtContent.innerHTML;
                    }
                }

                // 获取选项列表 - 支持多种题型
                // 1. 单选题/多选题: ul.mark_letter
                const markLetter = containerClone.querySelector('ul.mark_letter');
                if (markLetter) {
                    questionHTML += markLetter.outerHTML;
                }

                // 2. 完型填空/填空题: div.mark_gestalt
                const markGestalt = containerClone.querySelector('div.mark_gestalt');
                if (markGestalt) {
                    // 移除脚本添加的按钮容器（在选项内部的）
                    const innerButtons = markGestalt.querySelectorAll('div[style*="display: inline-block"]');
                    innerButtons.forEach(btn => btn.remove());
                    const innerEditors = markGestalt.querySelectorAll('div[style*="display: none"]');
                    innerEditors.forEach(div => div.remove());
                    questionHTML += markGestalt.outerHTML;
                }

                // 移除AI讲解链接
                const aiLinks = containerClone.querySelectorAll('a.aiAssistant');
                aiLinks.forEach(link => link.remove());

                // 如果还是没有内容，尝试从 aiAreaContent 获取
                if (!questionHTML) {
                    const aiAreaContent = containerClone.querySelector('.aiAreaContent');
                    if (aiAreaContent) {
                        // 移除 mark_name 避免重复
                        const mn = aiAreaContent.querySelector('.mark_name');
                        if (mn) mn.remove();
                        questionHTML = aiAreaContent.innerHTML;
                    }
                }
            }

            console.log(`题目 ${index + 1}:`, {
                title: titleText,
                hasQuestionHTML: !!questionHTML,
                questionHTMLLength: questionHTML.length,
                hasAnswerHTML: !!answerHTML,
                answerHTMLLength: answerHTML?.length || 0
            });

            content.push({
                type: 'question',
                index: index + 1,
                title: titleText,
                questionHTML: questionHTML,
                answerHTML: answerHTML
            });
        });

        return { docTitle, questions: content };
    }

    async _generateDocx(content, includeAnswer = false) {
        // 获取导出设置（答案由参数控制，不从设置读取）
        const exportDefaults = this.config.get('exportSettings');
        let exportSettings = {};
        let contentOptions = {};
        try {
            const allSettings = await this.dbManager.getAllSettings();
            exportSettings = {
                fontFamily: allSettings.exportFontFamily ?? exportDefaults.fontFamily,
                fontSize: allSettings.exportFontSize ?? exportDefaults.fontSize,
                titleFontSize: allSettings.exportTitleFontSize ?? exportDefaults.titleFontSize,
                lineHeight: allSettings.exportLineHeight ?? exportDefaults.lineHeight,
                pageMargin: allSettings.exportPageMargin ?? exportDefaults.pageMargin
            };
            // 导出内容选项
            contentOptions = {
                exportMyAnswer: allSettings.exportMyAnswer ?? exportDefaults.exportMyAnswer,
                exportCorrectAnswer: allSettings.exportCorrectAnswer ?? exportDefaults.exportCorrectAnswer,
                exportScore: allSettings.exportScore ?? exportDefaults.exportScore,
                exportAnalysis: allSettings.exportAnalysis ?? exportDefaults.exportAnalysis
            };
        } catch (e) {
            exportSettings = { ...exportDefaults };
            contentOptions = {
                exportMyAnswer: exportDefaults.exportMyAnswer,
                exportCorrectAnswer: exportDefaults.exportCorrectAnswer,
                exportScore: exportDefaults.exportScore,
                exportAnalysis: exportDefaults.exportAnalysis
            };
        }

        // 根据导出内容选项过滤答案HTML
        const filterAnswerHtml = (answerHTML) => {
            if (!answerHTML) return '';

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = answerHTML;

            // 如果不导出"我的答案"，移除相关元素
            if (!contentOptions.exportMyAnswer) {
                // 移除包含"我的答案"的span（查找包含stuAnswerContent的父span）
                const myAnswerSpans = tempDiv.querySelectorAll('.stuAnswerContent');
                myAnswerSpans.forEach(span => {
                    // 找到包含"我的答案:"标签的父级span
                    const parentSpan = span.closest('span.colorDeep.marginRight40.fl') || span.parentElement;
                    if (parentSpan) parentSpan.remove();
                });
            }

            // 如果不导出"正确答案"，移除相关元素
            if (!contentOptions.exportCorrectAnswer) {
                const correctAnswerSpans = tempDiv.querySelectorAll('.rightAnswerContent');
                correctAnswerSpans.forEach(span => {
                    const parentSpan = span.closest('span.colorGreen.marginRight40.fl') || span.parentElement;
                    if (parentSpan) parentSpan.remove();
                });
            }

            // 如果不导出"本题得分"，移除相关元素
            if (!contentOptions.exportScore) {
                const scoreDiv = tempDiv.querySelector('.mark_score');
                if (scoreDiv) scoreDiv.remove();
            }

            // 如果不导出"答案解析"，移除相关元素
            if (!contentOptions.exportAnalysis) {
                const analysisDiv = tempDiv.querySelector('.analysisDiv');
                if (analysisDiv) analysisDiv.remove();
            }

            return tempDiv.innerHTML;
        };

        // 使用 GM_xmlhttpRequest 下载图片（绕过 CORS 限制）
        const downloadImageAsBase64 = (imgUrl) => {
            return new Promise((resolve) => {
                // 处理相对路径
                let fullUrl = imgUrl;
                if (imgUrl.startsWith('//')) {
                    fullUrl = 'https:' + imgUrl;
                } else if (imgUrl.startsWith('/')) {
                    fullUrl = window.location.origin + imgUrl;
                }

                console.log('[图片下载] 开始下载:', fullUrl);

                // 检查是否有 GM_xmlhttpRequest 可用
                if (typeof GM_xmlhttpRequest === 'function') {
                    console.log('[图片下载] 使用 GM_xmlhttpRequest');
                    try {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: fullUrl,
                            responseType: 'blob',
                            timeout: 15000,
                            headers: {
                                'Referer': window.location.href
                            },
                            onload: function (response) {
                                console.log('[图片下载] 响应状态:', response.status, '类型:', response.response?.type);
                                if (response.status === 200 && response.response) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        console.log('[图片下载] 转换成功, base64长度:', reader.result?.length);
                                        resolve(reader.result);
                                    };
                                    reader.onerror = (e) => {
                                        console.error('[图片下载] FileReader 错误:', e);
                                        resolve(fullUrl);
                                    };
                                    reader.readAsDataURL(response.response);
                                } else {
                                    console.warn('[图片下载] 响应错误:', response.status, response.statusText);
                                    resolve(fullUrl);
                                }
                            },
                            onerror: function (error) {
                                console.error('[图片下载] GM_xmlhttpRequest 错误:', error);
                                resolve(fullUrl);
                            },
                            ontimeout: function () {
                                console.warn('[图片下载] 超时:', fullUrl);
                                resolve(fullUrl);
                            }
                        });
                    } catch (e) {
                        console.error('[图片下载] GM_xmlhttpRequest 异常:', e);
                        resolve(fullUrl);
                    }
                } else {
                    // GM_xmlhttpRequest 不可用，尝试 fetch
                    console.warn('[图片下载] GM_xmlhttpRequest 不可用，尝试 fetch');
                    fetch(fullUrl, { mode: 'cors', credentials: 'include' })
                        .then(response => response.blob())
                        .then(blob => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = () => resolve(fullUrl);
                            reader.readAsDataURL(blob);
                        })
                        .catch(e => {
                            console.error('[图片下载] fetch 错误:', e);
                            resolve(fullUrl);
                        });
                }
            });
        };

        // 处理HTML中的图片（包括尺寸调整）
        // A4纸内容区域约 21cm - 4cm边距 = 17cm ≈ 480pt，这里设置稍小一点确保不超出
        const MAX_IMAGE_WIDTH = 600;  // 最大宽度（像素）

        // 获取图片尺寸，仅当超出最大宽度时才缩放
        const getScaledImageSize = (base64Data) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const originalWidth = img.naturalWidth;
                    const originalHeight = img.naturalHeight;

                    // 只有当宽度超出时才缩放
                    if (originalWidth > MAX_IMAGE_WIDTH) {
                        const scale = MAX_IMAGE_WIDTH / originalWidth;
                        const newWidth = MAX_IMAGE_WIDTH;
                        const newHeight = Math.round(originalHeight * scale);
                        console.log(`[图片缩放] ${originalWidth}x${originalHeight} → ${newWidth}x${newHeight}`);
                        resolve({ width: newWidth, height: newHeight, scaled: true });
                    } else {
                        // 不需要缩放，保持原尺寸
                        console.log(`[图片尺寸] ${originalWidth}x${originalHeight} (无需缩放)`);
                        resolve({ width: originalWidth, height: originalHeight, scaled: false });
                    }
                };
                img.onerror = () => {
                    console.warn('[图片尺寸] 无法获取尺寸');
                    resolve({ width: null, height: null, scaled: false });
                };
                img.src = base64Data;
            });
        };

        // 处理HTML中的图片
        const processImagesInHtml = async (html) => {
            if (!html) return '';
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            const images = tempDiv.querySelectorAll('img');
            for (const img of images) {
                // 优先使用 data-original（高清原图）
                const originalSrc = img.getAttribute('data-original');
                const src = originalSrc || img.getAttribute('src');
                if (src) {
                    console.log('正在处理图片:', src);
                    const processedSrc = await downloadImageAsBase64(src);
                    img.setAttribute('src', processedSrc);
                    // 移除可能干扰的属性
                    img.removeAttribute('data-original');
                    img.removeAttribute('data-src');

                    // 检查是否成功转为 base64
                    if (processedSrc.startsWith('data:')) {
                        // 获取尺寸信息，只有超宽的才会被缩放
                        const sizeInfo = await getScaledImageSize(processedSrc);

                        if (sizeInfo.scaled && sizeInfo.width && sizeInfo.height) {
                            // 只有被缩放的图片才设置固定尺寸
                            img.setAttribute('width', sizeInfo.width);
                            img.setAttribute('height', sizeInfo.height);
                            img.style.width = `${sizeInfo.width}px`;
                            img.style.height = `${sizeInfo.height}px`;
                        }
                        // 未缩放的图片保持原样，不设置尺寸属性
                    } else {
                        console.warn('图片保留原URL:', processedSrc);
                        // 对于未转换的图片，使用CSS限制最大宽度作为保险
                        img.style.maxWidth = `${MAX_IMAGE_WIDTH}px`;
                        img.style.height = 'auto';
                    }
                }
            }

            return tempDiv.innerHTML;
        };

        // 清理HTML，保留原始样式和结构，移除不需要的元素
        const cleanHtml = (html) => {
            if (!html) return '';
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // 移除 element-invisible-hidden 类的元素（包含选项完整内容，如":1968年NATO会议"）
            // 用户只需要答案字母（如"B"），不需要这些冗余内容
            const hiddenElements = tempDiv.querySelectorAll('.element-invisible-hidden');
            hiddenElements.forEach(el => el.remove());

            return tempDiv.innerHTML;
        };

        // 构建纯HTML格式文档（Word可以直接打开.doc格式的HTML）
        let htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:w="urn:schemas-microsoft-com:office:word"
  xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word 15">
<!--[if gte mso 9]>
<xml>
    <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
</xml>
<![endif]-->
<style>
    /* 页面基础设置 */
    @page { 
        size: A4; 
        margin: ${exportSettings.pageMargin};
    }
    body { 
        font-family: '${exportSettings.fontFamily}', SimSun, serif; 
        font-size: ${exportSettings.fontSize}pt; 
        line-height: ${exportSettings.lineHeight};
        color: #333;
    }
    
    /* 文档标题 */
    .doc-title {
        text-align: center;
        font-size: ${exportSettings.titleFontSize}pt;
        font-weight: bold;
        margin-bottom: 30px;
        color: #000;
    }
    
    /* 题目容器（添加明显分隔线） */
    .question {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #2d3748;
        page-break-inside: avoid;
    }
    .question:last-child {
        border-bottom: none;
    }
    
    /* 题目标题（题号和分值） */
    .question-header {
        font-weight: bold;
        font-size: ${exportSettings.fontSize}pt;
        color: #000;
        margin-bottom: 10px;
        background-color: #f5f5f5;
        padding: 5px 10px;
    }
    
    /* 题目内容区域 */
    .question-content {
        margin: 10px 0;
    }
    .question-content img {
        max-width: 500px;
        height: auto;
    }
    
    /* 答案区域 */
    .answer-section {
        margin-top: 15px;
        padding: 10px;
        background-color: #fff8f8;
        border-left: 3px solid #e74c3c;
    }
    .answer-label {
        font-weight: bold;
        color: #e74c3c;
    }
    .answer-content {
        margin-top: 5px;
    }
    .answer-content img {
        max-width: 500px;
        height: auto;
    }
    
    /* ========== 保留原始网页样式 ========== */
    
    /* 题目名称样式 */
    .mark_name {
        font-weight: bold;
        margin-bottom: 10px;
    }
    .colorShallow {
        color: #999;
        font-weight: normal;
    }
    .colorDeep {
        color: #333;
    }
    .colorGreen {
        color: #48bb78;
    }
    
    /* 单选/多选题选项样式 */
    .mark_letter {
        list-style: none;
        padding: 0;
        margin: 10px 0;
    }
    .mark_letter li {
        padding: 8px 0;
        border-bottom: 1px dashed #e2e8f0;
    }
    .mark_letter li:last-child {
        border-bottom: none;
    }
    
    /* 完型填空选项样式 */
    .mark_gestalt {
        margin: 15px 0;
    }
    .gestalt_row {
        margin: 12px 0;
        padding: 8px 0;
        border-bottom: 1px dashed #e2e8f0;
    }
    .gestalt_row:last-child {
        border-bottom: none;
    }
    .gestalt_row dt {
        font-weight: bold;
        color: #2d3748;
        margin-bottom: 8px;
    }
    .gestalt_row dd {
        display: inline-block;
        margin: 4px 20px 4px 0;
    }
    .gestalt_num {
        font-weight: bold;
        margin-right: 5px;
    }
    
    /* 答案详情样式 */
    .mark_answer {
        padding: 10px;
        background: #f7fafc;
        border-radius: 4px;
    }
    .mark_key {
        margin-bottom: 10px;
    }
    .mark_fill dt {
        font-weight: bold;
    }
    .mark_fill dd {
        display: inline;
    }
    .gestalt_fill {
        display: inline-block;
        margin-right: 15px;
        padding: 2px 8px;
        background: #edf2f7;
        border-radius: 4px;
    }
    .mark_score {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #e2e8f0;
    }
    .totalScore {
        font-weight: bold;
        color: #e53e3e;
    }
    .fontWeight {
        font-weight: bold;
    }
    .marginRight40 {
        margin-right: 40px;
    }
    .fl {
        display: inline-block;
    }
    .fr {
        float: right;
    }
    .stuAnswerContent, .rightAnswerContent {
        font-weight: bold;
    }
    
    /* 表格样式 */
    table {
        border-collapse: collapse;
        width: 100%;
        margin: 10px 0;
    }
    td, th {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
    }
</style>
</head>
<body>
<div class="doc-title">${this._escapeHtml(content.docTitle)}</div>
`;

        // 处理每道题目
        for (const item of content.questions) {
            // 处理题目HTML中的图片（异步处理，尝试转为base64）
            const processedQuestionHtml = await processImagesInHtml(cleanHtml(item.questionHTML || ''));

            htmlContent += `
<div class="question">
    <div class="question-header">${this._escapeHtml(item.title)}</div>
    <div class="question-content">${processedQuestionHtml}</div>`;

            // 根据参数决定是否导出答案
            if (includeAnswer && item.answerHTML) {
                // 先过滤答案内容（根据导出内容选项）
                const filteredAnswerHtml = filterAnswerHtml(item.answerHTML);
                // 只有过滤后仍有内容才显示答案区域
                if (filteredAnswerHtml.trim()) {
                    const processedAnswerHtml = await processImagesInHtml(cleanHtml(filteredAnswerHtml));
                    htmlContent += `
    <div class="answer-section">
        <div class="answer-label">【答案】</div>
        <div class="answer-content">${processedAnswerHtml}</div>
    </div>`;
                }
            }

            htmlContent += `
</div>
`;
        }

        htmlContent += `
</body>
</html>`;

        // 生成文件名（使用文档标题 + 时间戳）
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        // 清理文件名中的非法字符
        const safeTitle = content.docTitle.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);

        let blob;
        let fileExtension;

        // 尝试使用 html-docx-js 库生成真正的 docx 文件
        if (typeof htmlDocx !== 'undefined' && htmlDocx.asBlob) {
            try {
                console.log('[导出] 使用 html-docx-js 生成 docx 文件');
                blob = htmlDocx.asBlob(htmlContent);
                fileExtension = 'docx';
                Logger.success('正在生成 docx 文件...');
            } catch (e) {
                console.warn('[导出] html-docx-js 转换失败，回退到 doc 格式:', e);
                // 回退到 HTML 格式的 doc 文件
                blob = new Blob(['\ufeff' + htmlContent], {
                    type: 'application/msword'
                });
                fileExtension = 'doc';
            }
        } else {
            console.log('[导出] html-docx-js 库不可用，使用 doc 格式');
            // html-docx-js 库不可用，使用 HTML 格式的 doc 文件
            blob = new Blob(['\ufeff' + htmlContent], {
                type: 'application/msword'
            });
            fileExtension = 'doc';
        }

        // 生成下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${safeTitle}_${dateStr}_${timeStr}.${fileExtension}`;

        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * 生成 DOC 格式文档（手机版-兼容性更好）
     * 直接使用 HTML 格式的 .doc 文件，跳过 html-docx-js 转换
     * @param {Object} content - 文档内容对象
     * @param {boolean} includeAnswer - 是否包含答案
     */
    async _generateDoc(content, includeAnswer = false) {
        // 获取导出设置（与docx共用配置）
        const exportDefaults = this.config.get('exportSettings');
        let exportSettings = {};
        let contentOptions = {};
        try {
            const allSettings = await this.dbManager.getAllSettings();
            exportSettings = {
                fontFamily: allSettings.exportFontFamily ?? exportDefaults.fontFamily,
                fontSize: allSettings.exportFontSize ?? exportDefaults.fontSize,
                titleFontSize: allSettings.exportTitleFontSize ?? exportDefaults.titleFontSize,
                lineHeight: allSettings.exportLineHeight ?? exportDefaults.lineHeight,
                pageMargin: allSettings.exportPageMargin ?? exportDefaults.pageMargin
            };
            // 导出内容选项
            contentOptions = {
                exportMyAnswer: allSettings.exportMyAnswer ?? exportDefaults.exportMyAnswer,
                exportCorrectAnswer: allSettings.exportCorrectAnswer ?? exportDefaults.exportCorrectAnswer,
                exportScore: allSettings.exportScore ?? exportDefaults.exportScore,
                exportAnalysis: allSettings.exportAnalysis ?? exportDefaults.exportAnalysis
            };
        } catch (e) {
            exportSettings = { ...exportDefaults };
            contentOptions = {
                exportMyAnswer: exportDefaults.exportMyAnswer,
                exportCorrectAnswer: exportDefaults.exportCorrectAnswer,
                exportScore: exportDefaults.exportScore,
                exportAnalysis: exportDefaults.exportAnalysis
            };
        }

        // 根据导出内容选项过滤答案HTML（复用_generateDocx中的逻辑）
        const filterAnswerHtml = (answerHTML) => {
            if (!answerHTML) return '';

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = answerHTML;

            if (!contentOptions.exportMyAnswer) {
                const myAnswerSpans = tempDiv.querySelectorAll('.stuAnswerContent');
                myAnswerSpans.forEach(span => {
                    const parentSpan = span.closest('span.colorDeep.marginRight40.fl') || span.parentElement;
                    if (parentSpan) parentSpan.remove();
                });
            }

            if (!contentOptions.exportCorrectAnswer) {
                const correctAnswerSpans = tempDiv.querySelectorAll('.rightAnswerContent');
                correctAnswerSpans.forEach(span => {
                    const parentSpan = span.closest('span.colorGreen.marginRight40.fl') || span.parentElement;
                    if (parentSpan) parentSpan.remove();
                });
            }

            if (!contentOptions.exportScore) {
                const scoreDiv = tempDiv.querySelector('.mark_score');
                if (scoreDiv) scoreDiv.remove();
            }

            if (!contentOptions.exportAnalysis) {
                const analysisDiv = tempDiv.querySelector('.analysisDiv');
                if (analysisDiv) analysisDiv.remove();
            }

            return tempDiv.innerHTML;
        };

        // 使用 GM_xmlhttpRequest 下载图片（复用_generateDocx中的逻辑）
        const downloadImageAsBase64 = (imgUrl) => {
            return new Promise((resolve) => {
                let fullUrl = imgUrl;
                if (imgUrl.startsWith('//')) {
                    fullUrl = 'https:' + imgUrl;
                } else if (imgUrl.startsWith('/')) {
                    fullUrl = window.location.origin + imgUrl;
                }

                console.log('[图片下载] 开始下载:', fullUrl);

                if (typeof GM_xmlhttpRequest === 'function') {
                    console.log('[图片下载] 使用 GM_xmlhttpRequest');
                    try {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: fullUrl,
                            responseType: 'blob',
                            timeout: 15000,
                            headers: {
                                'Referer': window.location.href
                            },
                            onload: function (response) {
                                console.log('[图片下载] 响应状态:', response.status, '类型:', response.response?.type);
                                if (response.status === 200 && response.response) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        console.log('[图片下载] 转换成功, base64长度:', reader.result?.length);
                                        resolve(reader.result);
                                    };
                                    reader.onerror = (e) => {
                                        console.error('[图片下载] FileReader 错误:', e);
                                        resolve(fullUrl);
                                    };
                                    reader.readAsDataURL(response.response);
                                } else {
                                    console.warn('[图片下载] 响应错误:', response.status, response.statusText);
                                    resolve(fullUrl);
                                }
                            },
                            onerror: function (error) {
                                console.error('[图片下载] GM_xmlhttpRequest 错误:', error);
                                resolve(fullUrl);
                            },
                            ontimeout: function () {
                                console.warn('[图片下载] 超时:', fullUrl);
                                resolve(fullUrl);
                            }
                        });
                    } catch (e) {
                        console.error('[图片下载] GM_xmlhttpRequest 异常:', e);
                        resolve(fullUrl);
                    }
                } else {
                    console.warn('[图片下载] GM_xmlhttpRequest 不可用，尝试 fetch');
                    fetch(fullUrl, { mode: 'cors', credentials: 'include' })
                        .then(response => response.blob())
                        .then(blob => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = () => resolve(fullUrl);
                            reader.readAsDataURL(blob);
                        })
                        .catch(e => {
                            console.error('[图片下载] fetch 错误:', e);
                            resolve(fullUrl);
                        });
                }
            });
        };

        const MAX_IMAGE_WIDTH = 600;

        const getScaledImageSize = (base64Data) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const originalWidth = img.naturalWidth;
                    const originalHeight = img.naturalHeight;

                    if (originalWidth > MAX_IMAGE_WIDTH) {
                        const scale = MAX_IMAGE_WIDTH / originalWidth;
                        const newWidth = MAX_IMAGE_WIDTH;
                        const newHeight = Math.round(originalHeight * scale);
                        console.log(`[图片缩放] ${originalWidth}x${originalHeight} → ${newWidth}x${newHeight}`);
                        resolve({ width: newWidth, height: newHeight, scaled: true });
                    } else {
                        console.log(`[图片尺寸] ${originalWidth}x${originalHeight} (无需缩放)`);
                        resolve({ width: originalWidth, height: originalHeight, scaled: false });
                    }
                };
                img.onerror = () => {
                    console.warn('[图片尺寸] 无法获取尺寸');
                    resolve({ width: null, height: null, scaled: false });
                };
                img.src = base64Data;
            });
        };

        const processImagesInHtml = async (html) => {
            if (!html) return '';
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            const images = tempDiv.querySelectorAll('img');
            for (const img of images) {
                const originalSrc = img.getAttribute('data-original');
                const src = originalSrc || img.getAttribute('src');
                if (src) {
                    console.log('正在处理图片:', src);
                    const processedSrc = await downloadImageAsBase64(src);
                    img.setAttribute('src', processedSrc);
                    img.removeAttribute('data-original');
                    img.removeAttribute('data-src');

                    if (processedSrc.startsWith('data:')) {
                        const sizeInfo = await getScaledImageSize(processedSrc);

                        if (sizeInfo.scaled && sizeInfo.width && sizeInfo.height) {
                            img.setAttribute('width', sizeInfo.width);
                            img.setAttribute('height', sizeInfo.height);
                            img.style.width = `${sizeInfo.width}px`;
                            img.style.height = `${sizeInfo.height}px`;
                        }
                    } else {
                        console.warn('图片保留原URL:', processedSrc);
                        img.style.maxWidth = `${MAX_IMAGE_WIDTH}px`;
                        img.style.height = 'auto';
                    }
                }
            }

            return tempDiv.innerHTML;
        };

        const cleanHtml = (html) => {
            if (!html) return '';
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            const hiddenElements = tempDiv.querySelectorAll('.element-invisible-hidden');
            hiddenElements.forEach(el => el.remove());

            return tempDiv.innerHTML;
        };

        // 构建纯HTML格式文档（与docx使用相同的HTML结构和样式）
        let htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:w="urn:schemas-microsoft-com:office:word"
  xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word 15">
<!--[if gte mso 9]>
<xml>
    <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
</xml>
<![endif]-->
<style>
    /* 页面基础设置 */
    @page { 
        size: A4; 
        margin: ${exportSettings.pageMargin};
    }
    body { 
        font-family: '${exportSettings.fontFamily}', SimSun, serif; 
        font-size: ${exportSettings.fontSize}pt; 
        line-height: ${exportSettings.lineHeight};
        color: #333;
    }
    
    /* 文档标题 */
    .doc-title {
        text-align: center;
        font-size: ${exportSettings.titleFontSize}pt;
        font-weight: bold;
        margin-bottom: 30px;
        color: #000;
    }
    
    /* 题目容器（添加明显分隔线） */
    .question {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #2d3748;
        page-break-inside: avoid;
    }
    .question:last-child {
        border-bottom: none;
    }
    
    /* 题目标题（题号和分值） */
    .question-header {
        font-weight: bold;
        font-size: ${exportSettings.fontSize}pt;
        color: #000;
        margin-bottom: 10px;
        background-color: #f5f5f5;
        padding: 5px 10px;
    }
    
    /* 题目内容区域 */
    .question-content {
        margin: 10px 0;
    }
    .question-content img {
        max-width: 500px;
        height: auto;
    }
    
    /* 答案区域 */
    .answer-section {
        margin-top: 15px;
        padding: 10px;
        background-color: #fff8f8;
        border-left: 3px solid #e74c3c;
    }
    .answer-label {
        font-weight: bold;
        color: #e74c3c;
    }
    .answer-content {
        margin-top: 5px;
    }
    .answer-content img {
        max-width: 500px;
        height: auto;
    }
    
    /* ========== 保留原始网页样式 ========== */
    
    /* 题目名称样式 */
    .mark_name {
        font-weight: bold;
        margin-bottom: 10px;
    }
    .colorShallow {
        color: #999;
        font-weight: normal;
    }
    .colorDeep {
        color: #333;
    }
    .colorGreen {
        color: #48bb78;
    }
    
    /* 单选/多选题选项样式 */
    .mark_letter {
        list-style: none;
        padding: 0;
        margin: 10px 0;
    }
    .mark_letter li {
        padding: 8px 0;
        border-bottom: 1px dashed #e2e8f0;
    }
    .mark_letter li:last-child {
        border-bottom: none;
    }
    
    /* 完型填空选项样式 */
    .mark_gestalt {
        margin: 15px 0;
    }
    .gestalt_row {
        margin: 12px 0;
        padding: 8px 0;
        border-bottom: 1px dashed #e2e8f0;
    }
    .gestalt_row:last-child {
        border-bottom: none;
    }
    .gestalt_row dt {
        font-weight: bold;
        color: #2d3748;
        margin-bottom: 8px;
    }
    .gestalt_row dd {
        display: inline-block;
        margin: 4px 20px 4px 0;
    }
    .gestalt_num {
        font-weight: bold;
        margin-right: 5px;
    }
    
    /* 答案详情样式 */
    .mark_answer {
        padding: 10px;
        background: #f7fafc;
        border-radius: 4px;
    }
    .mark_key {
        margin-bottom: 10px;
    }
    .mark_fill dt {
        font-weight: bold;
    }
    .mark_fill dd {
        display: inline;
    }
    .gestalt_fill {
        display: inline-block;
        margin-right: 15px;
        padding: 2px 8px;
        background: #edf2f7;
        border-radius: 4px;
    }
    .mark_score {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #e2e8f0;
    }
    .totalScore {
        font-weight: bold;
        color: #e53e3e;
    }
    .fontWeight {
        font-weight: bold;
    }
    .marginRight40 {
        margin-right: 40px;
    }
    .fl {
        display: inline-block;
    }
    .fr {
        float: right;
    }
    .stuAnswerContent, .rightAnswerContent {
        font-weight: bold;
    }
    
    /* 表格样式 */
    table {
        border-collapse: collapse;
        width: 100%;
        margin: 10px 0;
    }
    td, th {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
    }
</style>
</head>
<body>
<div class="doc-title">${this._escapeHtml(content.docTitle)}</div>
`;

        // 处理每道题目
        for (const item of content.questions) {
            const processedQuestionHtml = await processImagesInHtml(cleanHtml(item.questionHTML || ''));

            htmlContent += `
<div class="question">
    <div class="question-header">${this._escapeHtml(item.title)}</div>
    <div class="question-content">${processedQuestionHtml}</div>`;

            if (includeAnswer && item.answerHTML) {
                const filteredAnswerHtml = filterAnswerHtml(item.answerHTML);
                if (filteredAnswerHtml.trim()) {
                    const processedAnswerHtml = await processImagesInHtml(cleanHtml(filteredAnswerHtml));
                    htmlContent += `
    <div class="answer-section">
        <div class="answer-label">答案</div>
        <div class="answer-content">${processedAnswerHtml}</div>
    </div>`;
                }
            }

            htmlContent += `
</div>
`;
        }

        htmlContent += `
</body>
</html>`;

        // 生成文件名（与docx使用相同的命名规则）
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        const safeTitle = content.docTitle.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);

        // 直接生成DOC格式（跳过html-docx-js转换）
        console.log('[导出] 生成 DOC 格式文件（手机版）');
        const blob = new Blob(['\ufeff' + htmlContent], {
            type: 'application/msword'
        });
        Logger.success('正在生成 DOC 文件（手机版）...');

        // 生成下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${safeTitle}_${dateStr}_${timeStr}.doc`;

        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    _handleManageClick() {
        const controlPanel = new ControlPanelUI(this.dbManager, this.workKey, this.config);
        controlPanel.show();
    }

    _handleGlobalToggle() {
        // 获取所有答案块元素
        const answerBlocks = document.querySelectorAll(this.config.get('selectors.answerBlock'));
        
        // 检查当前状态（只要有一个显示就算显示状态）
        const isAnyVisible = Array.from(answerBlocks).some(block => block.style.display !== 'none');
        
        // 切换所有答案块的显示状态
        answerBlocks.forEach(block => {
            block.style.display = isAnyVisible ? 'none' : '';
        });
        
        // 同步更新所有控制器的状态
        this.controllers.forEach(controller => {
            controller.isHidden = !isAnyVisible;
            controller._updateAnswerButtonState();
        });
        
        this._updateGlobalButtonState(!isAnyVisible);
    }

    _updateGlobalButtonState(allHidden) {
        const buttonText = this.config.get('globalButton.text');
        const colors = this.config.get('globalButton.colors');

        this.globalButton.innerText = allHidden ? buttonText.showAll : buttonText.hideAll;
        this.globalButton.style.background = allHidden ? colors.showAllBackground : colors.hideAllBackground;
    }
}


// 导出供其他模块使用
window.GlobalController = GlobalController;
