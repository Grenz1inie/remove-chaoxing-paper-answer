/**
 * URLParser - URL解析工具类
 * 负责从URL中提取作业/试卷的唯一标识
 * @version 3.12.0
 */
class URLParser {
    /**
     * 从当前页面URL中提取workKey（作业唯一标识）
     * 用于数据隔离，每份作业有独立的笔记、错题等数据
     * 
     * @returns {string} workKey - 格式: classId_courseId_workId 或 fallback
     */
    static getWorkKey() {
        const url = window.location.href;
        const params = new URLSearchParams(window.location.search);

        // 从 URL 查询参数中提取
        const classId = params.get('clazzId') || params.get('classId') || '';
        const courseId = params.get('courseId') || '';
        const workId = params.get('workId') || params.get('id') || params.get('paperId') || '';

        if (classId && courseId && workId) {
            return `${classId}_${courseId}_${workId}`;
        }

        // 备用：从 URL 路径中提取
        const pathMatch = url.match(/\/(\d+)\/(\d+)\/(\d+)/);
        if (pathMatch) {
            return `${pathMatch[1]}_${pathMatch[2]}_${pathMatch[3]}`;
        }

        // 最后回退：使用路径名生成唯一标识
        const pathname = window.location.pathname;
        const hash = pathname.split('').reduce((acc, char) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0);
        return `page_${Math.abs(hash).toString(36)}`;
    }
}

// 导出供其他模块使用
window.URLParser = URLParser;
