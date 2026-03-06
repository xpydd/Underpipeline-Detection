/**
 * 全局配置 - 路径和环境
 * 用于处理 OSS 部署时的子目录路径问题
 */
const CONFIG = {
    // 项目名称，用于检测路径
    projectName: 'Underpipeline-Detection',

    // 自动检测基础路径
    getBaseUrl: function() {
        const path = window.location.pathname;
        const index = path.indexOf(this.projectName);
        
        if (index !== -1) {
            // 提取 /.../Underpipeline-Detection/
            return path.substring(0, index + this.projectName.length) + '/';
        }
        
        // 如果是本地 file 协议
        if (window.location.protocol === 'file:') {
            return './';
        }

        // 默认情况，尝试判断是否在根目录
        // 如果我们在开发环境，可能是 /
        return '/';
    },

    // 转换相对路径为绝对路径（包含 Base URL）
    resolvePath: function(path) {
        if (!path) return path;
        if (path.startsWith('http') || path.startsWith('//')) return path;
        
        // 如果已经是绝对路径（以 / 开头），需要检查是否已经包含 Base URL
        if (path.startsWith('/')) {
            const baseUrl = this.getBaseUrl();
            if (baseUrl !== '/' && !path.startsWith(baseUrl)) {
                // 如果 Base URL 不是根目录，且路径没有包含 Base URL，则拼接
                // 注意：这里假设 path 是相对于项目根目录的绝对路径
                // 例如：/project-management.html -> /Underpipeline-Detection/project-management.html
                // 去掉开头的 /
                return baseUrl + path.substring(1);
            }
            return path;
        }

        // 相对路径，保持原样，或者根据需求转换为绝对路径
        // 为了确保安全，通常建议在 HTML 中使用相对路径。
        // 但如果在 JS 中跳转，可以使用此方法获取完整路径。
        return path;
    },
    
    // 执行页面跳转
    navigateTo: function(path) {
        // 处理 ./ 或 / 开头的路径
        if (path.startsWith('./')) {
            window.location.href = path;
        } else if (path.startsWith('/')) {
            window.location.href = this.resolvePath(path);
        } else {
            // 纯文件名，视为相对路径
            window.location.href = path;
        }
    }
};

// 挂载到 window 对象
window.APP_CONFIG = CONFIG;

// 导出（如果支持）
if (typeof module !== 'undefined') {
    module.exports = CONFIG;
}
