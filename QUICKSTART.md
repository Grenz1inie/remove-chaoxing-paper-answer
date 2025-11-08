# 快速入门 (Quick Start)

> 5分钟快速上手超星学习通作业答案隐藏工具

## 📦 安装步骤

### 步骤 1: 安装脚本管理器

选择以下任一扩展安装到你的浏览器：

| 浏览器 | 推荐扩展 | 下载链接 |
|--------|---------|----------|
| Chrome | Tampermonkey | [点击安装](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| Edge | Tampermonkey | [点击安装](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) |
| Firefox | Tampermonkey | [点击安装](https://addons.mozilla.org/zh-CN/firefox/addon/tampermonkey/) |

### 步骤 2: 安装脚本

**[📥 点击这里安装脚本](https://github.com/Grenz1inie/remove-chaoxing-paper-answer/raw/main/main.user.js)**

点击后，Tampermonkey 会自动识别并弹出安装确认页面。

### 步骤 3: 开始使用

访问超星学习通的作业页面：
```
https://*.chaoxing.com/mooc-ans/mooc2/work/view*
```

脚本会自动运行，你将看到：
- ✅ 所有答案被隐藏
- ✅ 每个题目旁边有「显示答案」按钮
- ✅ 页面右上角有「显示全部答案」按钮

---

## 🎮 使用方法

### 单个答案控制

每个答案位置都有一个控制按钮：

- 点击 **「显示答案」** → 显示该题答案
- 点击 **「隐藏答案」** → 隐藏该题答案

### 全局答案控制

页面右上角有全局控制按钮：

- 点击 **「显示全部答案」** → 显示所有题目的答案
- 点击 **「隐藏全部答案」** → 隐藏所有题目的答案

---

## 🎨 界面预览

### 初始状态（答案已隐藏）
所有答案块被隐藏，每个题目旁边显示蓝色的「显示答案」按钮。

### 显示答案后
点击按钮后，答案显示，按钮变为紫色的「隐藏答案」按钮。

### 全局控制
右上角的全局按钮可以一键控制所有答案的显示/隐藏状态。

---

## ⚙️ 自定义设置

### 修改按钮颜色

如果你想修改按钮的颜色，可以编辑配置文件：

1. 打开 Tampermonkey 管理面板
2. 找到本脚本，点击「编辑」
3. 找到配置部分（或访问 GitHub 修改 `modules/config.js`）
4. 修改颜色代码：

```javascript
btnStyle: {
    primaryColor: '#4299e1',    // 蓝色（显示按钮）
    secondaryColor: '#9f7aea',  // 紫色（隐藏按钮）
}
```

常用颜色参考：
- 红色：`#e53e3e`
- 橙色：`#dd6b20`
- 绿色：`#38a169`
- 蓝色：`#3182ce`
- 紫色：`#805ad5`

### 修改按钮位置

修改按钮的边距：

```javascript
btnPosition: {
    marginLeft: '20px',    // 左边距
    marginTop: '10px',     // 上边距
    marginRight: '0px',    // 右边距
    marginBottom: '0px',   // 下边距
}
```

### 修改执行延迟

如果页面加载较慢，可以增加执行延迟：

```javascript
executionDelay: 1000,  // 从默认的800ms改为1000ms
```

---

## ❓ 常见问题

### Q1: 脚本没有运行？

**检查清单**：
- ✅ 是否已安装 Tampermonkey？
- ✅ 是否已安装本脚本？
- ✅ 脚本是否已启用？（在 Tampermonkey 图标中查看）
- ✅ 是否在正确的网页上？（超星学习通作业页面）
- ✅ 尝试刷新页面

### Q2: 找不到答案块？

可能原因：
- 页面还在加载中，请等待几秒或刷新页面
- 页面结构可能已更改，请提交 Issue 反馈
- 该页面没有 `div.mark_answer` 元素

### Q3: 按钮样式异常？

尝试以下方法：
1. 清除浏览器缓存
2. 重新加载页面
3. 检查是否有其他脚本冲突
4. 禁用其他超星相关脚本测试

### Q4: 如何更新脚本？

方法一（自动）：
1. 打开 Tampermonkey 管理面板
2. 点击「检查更新」
3. 如有更新会自动安装

方法二（手动）：
1. 重新点击安装链接
2. 确认覆盖旧版本

### Q5: 如何卸载脚本？

1. 打开 Tampermonkey 管理面板
2. 找到本脚本
3. 点击垃圾桶图标删除

---

## 📱 支持的浏览器

| 浏览器 | 支持版本 | 备注 |
|--------|---------|------|
| Chrome | 最新版 | ✅ 完全支持 |
| Edge | 最新版 | ✅ 完全支持 |
| Firefox | 最新版 | ✅ 完全支持 |
| Safari | 最新版 | ⚠️ 需要安装 Userscripts |
| Opera | 最新版 | ✅ 完全支持 |

---

## 🔒 隐私说明

本脚本：
- ✅ 完全在本地运行，不上传任何数据
- ✅ 不收集任何个人信息
- ✅ 不包含任何跟踪代码
- ✅ 开源代码，可以自由审查

脚本权限说明：
- `@grant none`：不需要任何特殊权限
- `@match https://*.chaoxing.com/*`：仅在超星域名下运行
- `@run-at document-end`：在页面加载完成后运行

---

## 📞 获取帮助

遇到问题？有好的建议？

- 🐛 [提交 Bug](https://github.com/Grenz1inie/remove-chaoxing-paper-answer/issues)
- 💡 [提交建议](https://github.com/Grenz1inie/remove-chaoxing-paper-answer/issues)
- 📖 [查看文档](https://github.com/Grenz1inie/remove-chaoxing-paper-answer)
- ⭐ [给项目点星](https://github.com/Grenz1inie/remove-chaoxing-paper-answer)

---

## 📚 相关文档

- [完整说明 (README.md)](README.md)
- [模块化设计 (MODULE_DESIGN.md)](MODULE_DESIGN.md)
- [开发指南 (DEVELOPMENT.md)](DEVELOPMENT.md)
- [更新日志 (CHANGELOG.md)](CHANGELOG.md)

---

**祝学习愉快！🎓**
