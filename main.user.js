// ==UserScript==
// @name         隐藏/显示超星学习通作业答案
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  一键隐藏超星学习通作业页面中所有 div.mark_answer 答案块，支持单个控制和全局控制。采用模块化设计，代码结构清晰易维护。
// @author       You
// @match        https://*.chaoxing.com/mooc-ans/mooc2/work/view*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chaoxing.com
// @grant        none
// @run-at       document-end
// @license      MIT
// @require      https://raw.githubusercontent.com/Grenz1inie/remove-chaoxing-paper-answer/main/modules/config.js
// @require      https://raw.githubusercontent.com/Grenz1inie/remove-chaoxing-paper-answer/main/modules/dom-handler.js
// @require      https://raw.githubusercontent.com/Grenz1inie/remove-chaoxing-paper-answer/main/modules/ui.js
// @require      https://raw.githubusercontent.com/Grenz1inie/remove-chaoxing-paper-answer/main/modules/button-controller.js
// ==/UserScript==

(function() {
    'use strict';

    /**
     * 主初始化函数
     */
    function initialize() {
        const topicContainer = window.DomHandler.getTopicContainer();
        const answerBlocks = window.DomHandler.getAnswerBlocks();

        // 检查是否找到答案块
        if (answerBlocks.length === 0) {
            window.UIModule.log('未找到 class="mark_answer" 的答案块（可能页面未完全加载，可刷新重试）', 'info');
            return;
        }

        // 检查题目容器
        if (!topicContainer) {
            window.UIModule.log('未找到 class="topicNumber" 模块，仅启用单个答案块隐藏功能', 'info');
        }

        // 初始化所有答案块的控制按钮
        answerBlocks.forEach(block => {
            window.ButtonController.initializeSingleBlock(block);
        });

        // 如果找到题目容器，添加全局控制按钮
        if (topicContainer) {
            window.ButtonController.initializeGlobalButton(topicContainer);
        }

        // 输出完成日志
        window.UIModule.log('超星作业答案块隐藏工具执行完成！', 'success');
        window.UIModule.log(`已隐藏 ${answerBlocks.length} 个答案内容块，每个块已添加独立显示按钮`, 'info');
        window.UIModule.log(
            topicContainer 
                ? '已在 topicNumber 右上角添加全局控制按钮' 
                : '未找到 topicNumber 模块，未添加全局按钮',
            'info'
        );
    }

    // 延迟执行以确保页面加载完成
    setTimeout(initialize, window.ChaoxingConfig.executionDelay);
})();