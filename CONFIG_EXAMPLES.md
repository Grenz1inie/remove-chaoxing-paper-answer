# 配置示例

本文件展示如何自定义配置 `modules/config.js`。

## 默认配置

```javascript
const ChaoxingConfig = {
    // 按钮位置配置
    btnPosition: {
        marginLeft: '20px',
        marginRight: '0px',
        marginTop: '10px',
        marginBottom: '0px',
        verticalAlign: 'middle'
    },

    // 按钮样式配置
    btnStyle: {
        fontSize: '12px',
        padding: '3px 10px',
        borderRadius: '4px',
        primaryColor: '#4299e1',   // 蓝色
        secondaryColor: '#9f7aea'  // 紫色
    },

    // DOM选择器配置
    selectors: {
        topicNumberContainer: 'div.topicNumber',
        answerBlocks: 'div.mark_answer'
    },

    // 执行延迟配置（毫秒）
    executionDelay: 800,

    // 日志配置
    logging: {
        enabled: true,
        prefix: '[超星答案工具]'
    }
};
```

---

## 配置示例

### 示例 1: 使用红色主题

```javascript
btnStyle: {
    fontSize: '12px',
    padding: '3px 10px',
    borderRadius: '4px',
    primaryColor: '#e53e3e',   // 红色
    secondaryColor: '#c53030'  // 深红色
}
```

### 示例 2: 使用绿色主题

```javascript
btnStyle: {
    fontSize: '12px',
    padding: '3px 10px',
    borderRadius: '4px',
    primaryColor: '#38a169',   // 绿色
    secondaryColor: '#2f855a'  // 深绿色
}
```

### 示例 3: 大号按钮

```javascript
btnStyle: {
    fontSize: '14px',      // 更大的字体
    padding: '5px 15px',   // 更大的内边距
    borderRadius: '6px',   // 更圆的边角
    primaryColor: '#4299e1',
    secondaryColor: '#9f7aea'
}
```

### 示例 4: 更大的边距

```javascript
btnPosition: {
    marginLeft: '30px',    // 增加左边距
    marginRight: '10px',   // 增加右边距
    marginTop: '15px',     // 增加上边距
    marginBottom: '5px',   // 增加下边距
    verticalAlign: 'middle'
}
```

### 示例 5: 更长的延迟（适合慢速网络）

```javascript
executionDelay: 1500,  // 1.5秒延迟
```

### 示例 6: 关闭日志

```javascript
logging: {
    enabled: false,  // 禁用日志输出
    prefix: '[超星答案工具]'
}
```

---

## 常用颜色代码

### 蓝色系
- 浅蓝: `#63b3ed`
- 标准蓝: `#4299e1`
- 深蓝: `#3182ce`

### 绿色系
- 浅绿: `#68d391`
- 标准绿: `#48bb78`
- 深绿: `#38a169`

### 红色系
- 浅红: `#fc8181`
- 标准红: `#f56565`
- 深红: `#e53e3e`

### 紫色系
- 浅紫: `#b794f4`
- 标准紫: `#9f7aea`
- 深紫: `#805ad5`

### 橙色系
- 浅橙: `#f6ad55`
- 标准橙: `#ed8936`
- 深橙: `#dd6b20`

### 灰色系
- 浅灰: `#cbd5e0`
- 标准灰: `#a0aec0`
- 深灰: `#718096`

---

## 配置建议

### 1. 颜色对比度
- 确保按钮颜色与背景有足够的对比度
- 推荐使用中等饱和度的颜色

### 2. 按钮大小
- 不要设置过小，确保易于点击
- 移动端建议增大按钮尺寸

### 3. 延迟时间
- 标准网络环境: 800ms
- 慢速网络: 1000-1500ms
- 快速网络: 500-800ms

### 4. 边距设置
- 确保按钮不会与其他元素重叠
- 保持视觉上的舒适间距

---

## 修改配置的方法

### 方法一: 直接修改 GitHub 上的文件
1. Fork 本仓库
2. 编辑 `modules/config.js`
3. 提交更改
4. 修改 `main.user.js` 中的 `@require` 路径指向你的仓库
5. 重新安装脚本

### 方法二: 本地开发
1. 克隆仓库到本地
2. 修改 `modules/config.js`
3. 启动本地服务器
4. 修改 `@require` 路径为本地地址
5. 安装修改后的脚本进行测试

### 方法三: 在脚本中直接覆盖
在 `main.user.js` 的 `initialize()` 函数开始处添加：

```javascript
function initialize() {
    // 覆盖默认配置
    window.ChaoxingConfig.btnStyle.primaryColor = '#e53e3e';
    window.ChaoxingConfig.btnStyle.secondaryColor = '#c53030';
    
    // 继续执行原有逻辑
    const topicContainer = window.DomHandler.getTopicContainer();
    // ...
}
```

---

## 配置验证

修改配置后，可以在控制台验证：

```javascript
// 查看当前配置
console.log(window.ChaoxingConfig);

// 查看特定配置项
console.log(window.ChaoxingConfig.btnStyle);
console.log(window.ChaoxingConfig.btnPosition);
```

---

## 注意事项

⚠️ **重要提示**：
1. 修改配置后需要刷新页面才能生效
2. 如果使用远程加载模块，需要等待 GitHub/CDN 缓存更新
3. 建议先在本地测试配置是否正常工作
4. 保持配置文件的 JavaScript 语法正确

---

有任何配置问题，欢迎提交 Issue！
