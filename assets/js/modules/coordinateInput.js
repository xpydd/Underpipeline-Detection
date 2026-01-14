/**
 * 坐标输入模块
 */

export class CoordinateInputModule {
    constructor() {
        this.modalId = 'coordinateInputModal';
        this.currentPage = 1;
        this.coordinatesPerPage = 10;
        this.mockCoordinates = [];

        // 生成模拟坐标数据
        this.generateMockData();
    }

    // 生成模拟坐标数据
    generateMockData() {
        for (let i = 1; i <= 100; i++) {
            this.mockCoordinates.push({
                id: `DL${String(i).padStart(3, '0')}`,
                x: (2347184 + Math.random() * 1000).toFixed(3),
                y: (434427 + Math.random() * 1000).toFixed(3),
                elevation: (38 + Math.random() * 10).toFixed(2)
            });
        }
    }

    // 载入坐标
    loadCoordinate(btn) {
        const row = btn.closest('tr');
        const inputs = row.querySelectorAll('input');
        const id = row.querySelector('td:first-child').textContent;
        const x = inputs[0].value;
        const y = inputs[1].value;
        const elevation = inputs[2].value;

        console.log('载入坐标:', { id, x, y, elevation });
        alert(`已载入坐标点 ${id}`);
    }

    // 跳转到指定页
    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
    }

    // 跳转到自定义页
    goToCustomPage() {
        const input = document.querySelector('#coordinateInputModal input[type="number"]');
        const page = parseInt(input.value);
        const totalPages = Math.ceil(this.mockCoordinates.length / this.coordinatesPerPage);

        if (page >= 1 && page <= totalPages) {
            this.goToPage(page);
        } else {
            alert(`请输入1-${totalPages}之间的页码`);
        }
    }

    // 渲染坐标表格
    renderTable() {
        const tbody = document.getElementById('coordinateTableBody');
        const start = (this.currentPage - 1) * this.coordinatesPerPage;
        const end = start + this.coordinatesPerPage;
        const pageData = this.mockCoordinates.slice(start, end);

        tbody.innerHTML = pageData.map(coord => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <td class="px-4 py-3 text-center text-slate-700 dark:text-slate-300">${coord.id}</td>
                <td class="px-4 py-3">
                    <input type="text" value="${coord.x}" class="w-full px-2 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs focus:ring-1 focus:ring-primary focus:border-primary">
                </td>
                <td class="px-4 py-3">
                    <input type="text" value="${coord.y}" class="w-full px-2 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs focus:ring-1 focus:ring-primary focus:border-primary">
                </td>
                <td class="px-4 py-3">
                    <input type="text" value="${coord.elevation}" class="w-full px-2 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs focus:ring-1 focus:ring-primary focus:border-primary">
                </td>
                <td class="px-4 py-3 text-center">
                    <button onclick="coordinateInput.loadCoordinate(this)" class="text-primary hover:underline text-xs">载入</button>
                </td>
            </tr>
        `).join('');
    }

    // 导入坐标
    importCoordinates() {
        alert('导入功能开发中...\n支持拖拽Excel/CSV文件导入坐标数据');
    }

    // 导出坐标
    exportCoordinates() {
        alert('导出功能开发中...\n将导出当前所有坐标数据为Excel文件');
    }

    // 确认坐标
    confirm() {
        console.log('确认坐标数据');
        document.getElementById(this.modalId).close();
    }
}

// 导出单例
export const coordinateInput = new CoordinateInputModule();