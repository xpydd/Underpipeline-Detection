/**
 * 主入口文件 - 地下管线探测系统
 * 统一管理所有模块的初始化和全局功能
 */

// 导入所有模块
import { pointSearch } from './modules/pointSearch.js';
import { radarScan } from './modules/radarScan.js';
import { surveyIssues } from './modules/surveyIssues.js';
import { coordinateInput } from './modules/coordinateInput.js';

// 将模块挂载到全局对象，供HTML中的onclick使用
window.pointSearch = pointSearch;
window.radarScan = radarScan;
window.surveyIssues = surveyIssues;
window.coordinateInput = coordinateInput;

// 全局函数 - 供HTML直接调用
window.searchPoint = () => pointSearch.search();
window.connectDevice = () => radarScan.connectDevice();
window.startTransfer = () => radarScan.startTransfer();
window.pauseTransfer = () => radarScan.pauseTransfer();
window.resumeTransfer = () => radarScan.resumeTransfer();
window.confirmRadarScan = () => radarScan.confirm();
window.updateDataTypeSelection = () => radarScan.updateDataTypeSelection();

// 勘测问题相关
window.handleSurveyIssueAction = (action) => surveyIssues.handleAction(action);
window.showImagePreview = (issueId) => surveyIssues.showImagePreview(issueId);

// 坐标输入相关
window.loadCoordinate = (btn) => coordinateInput.loadCoordinate(btn);
window.goToPage = (page) => coordinateInput.goToPage(page);
window.goToCustomPage = () => coordinateInput.goToCustomPage();
window.importCoordinates = () => coordinateInput.importCoordinates();
window.exportCoordinates = () => coordinateInput.exportCoordinates();
window.confirmCoordinates = () => coordinateInput.confirm();

// 深色模式初始化
function initDarkMode() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.documentElement.classList.add('dark');
    }
}

// 切换深色模式
window.toggleDarkMode = function() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('地下管线探测系统已加载');

    // 初始化深色模式
    initDarkMode();

    // 初始化坐标表格
    if (typeof coordinateInput !== 'undefined' && document.getElementById('coordinateTableBody')) {
        coordinateInput.renderTable();
    }
});
