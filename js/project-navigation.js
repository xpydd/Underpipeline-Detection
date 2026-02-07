/**
 * 项目导航工具函数
 * 用于在项目相关页面之间传递项目ID参数
 */

// 获取当前URL中的项目ID
function getCurrentProjectId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// 获取当前URL中的项目名称（兼容旧链接）
function getCurrentProjectName() {
    const params = new URLSearchParams(window.location.search);
    return params.get('name');
}

// 构建带项目ID的URL
function buildProjectUrl(baseUrl, projectId) {
    if (!projectId) {
        projectId = getCurrentProjectId();
    }

    const originalUrl = baseUrl;

    // 尝试修正路径 (OSS部署支持)
    if (typeof window.APP_CONFIG !== 'undefined') {
        baseUrl = window.APP_CONFIG.resolvePath(baseUrl);
        console.log(`[ProjectNavigation] Resolved path: ${originalUrl} -> ${baseUrl}`);
    } else {
        console.warn('[ProjectNavigation] APP_CONFIG not available, using original path');
    }

    if (!projectId) {
        return baseUrl;
    }

    const separator = baseUrl.includes('?') ? '&' : '?';
    const finalUrl = `${baseUrl}${separator}id=${encodeURIComponent(projectId)}`;
    console.log(`[ProjectNavigation] Built URL with project ID: ${finalUrl}`);
    return finalUrl;
}

// 更新页面中所有项目相关链接，添加项目ID参数
function updateProjectLinks() {
    const projectId = getCurrentProjectId();

    if (!projectId) {
        return;
    }

    // 需要更新的链接选择器
    const linkSelectors = [
        'a[href="project-detail.html"]',
        'a[href="project-data.html"]',
        'a[href="project-model.html"]',
        'a[href^="project-"][title="项目"]',
        'a[href^="project-"][title="数据"]',
        'a[href^="project-"][title="模型"]',
        'a[href^="project-"][title="勘探"]',
        'a[href^="project-"][title="报告"]'
    ];

    linkSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(link => {
            const href = link.getAttribute('href');

            // 跳过已经包含ID参数的链接
            if (href && !href.includes('?id=') && !href.includes('&id=')) {
                link.setAttribute('href', buildProjectUrl(href, projectId));
            }
        });
    });
}

// 页面加载完成后自动更新链接
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // 确保 APP_CONFIG 已加载
        if (typeof window.APP_CONFIG === 'undefined') {
            console.warn('[ProjectNavigation] Waiting for APP_CONFIG to load...');
            setTimeout(updateProjectLinks, 50);
        } else {
            updateProjectLinks();
        }
    });
}

// 导出函数供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getCurrentProjectId,
        getCurrentProjectName,
        buildProjectUrl,
        updateProjectLinks
    };
}
