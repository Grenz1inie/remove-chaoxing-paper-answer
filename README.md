# 超星试卷答案块移除工具









一键删除超星考试 / 试卷页面中所有 `div.mark_answer` 类的答案内容块（含内部所有内容），轻量无依赖，复制到控制台即可执行，快速清理冗余答案元素。




---



## 使用步骤



1. 打开超星学习通 **考试/试卷页面**（确保页面完全加载完成）

2. 打开浏览器开发者工具：

    - Windows：按 `F12` 或 `Ctrl+Shift+I`

    - Mac：按 `Command+Option+I`

    - 或右键页面 → 「检查」/「审查元素」

3. 切换到「控制台」（Console）标签

4. 复制下方代码块，粘贴到控制台输入框，按回车执行

5. 执行成功后，页面中所有答案块会立即消失



---



## 执行代码（点击可复制）



```JavaScript
// 超星试卷答案块移除脚本 - 立即执行
(function() {
  // 选择所有 class 为 mark_answer 的 div 元素
  const targetElements = document.querySelectorAll('div.mark_answer');
  // 遍历并彻底删除元素（含内部所有内容）
  targetElements.forEach(element => {
    element.parentNode?.removeChild(element);
  });
  // 控制台提示执行结果
  console.log(`✅ 执行完成！已删除 ${targetElements.length} 个答案内容块`);
})();

```
