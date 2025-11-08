// ==UserScript==
// @name         UI Module - UI模块
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  超星学习通作业答案隐藏工具 - UI模块
// @author       You
// @license      MIT
// @require      https://raw.githubusercontent.com/Grenz1inie/remove-chaoxing-paper-answer/main/modules/config.js
// ==/UserScript==

/**
 * UI模块
 * 负责创建和管理界面元素
 */
const UIModule = {
    /**
     * 生成单个恢复按钮的样式
     * @returns {string} CSS样式字符串
     */
    getSingleButtonStyle() {
        const config = window.ChaoxingConfig;
        return `
            margin-left: ${config.btnPosition.marginLeft};
            margin-right: ${config.btnPosition.marginRight};
            margin-top: ${config.btnPosition.marginTop};
            margin-bottom: ${config.btnPosition.marginBottom};
            vertical-align: ${config.btnPosition.verticalAlign};
            padding: 2px 8px;
            border: none;
            border-radius: 3px;
            background: ${config.btnStyle.primaryColor};
            color: white;
            font-size: 12px;
            cursor: pointer;
            transition: background 0.2s;
            display: inline-block;
        `;
    },

    /**
     * 生成全局按钮的样式
     * @returns {string} CSS样式字符串
     */
    getGlobalButtonStyle() {
        const config = window.ChaoxingConfig;
        return `
            position: absolute;
            top: 8px;
            right: 8px;
            border: none;
            border-radius: ${config.btnStyle.borderRadius};
            padding: ${config.btnStyle.padding};
            font-size: ${config.btnStyle.fontSize};
            color: white;
            cursor: pointer;
            transition: background 0.2s;
            z-index: 9999;
            background: ${config.btnStyle.primaryColor};
        `;
    },

    /**
     * 创建单个恢复按钮
     * @param {Function} clickHandler - 点击事件处理函数
     * @returns {HTMLElement} 按钮元素
     */
    createRestoreButton(clickHandler) {
        const button = document.createElement('button');
        button.innerText = '显示答案';
        button.style = this.getSingleButtonStyle();
        button.title = '点击显示当前答案块';
        button.addEventListener('click', clickHandler);
        return button;
    },

    /**
     * 创建全局控制按钮
     * @param {Function} clickHandler - 点击事件处理函数
     * @returns {HTMLElement} 按钮元素
     */
    createGlobalButton(clickHandler) {
        const button = document.createElement('button');
        button.innerText = '显示全部答案';
        button.style = this.getGlobalButtonStyle();
        button.title = '点击一键显示/隐藏所有答案块';
        button.addEventListener('click', clickHandler);
        return button;
    },

    /**
     * 更新按钮状态（显示/隐藏）
     * @param {HTMLElement} button - 按钮元素
     * @param {boolean} isDeleted - 是否为删除状态
     * @param {boolean} isGlobal - 是否为全局按钮
     */
    updateButtonState(button, isDeleted, isGlobal = false) {
        const config = window.ChaoxingConfig;
        if (isGlobal) {
            button.innerText = isDeleted ? '显示全部答案' : '隐藏全部答案';
        } else {
            button.innerText = isDeleted ? '显示答案' : '隐藏答案';
        }
        button.style.background = isDeleted ? config.btnStyle.primaryColor : config.btnStyle.secondaryColor;
    },

    /**
     * 日志输出
     * @param {string} message - 日志消息
     * @param {string} type - 日志类型 (info/success/error)
     */
    log(message, type = 'info') {
        const config = window.ChaoxingConfig;
        if (!config.logging.enabled) return;

        const prefix = config.logging.prefix;
        const icons = {
            info: 'ℹ️',
            success: '✅',
            error: '❌'
        };
        const icon = icons[type] || icons.info;
        console.log(`${icon} ${prefix} ${message}`);
    }
};

// 导出UI模块对象
if (typeof window !== 'undefined') {
    window.UIModule = UIModule;
}
