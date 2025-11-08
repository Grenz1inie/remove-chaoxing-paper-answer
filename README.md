# 大学牲期末复习小工具——隐藏/显示超星学习通作业答案

> **✨ v2.0.0 现已采用模块化设计！代码结构更清晰，更易维护和扩展。**

一键隐藏超星考试 / 试卷页面中所有 `div.mark_answer` 答案块，支持**单个控制和全局控制**，可直接在控制台执行或安装为油猴脚本使用。

---

## 🆕 v2.0.0 更新内容

- ✅ **全新模块化架构**：代码按功能拆分为独立模块
- ✅ **配置模块**：所有配置集中管理，修改更方便
- ✅ **DOM操作模块**：封装所有DOM查询和操作
- ✅ **UI模块**：统一管理界面元素和样式
- ✅ **按钮控制模块**：事件处理逻辑独立封装
- ✅ **通过 @require 自动加载子模块**：安装更简单
- ✅ **代码可读性和可维护性大幅提升**

详细的模块化设计说明请查看 [MODULE_DESIGN.md](MODULE_DESIGN.md)

---

## 🖼️ 预览图

<img src="images/1.png" alt="预览1" width="50%">
<img src="images/2.png" alt="预览1" width="50%">
<img src="images/3.png" alt="预览1" width="50%">

---

## 📦 项目结构

```
remove-chaoxing-paper-answer/
├── main.user.js                    # 主入口文件（安装此文件）
├── modules/                         # 模块目录
│   ├── config.js                   # 配置模块
│   ├── dom-handler.js              # DOM操作模块
│   ├── ui.js                       # UI界面模块
│   └── button-controller.js        # 按钮控制模块
├── README.md                        # 本文件
└── MODULE_DESIGN.md                # 模块化设计详细说明
```

---

## 🧭 使用方式一：安装为油猴脚本（推荐）

### 1. 安装浏览器扩展

首先安装以下任一脚本管理器扩展：

- **Tampermonkey（推荐）**
  - [Chrome 扩展商店](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
  - [Edge 扩展商店](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
  - [Firefox 扩展商店](https://addons.mozilla.org/zh-CN/firefox/addon/tampermonkey/)
  
- **Violentmonkey**
  - [Chrome 扩展商店](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag)
  - [Firefox 扩展商店](https://addons.mozilla.org/zh-CN/firefox/addon/violentmonkey/)

### 2. 安装脚本

点击下方链接安装：

**[📥 点击安装 main.user.js](https://github.com/Grenz1inie/remove-chaoxing-paper-answer/raw/main/main.user.js)**

或者：

1. 在本仓库点击 `main.user.js` 文件
2. 点击「Raw」按钮
3. Tampermonkey 会自动识别并提示安装

### 3. 使用脚本

安装完成后，访问超星学习通作业页面（`https://*.chaoxing.com/mooc-ans/mooc2/work/view*`），脚本会自动运行：

- 所有答案块会被隐藏
- 每个答案位置会显示「显示答案」按钮
- 页面右上角会显示「显示全部答案」全局控制按钮

---

## 🧭 使用方式二：控制台直接执行（快速测试）

如果只是想临时使用而不想安装扩展，可以在浏览器控制台直接执行：

1. 打开超星学习通 **作业页面**（确保页面完全加载完成）  
2. 打开浏览器开发者工具：  
   - Windows：按 `F12` 或 `Ctrl+Shift+I`  
   - Mac：按 `Command+Option+I`  
   - 或右键页面 → 「检查」  
3. 切换到「Console」控制台标签页  
4. 访问 [main.user.js](main.user.js)，复制完整代码并粘贴执行

> ⚠️ **注意**：控制台执行方式需要移除脚本头部的元数据注释（`// ==UserScript==` 部分），或者复制从 `(function() {` 开始的代码。

---

## 🎨 自定义配置

### 修改配置项

所有配置集中在 `modules/config.js` 文件中，你可以修改以下内容：

```javascript
const ChaoxingConfig = {
    // 按钮位置
    btnPosition: {
        marginLeft: '20px',
        marginTop: '10px',
        // ...
    },
    
    // 按钮样式
    btnStyle: {
        fontSize: '12px',
        primaryColor: '#4299e1',    // 主色调（蓝色）
        secondaryColor: '#9f7aea',  // 次要色调（紫色）
        // ...
    },
    
    // 执行延迟（毫秒）
    executionDelay: 800,
    
    // 日志配置
    logging: {
        enabled: true,
        prefix: '[超星答案工具]'
    }
};
```

### 本地开发

如果要在本地开发并测试：

1. Fork 本仓库
2. 修改 `main.user.js` 中的 `@require` 路径为你的 GitHub 仓库地址
3. 修改各模块文件
4. 提交并推送到你的仓库
5. 重新安装脚本测试

---

## 🧭 使用方式三：控制台直接执行（旧版）

1. 打开超星学习通 **作业页面**（确保页面完全加载完成）  
2. 打开浏览器开发者工具：  
   - Windows：按 `F12` 或 `Ctrl+Shift+I`  
   - Mac：按 `Command+Option+I`  
   - 或右键页面 → 「检查」  
3. 切换到「Console」控制台标签页  
4. 复制以下代码块并粘贴执行：

```javascript
(function() {
    'use strict';
    // ===================== 配置区（可自由修改）=====================
    const config = {
        btnPosition: {
            marginLeft: '20px',
            marginRight: '0px',
            marginTop: '10px',
            marginBottom: '0px',
            verticalAlign: 'middle'
        },
        btnStyle: {
            fontSize: '12px',
            padding: '3px 10px',
            borderRadius: '4px',
            primaryColor: '#4299e1',   // 显示按钮的颜色
            secondaryColor: '#9f7aea'  // 隐藏按钮的颜色
        }
    };
    // =====================================================================

    setTimeout(() => {
        const topicNumberContainer = document.querySelector('div.topicNumber');
        const targetAnswerBlocks = document.querySelectorAll('div.mark_answer');

        if (targetAnswerBlocks.length === 0) {
            console.log('ℹ️ 未找到 class="mark_answer" 的答案块（可能页面未完全加载，可刷新重试）');
            return;
        }
        if (!topicNumberContainer) {
            console.log('ℹ️ 未找到 class="topicNumber" 模块，仅启用单个答案块隐藏功能');
        }

        // 单个按钮样式
        const singleBtnStyle = `
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

        // 全局按钮样式（右上角悬浮）
        const globalBtnStyle = `
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

        // 初始化：彻底删除所有答案块+添加显示按钮
        targetAnswerBlocks.forEach(block => {
            // 存储原始元素（用于恢复）
            const originalElement = block.outerHTML;
            const parent = block.parentNode;
            const nextSibling = block.nextSibling;

            // 彻底删除元素（从DOM中移除，内容自动补位）
            parent.removeChild(block);

            // 创建显示/隐藏按钮
            const toggleBtn = document.createElement('button');
            toggleBtn.innerText = '显示答案';
            toggleBtn.style = singleBtnStyle;
            toggleBtn.title = '点击显示当前答案块';
            toggleBtn.dataset.isHidden = 'true'; // 标记初始状态：已隐藏
            toggleBtn.dataset.originalElement = originalElement; // 存储原始元素HTML

            // 按钮点击事件（切换显示/隐藏）
            toggleBtn.addEventListener('click', () => {
                const isHidden = toggleBtn.dataset.isHidden === 'true';
                if (isHidden) {
                    // 显示答案块：恢复原始元素
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = toggleBtn.dataset.originalElement;
                    const restoredBlock = tempDiv.firstChild;
                    parent.insertBefore(restoredBlock, nextSibling);
                    toggleBtn.innerText = '隐藏答案';
                    toggleBtn.style.background = config.btnStyle.secondaryColor;
                    toggleBtn.dataset.isHidden = 'false';
                } else {
                    // 隐藏答案块：删除元素
                    const currentBlock = parent.querySelector('div.mark_answer');
                    if (currentBlock) {
                        parent.removeChild(currentBlock);
                        toggleBtn.innerText = '显示答案';
                        toggleBtn.style.background = config.btnStyle.primaryColor;
                        toggleBtn.dataset.isHidden = 'true';
                    }
                }
            });

            // 插入按钮到原元素位置
            if (nextSibling) {
                parent.insertBefore(toggleBtn, nextSibling);
            } else {
                parent.appendChild(toggleBtn);
            }
        });

        // 添加全局控制按钮（topicNumber 右上角）
        if (topicNumberContainer) {
            // 给容器添加相对定位，确保全局按钮悬浮正确
            if (getComputedStyle(topicNumberContainer).position === 'static') {
                topicNumberContainer.style.position = 'relative';
            }

            const globalToggleBtn = document.createElement('button');
            globalToggleBtn.innerText = '显示全部答案';
            globalToggleBtn.style = globalBtnStyle;
            globalToggleBtn.title = '点击一键显示/隐藏所有答案块';
            globalToggleBtn.dataset.isAllHidden = 'true'; // 标记初始状态：全部已隐藏

            // 全局按钮点击事件
            globalToggleBtn.addEventListener('click', () => {
                const isAllHidden = globalToggleBtn.dataset.isAllHidden === 'true';
                const allToggleBtns = document.querySelectorAll('button[title="点击显示当前答案块"]');

                // 批量切换所有按钮状态
                allToggleBtns.forEach(btn => {
                    const btnIsHidden = btn.dataset.isHidden === 'true';
                    if (isAllHidden && btnIsHidden) {
                        btn.click(); // 全部显示：点击所有"显示答案"按钮
                    } else if (!isAllHidden && !btnIsHidden) {
                        btn.click(); // 全部隐藏：点击所有"隐藏答案"按钮
                    }
                });

                // 更新全局按钮状态
                globalToggleBtn.innerText = isAllHidden ? '隐藏全部答案' : '显示全部答案';
                globalToggleBtn.style.background = isAllHidden ? config.btnStyle.secondaryColor : config.btnStyle.primaryColor;
                globalToggleBtn.dataset.isAllHidden = !isAllHidden;
            });

            topicNumberContainer.appendChild(globalToggleBtn);
        }

        // 执行结果提示
        console.log(`✅ 超星作业答案块隐藏工具执行完成！`);
        console.log(`- 已隐藏 ${targetAnswerBlocks.length} 个答案内容块，每个块已添加独立控制按钮`);
        console.log(`- ${topicNumberContainer ? '已在 topicNumber 右上角添加全局控制按钮' : '未找到 topicNumber 模块，未添加全局按钮'}`);
    }, 800);
})();
```

---

## 🧩 使用方式二：安装油猴脚本

> 推荐方式，可在每次打开试卷页面时自动执行，支持交互式恢复/隐藏操作

1. 安装浏览器插件 [Tampermonkey（油猴）](https://www.tampermonkey.net/)  
2. 点击以下链接安装脚本：  
   👉 [**隐藏/显示超星学习通作业答案**](https://greasyfork.org/zh-CN/scripts/555192)
3. 进入超星作业页面，脚本会自动运行，右上角将出现「显示/隐藏全部答案」按钮



---

## 📜 更新日志

### v1.0.1
- 🧩 新增：油猴脚本支持（Tampermonkey 自动执行）
- 🔁 优化：删除后页面自动补位，无空白残留
- 💬 新增：单块恢复+全局控制按钮
- ⚡ 改进：兼容性增强（支持延迟加载）

### v1.0.0
- 测试
