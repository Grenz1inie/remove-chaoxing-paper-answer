/**
 * Logger - 日志工具类
 * 提供统一的控制台日志输出接口
 * @version 3.12.0.9
 */
class Logger {
    static PREFIX = '🎓 [超星答案助手]';

    static log(message, type = 'info') {
        console[type](`${this.PREFIX} ${message}`);
    }

    static success(message) {
        this.log(`✅ ${message}`, 'log');
    }

    static error(message, error) {
        console.error(`${this.PREFIX} ❌ ${message}`, error);
    }

    static warn(message) {
        this.log(`⚠️ ${message}`, 'warn');
    }
}

// 导出供其他模块使用
window.Logger = Logger;
