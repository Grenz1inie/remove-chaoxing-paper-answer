// ==UserScript==
// @name         隐藏/显示超星学习通作业答案
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  一键隐藏超星学习通作业页面中所有 div.mark_answer 答案块，支持单个控制和全局控制，可直接在控制台执行或安装为油猴脚本使用。
// @author       You
// @match        https://*.chaoxing.com/mooc-ans/mooc2/work/view*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chaoxing.com
// @grant        none
// @run-at       document-end
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    // ===================== 配置管理模块 =====================
    class Config {
        static DEFAULT = {
            selectors: {
                answerBlock: 'div.mark_answer',
                container: 'div.topicNumber'
            },
            delays: {
                initialization: 800
            },
            button: {
                position: {
                    marginLeft: '20px',
                    marginRight: '0px',
                    marginTop: '10px',
                    marginBottom: '0px',
                    verticalAlign: 'middle'
                },
                style: {
                    fontSize: '12px',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    primaryColor: '#4299e1',   // 显示按钮颜色
                    secondaryColor: '#9f7aea'  // 隐藏按钮颜色
                },
                text: {
                    show: '显示答案',
                    hide: '隐藏答案',
                    showAll: '显示全部答案',
                    hideAll: '隐藏全部答案'
                }
            },
            messages: {
                noAnswerBlocks: 'ℹ️ 未找到答案块（可能页面未完全加载，可刷新重试）',
                noContainer: 'ℹ️ 未找到容器模块，仅启用单个答案块隐藏功能',
                success: '✅ 超星作业答案块隐藏工具执行完成！',
                hiddenCount: (count) => `- 已隐藏 ${count} 个答案内容块，每个块已添加独立显示按钮`,
                globalButton: (hasContainer) => `- ${hasContainer ? '已在容器右上角添加全局控制按钮' : '未找到容器模块，未添加全局按钮'}`
            }
        };

        constructor(customConfig = {}) {
            this.config = this._deepMerge(Config.DEFAULT, customConfig);
        }

        get(path) {
            return path.split('.').reduce((obj, key) => obj?.[key], this.config);
        }

        _deepMerge(target, source) {
            const result = { ...target };
            for (const key in source) {
                if (source[key] instanceof Object && key in target) {
                    result[key] = this._deepMerge(target[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
            return result;
        }
    }

    // ===================== 日志管理模块 =====================
    class Logger {
        static log(message, type = 'info') {
            const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
            console.log(`${prefix} ${message}`);
        }

        static success(message) {
            console.log(`✅ ${message}`);
        }

        static error(message, error) {
            console.error(`❌ ${message}`, error);
        }
    }

    // ===================== DOM 工具类 =====================
    class DOMHelper {
        static createElement(tag, attributes = {}) {
            const element = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else if (key === 'dataset' && typeof value === 'object') {
                    Object.entries(value).forEach(([dataKey, dataValue]) => {
                        element.dataset[dataKey] = dataValue;
                    });
                } else {
                    element[key] = value;
                }
            });
            return element;
        }

        static insertElement(element, parent, nextSibling = null) {
            if (nextSibling) {
                parent.insertBefore(element, nextSibling);
            } else {
                parent.appendChild(element);
            }
        }

        static removeElement(element) {
            element?.parentNode?.removeChild(element);
        }

        static ensureRelativePosition(element) {
            if (getComputedStyle(element).position === 'static') {
                element.style.position = 'relative';
            }
        }
    }

    // ===================== 样式生成器 =====================
    class StyleGenerator {
        constructor(config) {
            this.config = config;
        }

        getSingleButtonStyle() {
            const { position, style } = this.config.get('button');
            return {
                marginLeft: position.marginLeft,
                marginRight: position.marginRight,
                marginTop: position.marginTop,
                marginBottom: position.marginBottom,
                verticalAlign: position.verticalAlign,
                padding: '2px 8px',
                border: 'none',
                borderRadius: '3px',
                background: style.primaryColor,
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'inline-block'
            };
        }

        getGlobalButtonStyle() {
            const { style } = this.config.get('button');
            return {
                position: 'absolute',
                top: '8px',
                right: '8px',
                border: 'none',
                borderRadius: style.borderRadius,
                padding: style.padding,
                fontSize: style.fontSize,
                color: 'white',
                cursor: 'pointer',
                transition: 'background 0.2s',
                zIndex: '9999',
                background: style.primaryColor
            };
        }
    }

    // ===================== 答案块控制器 =====================
    class AnswerBlockController {
        constructor(block, config, styleGenerator) {
            this.block = block;
            this.config = config;
            this.styleGenerator = styleGenerator;
            this.parent = block.parentNode;
            this.nextSibling = block.nextSibling;
            this.originalHTML = block.outerHTML;
            this.toggleButton = null;
            this.isHidden = false;
        }

        initialize() {
            this._hideBlock();
            this._createToggleButton();
            return this.toggleButton;
        }

        _hideBlock() {
            DOMHelper.removeElement(this.block);
            this.isHidden = true;
        }

        _createToggleButton() {
            const buttonText = this.config.get('button.text');
            this.toggleButton = DOMHelper.createElement('button', {
                innerText: buttonText.show,
                style: this.styleGenerator.getSingleButtonStyle(),
                title: '点击显示/隐藏当前答案块',
                dataset: {
                    isHidden: 'true',
                    originalHTML: this.originalHTML
                }
            });

            this.toggleButton.addEventListener('click', () => this._handleToggle());
            DOMHelper.insertElement(this.toggleButton, this.parent, this.nextSibling);
        }

        _handleToggle() {
            if (this.isHidden) {
                this._showBlock();
            } else {
                this._hideBlock();
            }
            this._updateButtonState();
        }

        _showBlock() {
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = this.originalHTML;
            const restoredBlock = tempContainer.firstChild;
            DOMHelper.insertElement(restoredBlock, this.parent, this.toggleButton.nextSibling);
            this.isHidden = false;
        }

        _updateButtonState() {
            const buttonText = this.config.get('button.text');
            const colors = this.config.get('button.style');
            
            this.toggleButton.innerText = this.isHidden ? buttonText.show : buttonText.hide;
            this.toggleButton.style.background = this.isHidden ? colors.primaryColor : colors.secondaryColor;
            this.toggleButton.dataset.isHidden = String(this.isHidden);
        }

        toggle() {
            this._handleToggle();
        }

        getState() {
            return this.isHidden;
        }
    }

    // ===================== 全局控制器 =====================
    class GlobalController {
        constructor(container, controllers, config, styleGenerator) {
            this.container = container;
            this.controllers = controllers;
            this.config = config;
            this.styleGenerator = styleGenerator;
            this.globalButton = null;
        }

        initialize() {
            if (!this.container) return null;

            DOMHelper.ensureRelativePosition(this.container);
            this._createGlobalButton();
            return this.globalButton;
        }

        _createGlobalButton() {
            const buttonText = this.config.get('button.text');
            this.globalButton = DOMHelper.createElement('button', {
                innerText: buttonText.showAll,
                style: this.styleGenerator.getGlobalButtonStyle(),
                title: '点击一键显示/隐藏所有答案块'
            });

            this.globalButton.addEventListener('click', () => this._handleGlobalToggle());
            this.container.appendChild(this.globalButton);
        }

        _handleGlobalToggle() {
            const allHidden = this.controllers.every(ctrl => ctrl.getState());
            
            this.controllers.forEach(controller => {
                const shouldToggle = allHidden ? controller.getState() : !controller.getState();
                if (shouldToggle) {
                    controller.toggle();
                }
            });

            this._updateGlobalButtonState(!allHidden);
        }

        _updateGlobalButtonState(allHidden) {
            const buttonText = this.config.get('button.text');
            const colors = this.config.get('button.style');
            
            this.globalButton.innerText = allHidden ? buttonText.showAll : buttonText.hideAll;
            this.globalButton.style.background = allHidden ? colors.primaryColor : colors.secondaryColor;
        }
    }

    // ===================== 主应用类 =====================
    class ChaoxingAnswerHider {
        constructor(customConfig = {}) {
            this.config = new Config(customConfig);
            this.styleGenerator = new StyleGenerator(this.config);
            this.answerControllers = [];
            this.globalController = null;
        }

        async initialize() {
            try {
                await this._waitForPageLoad();
                const elements = this._findElements();
                
                if (!this._validateElements(elements)) {
                    return;
                }

                this._initializeAnswerBlocks(elements.answerBlocks);
                this._initializeGlobalControl(elements.container);
                this._logSuccess(elements.answerBlocks.length, !!elements.container);
            } catch (error) {
                Logger.error('初始化失败', error);
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

        _initializeAnswerBlocks(blocks) {
            blocks.forEach(block => {
                const controller = new AnswerBlockController(block, this.config, this.styleGenerator);
                controller.initialize();
                this.answerControllers.push(controller);
            });
        }

        _initializeGlobalControl(container) {
            this.globalController = new GlobalController(
                container,
                this.answerControllers,
                this.config,
                this.styleGenerator
            );
            this.globalController.initialize();
        }

        _logSuccess(count, hasContainer) {
            Logger.success(this.config.get('messages.success'));
            Logger.log(this.config.get('messages.hiddenCount')(count));
            Logger.log(this.config.get('messages.globalButton')(hasContainer));
        }
    }

    // ===================== 启动应用 =====================
    const app = new ChaoxingAnswerHider();
    app.initialize();
})();