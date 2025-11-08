// ==UserScript==
// @name         Config Module - 配置模块
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  超星学习通作业答案隐藏工具 - 配置模块
// @author       You
// @license      MIT
// ==/UserScript==

/**
 * 配置模块
 * 提供所有可配置的选项
 */
const ChaoxingConfig = {
    /**
     * 按钮位置配置
     */
    btnPosition: {
        marginLeft: '20px',
        marginRight: '0px',
        marginTop: '10px',
        marginBottom: '0px',
        verticalAlign: 'middle'
    },

    /**
     * 按钮样式配置
     */
    btnStyle: {
        fontSize: '12px',
        padding: '3px 10px',
        borderRadius: '4px',
        primaryColor: '#4299e1',   // 删除后显示按钮的颜色
        secondaryColor: '#9f7aea'  // 恢复按钮的颜色
    },

    /**
     * DOM选择器配置
     */
    selectors: {
        topicNumberContainer: 'div.topicNumber',
        answerBlocks: 'div.mark_answer'
    },

    /**
     * 执行延迟配置（毫秒）
     */
    executionDelay: 800,

    /**
     * 日志配置
     */
    logging: {
        enabled: true,
        prefix: '[超星答案工具]'
    }
};

// 导出配置对象
if (typeof window !== 'undefined') {
    window.ChaoxingConfig = ChaoxingConfig;
}
