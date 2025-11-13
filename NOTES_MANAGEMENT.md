# 笔记管理功能说明

## 功能概述

新增笔记数据库管理界面，用于集中管理所有保存的笔记。

## 使用方法

1. **打开管理界面**
   - 在作业页面右上角，找到"显示全部答案"按钮
   - 在其下方会有一个"📝 管理笔记"按钮
   - 点击该按钮即可打开笔记管理弹窗

2. **查看笔记**
   - 弹窗中会列出当前作业的所有笔记
   - 每条笔记显示：
     - 题目ID（蓝色高亮）
     - 创建/更新时间
     - 笔记内容预览（最多3行）

3. **删除笔记**
   - 点击笔记项前的复选框选中要删除的笔记
   - 可以使用"全选"按钮快速选择所有笔记
   - 点击"删除选中"按钮
   - 确认后即可删除选中的笔记（不可恢复！）

4. **关闭界面**
   - 点击弹窗右上角的 ✕ 按钮
   - 或点击弹窗外的遮罩层

## 技术特性

### 数据库设计（v2）

数据库升级到v2版本，采用双存储结构：

#### 1. notes 存储（笔记主体）
```javascript
{
  id: 'workKey_questionId',           // 主键
  workKey: 'courseId_classId_workId', // 作业标识
  questionId: 'questionId',            // 题目ID
  content: 'text',                     // 笔记内容
  contentType: 'text',                 // 内容类型（为将来扩展准备）
  hasAttachments: false,               // 是否有附件
  attachmentCount: 0,                  // 附件数量
  timestamp: 1234567890,               // 创建时间
  updatedAt: 1234567890                // 更新时间
}
```

#### 2. attachments 存储（附件，预留）
```javascript
{
  id: 'auto_increment',                // 自增主键
  noteId: 'workKey_questionId',        // 关联笔记ID
  workKey: 'courseId_classId_workId',  // 作业标识
  type: 'image',                       // 附件类型（image/file等）
  data: Blob,                          // 附件数据（图片、文件等）
  filename: 'example.png',             // 文件名
  size: 12345,                         // 文件大小
  mimeType: 'image/png',               // MIME类型
  timestamp: 1234567890                // 上传时间
}
```

### DatabaseManager 新增方法

1. **deleteNotes(noteIds)**
   - 批量删除多个笔记
   - 参数：笔记ID数组
   - 返回：删除成功的数量
   - 错误处理：单个失败不影响其他笔记的删除

2. **getStatistics()**
   - 获取数据库统计信息
   - 返回：
     - totalNotes: 笔记总数
     - databaseName: 数据库名称
     - version: 数据库版本号

### UI组件：NoteManagerUI

新增独立的笔记管理UI组件类，包含：

- **Modal弹窗**：全屏遮罩层 + 居中内容框
- **标题栏**：显示"📝 笔记管理" + 关闭按钮
- **笔记列表**：滚动容器，显示所有笔记
- **笔记项**：
  - 复选框：选中/取消选中
  - 题目ID：蓝色高亮显示
  - 时间戳：灰色小字
  - 内容预览：最多显示100px高度
  - 悬停效果：鼠标移入背景变色
  - 选中效果：浅蓝色背景
- **底部操作栏**：
  - 左侧：笔记数量统计
  - 右侧：全选按钮 + 删除按钮

## 配置项

在 `Config.DEFAULT.manageButton` 中可配置管理按钮样式：

```javascript
manageButton: {
  text: '📝 管理笔记',           // 按钮文本
  position: {
    top: '40px',                 // 距离顶部距离（在全局按钮下方）
    right: '10px',               // 距离右侧距离
    zIndex: '1000'               // 层级
  },
  style: {
    fontSize: '12px',            // 字体大小
    padding: '6px 12px',         // 内边距
    borderRadius: '4px',         // 圆角
    border: '1px solid #cbd5e0', // 边框
    fontWeight: 'normal',        // 字重
    cursor: 'pointer',           // 鼠标样式
    transition: 'all 0.2s'       // 过渡动画
  },
  colors: {
    background: '#805ad5',       // 背景色（紫色）
    textColor: 'white'           // 文字颜色
  }
}
```

## 未来扩展计划

数据库已预留 `attachments` 存储，后续可支持：

1. **图片附件**
   - 截图粘贴
   - 图片上传
   - 图片预览和删除

2. **文件附件**
   - PDF文档
   - Word文档
   - 其他类型文件

3. **富文本支持**
   - Markdown格式
   - HTML格式
   - 代码高亮

## 注意事项

1. **数据持久化**：笔记数据存储在浏览器的IndexedDB中，清除浏览器数据会导致笔记丢失
2. **作业隔离**：不同作业的笔记是隔离的，管理界面只显示当前作业的笔记
3. **删除确认**：删除操作会弹出确认对话框，删除后无法恢复
4. **性能优化**：笔记列表按时间倒序排列，最新的笔记显示在最前面

## 技术亮点

1. **模块化设计**：NoteManagerUI 作为独立组件，职责单一，易于维护
2. **数据库版本管理**：自动处理v1到v2的升级，保证数据兼容性
3. **错误处理**：完善的try-catch机制，单个笔记删除失败不影响其他操作
4. **用户体验**：
   - 实时反馈选中状态
   - 悬停效果提示
   - 删除前二次确认
   - 空状态友好提示
5. **可扩展性**：数据库结构支持未来添加图片、附件等功能
