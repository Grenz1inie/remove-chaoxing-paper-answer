// ==UserScript==
// @name         DOM Handler Module - DOM操作模块
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  超星学习通作业答案隐藏工具 - DOM操作模块
// @author       You
// @license      MIT
// @require      https://raw.githubusercontent.com/Grenz1inie/remove-chaoxing-paper-answer/main/modules/config.js
// ==/UserScript==

/**
 * DOM操作模块
 * 负责查找和操作DOM元素
 */
const DomHandler = {
    /**
     * 获取题目容器
     * @returns {HTMLElement|null}
     */
    getTopicContainer() {
        return document.querySelector(window.ChaoxingConfig.selectors.topicNumberContainer);
    },

    /**
     * 获取所有答案块
     * @returns {NodeList}
     */
    getAnswerBlocks() {
        return document.querySelectorAll(window.ChaoxingConfig.selectors.answerBlocks);
    },

    /**
     * 删除答案块并返回相关信息
     * @param {HTMLElement} block - 答案块元素
     * @returns {Object} 包含parent, nextSibling, originalHtml的对象
     */
    removeAnswerBlock(block) {
        const parent = block.parentNode;
        const nextSibling = block.nextSibling;
        const originalHtml = block.outerHTML;
        
        parent.removeChild(block);
        
        return {
            parent,
            nextSibling,
            originalHtml
        };
    },

    /**
     * 恢复答案块
     * @param {Object} info - 包含parent, nextSibling, originalHtml的对象
     * @returns {HTMLElement} 恢复的答案块元素
     */
    restoreAnswerBlock(info) {
        const { parent, nextSibling, originalHtml } = info;
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = originalHtml;
        const restoredBlock = tempContainer.firstChild;
        
        if (nextSibling) {
            parent.insertBefore(restoredBlock, nextSibling);
        } else {
            parent.appendChild(restoredBlock);
        }
        
        return restoredBlock;
    },

    /**
     * 在指定位置插入按钮
     * @param {HTMLElement} button - 按钮元素
     * @param {HTMLElement} parent - 父元素
     * @param {HTMLElement|null} nextSibling - 下一个兄弟元素
     */
    insertButton(button, parent, nextSibling) {
        if (nextSibling) {
            parent.insertBefore(button, nextSibling);
        } else {
            parent.appendChild(button);
        }
    },

    /**
     * 确保容器有相对定位
     * @param {HTMLElement} container - 容器元素
     */
    ensureRelativePosition(container) {
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
            container.dataset.originalPosition = 'static';
        }
    },

    /**
     * 查找所有恢复按钮
     * @returns {NodeList}
     */
    getRestoreButtons() {
        return document.querySelectorAll('button[title*="显示当前答案块"]');
    }
};

// 导出DOM处理器对象
if (typeof window !== 'undefined') {
    window.DomHandler = DomHandler;
}
