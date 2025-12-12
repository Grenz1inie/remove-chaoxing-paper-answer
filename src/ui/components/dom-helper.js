/**
 * DOMHelper - DOM操作辅助类
 * 提供通用的DOM元素创建和操作方法
 * @version 3.12.0.5
 */
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

    static ensureRelativePosition(element) {
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
    }

    // ========== 通用 UI 组件工厂方法 ==========

    /**
     * 创建带圆角阴影的容器
     * @param {Object} options - 配置选项
     * @returns {HTMLElement}
     */
    static createCard(options = {}) {
        const {
            padding = '24px',
            marginBottom = '20px',
            backgroundColor = 'white',
            borderRadius = '8px',
            boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)',
            ...otherStyles
        } = options;

        return this.createElement('div', {
            style: {
                backgroundColor,
                borderRadius,
                padding,
                boxShadow,
                marginBottom,
                ...otherStyles
            }
        });
    }

    /**
     * 创建标题元素
     * @param {string} text - 标题文本
     * @param {Object} options - 配置选项
     * @returns {HTMLElement}
     */
    static createTitle(text, options = {}) {
        const {
            tag = 'div',
            fontSize = '16px',
            fontWeight = 'bold',
            color = '#2d3748',
            marginBottom = '16px',
            ...otherStyles
        } = options;

        return this.createElement(tag, {
            innerText: text,
            style: {
                fontSize,
                fontWeight,
                color,
                marginBottom,
                ...otherStyles
            }
        });
    }

    /**
     * 创建描述文本元素
     * @param {string} text - 描述文本
     * @param {Object} options - 配置选项
     * @returns {HTMLElement}
     */
    static createDescription(text, options = {}) {
        const {
            fontSize = '13px',
            color = '#718096',
            marginTop = '6px',
            lineHeight = '1.5',
            ...otherStyles
        } = options;

        return this.createElement('div', {
            innerText: text,
            style: {
                fontSize,
                color,
                marginTop,
                lineHeight,
                ...otherStyles
            }
        });
    }

    /**
     * 创建按钮元素
     * @param {string} text - 按钮文本
     * @param {Function} onClick - 点击回调
     * @param {Object} options - 配置选项
     * @returns {HTMLElement}
     */
    static createButton(text, onClick, options = {}) {
        const {
            padding = '8px 16px',
            fontSize = '13px',
            fontWeight = '500',
            borderRadius = '6px',
            border = 'none',
            backgroundColor = '#4299e1',
            color = 'white',
            cursor = 'pointer',
            transition = 'all 0.2s',
            ...otherStyles
        } = options;

        const button = this.createElement('button', {
            innerText: text,
            style: {
                padding,
                fontSize,
                fontWeight,
                borderRadius,
                border,
                backgroundColor,
                color,
                cursor,
                transition,
                ...otherStyles
            }
        });

        if (onClick) {
            button.addEventListener('click', onClick);
        }

        return button;
    }

    /**
     * 创建带悬停效果的按钮
     * @param {string} text - 按钮文本
     * @param {Function} onClick - 点击回调
     * @param {Object} options - 配置选项
     * @returns {HTMLElement}
     */
    static createHoverButton(text, onClick, options = {}) {
        const {
            hoverBg,
            normalBg,
            hoverTransform = 'translateY(-1px)',
            hoverShadow = '0 4px 8px rgba(0, 0, 0, 0.15)',
            normalShadow = '0 2px 4px rgba(0, 0, 0, 0.1)',
            ...otherOptions
        } = options;

        const button = this.createButton(text, onClick, {
            ...otherOptions,
            boxShadow: normalShadow
        });

        // 添加悬停效果
        if (hoverBg || normalBg) {
            button.addEventListener('mouseenter', () => {
                if (hoverBg) button.style.backgroundColor = hoverBg;
                button.style.transform = hoverTransform;
                button.style.boxShadow = hoverShadow;
            });

            button.addEventListener('mouseleave', () => {
                if (normalBg) button.style.backgroundColor = normalBg;
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = normalShadow;
            });
        }

        return button;
    }

    /**
     * 创建 flex 容器
     * @param {Object} options - 配置选项
     * @returns {HTMLElement}
     */
    static createFlexContainer(options = {}) {
        const {
            direction = 'row',
            justify = 'flex-start',
            align = 'center',
            gap = '8px',
            ...otherStyles
        } = options;

        return this.createElement('div', {
            style: {
                display: 'flex',
                flexDirection: direction,
                justifyContent: justify,
                alignItems: align,
                gap,
                ...otherStyles
            }
        });
    }
}

// 导出供其他模块使用
window.DOMHelper = DOMHelper;
