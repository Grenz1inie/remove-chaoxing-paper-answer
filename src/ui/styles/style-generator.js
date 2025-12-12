/**
 * StyleGenerator - 样式生成器
 * 负责生成各种按钮和UI组件的样式
 * @version 3.12.0
 */
class StyleGenerator {
    constructor(config) {
        this.config = config;
    }

    // ========== 通用按钮样式生成方法 ==========

    /**
     * 生成内联按钮样式（答案、笔记、保存、编辑等按钮）
     * @param {string} configKey - 配置键名（如 'answerButton', 'noteButton'）
     * @param {string} bgColorKey - 背景色配置键名
     * @returns {Object} 样式对象
     */
    _getInlineButtonStyle(configKey, bgColorKey) {
        const position = this.config.get(`${configKey}.position`);
        const style = this.config.get(`${configKey}.style`);
        const colors = this.config.get(`${configKey}.colors`);

        const result = {
            marginLeft: position.marginLeft,
            marginRight: position.marginRight,
            marginTop: position.marginTop,
            marginBottom: position.marginBottom,
            verticalAlign: position.verticalAlign,
            padding: style.padding,
            border: style.border,
            borderRadius: style.borderRadius,
            background: colors[bgColorKey],
            color: colors.textColor,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            cursor: style.cursor,
            transition: style.transition,
            boxShadow: style.boxShadow,
            display: 'inline-block'
        };

        // 可选属性：minWidth 和 textAlign
        if (style.minWidth) {
            result.minWidth = style.minWidth;
        }
        if (style.textAlign) {
            result.textAlign = style.textAlign;
        }

        return result;
    }

    /**
     * 生成浮动按钮样式（全局、控制面板按钮）
     * @param {string} configKey - 配置键名
     * @param {string} bgColorKey - 背景色配置键名
     * @returns {Object} 样式对象
     */
    _getFloatingButtonStyle(configKey, bgColorKey) {
        const style = this.config.get(`${configKey}.style`);
        const colors = this.config.get(`${configKey}.colors`);

        return {
            display: 'inline-block',
            whiteSpace: 'nowrap',
            border: style.border,
            borderRadius: style.borderRadius,
            padding: style.padding,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            color: colors.textColor,
            cursor: style.cursor,
            transition: style.transition,
            boxShadow: style.boxShadow,
            background: colors[bgColorKey]
        };
    }

    // ========== 具体按钮样式获取方法 ==========

    getCopyButtonStyle() {
        const position = this.config.get('copyButton.position');
        const style = this.config.get('copyButton.style');
        const colors = this.config.get('copyButton.colors');

        return {
            position: 'absolute',
            top: position.top,
            right: position.right,
            zIndex: '100',
            fontSize: style.fontSize,
            padding: style.padding,
            borderRadius: style.borderRadius,
            border: style.border,
            fontWeight: style.fontWeight,
            cursor: style.cursor,
            transition: style.transition,
            boxShadow: style.boxShadow,
            minWidth: style.minWidth,
            textAlign: style.textAlign,
            background: colors.background,
            color: colors.textColor
        };
    }

    getAskDoubaoButtonStyle() {
        const position = this.config.get('askDoubaoButton.position');
        const style = this.config.get('askDoubaoButton.style');
        const colors = this.config.get('askDoubaoButton.colors');

        return {
            position: 'absolute',
            top: position.top,
            right: position.right,
            zIndex: '100',
            fontSize: style.fontSize,
            padding: style.padding,
            borderRadius: style.borderRadius,
            border: style.border,
            fontWeight: style.fontWeight,
            cursor: style.cursor,
            transition: style.transition,
            boxShadow: style.boxShadow,
            minWidth: style.minWidth,
            textAlign: style.textAlign,
            background: colors.background,
            color: colors.textColor
        };
    }

    getAnswerButtonStyle(isHidden = true) {
        return this._getInlineButtonStyle('answerButton', isHidden ? 'showBackground' : 'hideBackground');
    }

    getNoteButtonStyle(isVisible = false) {
        return this._getInlineButtonStyle('noteButton', isVisible ? 'hideBackground' : 'showBackground');
    }

    getSaveNoteButtonStyle() {
        return this._getInlineButtonStyle('saveNoteButton', 'background');
    }

    getMistakeButtonStyle() {
        const config = this.config.get('mistakeButton');
        const style = config.style;
        const colors = config.colors;

        return {
            ...style,
            backgroundColor: colors.background,
            color: colors.textColor
        };
    }

    getEditModeButtonStyle(isEditMode = false) {
        return this._getInlineButtonStyle('editModeButton', isEditMode ? 'previewBackground' : 'editBackground');
    }

    getGlobalButtonStyle(isHidden = true) {
        return this._getFloatingButtonStyle('globalButton', isHidden ? 'showAllBackground' : 'hideAllBackground');
    }

    getManageButtonStyle() {
        return this._getFloatingButtonStyle('manageButton', 'background');
    }

    getExportButtonStyle() {
        return this._getFloatingButtonStyle('exportButton', 'background');
    }

    // ========== 悬停效果管理 ==========

    /**
     * 为按钮添加统一的悬停动画效果
     * @param {HTMLElement} button - 按钮元素
     * @param {Object} options - 配置选项
     * @param {Function} options.getHoverBg - 获取悬停背景色的函数
     * @param {Function} options.getNormalBg - 获取正常背景色的函数
     */
    addHoverEffect(button, options) {
        const { getHoverBg, getNormalBg } = options;

        // 缓存进入时的背景色，确保离开时恢复到正确的颜色
        let cachedBgColor = null;

        button.addEventListener('mouseenter', () => {
            // 进入时缓存当前背景色（而不是调用getNormalBg，因为状态可能在hover期间改变）
            cachedBgColor = button.style.backgroundColor || getNormalBg();
            button.style.backgroundColor = getHoverBg();
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
        });

        button.addEventListener('mouseleave', () => {
            // 恢复到进入时缓存的背景色
            button.style.backgroundColor = cachedBgColor || getNormalBg();
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });
    }

    /**
     * 为双状态按钮添加悬停效果（如显示/隐藏按钮）
     * @param {HTMLElement} button - 按钮元素
     * @param {string} configKey - 配置键名
     * @param {Function} getState - 获取当前状态的函数
     * @param {string} trueHoverKey - 状态为true时的悬停色配置键
     * @param {string} falseHoverKey - 状态为false时的悬停色配置键
     * @param {string} trueBgKey - 状态为true时的背景色配置键
     * @param {string} falseBgKey - 状态为false时的背景色配置键
     */
    addToggleHoverEffect(button, configKey, getState, trueHoverKey, falseHoverKey, trueBgKey, falseBgKey) {
        const colors = this.config.get(`${configKey}.colors`);

        this.addHoverEffect(button, {
            getHoverBg: () => getState() ? colors[trueHoverKey] : colors[falseHoverKey],
            getNormalBg: () => getState() ? colors[trueBgKey] : colors[falseBgKey]
        });
    }

    /**
     * 为单状态按钮添加悬停效果
     * @param {HTMLElement} button - 按钮元素
     * @param {string} configKey - 配置键名
     */
    addSimpleHoverEffect(button, configKey) {
        const colors = this.config.get(`${configKey}.colors`);

        this.addHoverEffect(button, {
            getHoverBg: () => colors.hoverBackground,
            getNormalBg: () => colors.background
        });
    }

    /**
     * 为按钮添加悬停动画效果（不改变背景色）
     * @param {HTMLElement} button - 按钮元素
     */
    addNoColorChangeHoverEffect(button) {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        });
    }

    // ========== 笔记编辑器样式 ==========

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
}

// 导出供其他模块使用
window.StyleGenerator = StyleGenerator;
