# 开发指南 (Development Guide)

本指南将帮助你理解项目结构，并指导你如何进行开发、测试和部署。

## 📋 目录

- [开发环境准备](#开发环境准备)
- [本地开发](#本地开发)
- [模块说明](#模块说明)
- [添加新功能](#添加新功能)
- [测试指南](#测试指南)
- [部署流程](#部署流程)
- [常见问题](#常见问题)

---

## 🛠️ 开发环境准备

### 必需工具

1. **浏览器**：推荐使用 Chrome 或 Firefox
2. **脚本管理器**：Tampermonkey 或 Violentmonkey
3. **代码编辑器**：推荐使用 VS Code
4. **Git**：用于版本控制

### 推荐的 VS Code 扩展

- **ESLint**：代码规范检查
- **Prettier**：代码格式化
- **JavaScript (ES6) code snippets**：代码片段
- **GitLens**：Git 增强工具

---

## 💻 本地开发

### 1. 克隆仓库

```bash
git clone https://github.com/Grenz1inie/remove-chaoxing-paper-answer.git
cd remove-chaoxing-paper-answer
```

### 2. 创建本地开发分支

```bash
git checkout -b feature/your-feature-name
```

### 3. 设置本地服务器（可选）

如果想在本地测试模块加载，可以启动一个简单的 HTTP 服务器：

```bash
# Python 3
python -m http.server 8000

# 或使用 Node.js
npx http-server -p 8000
```

然后修改 `main.user.js` 中的 `@require` 路径：

```javascript
// @require      http://localhost:8000/modules/config.js
// @require      http://localhost:8000/modules/dom-handler.js
// @require      http://localhost:8000/modules/ui.js
// @require      http://localhost:8000/modules/button-controller.js
```

### 4. 安装开发版本

1. 在 Tampermonkey 中创建新脚本
2. 粘贴修改后的 `main.user.js` 内容
3. 保存并启用脚本

---

## 📦 模块说明

### 模块依赖图

```
main.user.js
    │
    ├─> config.js (配置模块)
    │
    ├─> dom-handler.js
    │       └─> config.js
    │
    ├─> ui.js
    │       └─> config.js
    │
    └─> button-controller.js
            ├─> config.js
            ├─> dom-handler.js
            └─> ui.js
```

### 各模块职责

#### config.js - 配置模块
- **职责**：集中管理所有配置项
- **导出**：`window.ChaoxingConfig`
- **修改**：修改配置时只需编辑此文件

#### dom-handler.js - DOM操作模块
- **职责**：封装所有DOM查询和操作
- **导出**：`window.DomHandler`
- **修改**：添加新的DOM操作方法时编辑此文件

#### ui.js - UI模块
- **职责**：管理界面元素和样式
- **导出**：`window.UIModule`
- **修改**：添加新的UI组件或样式时编辑此文件

#### button-controller.js - 按钮控制模块
- **职责**：处理按钮事件和状态
- **导出**：`window.ButtonController`
- **修改**：修改按钮行为逻辑时编辑此文件

---

## ✨ 添加新功能

### 示例：添加键盘快捷键支持

#### 1. 在 config.js 中添加配置

```javascript
const ChaoxingConfig = {
    // ...现有配置
    
    // 新增快捷键配置
    shortcuts: {
        toggleAll: 'Ctrl+H',        // 全局切换
        toggleSingle: 'Ctrl+Shift+H' // 单个切换
    }
};
```

#### 2. 创建新模块 modules/keyboard-handler.js

```javascript
// ==UserScript==
// @name         Keyboard Handler Module - 键盘处理模块
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  超星学习通作业答案隐藏工具 - 键盘处理模块
// @author       You
// @license      MIT
// @require      https://raw.githubusercontent.com/Grenz1inie/remove-chaoxing-paper-answer/main/modules/config.js
// ==/UserScript==

const KeyboardHandler = {
    init() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    },
    
    handleKeyPress(event) {
        // 实现快捷键逻辑
        const config = window.ChaoxingConfig.shortcuts;
        // ...
    }
};

if (typeof window !== 'undefined') {
    window.KeyboardHandler = KeyboardHandler;
}
```

#### 3. 在 main.user.js 中引入新模块

```javascript
// @require https://raw.githubusercontent.com/Grenz1inie/remove-chaoxing-paper-answer/main/modules/keyboard-handler.js
```

#### 4. 在 initialize() 函数中调用

```javascript
function initialize() {
    // ...现有代码
    
    // 初始化键盘处理
    window.KeyboardHandler.init();
}
```

---

## 🧪 测试指南

### 手动测试清单

在提交代码前，请确保以下功能正常：

- [ ] 页面加载后脚本自动执行
- [ ] 所有答案块被正确隐藏
- [ ] 单个「显示答案」按钮功能正常
- [ ] 单个「隐藏答案」按钮功能正常
- [ ] 全局「显示全部答案」按钮功能正常
- [ ] 全局「隐藏全部答案」按钮功能正常
- [ ] 按钮样式正确显示
- [ ] 控制台无错误信息
- [ ] 日志输出正确

### 测试页面

1. 访问任意超星学习通作业页面
2. 确保页面包含 `div.mark_answer` 元素
3. 等待脚本自动执行（约800ms）

### 调试技巧

#### 1. 查看模块加载状态

在控制台执行：

```javascript
console.log('Config:', window.ChaoxingConfig);
console.log('DomHandler:', window.DomHandler);
console.log('UIModule:', window.UIModule);
console.log('ButtonController:', window.ButtonController);
```

#### 2. 启用详细日志

在 `modules/config.js` 中：

```javascript
logging: {
    enabled: true,  // 设置为 true
    prefix: '[超星答案工具]'
}
```

#### 3. 检查DOM元素

```javascript
// 检查答案块
console.log(document.querySelectorAll('div.mark_answer'));

// 检查题目容器
console.log(document.querySelector('div.topicNumber'));

// 检查按钮
console.log(document.querySelectorAll('button[title*="显示当前答案块"]'));
```

---

## 🚀 部署流程

### 1. 更新版本号

修改 `main.user.js` 和各模块文件的版本号：

```javascript
// @version      2.1.0
```

### 2. 更新 CHANGELOG.md

在 `CHANGELOG.md` 中添加新版本的更新内容。

### 3. 提交代码

```bash
git add .
git commit -m "feat: 添加新功能描述"
git push origin feature/your-feature-name
```

### 4. 创建 Pull Request

1. 在 GitHub 上创建 Pull Request
2. 描述更改内容
3. 等待审核

### 5. 合并到主分支

审核通过后，合并到 `main` 分支。

### 6. 创建 Release（可选）

1. 在 GitHub 上创建新的 Release
2. 标记版本号（如 v2.1.0）
3. 填写更新说明
4. 附加 `main.user.js` 文件

### 7. 用户更新

用户只需：
1. 访问 Tampermonkey 管理面板
2. 点击「检查更新」
3. 脚本会自动更新到最新版本

---

## ❓ 常见问题

### Q1: 模块加载失败怎么办？

**A**: 检查以下几点：
1. GitHub 仓库是否公开
2. 文件路径是否正确
3. 网络是否能访问 GitHub
4. 可以尝试使用 CDN（如 jsDelivr）

### Q2: 如何在本地测试模块加载？

**A**: 启动本地 HTTP 服务器，并修改 `@require` 路径为本地地址。

### Q3: 修改配置后不生效？

**A**: 确保：
1. 已保存配置文件
2. 已提交到 GitHub（如果使用远程加载）
3. 清除浏览器缓存
4. 重新加载页面

### Q4: 如何添加新的DOM选择器？

**A**: 在 `config.js` 中的 `selectors` 对象添加新选择器：

```javascript
selectors: {
    topicNumberContainer: 'div.topicNumber',
    answerBlocks: 'div.mark_answer',
    newElement: 'div.new-class'  // 新增
}
```

### Q5: 如何改变按钮样式？

**A**: 在 `config.js` 的 `btnStyle` 和 `btnPosition` 对象中修改样式配置。

### Q6: 脚本执行延迟如何调整？

**A**: 在 `config.js` 中修改 `executionDelay` 值（单位：毫秒）。

---

## 📝 代码规范

### 命名规范

- **模块名**：使用 PascalCase（如 `DomHandler`）
- **函数名**：使用 camelCase（如 `getAnswerBlocks`）
- **常量**：使用 UPPER_SNAKE_CASE（如 `DEFAULT_DELAY`）
- **私有方法**：使用下划线前缀（如 `_privateMethod`）

### 注释规范

使用 JSDoc 格式：

```javascript
/**
 * 函数描述
 * @param {string} param1 - 参数1描述
 * @param {number} param2 - 参数2描述
 * @returns {boolean} 返回值描述
 */
function exampleFunction(param1, param2) {
    // 实现
}
```

### 提交信息规范

使用约定式提交（Conventional Commits）：

- `feat:` 新增功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具相关

示例：
```
feat: 添加键盘快捷键支持
fix: 修复按钮状态更新问题
docs: 更新开发指南
```

---

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📞 联系方式

如有问题或建议，请：
- 提交 Issue
- 创建 Pull Request
- 或在讨论区留言

---

**Happy Coding! 🎉**
