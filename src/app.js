/**
 * ChaoxingAnswerHider - 主应用类
 * 超星学习通答案助手的核心应用类
 * @version 3.12.0.7
 */
class ChaoxingAnswerHider {
    constructor(customConfig = {}) {
        this.config = new Config(customConfig);
        this.styleGenerator = new StyleGenerator(this.config);
        this.dbManager = new DatabaseManager(this.config);
        this.answerControllers = [];
        this.globalController = null;
        this.workKey = URLParser.getWorkKey();
        this.doubaoTabRef = null; // 存储豆包AI标签页的引用
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
                this.workKey,
                this  // 传递应用实例引用
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

// 导出供其他模块使用
window.ChaoxingAnswerHider = ChaoxingAnswerHider;
