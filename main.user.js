// ==UserScript==
// @name         （开发版）超星学习通期末周复习小助手
// @namespace    http://tampermonkey.net/
// @version      3.13.1
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
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@94fdb49/config.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@94fdb49/src/core/logger.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@94fdb49/src/core/url-parser.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@94fdb49/src/core/database-manager.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@94fdb49/src/ui/styles/style-generator.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@94fdb49/src/ui/components/dom-helper.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@94fdb49/src/ui/components/note-editor.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@94fdb49/src/ui/components/control-panel.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@94fdb49/src/controllers/answer-block-controller.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@94fdb49/src/controllers/global-controller.js
// @require      https://cdn.jsdelivr.net/gh/Grenz1inie/remove-chaoxing-paper-answer@94fdb49/src/app.js
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
        Logger.log('检测到豆包AI页面，正在初始化自动填充功能（支持文字+多图）...');

        const DOUBAO_CONFIG = {
            inputSelector: 'textarea[data-testid="chat_input_input"]',
            sendBtnSelector: '#flow-end-msg-send',
            waitTimeout: 10000,
            pollInterval: 100,
            chunkSize: 2 * 1024 * 1024
        };

        /**
         * 读取混合内容（文字+多图）
         */
        function readMixedContent() {
            console.log('[分片读取] 开始读取混合内容');
            const meta = GM_getValue('chaoxing_doubao_meta', null);
            if (!meta) {
                console.log('[分片读取] 未找到元信息');
                return null;
            }

            const result = {
                text: meta.text || '',
                hasText: meta.hasText,
                hasImage: meta.hasImage,
                imageCount: meta.imageCount,
                images: []
            };

            // 读取每张图片的分片
            if (meta.hasImage && meta.images && meta.images.length > 0) {
                for (let imgIndex = 0; imgIndex < meta.images.length; imgIndex++) {
                    const imgMeta = meta.images[imgIndex];
                    let fullBase64 = '';

                    // 拼接该图片的所有分片
                    for (let i = 0; i < imgMeta.totalChunks; i++) {
                        const chunk = GM_getValue(`chaoxing_doubao_img${imgIndex}_chunk_${i}`, '');
                        if (!chunk) {
                            console.error(`[分片读取] 图片${imgIndex} 分片${i}为空`);
                            throw new Error(`图片${imgIndex} 分片${i}为空`);
                        }
                        fullBase64 += chunk;
                    }

                    if (fullBase64.length !== imgMeta.totalLen) {
                        console.error(`[分片读取] 图片${imgIndex} 拼接异常`);
                        throw new Error(`图片${imgIndex} 拼接异常`);
                    }

                    result.images.push({
                        base64: fullBase64,
                        type: imgMeta.type,
                        name: imgMeta.name
                    });

                    console.log(`[分片读取] 图片${imgIndex + 1}/${meta.images.length} 读取完成`);
                }
            }

            console.log(`[分片读取] 混合内容读取完成：文字=${result.hasText}, 图片=${result.imageCount}张`);
            return result;
        }

        /**
         * 清理混合内容缓存
         */
        function clearMixedContent() {
            console.log('[分片清理] 开始清理混合内容');
            const meta = GM_getValue('chaoxing_doubao_meta', null);
            if (meta && meta.hasImage && meta.images) {
                for (let imgIndex = 0; imgIndex < meta.images.length; imgIndex++) {
                    const imgMeta = meta.images[imgIndex];
                    for (let i = 0; i < imgMeta.totalChunks; i++) {
                        GM_deleteValue(`chaoxing_doubao_img${imgIndex}_chunk_${i}`);
                    }
                }
            }
            GM_deleteValue('chaoxing_doubao_meta');
            console.log('[分片清理] 清理完成');
        }

        /**
         * Base64转File对象
         */
        function base64ToFile(base64, name, type) {
            const pure = base64.split(',')[1];
            const bytes = atob(pure);
            const buf = new ArrayBuffer(bytes.length);
            const uint8 = new Uint8Array(buf);
            for (let i = 0; i < bytes.length; i++) {
                uint8[i] = bytes.charCodeAt(i);
            }
            return new File([buf], name, { type: type });
        }

        /**
         * 解锁输入框（模拟人工聚焦+初始输入，激活发送逻辑）
         */
        function unlockInputBox(inputElem) {
            console.log('[输入框解锁] 开始解锁输入框');
            inputElem.click();
            inputElem.focus();
            // 输入空字符触发初始状态（模拟手动输入），再清空
            document.execCommand('insertText', false, ' ');
            inputElem.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            inputElem.select();
            document.execCommand('backspace');
            console.log('[输入框解锁] 解锁完成');
        }

        /**
         * 输入文字到输入框（使用temp3.txt的正确逻辑）
         */
        function inputTextToInput(inputElem, text) {
            console.log('[文字输入] 开始输入文字');
            return new Promise(resolve => {
                // 使用document.execCommand确保内容不被清空
                document.execCommand('insertText', false, text);
                inputElem.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                console.log('[文字输入] 文字输入完成');
                setTimeout(resolve, 300);
            });
        }

        /**
         * 粘贴图片到输入框
         */
        function pasteImageToInput(file) {
            console.log('[图片粘贴] 开始粘贴图片');
            return new Promise(resolve => {
                const input = document.querySelector(DOUBAO_CONFIG.inputSelector);
                if (!input) {
                    throw new Error('未找到输入框');
                }

                const dt = new DataTransfer();
                dt.items.add(file);

                const pasteEvent = new ClipboardEvent('paste', {
                    bubbles: true,
                    cancelable: true,
                    clipboardData: dt
                });

                input.focus();
                input.dispatchEvent(pasteEvent);
                console.log('[图片粘贴] 粘贴完成');
                resolve();
            });
        }

        /**
         * 检查发送按钮是否可用
         */
        function isSendBtnEnabled() {
            const btn = document.querySelector(DOUBAO_CONFIG.sendBtnSelector);
            if (!btn) return false;
            const ariaDisabled = btn.getAttribute('aria-disabled') === 'true';
            return !ariaDisabled;
        }

        /**
         * 轮询等待发送按钮可用
         */
        function waitSendBtnWithPolling() {
            return new Promise(resolve => {
                console.log(`[轮询检测] 开始轮询，间隔=${DOUBAO_CONFIG.pollInterval}ms，超时=${DOUBAO_CONFIG.waitTimeout}ms`);
                
                // 立即检查一次
                if (isSendBtnEnabled()) {
                    console.log('[轮询检测] 按钮已可用');
                    return resolve(true);
                }

                let pollCount = 0;
                const pollTimer = setInterval(() => {
                    pollCount++;
                    if (isSendBtnEnabled()) {
                        clearInterval(pollTimer);
                        clearTimeout(timeoutTimer);
                        console.log(`[轮询检测] 第${pollCount}次检测成功，按钮可用`);
                        resolve(true);
                    }
                }, DOUBAO_CONFIG.pollInterval);

                const timeoutTimer = setTimeout(() => {
                    clearInterval(pollTimer);
                    console.log(`[轮询检测] 超时，共轮询${pollCount}次`);
                    resolve(false);
                }, DOUBAO_CONFIG.waitTimeout);
            });
        }

        /**
         * 豆包AI自动发送逻辑（支持纯文字/纯图片/混合场景）
         */
        async function autoSendMessage() {
            try {
                // 等待页面加载
                Logger.log('⏱️ 等待1.5秒确保页面加载...');
                await new Promise(resolve => setTimeout(resolve, 1500));

                // 读取混合内容
                const mixedContent = readMixedContent();
                if (!mixedContent || (!mixedContent.hasText && !mixedContent.hasImage)) {
                    Logger.warn('未找到待提问的内容');
                    clearMixedContent();
                    return;
                }

                // 检查输入框
                const inputElem = document.querySelector(DOUBAO_CONFIG.inputSelector);
                if (!inputElem) {
                    throw new Error('未找到输入框');
                }

                // 判断场景类型
                const isTextOnly = mixedContent.hasText && !mixedContent.hasImage;
                const isImageOnly = !mixedContent.hasText && mixedContent.hasImage;
                const isMixed = mixedContent.hasText && mixedContent.hasImage;

                if (isTextOnly) {
                    Logger.log('📝 检测到纯文字场景');
                } else if (isImageOnly) {
                    Logger.log('🖼️ 检测到纯图片场景');
                } else if (isMixed) {
                    Logger.log('🎨 检测到混合内容场景（文字+图片）');
                }

                // 所有场景都需要先解锁输入框
                unlockInputBox(inputElem);

                // 场景1: 纯文字
                if (isTextOnly) {
                    await inputTextToInput(inputElem, mixedContent.text);
                    Logger.success('✅ 纯文字已输入');
                }
                // 场景2: 纯图片
                else if (isImageOnly) {
                    for (let i = 0; i < mixedContent.images.length; i++) {
                        const imgData = mixedContent.images[i];
                        const file = base64ToFile(imgData.base64, imgData.name, imgData.type);
                        await pasteImageToInput(file);
                        Logger.success(`✅ 图片${i + 1}/${mixedContent.imageCount} 已粘贴`);
                    }
                }
                // 场景3: 混合内容（文字 + 图片）
                else if (isMixed) {
                    // 先输入文字
                    await inputTextToInput(inputElem, mixedContent.text);
                    Logger.success('✅ 文字已输入');
                    
                    // 再依次粘贴所有图片
                    for (let i = 0; i < mixedContent.images.length; i++) {
                        const imgData = mixedContent.images[i];
                        const file = base64ToFile(imgData.base64, imgData.name, imgData.type);
                        await pasteImageToInput(file);
                        Logger.success(`✅ 图片${i + 1}/${mixedContent.imageCount} 已粘贴`);
                    }
                }

                // 轮询检测发送按钮
                Logger.log('所有内容已输入，开始轮询检测发送按钮...');
                const canSend = await waitSendBtnWithPolling();

                if (canSend) {
                    const sendBtn = document.querySelector(DOUBAO_CONFIG.sendBtnSelector);
                    if (sendBtn) {
                        sendBtn.click();
                        Logger.success('✅ 已自动发送到豆包AI');
                    }
                } else {
                    alert('⚠️ 发送按钮超时不可用，请手动点击发送');
                    Logger.warn('发送按钮10秒超时');
                }

            } catch (error) {
                Logger.error('豆包AI自动填充失败', error);
                console.error('详细错误:', error);
            } finally {
                // 清除缓存
                clearMixedContent();
                console.log('已清除缓存');
            }
        }

        // 页面加载完成后自动执行
        try {
            autoSendMessage();
            Logger.log('✅ 豆包AI自动填充功能已启动');
        } catch (error) {
            console.error('❌ 豆包AI自动填充启动失败:', error);
        }

    } else {
        // ===================== 超星学习通页面逻辑 =====================
        const app = new ChaoxingAnswerHider();
        app.initialize();
    }
})();
