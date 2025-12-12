// ==UserScript==
// @name         （开发版）超星学习通期末周复习小助手
// @namespace    http://tampermonkey.net/
// @version      3.12.0.5
// @description  这是一款面向学习场景的脚本工具，其集成了支持提示词定制的智能 AI 助手模块，通过 Web 自动化技术实现跨域提问（区别于传统模型 API 调用或题库检索方式）；同时提供答案动态显隐控制功能，适配多轮刷题需求；内置错题星级标记系统，基于错误频次实现重点内容优先级管理；搭载本地持久化存储的富文本笔记组件，支持知识点与解析的实时记录与安全留存；具备可配置化作业题目导出能力，支持得分、答案、解析等字段的自定义筛选，可快速生成结构化刷题集或背题手册；此外，工具还提供可视化控制面板作为配置入口，支持对上述全功能模块的参数与逻辑进行深度个性化定制，为高效学习与复习流程提供技术支撑。
// @author       YJohn
// @match        https://*.chaoxing.com/mooc-ans/mooc2/work/view*
// @match        https://www.doubao.com/chat/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chaoxing.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_openInTab
// @connect      p.ananas.chaoxing.com
// @connect      chaoxing.com
// @connect      *.chaoxing.com
// @connect      doubao.com
// @connect      *.doubao.com
// @connect      *
// @require      https://cdn.jsdelivr.net/npm/html-docx-js@0.3.1/dist/html-docx.min.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@750acec/config.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@750acec/src/core/logger.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@750acec/src/core/url-parser.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@750acec/src/core/database-manager.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@750acec/src/ui/styles/style-generator.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@750acec/src/ui/components/dom-helper.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@750acec/src/ui/components/note-editor.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@750acec/src/ui/components/control-panel.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@750acec/src/controllers/answer-block-controller.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@750acec/src/controllers/global-controller.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@750acec/src/app.js
// @run-at       document-end
// @license MIT
// @downloadURL https://update.greasyfork.org/scripts/555192/%E8%B6%85%E6%98%9F%E5%AD%A6%E4%B9%A0%E9%80%9A%E9%AB%98%E6%95%88%E5%88%B7%E9%A2%98%E5%B0%8F%E5%8A%A9%E6%89%8B.user.js
// @updateURL https://update.greasyfork.org/scripts/555192/%E8%B6%85%E6%98%9F%E5%AD%A6%E4%B9%A0%E9%80%9A%E9%AB%98%E6%95%88%E5%88%B7%E9%A2%98%E5%B0%8F%E5%8A%A9%E6%89%8B.meta.js
// ==/UserScript==

/**
 * 超星学习通期末周复习小助手
 * 模块化架构版本 v3.12.0
 * 
 * 模块结构：
 * ├── config.js                    - 配置管理模块
 * ├── src/
 * │   ├── core/
 * │   │   ├── logger.js            - 日志工具类
 * │   │   ├── url-parser.js        - URL解析工具类
 * │   │   └── database-manager.js  - IndexedDB数据库管理器
 * │   ├── ui/
 * │   │   ├── styles/
 * │   │   │   └── style-generator.js  - 样式生成器
 * │   │   └── components/
 * │   │       ├── dom-helper.js       - DOM操作辅助类
 * │   │       ├── note-editor.js      - 富文本笔记编辑器
 * │   │       └── control-panel.js    - 控制面板UI组件
 * │   ├── controllers/
 * │   │   ├── answer-block-controller.js  - 答案块控制器
 * │   │   └── global-controller.js        - 全局控制器
 * │   └── app.js                   - 主应用类
 * └── main.user.js                 - 入口文件（当前文件）
 */

(function () {
    'use strict';

    // ===================== 启动应用 =====================
    // 检测当前页面是超星还是豆包
    if (window.location.hostname.includes('doubao.com')) {
        // ===================== 豆包AI页面逻辑 =====================
        Logger.log('检测到豆包AI页面，正在初始化自动填充功能...');

        /**
         * 检测是否为移动端设备
         * @returns {boolean} true表示移动端，false表示桌面端
         */
        function isMobileDevice() {
            return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        }

        /**
         * 豆包AI自动发送逻辑（读取完整内容并填充）
         * 固定等待1.5秒确保页面加载完成
         */
        async function autoSendMessage() {
            const storageKey = 'chaoxing_doubao_question';

            try {
                // 读取内容
                const fullContent = GM_getValue(storageKey, '');
                console.log('🔍 读取GM存储的完整内容：');
                console.log('  内容预览:', fullContent ? `${fullContent.substring(0, 100)}...` : '(空)');
                console.log('  内容长度:', fullContent.length);

                if (!fullContent) {
                    Logger.warn('未找到待提问的题目内容');
                    GM_deleteValue(storageKey);
                    return;
                }

                Logger.log('找到待提问题目，准备自动填充和发送...');

                // 强制固定等待1.5秒，确保页面完全加载
                Logger.log('⏱️ 等待 1.5 秒确保页面加载...');
                await new Promise(resolve => setTimeout(resolve, 1500));

                // 直接获取元素
                const inputElem = document.querySelector('textarea[data-testid="chat_input_input"]');
                const sendBtn = document.querySelector('button[data-testid="chat_input_send_button"]');

                if (!inputElem || !sendBtn) {
                    throw new Error('等待1.5秒后仍未找到输入框或发送按钮');
                }

                Logger.log('✅ 已获取输入框和发送按钮');

                // 聚焦输入框
                inputElem.click();
                inputElem.focus();

                // 解锁输入逻辑
                document.execCommand('insertText', false, ' ');
                inputElem.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                inputElem.select();
                document.execCommand('backspace');

                // 输入内容
                document.execCommand('insertText', false, fullContent);
                inputElem.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

                Logger.success('题目已填充到输入框');
                console.log('输入框内容:', inputElem.value.substring(0, 100) + '...');

                // 额外等待一小段时间，确保输入完全处理
                await new Promise(resolve => setTimeout(resolve, 300));

                // 使用 Enter 键发送
                inputElem.dispatchEvent(new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    key: 'Enter',
                    code: 'Enter',
                    which: 13,
                    keyCode: 13
                }));

                inputElem.dispatchEvent(new KeyboardEvent('keyup', {
                    bubbles: true,
                    cancelable: true,
                    key: 'Enter',
                    code: 'Enter',
                    which: 13,
                    keyCode: 13
                }));

                Logger.success('已自动发送题目到豆包AI');
                console.log('已模拟按下 Enter 键发送');

            } catch (error) {
                Logger.error('豆包AI自动填充失败', error);
                console.error('详细错误:', error.message);
            } finally {
                // 清除缓存
                try {
                    GM_deleteValue(storageKey);
                    console.log('已清除本地缓存');
                } catch (e) {
                    console.warn('清除缓存失败（可忽略）:', e);
                }
            }
        }

        // 页面加载完成后自动执行一次（包裹在try-catch中防止崩溃）
        try {
            autoSendMessage();
            Logger.log('✅ 豆包AI自动填充功能已启动');
        } catch (error) {
            console.error('❌ 豆包AI自动填充启动失败:', error);
            // 即使失败也不影响页面使用
        }

    } else {
        // ===================== 超星学习通页面逻辑 =====================
        const app = new ChaoxingAnswerHider();
        app.initialize();
    }
})();
