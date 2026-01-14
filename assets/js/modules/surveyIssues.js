/**
 * 勘测问题模块
 */

export class SurveyIssuesModule {
    constructor() {
        this.modalId = 'surveyIssuesModal';
        this.currentViewingIssueId = null;

        // 模拟影像资料数据
        this.surveyIssueImages = {
            1: [
                { type: 'image', url: 'https://via.placeholder.com/400x300/5ad98b/ffffff?text=YJ001-1' },
                { type: 'image', url: 'https://via.placeholder.com/400x300/3b82f6/ffffff?text=YJ001-2' },
                { type: 'video', url: 'https://via.placeholder.com/400x300/f59e0b/ffffff?text=YJ001-Video' }
            ],
            2: [
                { type: 'image', url: 'https://via.placeholder.com/400x300/8b5cf6/ffffff?text=YJ002-1' },
                { type: 'image', url: 'https://via.placeholder.com/400x300/ec4899/ffffff?text=YJ002-2' }
            ],
            3: [
                { type: 'image', url: 'https://via.placeholder.com/400x300/10b981/ffffff?text=YJ003-1' },
                { type: 'image', url: 'https://via.placeholder.com/400x300/f43f5e/ffffff?text=YJ003-2' },
                { type: 'image', url: 'https://via.placeholder.com/400x300/06b6d4/ffffff?text=YJ003-3' },
                { type: 'video', url: 'https://via.placeholder.com/400x300/f97316/ffffff?text=YJ003-Video1' },
                { type: 'video', url: 'https://via.placeholder.com/400x300/84cc16/ffffff?text=YJ003-Video2' }
            ],
            4: [
                { type: 'image', url: 'https://via.placeholder.com/400x300/6366f1/ffffff?text=YJ004-1' }
            ]
        };
    }

    // 处理勘测问题操作
    handleAction(action) {
        switch(action) {
            case 'modify':
                this.enableEditMode();
                break;
            case 'add':
                this.addNewIssueRow();
                break;
            case 'export':
                alert('导出功能开发中...');
                break;
        }
    }

    // 启用编辑模式
    enableEditMode() {
        const rows = document.querySelectorAll('#surveyIssuesTableBody tr[data-issue-id]');
        rows.forEach(row => {
            row.querySelectorAll('.view-mode').forEach(el => el.classList.add('hidden'));
            row.querySelectorAll('.edit-mode').forEach(el => el.classList.remove('hidden'));
        });
    }

    // 添加新问题行
    addNewIssueRow() {
        const tbody = document.getElementById('surveyIssuesTableBody');
        const newId = tbody.children.length + 1;
        const newRow = document.createElement('tr');
        newRow.className = 'hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-blue-50 dark:bg-blue-900/20';
        newRow.setAttribute('data-issue-id', 'new');
        newRow.innerHTML = `
            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">${newId}</td>
            <td class="px-4 py-3">
                <input type="text" placeholder="请输入问题描述" class="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs focus:ring-1 focus:ring-primary focus:border-primary">
            </td>
            <td class="px-4 py-3">
                <input type="text" placeholder="请输入解决方案" class="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs focus:ring-1 focus:ring-primary focus:border-primary">
            </td>
            <td class="px-4 py-3">
                <span class="text-slate-400 text-xs">暂无</span>
            </td>
            <td class="px-4 py-3 flex gap-1">
                <button onclick="surveyIssues.saveNewIssue(this)" class="px-2 py-1 text-[10px] font-medium text-white bg-primary hover:bg-primary/90 rounded transition-colors">保存</button>
                <button onclick="surveyIssues.cancelNewIssue(this)" class="px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors">取消</button>
            </td>
        `;
        tbody.insertBefore(newRow, tbody.firstChild);
    }

    // 保存新问题
    saveNewIssue(btn) {
        const row = btn.closest('tr');
        const inputs = row.querySelectorAll('input[type="text"]');
        const description = inputs[0].value.trim();
        const solution = inputs[1].value.trim();

        if (!description) {
            alert('请输入问题描述');
            return;
        }

        console.log('保存新问题:', { description, solution });

        const newId = document.querySelectorAll('#surveyIssuesTableBody tr').length;
        row.setAttribute('data-issue-id', newId);
        row.className = 'hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors';
        row.innerHTML = `
            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">${newId}</td>
            <td class="px-4 py-3">
                <div class="view-mode">
                    <span class="text-slate-700 dark:text-slate-300">${description}</span>
                </div>
                <div class="edit-mode hidden">
                    <input type="text" value="${description}" class="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs focus:ring-1 focus:ring-primary focus:border-primary">
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="view-mode">
                    <span class="text-slate-600 dark:text-slate-400">${solution || '待补充'}</span>
                </div>
                <div class="edit-mode hidden">
                    <input type="text" value="${solution}" class="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs focus:ring-1 focus:ring-primary focus:border-primary">
                </div>
            </td>
            <td class="px-4 py-3">
                <span class="text-slate-400 text-xs">暂无</span>
            </td>
            <td class="px-4 py-3">
                <div class="view-mode">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-medium border border-red-200">
                        <span class="size-1.5 rounded-full bg-red-500"></span>
                        待处理
                    </span>
                </div>
                <div class="edit-mode hidden flex gap-1">
                    <button onclick="surveyIssues.saveIssueEdit(this)" class="px-2 py-1 text-[10px] font-medium text-white bg-primary hover:bg-primary/90 rounded transition-colors">保存</button>
                    <button onclick="surveyIssues.cancelIssueEdit(this)" class="px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors">取消</button>
                </div>
            </td>
        `;
    }

    // 取消新问题
    cancelNewIssue(btn) {
        const row = btn.closest('tr');
        row.remove();
    }

    // 保存问题编辑
    saveIssueEdit(btn) {
        const row = btn.closest('tr');
        const inputs = row.querySelectorAll('.edit-mode input[type="text"]');
        const description = inputs[0].value.trim();
        const solution = inputs[1].value.trim();

        if (!description) {
            alert('问题描述不能为空');
            return;
        }

        const spans = row.querySelectorAll('.view-mode span');
        spans[0].textContent = description;
        if (spans[1]) spans[1].textContent = solution || '待补充';

        row.querySelectorAll('.view-mode').forEach(el => el.classList.remove('hidden'));
        row.querySelectorAll('.edit-mode').forEach(el => el.classList.add('hidden'));

        console.log('保存编辑:', { id: row.getAttribute('data-issue-id'), description, solution });
    }

    // 取消问题编辑
    cancelIssueEdit(btn) {
        const row = btn.closest('tr');
        const inputs = row.querySelectorAll('.edit-mode input[type="text"]');
        const spans = row.querySelectorAll('.view-mode span');

        inputs[0].value = spans[0].textContent;
        if (inputs[1] && spans[1]) inputs[1].value = spans[1].textContent;

        row.querySelectorAll('.view-mode').forEach(el => el.classList.remove('hidden'));
        row.querySelectorAll('.edit-mode').forEach(el => el.classList.add('hidden'));
    }

    // 显示影像资料预览
    showImagePreview(issueId) {
        this.currentViewingIssueId = issueId;
        const images = this.surveyIssueImages[issueId] || [];
        const grid = document.getElementById('imagePreviewGrid');
        grid.innerHTML = '';

        images.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'relative group cursor-pointer rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700';

            if (item.type === 'image') {
                div.innerHTML = `
                    <img src="${item.url}" class="w-full h-48 object-cover" alt="影像${index + 1}">
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onclick="surveyIssues.deleteIssueImage(${issueId}, ${index})" class="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors">
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                `;
            } else {
                div.innerHTML = `
                    <div class="relative w-full h-48 bg-slate-900 flex items-center justify-center">
                        <img src="${item.url}" class="w-full h-full object-cover opacity-60" alt="视频${index + 1}">
                        <span class="material-symbols-outlined absolute text-white text-5xl">play_circle</span>
                    </div>
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onclick="surveyIssues.deleteIssueImage(${issueId}, ${index})" class="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors">
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                `;
            }
            grid.appendChild(div);
        });

        document.getElementById('imagePreviewModal').showModal();
    }

    // 删除影像资料
    deleteIssueImage(issueId, index) {
        if (confirm('确定要删除这个影像资料吗？')) {
            this.surveyIssueImages[issueId].splice(index, 1);
            this.showImagePreview(issueId);
            this.updateIssueImageCount(issueId);
        }
    }
}

// 导出单例
export const surveyIssues = new SurveyIssuesModule();