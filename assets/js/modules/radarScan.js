/**
 * 雷达扫描模块
 */

export class RadarScanModule {
    constructor() {
        this.modalId = 'radarScanModal';
        this.currentSelectedDevice = null;
        this.transferState = {
            isTransferring: false,
            isPaused: false,
            progress: 0,
            intervalId: null
        };

        // 设备与项目的绑定关系（模拟数据）
        this.deviceProjectMapping = {
            'LD-GTL310-66P': ['WT-250022', 'WT-250024', 'WT-250029'],
            'LD-GTL310-77P': ['WT-250030', 'WT-250055'],
            'LD-GTL310-88P': ['WT-250022', 'WT-250030', 'WT-250055']
        };

        // 项目与数据的绑定关系（模拟数据）
        this.projectDataMapping = {
            'WT-250022': ['数据_20251122', '数据_20251123', '数据_20251125'],
            'WT-250024': ['数据_20251123', '数据_20251126'],
            'WT-250029': ['数据_20251125', '数据_20251127', '数据_20251128'],
            'WT-250030': ['数据_20251122', '数据_20251126', '数据_20251128'],
            'WT-250055': ['数据_20251123', '数据_20251127']
        };
    }

    // 连接设备
    connectDevice() {
        const selectedDevice = document.querySelector('input[name="device"]:checked');
        if (!selectedDevice) {
            alert('请先选择一个设备');
            return;
        }

        // 模拟设备连接
        const deviceCard = selectedDevice.closest('.p-3');
        const statusIndicator = deviceCard.querySelector('.size-2');
        const statusText = deviceCard.querySelector('.text-\\[10px\\]');

        statusIndicator.classList.remove('bg-slate-400');
        statusIndicator.classList.add('bg-green-500');
        statusText.textContent = '已连接';

        // 保存当前选中的设备
        this.currentSelectedDevice = selectedDevice.value;

        // 加载该设备绑定的项目
        this.loadDeviceProjects(this.currentSelectedDevice);

        alert(`设备 ${selectedDevice.value} 连接成功！`);
    }

    // 加载设备绑定的项目
    loadDeviceProjects(deviceName) {
        const projects = this.deviceProjectMapping[deviceName] || [];
        const container = document.getElementById('projectNumberContainer');

        if (projects.length === 0) {
            container.innerHTML = '<span class="text-xs text-slate-400">该设备暂无绑定项目</span>';
            return;
        }

        container.innerHTML = projects.map(project => `
            <label class="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                <input type="checkbox" value="${project}" class="text-primary focus:ring-primary rounded" onchange="radarScan.updateProjectSelection()">
                <span class="text-xs text-slate-700 dark:text-slate-300">${project}</span>
            </label>
        `).join('');

        // 清空项目数据选择
        this.clearProjectData();
    }

    // 更新项目选择
    updateProjectSelection() {
        const selectedProjects = Array.from(
            document.querySelectorAll('#projectNumberContainer input:checked')
        ).map(el => el.value);

        console.log('已选择项目:', selectedProjects);

        // 加载选中项目的数据
        this.loadProjectData(selectedProjects);
    }

    // 加载项目数据
    loadProjectData(selectedProjects) {
        const container = document.getElementById('projectDataContainer');

        if (selectedProjects.length === 0) {
            container.innerHTML = '<span class="text-xs text-slate-400">请先选择项目编号</span>';
            return;
        }

        // 合并所有选中项目的数据（去重）
        const allData = new Set();
        selectedProjects.forEach(project => {
            const data = this.projectDataMapping[project] || [];
            data.forEach(d => allData.add(d));
        });

        const dataArray = Array.from(allData).sort();

        if (dataArray.length === 0) {
            container.innerHTML = '<span class="text-xs text-slate-400">所选项目暂无数据</span>';
            return;
        }

        container.innerHTML = dataArray.map(data => `
            <label class="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                <input type="checkbox" value="${data}" class="text-primary focus:ring-primary rounded" onchange="radarScan.updateDataSelection()">
                <span class="text-xs text-slate-700 dark:text-slate-300">${data}</span>
            </label>
        `).join('');
    }

    // 清空项目数据
    clearProjectData() {
        const container = document.getElementById('projectDataContainer');
        container.innerHTML = '<span class="text-xs text-slate-400">请先选择项目编号</span>';
    }

    // 更新数据选择
    updateDataSelection() {
        const selected = document.querySelectorAll('#projectDataContainer input:checked');
        console.log('已选择项目数据:', Array.from(selected).map(el => el.value));
    }

    // 更新数据类型选择
    updateDataTypeSelection() {
        const selected = document.querySelectorAll('#radarScanModal input[value="基础信息"]:checked, #radarScanModal input[value="图像文件"]:checked');
        console.log('已选择数据类型:', Array.from(selected).map(el => el.value));
    }

    // 更新按钮状态
    updateTransferButtons() {
        const startBtn = document.getElementById('startTransferBtn');
        const pauseBtn = document.getElementById('pauseTransferBtn');
        const resumeBtn = document.getElementById('resumeTransferBtn');

        if (this.transferState.isTransferring && !this.transferState.isPaused) {
            // 传输中
            startBtn.disabled = true;
            startBtn.classList.add('bg-slate-200', 'dark:bg-slate-700', 'text-slate-400', 'cursor-not-allowed');
            startBtn.classList.remove('bg-primary', 'hover:bg-primary/90', 'text-white');

            pauseBtn.disabled = false;
            pauseBtn.classList.remove('bg-slate-200', 'dark:bg-slate-700', 'text-slate-400', 'cursor-not-allowed');
            pauseBtn.classList.add('bg-orange-500', 'hover:bg-orange-600', 'text-white');

            resumeBtn.disabled = true;
            resumeBtn.classList.add('bg-slate-200', 'dark:bg-slate-700', 'text-slate-400', 'cursor-not-allowed');
            resumeBtn.classList.remove('bg-primary', 'hover:bg-primary/90', 'text-white');
        } else if (this.transferState.isPaused) {
            // 已暂停
            startBtn.disabled = true;
            startBtn.classList.add('bg-slate-200', 'dark:bg-slate-700', 'text-slate-400', 'cursor-not-allowed');
            startBtn.classList.remove('bg-primary', 'hover:bg-primary/90', 'text-white');

            pauseBtn.disabled = true;
            pauseBtn.classList.add('bg-slate-200', 'dark:bg-slate-700', 'text-slate-400', 'cursor-not-allowed');
            pauseBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600', 'text-white');

            resumeBtn.disabled = false;
            resumeBtn.classList.remove('bg-slate-200', 'dark:bg-slate-700', 'text-slate-400', 'cursor-not-allowed');
            resumeBtn.classList.add('bg-primary', 'hover:bg-primary/90', 'text-white');
        } else {
            // 未开始
            startBtn.disabled = false;
            startBtn.classList.remove('bg-slate-200', 'dark:bg-slate-700', 'text-slate-400', 'cursor-not-allowed');
            startBtn.classList.add('bg-primary', 'hover:bg-primary/90', 'text-white');

            pauseBtn.disabled = true;
            pauseBtn.classList.add('bg-slate-200', 'dark:bg-slate-700', 'text-slate-400', 'cursor-not-allowed');
            pauseBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600', 'text-white');

            resumeBtn.disabled = true;
            resumeBtn.classList.add('bg-slate-200', 'dark:bg-slate-700', 'text-slate-400', 'cursor-not-allowed');
            resumeBtn.classList.remove('bg-primary', 'hover:bg-primary/90', 'text-white');
        }
    }

    // 更新进度条
    updateProgress(progress) {
        this.transferState.progress = progress;
        document.getElementById('transferProgress').textContent = `${progress}%`;
        document.getElementById('transferProgressBar').style.width = `${progress}%`;
    }

    // 开始传输
    startTransfer() {
        const selectedProjects = document.querySelectorAll('#projectNumberContainer input:checked');
        const selectedData = document.querySelectorAll('#projectDataContainer input:checked');
        const selectedDataTypes = document.querySelectorAll('#radarScanModal input[value="基础信息"]:checked, #radarScanModal input[value="图像文件"]:checked');

        if (selectedProjects.length === 0) {
            alert('请至少选择一个项目编号');
            return;
        }
        if (selectedData.length === 0) {
            alert('请至少选择一个项目数据');
            return;
        }
        if (selectedDataTypes.length === 0) {
            alert('请至少选择一个数据类型');
            return;
        }

        this.transferState.isTransferring = true;
        this.transferState.isPaused = false;
        this.transferState.progress = 0;
        this.updateTransferButtons();
        this.updateProgress(0);

        this.transferState.intervalId = setInterval(() => {
            if (this.transferState.progress < 100) {
                this.updateProgress(this.transferState.progress + 1);
            } else {
                clearInterval(this.transferState.intervalId);
                alert('数据传输完成！');
                this.resetTransfer();
            }
        }, 100);
    }

    // 暂停传输
    pauseTransfer() {
        if (this.transferState.intervalId) {
            clearInterval(this.transferState.intervalId);
            this.transferState.intervalId = null;
        }
        this.transferState.isPaused = true;
        this.transferState.isTransferring = false;
        this.updateTransferButtons();
    }

    // 继续传输
    resumeTransfer() {
        this.transferState.isTransferring = true;
        this.transferState.isPaused = false;
        this.updateTransferButtons();

        this.transferState.intervalId = setInterval(() => {
            if (this.transferState.progress < 100) {
                this.updateProgress(this.transferState.progress + 1);
            } else {
                clearInterval(this.transferState.intervalId);
                alert('数据传输完成！');
                this.resetTransfer();
            }
        }, 100);
    }

    // 重置传输状态
    resetTransfer() {
        if (this.transferState.intervalId) {
            clearInterval(this.transferState.intervalId);
            this.transferState.intervalId = null;
        }
        this.transferState.isTransferring = false;
        this.transferState.isPaused = false;
        this.transferState.progress = 0;
        this.updateTransferButtons();
        this.updateProgress(0);
    }

    // 确认雷达扫描
    confirm() {
        console.log('确认雷达扫描数据');
        document.getElementById(this.modalId).close();
        this.resetTransfer();
    }
}

// 导出单例
export const radarScan = new RadarScanModule();