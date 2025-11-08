# 超星学习通作业答案隐藏工具 - 模块化说明

## 📦 项目结构

```
remove-chaoxing-paper-answer/
├── main.user.js                    # 主入口文件（安装此文件）
├── modules/                         # 模块目录
│   ├── config.js                   # 配置模块
│   ├── dom-handler.js              # DOM操作模块
│   ├── ui.js                       # UI界面模块
│   └── button-controller.js        # 按钮控制模块
├── README.md                        # 项目说明
└── MODULE_DESIGN.md                # 本文件 - 模块化设计说明
```

## 🏗️ 模块化设计架构

### 1. **主入口 (main.user.js)**
- **职责**: 脚本的主入口点，协调各个模块的初始化
- **依赖**: 通过 `@require` 加载所有子模块
- **功能**: 
  - 延迟执行初始化函数
  - 调用各模块完成功能实现
  - 输出执行日志

### 2. **配置模块 (modules/config.js)**
- **职责**: 集中管理所有可配置项
- **导出**: `window.ChaoxingConfig`
- **配置项**:
  - `btnPosition`: 按钮位置配置
  - `btnStyle`: 按钮样式配置
  - `selectors`: DOM选择器配置
  - `executionDelay`: 执行延迟时间
  - `logging`: 日志配置

### 3. **DOM操作模块 (modules/dom-handler.js)**
- **职责**: 封装所有DOM查询和操作
- **导出**: `window.DomHandler`
- **主要方法**:
  - `getTopicContainer()`: 获取题目容器
  - `getAnswerBlocks()`: 获取所有答案块
  - `removeAnswerBlock(block)`: 删除答案块
  - `restoreAnswerBlock(info)`: 恢复答案块
  - `insertButton(button, parent, nextSibling)`: 插入按钮
  - `ensureRelativePosition(container)`: 确保相对定位
  - `getRestoreButtons()`: 获取所有恢复按钮

### 4. **UI模块 (modules/ui.js)**
- **职责**: 管理界面元素的创建和样式
- **导出**: `window.UIModule`
- **主要方法**:
  - `getSingleButtonStyle()`: 获取单个按钮样式
  - `getGlobalButtonStyle()`: 获取全局按钮样式
  - `createRestoreButton(handler)`: 创建恢复按钮
  - `createGlobalButton(handler)`: 创建全局按钮
  - `updateButtonState(button, isDeleted, isGlobal)`: 更新按钮状态
  - `log(message, type)`: 统一日志输出

### 5. **按钮控制模块 (modules/button-controller.js)**
- **职责**: 处理按钮的事件逻辑和状态管理
- **导出**: `window.ButtonController`
- **主要方法**:
  - `createSingleButtonHandler(blockInfo)`: 创建单个按钮处理器
  - `createGlobalButtonHandler()`: 创建全局按钮处理器
  - `initializeSingleBlock(block)`: 初始化单个答案块
  - `initializeGlobalButton(container)`: 初始化全局按钮

## 🔗 模块依赖关系

```
main.user.js
    ├── requires: config.js
    ├── requires: dom-handler.js (depends on config.js)
    ├── requires: ui.js (depends on config.js)
    └── requires: button-controller.js (depends on config.js, dom-handler.js, ui.js)
```

## 📝 使用方式

### 方式一：直接安装（推荐）
1. 安装 Tampermonkey 或 Violentmonkey 扩展
2. 点击安装 `main.user.js`
3. 脚本会自动通过 `@require` 加载所有子模块

### 方式二：本地开发
如果你想在本地开发，需要修改 `@require` 路径为本地路径或本地服务器地址。

## 🎨 模块化优势

### 1. **职责分离**
- 每个模块只负责特定功能
- 代码更易理解和维护

### 2. **可复用性**
- 模块可以独立测试
- 可以在其他项目中复用

### 3. **易于扩展**
- 添加新功能只需创建新模块
- 不会影响现有代码

### 4. **配置集中**
- 所有配置项集中在 `config.js`
- 修改配置不需要改动业务逻辑

### 5. **可维护性**
- 清晰的文件结构
- 每个文件代码量适中
- 函数功能单一明确

## 🔧 自定义配置

修改 `modules/config.js` 中的配置项即可自定义行为：

```javascript
const ChaoxingConfig = {
    btnPosition: {
        marginLeft: '20px',    // 修改按钮左边距
        marginTop: '10px',     // 修改按钮上边距
        // ...
    },
    btnStyle: {
        primaryColor: '#4299e1',    // 修改主色调
        secondaryColor: '#9f7aea',  // 修改次要色调
        // ...
    },
    executionDelay: 800,  // 修改延迟执行时间（毫秒）
    // ...
};
```

## 📦 部署说明

### GitHub 部署
1. 将所有文件推送到 GitHub 仓库
2. 在 `main.user.js` 中使用 GitHub Raw URL 引用模块
3. 用户只需安装 `main.user.js` 即可

示例：
```javascript
// @require https://raw.githubusercontent.com/your-username/your-repo/main/modules/config.js
```

### CDN 部署
也可以使用 jsDelivr 等 CDN 服务来加速模块加载：
```javascript
// @require https://cdn.jsdelivr.net/gh/your-username/your-repo@main/modules/config.js
```

## 🐛 调试技巧

1. **查看模块是否加载成功**:
```javascript
console.log(window.ChaoxingConfig);
console.log(window.DomHandler);
console.log(window.UIModule);
console.log(window.ButtonController);
```

2. **启用详细日志**:
在 `config.js` 中设置：
```javascript
logging: {
    enabled: true,  // 启用日志
    prefix: '[超星答案工具]'
}
```

## 📄 许可证

MIT License

## 👨‍💻 贡献

欢迎提交 Issue 和 Pull Request！
