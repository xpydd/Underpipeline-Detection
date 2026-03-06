/**
 * 项目导航工具函数
 * 用于在项目相关页面之间传递项目ID参数，以及自动加载项目头部信息
 */

// 共享的模拟项目数据源（所有项目页面统一使用）
var sharedMockProjects = [
    {
        id: 'PROJ-2024-001',
        name: '北区燃气干线探测',
        address: '上海市 · 浦东新区',
        scene: '地下管线普查',
        area: '5000',
        ownerName: '城市建设投资集团',
        status: 'ongoing',
        startDate: '2024-01-15',
        endDate: '2024-03-15',
        description: '对北区主干道燃气管线进行全面普查，重点排查老化隐患。',
        coordSystem: 'cgcs2000',
        elevSystem: 'wusong',
        contactName: '张建国',
        contactTitle: '项目负责人',
        contactPhone: '13800138000',
        managerIds: '陈明',
        explorationIds: '王强, 周杰',
        dataIds: '李丽',
        reportIds: '孙小美',
        reviewerIds: '陈明'
    },
    {
        id: 'PROJ-2024-002',
        name: '西区供水管网 #2',
        address: '上海市 · 徐汇区',
        scene: '地下管线详查',
        area: '3200',
        ownerName: '新城区水务有限公司',
        status: 'overdue',
        startDate: '2024-02-20',
        endDate: '2024-04-20',
        description: '配合道路施工进行的供水管网详细探测。',
        elevSystem: 'cn85',
        contactName: '李华',
        contactTitle: '工程部经理',
        contactPhone: '13912345678'
    },
    {
        id: 'PROJ-2024-003',
        name: '高压电力 HV-404',
        address: '上海市 · 闵行区',
        scene: '地下管线放线测量',
        area: '8500',
        ownerName: '国家电网上海分公司',
        status: 'completed',
        startDate: '2024-03-10',
        endDate: '2024-05-10',
        description: '新建高压电力线路径放样。',
        elevSystem: 'yellow56',
        contactName: '刘洋',
        contactTitle: '运维主管',
        contactPhone: '13600001111'
    },
    {
        id: 'PROJ-2024-004',
        name: '南区排水系统改造',
        address: '上海市 · 黄浦区',
        scene: '地下管线竣工测量',
        area: '4200',
        ownerName: '市政工程管理处',
        status: 'suspended',
        startDate: '2024-04-15',
        endDate: '2024-06-15'
    },
    {
        id: 'PROJ-2024-005',
        name: '东区通信光缆布设',
        address: '上海市 · 杨浦区',
        scene: '地下管线普查',
        area: '6800',
        ownerName: '通信运营商',
        status: 'ongoing',
        startDate: '2024-05-20',
        endDate: '2024-07-20'
    },
    {
        id: 'PROJ-2024-006',
        name: '中央商务区热力管道',
        address: '上海市 · 静安区',
        scene: '地下管线详查',
        area: '2500',
        ownerName: '热力公司',
        status: 'ongoing',
        startDate: '2024-06-01',
        endDate: '2024-08-01'
    },
    {
        id: 'PROJ-2024-007',
        name: '工业园区燃气支线',
        address: '上海市 · 宝山区',
        scene: '地下管线放线测量',
        area: '7200',
        ownerName: '燃气集团',
        status: 'overdue',
        startDate: '2024-07-10',
        endDate: '2024-09-10'
    },
    {
        id: 'PROJ-2024-008',
        name: '新城区供水主干网',
        address: '上海市 · 松江区',
        scene: '地下管线竣工测量',
        area: '9500',
        ownerName: '市自来水公司',
        status: 'completed',
        startDate: '2024-08-05',
        endDate: '2024-10-05'
    }
];

// 获取所有项目（含 localStorage 中用户新建的项目）
function getAllProjects() {
    var storedProjects = JSON.parse(localStorage.getItem('mockProjects') || '[]');
    return sharedMockProjects.concat(storedProjects);
}

// 根据 URL 参数查找当前项目
function findCurrentProject() {
    var params = new URLSearchParams(window.location.search);
    var projectId = params.get('id');
    var projectName = params.get('name');
    var allProjects = getAllProjects();

    var project = null;
    if (projectId) {
        project = allProjects.find(function(p) { return p.id === projectId; });
    }
    if (!project && projectName) {
        project = allProjects.find(function(p) { return p.name === projectName; });
    }
    return project;
}

// 自动填充项目头部信息（project-title, project-id, project-address）
function populateProjectHeader() {
    var titleEl = document.getElementById('project-title');
    var idEl = document.getElementById('project-id');
    var addressEl = document.getElementById('project-address');

    if (!titleEl) return;

    var project = findCurrentProject();
    if (project) {
        titleEl.textContent = project.name;
        if (idEl) idEl.textContent = project.id || '';
        if (addressEl) addressEl.textContent = project.address || '';
    } else {
        var params = new URLSearchParams(window.location.search);
        if (params.get('id') || params.get('name')) {
            titleEl.textContent = '未找到项目';
        }
    }
}

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

    // 尝试修正路径 (OSS部署支持)
    if (typeof window.APP_CONFIG !== 'undefined') {
        baseUrl = window.APP_CONFIG.resolvePath(baseUrl);
    }

    if (!projectId) {
        return baseUrl;
    }

    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}id=${encodeURIComponent(projectId)}`;
}

// 更新页面中所有项目相关链接，添加项目ID参数
function updateProjectLinks() {
    const projectId = getCurrentProjectId();

    if (!projectId) {
        return;
    }

    document.querySelectorAll('a[href^="project-"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.includes('id=')) {
            link.setAttribute('href', buildProjectUrl(href, projectId));
        }
    });
}

// 页面加载完成后自动更新链接和填充项目头部
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        updateProjectLinks();
        populateProjectHeader();
    });
}

// 导出函数供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getCurrentProjectId,
        getCurrentProjectName,
        buildProjectUrl,
        updateProjectLinks,
        sharedMockProjects,
        getAllProjects,
        findCurrentProject,
        populateProjectHeader
    };
}
