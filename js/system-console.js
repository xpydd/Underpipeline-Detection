(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.SystemConsole = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    const projects = [
        { id: 'PROJ-2024-001', name: '北区燃气干线探测', status: '实施中' },
        { id: 'PROJ-2024-003', name: '南区雨污管网复检', status: '实施中' },
        { id: 'PROJ-2024-005', name: '综合管廊电力排查', status: '未开始' },
        { id: 'PROJ-2024-008', name: '西侧给水管线普查', status: '实施中' }
    ];

    const devices = [
        {
            id: 'LD-GTL310-66P',
            name: '雷达小车 66P',
            model: 'GTL-310',
            protocol: 'MQTT',
            online: true,
            connection: 'connected',
            lastHeartbeat: '2026-06-08 09:42:16',
            lastReturnAt: '2026-06-08 09:41:52',
            taskState: '矩形探测中',
            projectId: 'PROJ-2024-001',
            projectName: '北区燃气干线探测',
            boundAt: '2026-06-08 08:10:22',
            boundBy: '陈明',
            battery: 82,
            voltage: 24.6
        },
        {
            id: 'LD-GTL310-77P',
            name: '雷达小车 77P',
            model: 'GTL-310',
            protocol: 'MQTT',
            online: true,
            connection: 'standby',
            lastHeartbeat: '2026-06-08 09:39:44',
            lastReturnAt: '2026-06-08 09:30:18',
            taskState: '待机',
            projectId: '',
            projectName: '',
            boundAt: '',
            boundBy: '',
            battery: 91,
            voltage: 24.9
        },
        {
            id: 'LD-GTL310-88P',
            name: '雷达小车 88P',
            model: 'GTL-310',
            protocol: 'MQTT',
            online: false,
            connection: 'offline',
            lastHeartbeat: '2026-06-07 17:18:02',
            lastReturnAt: '2026-06-07 17:12:10',
            taskState: '离线',
            projectId: 'PROJ-2024-003',
            projectName: '南区雨污管网复检',
            boundAt: '2026-06-07 15:22:41',
            boundBy: '李珊',
            battery: 36,
            voltage: 22.1
        },
        {
            id: 'LD-GTL310-95P',
            name: '雷达小车 95P',
            model: 'GTL-310 Pro',
            protocol: 'MQTT',
            online: true,
            connection: 'warning',
            lastHeartbeat: '2026-06-08 09:33:05',
            lastReturnAt: '2026-06-08 09:25:31',
            taskState: '回传待处理',
            projectId: 'PROJ-2024-005',
            projectName: '综合管廊电力排查',
            boundAt: '2026-06-08 08:35:10',
            boundBy: '王敏',
            battery: 58,
            voltage: 23.8
        }
    ];

    let bindingRecords = [
        { id: 'BND-1042', deviceId: 'LD-GTL310-66P', type: '绑定', fromProject: '-', toProject: '北区燃气干线探测', operator: '陈明', time: '2026-06-08 08:10:22', reason: '项目开始作业', status: '成功' },
        { id: 'BND-1041', deviceId: 'LD-GTL310-95P', type: '换绑', fromProject: '南区雨污管网复检', toProject: '综合管廊电力排查', operator: '王敏', time: '2026-06-08 08:35:10', reason: '现场设备调度', status: '成功' },
        { id: 'BND-1039', deviceId: 'LD-GTL310-77P', type: '解绑', fromProject: '西侧给水管线普查', toProject: '-', operator: '赵工', time: '2026-06-07 18:02:44', reason: '作业结束回收', status: '成功' }
    ];

    const returnRecords = [
        { id: 'RET-2108', deviceId: 'LD-GTL310-66P', projectName: '北区燃气干线探测', type: 'gpr_detection', messageId: 'up-gpr-2108', responseTo: 'cmd-104', topic: '/ypd/prod/platform/LD-GTL310-66P', time: '2026-06-08 09:41:52', status: '已处理', summary: '测线 A303_0007，2 条候选管线' },
        { id: 'RET-2107', deviceId: 'LD-GTL310-66P', projectName: '北区燃气干线探测', type: 'vehicle_pose', messageId: 'up-pose-2107', responseTo: '-', topic: '/ypd/prod/platform/LD-GTL310-66P', time: '2026-06-08 09:41:12', status: '已处理', summary: 'X 2347186.21 / Y 434430.08 / yaw 46.2' },
        { id: 'RET-2105', deviceId: 'LD-GTL310-95P', projectName: '综合管廊电力排查', type: 'task_status', messageId: 'up-task-2105', responseTo: 'cmd-099', topic: '/ypd/prod/platform/LD-GTL310-95P', time: '2026-06-08 09:25:31', status: '待处理', summary: '任务暂停，存在未同步文件' },
        { id: 'RET-2098', deviceId: 'LD-GTL310-88P', projectName: '南区雨污管网复检', type: 'battery_status', messageId: 'up-battery-2098', responseTo: '-', topic: '/ypd/prod/platform/LD-GTL310-88P', time: '2026-06-07 17:12:10', status: '已处理', summary: '36% / 22.1V' }
    ];

    const state = {
        selectedDeviceId: devices[0].id,
        query: '',
        bindingFilter: 'all',
        modalAction: 'bind',
        modalDeviceId: '',
        removeDeviceId: '',
        recordView: {
            type: '',
            deviceId: '',
            page: 1,
            pageSize: 10,
            startDate: '',
            endDate: '',
            projectName: 'all'
        }
    };

    function getDeviceById(deviceId) {
        return devices.find(device => device.id === deviceId) || devices[0];
    }

    function getProjectById(projectId) {
        return projects.find(project => project.id === projectId);
    }

    function getInputValue(id) {
        const el = document.getElementById(id);
        if (!el) return '';
        if ('value' in el) return String(el.value ?? '').trim();
        return String(el.dataset?.value ?? el.textContent ?? '').trim();
    }

    function setInputValue(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        const textValue = String(value ?? '');
        if ('value' in el) {
            el.value = textValue;
            return;
        }
        el.dataset.value = textValue;
        el.textContent = textValue;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function buildDeviceTopicTemplates(env, deviceCode) {
        const envValue = String(env || 'prod').trim() || 'prod';
        const code = String(deviceCode || '{deviceCode}').trim() || '{deviceCode}';
        return {
            downTopic: `/ypd/${envValue}/device/${code}`,
            upTopic: `/ypd/${envValue}/platform/${code}`
        };
    }

    function syncDeviceAccessTopics() {
        const templates = buildDeviceTopicTemplates(getInputValue('deviceAccessEnv'), getInputValue('deviceAccessCode').toUpperCase() || '{deviceCode}');
        setInputValue('deviceAccessDownTopic', templates.downTopic);
        setInputValue('deviceAccessUpTopic', templates.upTopic);
    }

    function getConnectionMeta(device) {
        if (isDeviceOffline(device)) {
            return { label: '离线', className: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
        }
        if (device.connection === 'connected') {
            return { label: '已连接', className: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500 animate-pulse' };
        }
        if (device.connection === 'warning') {
            return { label: '需处理', className: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' };
        }
        return { label: '待连接', className: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' };
    }

    function isDeviceOffline(device) {
        return !device?.online || device.connection === 'offline';
    }

    function getBindingLabel(device) {
        return device.projectId ? device.projectName : '未绑定项目';
    }

    function getBatteryLabel(device) {
        const battery = Number(device.battery);
        const voltage = Number(device.voltage);
        if (!Number.isFinite(battery) || !Number.isFinite(voltage) || voltage <= 0) {
            return '未上报';
        }
        return `${battery}% / ${voltage}V`;
    }

    function renderConnectionBadge(device) {
        const meta = getConnectionMeta(device);
        return `<span class="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold ${meta.className}"><span class="size-1.5 rounded-full ${meta.dot}"></span>${meta.label}</span>`;
    }

    function renderStats() {
        const total = devices.length;
        const connected = devices.filter(device => device.connection === 'connected').length;
        const bound = devices.filter(device => device.projectId).length;
        const pendingReturns = returnRecords.filter(record => record.status === '待处理').length;
        setText('scTotalDevices', total);
        setText('scConnectedDevices', connected);
        setText('scBoundDevices', bound);
        setText('scPendingReturns', pendingReturns);
    }

    function getFilteredDevices() {
        return devices.filter(device => {
            const query = state.query.trim().toLowerCase();
            const matchesQuery = !query || [device.id, device.name, device.model, device.projectName].some(value => String(value).toLowerCase().includes(query));
            const matchesBinding = state.bindingFilter === 'all'
                || (state.bindingFilter === 'bound' && device.projectId)
                || (state.bindingFilter === 'unbound' && !device.projectId);
            return matchesQuery && matchesBinding;
        });
    }

    function getBindingRecords(deviceId) {
        return bindingRecords.filter(record => record.deviceId === deviceId);
    }

    function getReturnRecords(deviceId) {
        return returnRecords.filter(record => record.deviceId === deviceId);
    }

    function formatEmpty(value) {
        return value || '-';
    }

    function getBindingActionBadge(type) {
        const meta = {
            '绑定': { icon: 'link', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
            '换绑': { icon: 'sync_alt', className: 'bg-blue-50 text-blue-700 border-blue-100' },
            '解绑': { icon: 'link_off', className: 'bg-rose-50 text-rose-700 border-rose-100' }
        }[type] || { icon: 'history', className: 'bg-slate-50 text-slate-600 border-slate-100' };
        return `<span class="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-bold ${meta.className}"><span class="material-symbols-outlined text-sm">${meta.icon}</span>${escapeHtml(type)}</span>`;
    }

    function getRecordStatusBadge(status) {
        const meta = status === '待处理'
            ? { className: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' }
            : { className: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' };
        return `<span class="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold ${meta.className}"><span class="size-1.5 rounded-full ${meta.dot}"></span>${escapeHtml(status)}</span>`;
    }

    function getMessageTypeBadge(type) {
        const meta = {
            gpr_detection: { label: '探测结果', className: 'bg-violet-50 text-violet-700 border-violet-100' },
            vehicle_pose: { label: '车辆定位', className: 'bg-sky-50 text-sky-700 border-sky-100' },
            task_status: { label: '任务状态', className: 'bg-amber-50 text-amber-700 border-amber-100' },
            battery_status: { label: '电池状态', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
        }[type] || { label: type, className: 'bg-slate-50 text-slate-600 border-slate-100' };
        return `<span class="inline-flex rounded-md border px-2 py-1 text-[11px] font-bold ${meta.className}">${escapeHtml(meta.label)}</span>`;
    }

    function renderSummaryMetric(label, value, detail = '') {
        return `
            <div class="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <span class="block text-[11px] font-semibold text-slate-400">${escapeHtml(label)}</span>
                <strong class="mt-0.5 block text-sm text-slate-800 dark:text-white">${escapeHtml(value)}</strong>
                ${detail ? `<span class="mt-0.5 block truncate text-[11px] text-slate-400" title="${escapeHtml(detail)}">${escapeHtml(detail)}</span>` : ''}
            </div>
        `;
    }

    function getRecordDate(record) {
        return String(record.time || '').slice(0, 10);
    }

    function getRecordProjectNames(rows, type) {
        const names = rows.flatMap(record => type === 'binding-history'
            ? [record.fromProject, record.toProject]
            : [record.projectName]);
        return [...new Set(names.filter(name => name && name !== '-'))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
    }

    function recordMatchesProject(record, type, projectName) {
        if (!projectName || projectName === 'all') return true;
        if (type === 'binding-history') {
            return record.fromProject === projectName || record.toProject === projectName;
        }
        return record.projectName === projectName;
    }

    function getFilteredRecordRows(rows, type) {
        const { startDate, endDate, projectName } = state.recordView;
        return rows.filter(record => {
            const date = getRecordDate(record);
            const matchesStart = !startDate || date >= startDate;
            const matchesEnd = !endDate || date <= endDate;
            return matchesStart && matchesEnd && recordMatchesProject(record, type, projectName);
        });
    }

    function renderRecordProjectOptions(rows, type) {
        const select = document.getElementById('recordProjectFilter');
        if (!select) return;
        const names = getRecordProjectNames(rows, type);
        if (state.recordView.projectName !== 'all' && !names.includes(state.recordView.projectName)) {
            state.recordView.projectName = 'all';
        }
        select.innerHTML = '<option value="all">全部绑定项目</option>' + names.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
        select.value = state.recordView.projectName;
    }

    function syncRecordFilterControls() {
        const start = document.getElementById('recordStartDate');
        const end = document.getElementById('recordEndDate');
        if (start) start.value = state.recordView.startDate;
        if (end) end.value = state.recordView.endDate;
    }

    function renderRecordPager(totalRows, pageRows, pageCount) {
        const page = state.recordView.page;
        const startIndex = totalRows ? (page - 1) * state.recordView.pageSize + 1 : 0;
        const endIndex = totalRows ? startIndex + pageRows.length - 1 : 0;
        setText('recordPagerInfo', `共 ${totalRows} 条，显示 ${startIndex}-${endIndex} 条，每页 10 条`);
        setText('recordPagerPage', `${page} / ${pageCount}`);
        const prev = document.getElementById('recordPrevPage');
        const next = document.getElementById('recordNextPage');
        if (prev) prev.disabled = page <= 1;
        if (next) next.disabled = page >= pageCount;
    }

    function renderDeviceTable() {
        const body = document.getElementById('deviceTableBody');
        if (!body) return;
        const rows = getFilteredDevices();
        if (!rows.length) {
            body.innerHTML = '<tr><td colspan="8" class="px-4 py-10 text-center text-sm text-slate-400">暂无匹配设备</td></tr>';
            return;
        }
        body.innerHTML = rows.map(device => {
            const isSelected = device.id === state.selectedDeviceId;
            const bindAction = device.projectId ? 'rebind' : 'bind';
            const bindText = device.projectId ? '换绑' : '绑定';
            const rebindBlocked = bindAction === 'rebind' && isDeviceOffline(device);
            const removeBlocked = Boolean(device.projectId);
            const bindButtonTitle = rebindBlocked ? '离线设备不可换绑，请先恢复连接' : bindText;
            const bindButtonClass = rebindBlocked
                ? 'border-slate-200 bg-slate-100 text-slate-400 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100';
            const removeButtonClass = removeBlocked
                ? 'border-slate-200 bg-slate-100 text-slate-400 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100';
            const removeButtonTitle = removeBlocked ? '请先解绑项目后再移除设备' : '移除设备接入登记';
            const historyCount = getBindingRecords(device.id).length;
            const returnCount = getReturnRecords(device.id).length;
            return `
                <tr data-device-row="${escapeHtml(device.id)}" class="${isSelected ? 'bg-emerald-50/70 dark:bg-emerald-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'} transition-colors">
                    <td class="px-4 py-3">
                        <button type="button" class="text-left" data-select-device="${escapeHtml(device.id)}">
                            <span class="block text-sm font-bold text-slate-800 dark:text-white">${escapeHtml(device.id)}</span>
                            <span class="block text-xs text-slate-500">${escapeHtml(device.name)} / ${escapeHtml(device.model)}</span>
                        </button>
                    </td>
                    <td class="px-4 py-3">${renderConnectionBadge(device)}</td>
                    <td class="px-4 py-3 text-xs text-slate-500">${escapeHtml(device.lastHeartbeat)}</td>
                    <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-200">${escapeHtml(device.taskState)}</td>
                    <td class="px-4 py-3">
                        <span class="block max-w-[180px] truncate text-xs font-semibold text-slate-700 dark:text-slate-200" title="${escapeHtml(getBindingLabel(device))}">${escapeHtml(getBindingLabel(device))}</span>
                        <span class="text-[11px] text-slate-400">${device.projectId ? escapeHtml(device.projectId) : '空闲设备'}</span>
                    </td>
                    <td class="px-4 py-3 text-xs text-slate-500">${escapeHtml(device.lastReturnAt)}</td>
                    <td class="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200">${escapeHtml(getBatteryLabel(device))}</td>
                    <td class="px-4 py-3">
                        <div class="flex min-w-[300px] flex-wrap gap-1.5">
                            <button type="button" data-device-action="connect" data-device-id="${escapeHtml(device.id)}" class="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 px-2 text-[11px] font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300"><span class="material-symbols-outlined text-sm">link</span>连接</button>
                            <button type="button" data-device-action="${bindAction}" data-device-id="${escapeHtml(device.id)}" class="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold ${bindButtonClass}" title="${escapeHtml(bindButtonTitle)}" ${rebindBlocked ? 'disabled aria-disabled="true"' : ''}><span class="material-symbols-outlined text-sm">account_tree</span>${rebindBlocked ? '不可换绑' : bindText}</button>
                            ${device.projectId ? `<button type="button" data-device-action="unbind" data-device-id="${escapeHtml(device.id)}" class="inline-flex h-7 items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"><span class="material-symbols-outlined text-sm">link_off</span>解绑</button>` : ''}
                            <button type="button" data-device-action="remove" data-device-id="${escapeHtml(device.id)}" class="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] font-semibold ${removeButtonClass}" title="${escapeHtml(removeButtonTitle)}" ${removeBlocked ? 'disabled aria-disabled="true"' : ''}><span class="material-symbols-outlined text-sm">delete</span>${removeBlocked ? '不可移除' : '移除'}</button>
                            <button type="button" data-device-action="binding-history" data-device-id="${escapeHtml(device.id)}" class="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><span class="material-symbols-outlined text-sm">history</span>历史 ${historyCount}</button>
                            <button type="button" data-device-action="return-records" data-device-id="${escapeHtml(device.id)}" class="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600 hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><span class="material-symbols-outlined text-sm">assignment_returned</span>回传 ${returnCount}</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function openDeviceAccessModal() {
        setInputValue('deviceAccessCode', '');
        setInputValue('deviceAccessName', '');
        setInputValue('deviceAccessModel', '');
        setInputValue('deviceAccessProtocol', 'MQTT');
        setInputValue('deviceAccessEnv', 'prod');
        setInputValue('deviceAccessRemark', '');
        syncDeviceAccessTopics();
        document.getElementById('deviceAccessModal')?.showModal();
        document.getElementById('deviceAccessCode')?.focus();
    }

    function closeDeviceAccessModal() {
        document.getElementById('deviceAccessModal')?.close();
    }

    function submitDeviceAccess() {
        const deviceId = getInputValue('deviceAccessCode').toUpperCase();
        const name = getInputValue('deviceAccessName');
        const model = getInputValue('deviceAccessModel');
        const protocol = getInputValue('deviceAccessProtocol') || 'MQTT';
        const accessEnv = getInputValue('deviceAccessEnv') || 'prod';
        const accessRemark = getInputValue('deviceAccessRemark');
        if (!deviceId || !name || !model) {
            setStatus('请完善设备编号、设备名称和设备型号');
            return;
        }
        if (devices.some(device => device.id === deviceId)) {
            setStatus('设备编号已存在');
            return;
        }

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const topics = buildDeviceTopicTemplates(accessEnv, deviceId);
        devices.unshift({
            id: deviceId,
            name,
            model,
            protocol,
            accessEnv,
            accessRemark,
            downTopic: topics.downTopic,
            upTopic: topics.upTopic,
            accessedAt: now,
            accessedBy: '陈明',
            online: true,
            connection: 'standby',
            lastHeartbeat: '-',
            lastReturnAt: '-',
            taskState: '未开始',
            projectId: '',
            projectName: '',
            boundAt: '',
            boundBy: '',
            battery: null,
            voltage: null
        });
        state.selectedDeviceId = deviceId;
        state.query = '';
        state.bindingFilter = 'all';
        setInputValue('systemConsoleSearch', '');
        setInputValue('systemConsoleBindingFilter', 'all');
        closeDeviceAccessModal();
        renderAll();
        setStatus(`${deviceId} 新增设备接入成功，当前为未绑定待连接状态`);
    }

    function openDeviceRemoveModal(deviceId) {
        const device = getDeviceById(deviceId);
        if (!device) return;
        if (device.projectId) {
            state.selectedDeviceId = device.id;
            renderAll();
            setStatus(`${device.id} 请先解绑项目后再移除设备`);
            return;
        }
        state.removeDeviceId = device.id;
        setText('deviceRemoveModalDevice', `${device.id} / ${device.name}`);
        setText('deviceRemoveModalProject', getBindingLabel(device));
        setInputValue('deviceRemoveReason', '设备退役或接入作废');
        document.getElementById('deviceRemoveModal')?.showModal();
    }

    function closeDeviceRemoveModal() {
        document.getElementById('deviceRemoveModal')?.close();
    }

    function submitDeviceRemoval() {
        const index = devices.findIndex(device => device.id === state.removeDeviceId);
        if (index < 0) {
            setStatus('未找到要移除的设备');
            return;
        }
        const device = devices[index];
        if (device.projectId) {
            setStatus(`${device.id} 请先解绑项目后再移除设备`);
            return;
        }
        devices.splice(index, 1);
        state.selectedDeviceId = devices[0]?.id || '';
        state.removeDeviceId = '';
        closeDeviceRemoveModal();
        renderAll();
        setStatus(`${device.id} 已移除设备接入登记`);
    }

    function renderProjectOptions(currentProjectId = '', action = 'bind') {
        const select = document.getElementById('deviceProjectSelect');
        if (!select) return;
        const shouldDisableCurrent = action === 'rebind' && currentProjectId;
        select.innerHTML = '<option value="">请选择目标项目</option>' + projects.map(project => `
            <option value="${escapeHtml(project.id)}" ${shouldDisableCurrent && project.id === currentProjectId ? 'disabled' : ''}>${escapeHtml(project.id)} / ${escapeHtml(project.name)} / ${escapeHtml(project.status)}${shouldDisableCurrent && project.id === currentProjectId ? ' / 当前绑定' : ''}</option>
        `).join('');
    }

    function openDeviceModal(action, deviceId) {
        const device = getDeviceById(deviceId);
        if (action === 'rebind' && isDeviceOffline(device)) {
            state.selectedDeviceId = device.id;
            renderAll();
            setStatus(`${device.id} 离线设备不可换绑，请先恢复连接`);
            return;
        }
        state.modalAction = action;
        state.modalDeviceId = deviceId;
        const isUnbind = action === 'unbind';
        const titleMap = { bind: '绑定项目', rebind: '换绑项目', unbind: '解绑设备' };
        setText('deviceBindModalTitle', titleMap[action] || '绑定项目');
        setText('deviceBindModalDevice', `${device.id} / ${device.name}`);
        setText('deviceBindModalCurrentProject', getBindingLabel(device));
        const projectField = document.getElementById('deviceProjectField');
        if (projectField) projectField.classList.toggle('hidden', isUnbind);
        const reason = document.getElementById('deviceBindReason');
        if (reason) reason.value = action === 'rebind' ? '现场设备调度' : action === 'unbind' ? '作业结束或设备回收' : '项目开始作业';
        const help = document.getElementById('deviceProjectHelp');
        if (help) {
            help.textContent = action === 'rebind'
                ? '换绑会关闭当前有效绑定，并将设备切换到新的目标项目。'
                : '绑定成功后，该设备会成为目标项目的当前有效设备。';
        }
        renderProjectOptions(device.projectId, action);
        document.getElementById('deviceBindModal')?.showModal();
    }

    function closeDeviceModal() {
        document.getElementById('deviceBindModal')?.close();
    }

    function closeRecordModal() {
        document.getElementById('recordViewModal')?.close();
    }

    function openRecordModal(type, deviceId) {
        const device = getDeviceById(deviceId);
        state.selectedDeviceId = device.id;
        state.recordView = {
            type,
            deviceId: device.id,
            page: 1,
            pageSize: 10,
            startDate: '',
            endDate: '',
            projectName: 'all'
        };
        renderDeviceTable();
        renderRecordModal();
        document.getElementById('recordViewModal')?.showModal();
    }

    function renderRecordModal() {
        const { type, deviceId, pageSize } = state.recordView;
        if (!type || !deviceId) return;

        const device = getDeviceById(deviceId);

        const title = type === 'binding-history' ? '绑定/换绑历史' : '设备回传记录';
        const rows = type === 'binding-history' ? getBindingRecords(device.id) : getReturnRecords(device.id);
        renderRecordProjectOptions(rows, type);
        syncRecordFilterControls();
        const filteredRows = getFilteredRecordRows(rows, type);
        const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
        state.recordView.page = Math.min(Math.max(1, state.recordView.page), pageCount);
        const pageStart = (state.recordView.page - 1) * pageSize;
        const pageRows = filteredRows.slice(pageStart, pageStart + pageSize);

        setText('recordViewTitle', `${device.name} ${title}`);
        setText('recordViewMeta', `${device.id} / ${getBindingLabel(device)} / 共 ${rows.length} 条，筛选后 ${filteredRows.length} 条`);

        const head = document.getElementById('recordViewHead');
        const body = document.getElementById('recordViewBody');
        const table = document.getElementById('recordViewTable');
        const summary = document.getElementById('recordViewSummary');
        if (!head || !body) return;
        if (table) table.className = type === 'binding-history' ? 'w-full min-w-[940px] text-left' : 'w-full min-w-[1320px] text-left';

        if (type === 'binding-history') {
            if (summary) {
                const latest = filteredRows[0]?.time || '-';
                const lastAction = filteredRows[0]?.type || '-';
                summary.innerHTML = [
                    renderSummaryMetric('筛选结果', `${filteredRows.length} 条`, `共 ${rows.length} 条历史流水`),
                    renderSummaryMetric('最近操作', lastAction, latest),
                    renderSummaryMetric('当前有效项目', getBindingLabel(device), device.projectId || '未绑定')
                ].join('');
            }
            head.innerHTML = `
                <tr>
                    <th class="px-3 py-2">操作</th>
                    <th class="px-3 py-2">绑定变更</th>
                    <th class="px-3 py-2">操作信息</th>
                    <th class="px-3 py-2">原因</th>
                    <th class="px-3 py-2">状态</th>
                </tr>
            `;
            body.innerHTML = pageRows.length ? pageRows.map(record => `
                <tr class="align-top hover:bg-slate-50/80 dark:hover:bg-slate-900/60">
                    <td class="px-3 py-3">${getBindingActionBadge(record.type)}</td>
                    <td class="px-3 py-3">
                        <div class="flex items-center gap-2 text-xs">
                            <span class="max-w-[180px] truncate text-slate-500" title="${escapeHtml(formatEmpty(record.fromProject))}">${escapeHtml(formatEmpty(record.fromProject))}</span>
                            <span class="material-symbols-outlined text-sm text-slate-300">arrow_forward</span>
                            <span class="max-w-[220px] truncate font-semibold text-slate-800 dark:text-slate-100" title="${escapeHtml(formatEmpty(record.toProject))}">${escapeHtml(formatEmpty(record.toProject))}</span>
                        </div>
                        <span class="mt-1 block text-[11px] text-slate-400">${escapeHtml(record.id)}</span>
                    </td>
                    <td class="px-3 py-3">
                        <span class="block text-xs font-semibold text-slate-700 dark:text-slate-200">${escapeHtml(record.operator)}</span>
                        <span class="mt-1 block text-[11px] text-slate-400">${escapeHtml(record.time)}</span>
                    </td>
                    <td class="px-3 py-3 text-xs text-slate-500">${escapeHtml(record.reason)}</td>
                    <td class="px-3 py-3">${getRecordStatusBadge(record.status)}</td>
                </tr>
            `).join('') : '<tr><td colspan="5" class="px-3 py-10 text-center text-xs text-slate-400">暂无符合筛选条件的绑定/换绑历史</td></tr>';
        } else {
            if (summary) {
                const pending = filteredRows.filter(record => record.status === '待处理').length;
                const latest = filteredRows[0]?.time || '-';
                const latestType = filteredRows[0]?.type || '-';
                summary.innerHTML = [
                    renderSummaryMetric('筛选结果', `${filteredRows.length} 条`, `共 ${rows.length} 条设备上行消息`),
                    renderSummaryMetric('待处理', `${pending} 条`, pending ? '需要管理员确认' : '暂无待处理'),
                    renderSummaryMetric('最近回传', latest, latestType)
                ].join('');
            }
            head.innerHTML = `
                <tr>
                    <th class="w-[120px] px-3 py-2">类型</th>
                    <th class="w-[96px] px-3 py-2">状态</th>
                    <th class="w-[220px] px-3 py-2">关联项目</th>
                    <th class="w-[280px] px-3 py-2">回传摘要</th>
                    <th class="w-[160px] px-3 py-2">消息编号</th>
                    <th class="w-[140px] px-3 py-2">响应指令</th>
                    <th class="w-[280px] px-3 py-2">返回结果</th>
                </tr>
            `;
            body.innerHTML = pageRows.length ? pageRows.map(record => `
                <tr class="align-top hover:bg-slate-50/80 dark:hover:bg-slate-900/60">
                    <td class="px-3 py-3">${getMessageTypeBadge(record.type)}</td>
                    <td class="px-3 py-3">${getRecordStatusBadge(record.status)}</td>
                    <td class="px-3 py-3">
                        <span class="block max-w-[200px] truncate text-xs font-semibold text-slate-700 dark:text-slate-200" title="${escapeHtml(record.projectName)}">${escapeHtml(record.projectName)}</span>
                        <span class="mt-1 block text-[11px] text-slate-400">回传时间：${escapeHtml(record.time)}</span>
                    </td>
                    <td class="px-3 py-3 text-xs text-slate-600 dark:text-slate-300">
                        <span class="block max-w-[260px] truncate" title="${escapeHtml(record.summary)}">${escapeHtml(record.summary)}</span>
                        <span class="mt-1 block text-[11px] text-slate-400">回传记录：${escapeHtml(record.id)}</span>
                    </td>
                    <td class="px-3 py-3">
                        <span class="block max-w-[150px] truncate rounded bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700 dark:bg-slate-900 dark:text-slate-200" title="${escapeHtml(record.messageId)}">${escapeHtml(record.messageId)}</span>
                    </td>
                    <td class="px-3 py-3">
                        <span class="block max-w-[120px] truncate text-xs text-slate-500" title="${escapeHtml(record.responseTo)}">${escapeHtml(record.responseTo)}</span>
                    </td>
                    <td class="px-3 py-3">
                        <span class="block max-w-[260px] truncate rounded bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-500 dark:bg-slate-900" title="${escapeHtml(record.topic)}">${escapeHtml(record.topic)}</span>
                    </td>
                </tr>
            `).join('') : '<tr><td colspan="7" class="px-3 py-10 text-center text-xs text-slate-400">暂无符合筛选条件的设备回传记录</td></tr>';
        }

        renderRecordPager(filteredRows.length, pageRows, pageCount);
    }

    function submitDeviceBinding() {
        const device = getDeviceById(state.modalDeviceId);
        const projectId = document.getElementById('deviceProjectSelect')?.value || '';
        const reason = document.getElementById('deviceBindReason')?.value.trim() || '未填写';
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const action = state.modalAction;
        const oldProjectName = device.projectName || '-';
        if (action === 'rebind' && isDeviceOffline(device)) {
            setStatus(`${device.id} 离线设备不可换绑，请先恢复连接`);
            return;
        }
        if (action !== 'unbind') {
            const targetProject = getProjectById(projectId);
            if (!targetProject) {
                setStatus('请选择目标项目');
                return;
            }
            if (action === 'rebind' && projectId === device.projectId) {
                setStatus('请选择不同于当前绑定的目标项目');
                return;
            }
            device.projectId = targetProject.id;
            device.projectName = targetProject.name;
            device.boundAt = now;
            device.boundBy = '陈明';
        } else {
            device.projectId = '';
            device.projectName = '';
            device.boundAt = '';
            device.boundBy = '';
        }
        bindingRecords = [{
            id: `BND-${String(1100 + bindingRecords.length).padStart(4, '0')}`,
            deviceId: device.id,
            type: action === 'bind' ? '绑定' : action === 'rebind' ? '换绑' : '解绑',
            fromProject: oldProjectName,
            toProject: action === 'unbind' ? '-' : device.projectName,
            operator: '陈明',
            time: now,
            reason,
            status: '成功'
        }, ...bindingRecords];
        state.selectedDeviceId = device.id;
        closeDeviceModal();
        renderAll();
        setStatus(`${device.id} ${action === 'unbind' ? '已解绑' : '绑定关系已更新'}`);
    }

    function connectDevice(deviceId) {
        const device = getDeviceById(deviceId);
        if (!device.online) {
            device.connection = 'offline';
            setStatus(`${device.id} 当前离线，连接失败`);
        } else {
            device.connection = 'connected';
            device.lastHeartbeat = new Date().toISOString().slice(0, 19).replace('T', ' ');
            setStatus(`${device.id} 连接成功`);
        }
        state.selectedDeviceId = device.id;
        renderAll();
    }

    function setStatus(message) {
        setText('systemConsoleStatus', message);
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function updateRecordFilters(nextFilters) {
        state.recordView = { ...state.recordView, ...nextFilters, page: 1 };
        renderRecordModal();
    }

    function resetRecordFilters() {
        state.recordView = {
            ...state.recordView,
            page: 1,
            startDate: '',
            endDate: '',
            projectName: 'all'
        };
        renderRecordModal();
    }

    function changeRecordPage(delta) {
        state.recordView.page += delta;
        renderRecordModal();
    }

    function renderAll() {
        renderStats();
        renderDeviceTable();
    }

    function bindEvents() {
        document.getElementById('openDeviceAccess')?.addEventListener('click', openDeviceAccessModal);
        document.getElementById('deviceAccessCancel')?.addEventListener('click', closeDeviceAccessModal);
        document.getElementById('deviceAccessSubmit')?.addEventListener('click', submitDeviceAccess);
        document.getElementById('deviceAccessCode')?.addEventListener('input', syncDeviceAccessTopics);
        document.getElementById('deviceAccessModal')?.addEventListener('cancel', event => {
            event.preventDefault();
            closeDeviceAccessModal();
        });
        document.getElementById('deviceRemoveCancel')?.addEventListener('click', closeDeviceRemoveModal);
        document.getElementById('deviceRemoveSubmit')?.addEventListener('click', submitDeviceRemoval);
        document.getElementById('deviceRemoveModal')?.addEventListener('cancel', event => {
            event.preventDefault();
            closeDeviceRemoveModal();
        });
        document.getElementById('systemConsoleSearch')?.addEventListener('input', event => {
            state.query = event.target.value;
            renderDeviceTable();
        });
        document.getElementById('systemConsoleBindingFilter')?.addEventListener('change', event => {
            state.bindingFilter = event.target.value;
            renderDeviceTable();
        });
        document.addEventListener('click', event => {
            const selectButton = event.target.closest('[data-select-device]');
            if (selectButton) {
                state.selectedDeviceId = selectButton.dataset.selectDevice;
                renderAll();
                return;
            }
            const actionButton = event.target.closest('[data-device-action]');
            if (actionButton) {
                const action = actionButton.dataset.deviceAction;
                const deviceId = actionButton.dataset.deviceId;
                if (action === 'connect') connectDevice(deviceId);
                if (action === 'remove') openDeviceRemoveModal(deviceId);
                if (action === 'bind' || action === 'rebind' || action === 'unbind') openDeviceModal(action, deviceId);
                if (action === 'binding-history' || action === 'return-records') openRecordModal(action, deviceId);
            }
        });
        document.getElementById('deviceBindCancel')?.addEventListener('click', closeDeviceModal);
        document.getElementById('deviceBindSubmit')?.addEventListener('click', submitDeviceBinding);
        document.getElementById('deviceBindModal')?.addEventListener('cancel', event => {
            event.preventDefault();
            closeDeviceModal();
        });
        document.getElementById('recordViewClose')?.addEventListener('click', closeRecordModal);
        document.getElementById('recordViewModal')?.addEventListener('cancel', event => {
            event.preventDefault();
            closeRecordModal();
        });
        document.getElementById('recordStartDate')?.addEventListener('change', event => updateRecordFilters({ startDate: event.target.value }));
        document.getElementById('recordEndDate')?.addEventListener('change', event => updateRecordFilters({ endDate: event.target.value }));
        document.getElementById('recordProjectFilter')?.addEventListener('change', event => updateRecordFilters({ projectName: event.target.value }));
        document.getElementById('recordFilterReset')?.addEventListener('click', resetRecordFilters);
        document.getElementById('recordPrevPage')?.addEventListener('click', () => changeRecordPage(-1));
        document.getElementById('recordNextPage')?.addEventListener('click', () => changeRecordPage(1));
    }

    function initSystemConsole() {
        bindEvents();
        renderAll();
        setStatus('等待设备管理操作');
    }

    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', initSystemConsole);
    }

    return {
        projects,
        devices,
        returnRecords,
        getConnectionMeta,
        buildDeviceTopicTemplates,
        initSystemConsole
    };
});
