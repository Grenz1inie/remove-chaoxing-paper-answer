# 代码结构说明

本项目采用**单文件多模块架构**（Single-File Multi-Module Architecture），将所有代码组织在 `main.user.js` 一个物理文件中，但通过类和模块化注释实现了清晰的逻辑分离。

## 📁 虚拟目录结构

如果将本项目拆分为多文件结构，其组织形式如下：

```
main.user.js
│
├── 📄 userscript-header                        # Tampermonkey 脚本头部声明
│   └── @name, @version, @match, @grant 等
│
├── 📦 config/                                  # 配置管理层
│   └── Config.js                               # 配置管理类 (静态配置 + 动态获取)
│       ├── selectors                           # DOM 选择器配置
│       │   ├── answerBlock                     # 答案块选择器
│       │   ├── container                       # 题目容器选择器
│       │   ├── questionItem                    # 题目项选择器
│       │   └── sidePanel                       # 侧边栏选择器
│       ├── delays                              # 延迟配置
│       ├── copyButton                          # 复制题目按钮配置
│       ├── answerButton                        # 单个答案控制按钮配置
│       ├── noteButton                          # 笔记控制按钮配置
│       ├── saveNoteButton                      # 保存笔记按钮配置
│       ├── editModeButton                      # 编辑模式切换按钮配置
│       ├── globalButton                        # 全局控制按钮配置
│       ├── noteEditor                          # 笔记编辑器配置
│       ├── settings (userSettings)             # 用户设置默认值
│       ├── controlPanelButton                  # 控制面板按钮配置
│       ├── exportButton                        # 导出试题按钮配置
│       ├── controlPanelSaveButton              # 控制面板保存按钮配置
│       ├── exportSettings                      # 导出设置配置
│       ├── database                            # 数据库配置
│       └── messages                            # 提示消息配置
│
├── 📦 utils/                                   # 工具类层
│   ├── Logger.js                               # 日志管理类
│   │   ├── log()                               # 通用日志
│   │   ├── success()                           # 成功日志
│   │   └── error()                             # 错误日志
│   │
│   ├── URLParser.js                            # URL 解析器
│   │   ├── parseWorkInfo()                     # 解析作业信息
│   │   └── getWorkKey()                        # 获取作业唯一标识
│   │
│   └── DOMHelper.js                            # DOM 工具类 (已优化)
│       ├── createElement()                     # 创建元素
│       ├── insertElement()                     # 插入元素
│       ├── removeElement()                     # 移除元素
│       ├── ensureRelativePosition()            # 确保相对定位
│       ├── createCard()                        # 创建卡片容器 (新增)
│       ├── createTitle()                       # 创建标题元素 (新增)
│       ├── createDescription()                 # 创建描述文本 (新增)
│       ├── createButton()                      # 创建按钮 (新增)
│       ├── createHoverButton()                 # 创建带悬停效果的按钮 (新增)
│       └── createFlexContainer()               # 创建 Flex 容器 (新增)
│
├── 📦 database/                                # 数据持久化层
│   └── DatabaseManager.js                      # IndexedDB 管理器
│       ├── init()                              # 初始化数据库
│       ├── saveNote()                          # 保存笔记
│       ├── getNote()                           # 获取笔记
│       ├── getAllDomainNotes()                 # 获取所有笔记
│       ├── deleteNote()                        # 删除笔记
│       ├── getSetting()                        # 获取设置
│       ├── saveSetting()                       # 保存设置
│       ├── getAllSettings()                    # 获取所有设置
│       └── getStyles() / saveStyles()          # 样式配置存取
│
├── 📦 styles/                                  # 样式管理层
│   └── StyleGenerator.js                       # 样式生成器
│       ├── _getInlineButtonStyle()             # 通用内联按钮样式
│       ├── _getFloatingButtonStyle()           # 通用浮动按钮样式
│       ├── _getCopyButtonStyle()               # 复制按钮样式（私有）
│       ├── getAnswerButtonStyle()              # 答案按钮样式
│       ├── getNoteButtonStyle()                # 笔记按钮样式
│       ├── getSaveNoteButtonStyle()            # 保存按钮样式
│       ├── getEditModeButtonStyle()            # 编辑模式按钮样式
│       ├── getGlobalButtonStyle()              # 全局按钮样式
│       ├── getCopyButtonStyle()                # 复制按钮样式
│       ├── addHoverEffect()                    # 添加悬停效果
│       └── getNoteEditorStyle()                # 编辑器样式
│
├── 📦 components/                              # UI 组件层
│   ├── NoteEditor.js                           # 笔记编辑器组件
│   │   ├── create()                            # 创建编辑器
│   │   ├── _createToolbar()                    # 创建工具栏 (16个格式按钮)
│   │   ├── _addToolbarButton()                 # 添加工具栏按钮
│   │   ├── execCommand()                       # 执行编辑命令
│   │   ├── setEditMode()                       # 切换编辑/预览模式
│   │   ├── loadContent()                       # 加载内容
│   │   ├── saveContent()                       # 保存内容
│   │   ├── toggle()                            # 切换显示/隐藏
│   │   └── getElement()                        # 获取 DOM 元素
│   │
│   └── ControlPanelUI.js                       # 控制面板 UI 组件
│       ├── show()                              # 显示面板
│       ├── _close()                            # 关闭面板
│       ├── _loadSettings()                     # 加载设置
│       ├── _loadNotes()                        # 加载笔记列表
│       ├── _createModal()                      # 创建模态框
│       ├── _createHeader()                     # 创建头部
│       ├── _createTabs()                       # 创建选项卡
│       ├── _createSettingsTab()                # 设置选项卡
│       ├── _createNotesTab()                   # 笔记管理选项卡
│       ├── _createStylesTab()                  # 样式设置选项卡
│       ├── _renderContent()                    # 渲染内容
│       ├── _deleteSelectedNotes()              # 删除选中笔记
│       ├── _exportSelectedNotes()              # 导出选中笔记
│       └── _exportToWord()                     # 导出为 Word 文档
│
├── 📦 controllers/                             # 控制器层
│   ├── AnswerBlockController.js                # 答案块控制器 (单题控制)
│   │   ├── initialize()                        # 初始化
│   │   ├── _extractQuestionId()                # 提取题目ID
│   │   ├── _hideBlockInitial()                 # 初始隐藏答案
│   │   ├── _createButtons()                    # 创建按钮容器
│   │   ├── _createCopyButton()                 # 创建复制题目按钮
│   │   ├── _createAnswerToggleButton()         # 创建答案切换按钮
│   │   ├── _createNoteToggleButton()           # 创建笔记按钮
│   │   ├── _createEditModeToggleButton()       # 创建编辑模式按钮
│   │   ├── _createSaveNoteButton()             # 创建保存笔记按钮
│   │   ├── _createNoteEditor()                 # 创建笔记编辑器
│   │   ├── _getQuestionText()                  # 获取题目文本
│   │   ├── _handleCopyQuestion()               # 处理复制题目
│   │   ├── _handleAnswerToggle()               # 处理答案切换
│   │   ├── toggle()                            # 切换答案显示状态
│   │   └── getState()                          # 获取当前状态
│   │
│   └── GlobalController.js                     # 全局控制器 (全局功能)
│       ├── initialize()                        # 初始化
│       ├── _createButtonContainer()            # 创建按钮容器(响应式)
│       ├── _createManageButton()               # 创建控制面板按钮
│       ├── _createGlobalButton()               # 创建全局显示/隐藏按钮
│       ├── _createExportButton()               # 创建导出按钮
│       ├── _exportAllQuestions()               # 导出所有试题
│       ├── _extractQuestionsWithImages()       # 提取题目和图片
│       ├── _convertImageToBase64()             # 图片转 Base64
│       ├── _toggleAll()                        # 切换所有答案状态
│       └── _updateGlobalButtonState()          # 更新按钮状态
│
├── 📦 app/                                     # 应用入口层
│   └── ChaoxingAnswerHider.js                  # 主应用类
│       ├── constructor()                       # 构造函数 (初始化依赖)
│       ├── initialize()                        # 应用初始化
│       ├── _loadCustomStyles()                 # 加载自定义样式
│       ├── _waitForPageLoad()                  # 等待页面加载
│       ├── _findElements()                     # 查找 DOM 元素
│       ├── _validateElements()                 # 验证元素
│       ├── _initializeAnswerBlocks()           # 初始化答案块
│       ├── _initializeGlobalControl()          # 初始化全局控制
│       └── _logSuccess()                       # 记录成功日志
│
└── 📄 bootstrap                                # 启动层
    └── 创建 ChaoxingAnswerHider 实例并调用 initialize()
```

## 🏗️ 架构分层说明

### 1. 配置层 (Config Layer)
- **Config 类**: 集中管理所有配置项，支持路径式访问（如 `config.get('answerButton.colors.showBackground')`）
- 包含 DOM 选择器、按钮样式、颜色主题、数据库配置等

### 2. 工具层 (Utils Layer)
- **Logger**: 统一的日志输出管理，带表情符号前缀
- **URLParser**: URL 解析，提取课程/班级/作业 ID，生成唯一 workKey
- **DOMHelper**: DOM 操作辅助方法（创建、插入、删除元素）

### 3. 数据层 (Data Layer)
- **DatabaseManager**: 基于 IndexedDB 的本地持久化存储
- 支持笔记存储、用户设置存储、样式配置存储

### 4. 样式层 (Styles Layer)
- **StyleGenerator**: 动态样式生成器
- 根据 Config 配置生成各类按钮和组件的内联样式
- 支持悬停效果管理

### 5. 组件层 (Components Layer)
- **NoteEditor**: 富文本笔记编辑器
  - 16 个格式化按钮（加粗、斜体、标题、列表、代码等）
  - 支持编辑/预览模式切换
- **ControlPanelUI**: 控制面板模态框
  - 设置选项卡（自动保存等）
  - 笔记管理选项卡（查看、删除、导出）
  - 样式设置选项卡（自定义按钮颜色等）

### 6. 控制器层 (Controllers Layer)
- **AnswerBlockController**: 单题答案块控制
  - 管理单个题目的答案显示/隐藏
  - 复制题目功能
  - 笔记编辑器实例管理
- **GlobalController**: 全局功能控制
  - 批量显示/隐藏所有答案
  - 导出试题为 Word 文档（含图片）
  - 响应式按钮布局（横屏/竖屏适配）

### 7. 应用层 (App Layer)
- **ChaoxingAnswerHider**: 主应用类
- 负责依赖注入、生命周期管理、组件协调

## 📊 模块依赖关系

```
                    ┌─────────────────┐
                    │   Bootstrap     │
                    │   (启动入口)     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ ChaoxingAnswer  │
                    │     Hider       │
                    │   (主应用)       │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
│ GlobalController│ │AnswerBlockCtrl  │ │ DatabaseManager │
│   (全局控制)     │ │   (单题控制)     │ │   (数据存储)    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         │          ┌────────▼────────┐          │
         │          │   NoteEditor    │──────────┘
         │          │  (笔记编辑器)    │
         │          └─────────────────┘
         │
┌────────▼────────┐
│ ControlPanelUI  │
│   (控制面板)     │
└────────┬────────┘
         │
    ┌────┴────┬────────────┐
    │         │            │
┌───▼───┐ ┌───▼───┐  ┌─────▼─────┐
│Config │ │Logger │  │StyleGen   │
│(配置)  │ │(日志)  │  │(样式生成)  │
└───────┘ └───────┘  └─────┬─────┘
                           │
                     ┌─────▼─────┐
                     │ DOMHelper │
                     │(DOM工具)   │
                     └───────────┘
```

## 📝 设计原则

1. **单一职责**: 每个类只负责一个功能领域
2. **依赖注入**: 通过构造函数注入依赖，便于测试和替换
3. **配置驱动**: 所有样式和行为通过配置管理，易于定制
4. **模块化注释**: 使用 `// ===================== 模块名 =====================` 标记模块边界
5. **代码复用**: 提取通用UI组件工厂方法，减少重复代码 (v2.7.15+)
6. **统一接口**: 使用标准化的组件创建方法，提升可维护性

## 🔄 为什么采用单文件架构？

1. **Tampermonkey 限制**: 用户脚本需要单文件分发
2. **简化安装**: 用户无需处理多文件依赖
3. **版本管理**: 单文件便于版本追踪和回滚
4. **性能**: 避免多次网络请求加载模块

## 📈 代码统计 (v2.7.15)

| 模块 | 占比 | 说明 | 变化 |
|------|------|------|------|
| Config | ~8% | 配置管理 | 无变化 |
| Utils (Logger + URLParser + DOMHelper) | ~3% | 工具类 | **+1% (新增工厂方法)** |
| DatabaseManager | ~6% | 数据持久化 | 无变化 |
| NoteEditor | ~9% | 笔记编辑器组件 | 无变化 |
| ControlPanelUI | ~41% | 控制面板 | **-2% (代码重构)** |
| StyleGenerator | ~4% | 样式生成 | 无变化 |
| AnswerBlockController | ~9% | 单题控制器 | 无变化 |
| GlobalController | ~17% | 全局控制器 | 无变化 |
| ChaoxingAnswerHider | ~2% | 主应用类 | 无变化 |
| **总计** | **100%** | **~5800 行** | **净减少 ~80 行** |

### 重构成果
- ✅ 减少重复代码：~200+ 行
- ✅ 新增工厂方法：6 个通用组件创建方法
- ✅ 净减少代码：~80 行（考虑到新增的工厂方法）
- ✅ 可维护性提升：统一的组件创建接口
