# 大学牲期末复习小工具——隐藏/显示超星学习通作业答案

一键隐藏超星考试 / 试卷页面中所有 `div.mark_answer` 答案块，支持**单个控制和全局控制**、**富文本笔记编辑**、**完整的样式自定义**，可直接在控制台执行或安装为油猴脚本使用。

## ✨ v2.4.0 新特性

### 📝 富文本编辑器升级
- **18+ 功能按钮**：支持粗体、斜体、下划线、删除线、标题（H1-H3）、有序/无序列表、引用、链接、代码、图片、清除格式等
- **实时工具栏**：编辑时自动显示格式工具栏，支持快捷格式化
- **选区保持**：插入列表、链接、代码时自动保持选区，操作更流畅
- **按钮高亮**：自动识别当前格式状态，已应用的格式按钮高亮显示

### 🔄 编辑/预览模式切换
- **独立切换按钮**：笔记保存按钮左侧新增编辑/预览切换按钮
- **预览模式**：支持滚动查看格式化后的笔记内容，无需编辑模式
- **手动切换**：移除自动切换为编辑模式，由用户主动控制

### 🎨 6 按钮样式统一管理
- **统一风格**：答案、笔记、编辑、保存、全局、控制面板 6 个按钮样式完全统一
- **悬停动画**：所有按钮支持一致的悬停效果（上移 + 阴影增强）
- **完整配置**：每个按钮支持 10+ 配置项（位置、尺寸、颜色、悬停色）
- **样式管理面板**：控制面板新增样式管理标签页，支持实时预览和持久化保存
- **一键重置**：支持恢复所有按钮的默认样式配置

---

## 🖼️ 预览图

<img src="images/1.png" alt="预览1" width="50%">
<img src="images/2.png" alt="预览1" width="50%">
<img src="images/3.png" alt="预览1" width="50%">

---

## 🧭 使用方式一：控制台直接执行

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

### v2.4.0 (2025-11-14)
- ✨ **富文本编辑器**：升级笔记编辑器为类博客多功能编辑框，支持 18+ 格式按钮
- 🎨 **格式工具栏**：粗体、斜体、下划线、删除线、标题、列表、引用、链接、代码、图片等
- 🔍 **编辑/预览模式**：新增模式切换按钮，支持预览格式化笔记内容
- 🎯 **按钮样式统一**：6 个按钮（答案、笔记、编辑、保存、全局、控制面板）样式完全统一
- 💫 **悬停动画**：所有按钮统一悬停效果（上移 + 阴影增强），交互体验一致
- 🎛️ **完整样式管理**：每个按钮支持 10+ 配置项（位置、字体、内边距、圆角、字重、颜色、悬停色）
- 🖌️ **样式管理面板**：控制面板新增样式管理标签页，支持实时预览和持久化
- 🔧 **StyleGenerator 集成**：所有按钮接入样式生成器统一管理
- 📊 **选区保持优化**：插入列表、链接、代码时自动保持选区，避免格式丢失
- 🌈 **按钮状态高亮**：已应用的格式按钮自动高亮显示当前状态

### v2.3.0 (2025-11-13)
- 📝 **笔记管理增强**：管理笔记改为子菜单形式，支持当前页面/课程/班级/域名四种范围筛选
- 📊 **智能分组**：课程/班级/域名范围自动按页面分组展示，便于管理
- 🎨 **样式管理面板**：新增样式管理选项卡，支持自定义所有按钮和编辑器样式
- 💾 **样式持久化**：自定义样式保存到 IndexedDB，刷新后自动应用
- ⚙️ **保存按钮配置化**：控制面板的保存按钮完全可配置，与其他按钮样式统一

### v2.2.0 (2025-11-13)
- ⚙️ **保存按钮配置化**：控制面板的保存按钮完全可配置，与其他按钮样式统一

### v2.2.0 (2025-11-13)
- 🎛️ **控制面板升级**：管理按钮改名为"控制面板"，采用左侧边栏设计
- ⚙️ **设置管理**：新增设置功能，支持自动保存开关和延迟时间配置
- 📝 **笔记管理**：独立的笔记管理标签页，支持批量选择和删除
- 💾 **数据库升级v3**：新增 settings 存储，配置信息持久化存储
- 🔧 **默认设置调整**：自动保存功能默认关闭，用户可在控制面板中开启
- 🎨 **样式优化**：笔记编辑器支持自定义宽度配置
- 🛠️ **设置持久化**：用户设置保存到 IndexedDB，页面刷新不丢失
- 💾 **手动保存按钮**：笔记编辑器右侧新增保存按钮，支持手动保存
- 🎯 **统一保存机制**：控制面板设置页统一保存按钮，避免误操作
- 🐛 **修复Bug**：修复控制面板按钮显示 [object Object] 的问题

### v2.1.0 (2025-11-10)
- 📝 **笔记功能**：每道题目可独立添加笔记，支持显示/隐藏切换
- 💾 **IndexedDB 存储**：笔记数据本地持久化，不会丢失
- 🔄 **自动保存**：输入停止后自动保存笔记（默认10秒）
- 🎨 **智能高度**：笔记编辑器自动调整高度，最大400px
- 🗑️ **笔记管理**：支持查看和删除已保存的笔记
- 🗄️ **数据库v2**：预留附件存储结构，为未来图片等功能做准备

### v2.0.0 (2025-11-09)
- 🏗️ **重大重构**：采用现代化面向对象设计，大幅提升代码质量
- 📦 **模块化架构**：将代码拆分为多个独立模块（Config、Logger、DOMHelper、StyleGenerator 等）
- 🎯 **单一职责原则**：每个类只负责特定功能，提升代码可维护性
- 🔧 **增强配置系统**：支持深度合并的配置管理，便于自定义扩展
- 🛠️ **工具类封装**：DOMHelper 提供统一的 DOM 操作接口
- 🎨 **样式生成器**：StyleGenerator 统一管理所有样式生成逻辑
- 📊 **控制器模式**：AnswerBlockController 和 GlobalController 分别管理单个和全局控制
- 🚀 **异步初始化**：使用 async/await 优化页面加载流程
- 🐛 **错误处理**：完善的 try-catch 机制和日志系统
- 📝 **代码可读性**：清晰的命名、注释和代码结构
- 🔄 **易于扩展**：新增功能只需扩展相应类，无需修改核心逻辑

### v1.0.1
- 🧩 新增：油猴脚本支持（Tampermonkey 自动执行）
- 🔁 优化：删除后页面自动补位，无空白残留
- 💬 新增：单块恢复+全局控制按钮
- ⚡ 改进：兼容性增强（支持延迟加载）

### v1.0.0
- 测试
