// ==UserScript==
// @name         Button Controller Module - 按钮控制模块
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  超星学习通作业答案隐藏工具 - 按钮控制模块
// @author       You
// @license      MIT
// @require      https://raw.githubusercontent.com/Grenz1inie/remove-chaoxing-paper-answer/main/modules/config.js
// @require      https://raw.githubusercontent.com/Grenz1inie/remove-chaoxing-paper-answer/main/modules/dom-handler.js
// @require      https://raw.githubusercontent.com/Grenz1inie/remove-chaoxing-paper-answer/main/modules/ui.js
// ==/UserScript==

/**
 * 按钮控制模块
 * 负责按钮的事件处理和逻辑控制
 */
const ButtonController = {
    /**
     * 创建单个答案块的恢复按钮处理器
     * @param {Object} blockInfo - 答案块信息
     * @returns {Function} 点击事件处理函数
     */
    createSingleButtonHandler(blockInfo) {
        return function() {
            const button = this;
            const isDeleted = button.dataset.isDeleted === 'true';
            
            if (isDeleted) {
                // 恢复元素
                window.DomHandler.restoreAnswerBlock(blockInfo);
                button.dataset.isDeleted = 'false';
                window.UIModule.updateButtonState(button, false);
            } else {
                // 删除元素
                const currentBlock = blockInfo.parent.querySelector(window.ChaoxingConfig.selectors.answerBlocks);
                if (currentBlock) {
                    blockInfo.parent.removeChild(currentBlock);
                    button.dataset.isDeleted = 'true';
                    window.UIModule.updateButtonState(button, true);
                }
            }
        };
    },

    /**
     * 创建全局按钮的处理器
     * @returns {Function} 点击事件处理函数
     */
    createGlobalButtonHandler() {
        return function() {
            const button = this;
            const isAllDeleted = button.innerText === '显示全部答案';
            const restoreButtons = window.DomHandler.getRestoreButtons();

            restoreButtons.forEach(btn => {
                const isDeleted = btn.dataset.isDeleted === 'true';
                if (isAllDeleted && isDeleted) {
                    btn.click();
                } else if (!isAllDeleted && !isDeleted) {
                    btn.click();
                }
            });

            window.UIModule.updateButtonState(button, !isAllDeleted, true);
        };
    },

    /**
     * 初始化单个答案块的控制
     * @param {HTMLElement} block - 答案块元素
     */
    initializeSingleBlock(block) {
        // 删除答案块并获取信息
        const blockInfo = window.DomHandler.removeAnswerBlock(block);
        
        // 创建恢复按钮
        const handler = this.createSingleButtonHandler(blockInfo);
        const restoreButton = window.UIModule.createRestoreButton(handler);
        
        // 设置按钮数据
        restoreButton.dataset.originalHtml = blockInfo.originalHtml;
        restoreButton.dataset.isDeleted = 'true';
        
        // 插入按钮
        window.DomHandler.insertButton(restoreButton, blockInfo.parent, blockInfo.nextSibling);
        
        return restoreButton;
    },

    /**
     * 初始化全局控制按钮
     * @param {HTMLElement} container - 容器元素
     */
    initializeGlobalButton(container) {
        // 确保容器有相对定位
        window.DomHandler.ensureRelativePosition(container);
        
        // 创建全局按钮
        const handler = this.createGlobalButtonHandler();
        const globalButton = window.UIModule.createGlobalButton(handler);
        
        // 添加到容器
        container.appendChild(globalButton);
        
        return globalButton;
    }
};

// 导出按钮控制器对象
if (typeof window !== 'undefined') {
    window.ButtonController = ButtonController;
}
