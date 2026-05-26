(function (root, factory) {
    const api = factory(root.RadarPrototype, root.RadarAdapter);
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.ProjectConsole = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (radarPrototype, radarAdapterApi) {
    const BINDINGS_STORAGE_KEY = 'project-console-device-bindings-v1';
    const SETTINGS_STORAGE_KEY = 'project-console-device-settings-v1';

    const DEFAULT_PROJECT_DEVICE_BINDINGS = {
        'PROJ-2024-001': {
            deviceId: 'LD-GTL310-66P',
            directionDeg: 45,
            initialPoint: { x: 2347184.25, y: 434427.06, elevation: 4.82 },
            surveyLineId: 'A303_2026-04-21_0001_0',
            scanMode: 'straight',
            coordinateSystem: 'CGCS2000'
        },
        'PROJ-2024-003': {
            deviceId: 'LD-GTL310-88P',
            directionDeg: 315,
            initialPoint: { x: 2353180.42, y: 436812.5, elevation: 5.36 },
            surveyLineId: 'HV404_2026-04-21_0001_0',
            scanMode: 'straight',
            coordinateSystem: 'CGCS2000'
        },
        'PROJ-2024-005': {
            deviceId: 'LD-GTL310-77P',
            directionDeg: 90,
            initialPoint: { x: 2349122.72, y: 435278.18, elevation: 4.95 },
            surveyLineId: 'TXGX_2026-04-21_0001_0',
            scanMode: 'zigzag',
            coordinateSystem: 'CGCS2000'
        }
    };

    const state = {
        adapter: null,
        projectId: '',
        binding: null,
        devices: [],
        currentDevice: null,
        connected: false,
        queueItems: [],
        ledgerRows: [],
        ack: null,
        statusMessage: '等待设备对接'
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function readJsonStorage(storage, key, fallback) {
        if (!storage) return fallback;
        try {
            const parsed = JSON.parse(storage.getItem(key) || 'null');
            return parsed && typeof parsed === 'object' ? parsed : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function getCurrentProjectId(locationLike) {
        const search = locationLike?.search || '';
        const params = new URLSearchParams(search);
        return params.get('id') || params.get('projectId') || '';
    }

    function getStoredBindings(storage) {
        return readJsonStorage(storage, BINDINGS_STORAGE_KEY, {});
    }

    function resolveProjectDeviceBinding(projectId, storedBindings = {}) {
        const binding = storedBindings[projectId] || DEFAULT_PROJECT_DEVICE_BINDINGS[projectId] || null;
        return binding ? clone(binding) : null;
    }

    function getSavedSettings(storage, projectId) {
        const allSettings = readJsonStorage(storage, SETTINGS_STORAGE_KEY, {});
        return allSettings[projectId] || {};
    }

    function saveSettings(storage, projectId, nextSettings) {
        if (!storage || !projectId) return;
        const allSettings = readJsonStorage(storage, SETTINGS_STORAGE_KEY, {});
        allSettings[projectId] = { ...(allSettings[projectId] || {}), ...nextSettings };
        storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(allSettings));
    }

    function formatFixed(value, digits = 2) {
        const number = Number(value);
        return Number.isFinite(number) ? number.toFixed(digits) : '-';
    }

    function formatDirection(degrees) {
        const normalized = ((Number(degrees) % 360) + 360) % 360;
        if (normalized === 0) return '正北 0°';
        if (normalized === 90) return '正东 90°';
        if (normalized === 180) return '正南 180°';
        if (normalized === 270) return '正西 270°';
        if (normalized < 90) return `北偏东 ${Math.round(normalized)}°`;
        if (normalized < 180) return `南偏东 ${Math.round(180 - normalized)}°`;
        if (normalized < 270) return `南偏西 ${Math.round(normalized - 180)}°`;
        return `北偏西 ${Math.round(360 - normalized)}°`;
    }

    function getDeviceStatusMeta(status, connected = false) {
        if (connected) {
            return { label: '已对接', dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
        }
        const map = {
            online: { label: '在线', dot: 'bg-green-500', text: 'text-green-600', badge: 'bg-green-50 text-green-700 border-green-100' },
            standby: { label: '待机', dot: 'bg-amber-500', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-100' },
            offline: { label: '离线', dot: 'bg-slate-400', text: 'text-slate-500', badge: 'bg-slate-50 text-slate-600 border-slate-200' }
        };
        return map[status] || map.offline;
    }

    function buildInitializationInput({ projectId, binding, fields = {} }) {
        const initialPoint = binding?.initialPoint || {};
        return {
            deviceId: binding?.deviceId || '',
            projectIds: projectId ? [projectId] : [],
            surveyLineId: fields.surveyLineId || binding?.surveyLineId || '',
            scanMode: fields.scanMode || binding?.scanMode || 'straight',
            hostPermittivity: fields.hostPermittivity ?? 10,
            timeWindowNs: fields.timeWindowNs ?? 21,
            distanceScaleMPerPx: fields.distanceScaleMPerPx ?? 0.01,
            antennaConfig: fields.antennaConfig ?? 0,
            coordinateSystem: fields.coordinateSystem || binding?.coordinateSystem || 'CGCS2000',
            initialX: fields.initialX ?? initialPoint.x ?? '',
            initialY: fields.initialY ?? initialPoint.y ?? '',
            initialElevation: fields.initialElevation ?? initialPoint.elevation ?? '',
            directionDeg: fields.directionDeg ?? binding?.directionDeg ?? 0
        };
    }

    function normalizeStatusLabel(status) {
        const labels = {
            pending_review: '待研判',
            accepted: '已接入',
            needs_review: '需复核'
        };
        return labels[status] || status || '-';
    }

    function formatCandidateCoordinate(candidate) {
        if (!candidate?.coordinateValid) return '无有效坐标';
        const point = candidate.vertexCoordinate || {};
        return `${candidate.coordinateSystem} ${formatFixed(point.longitude, 6)}, ${formatFixed(point.latitude, 6)}, ${formatFixed(point.elevation_m, 2)}m`;
    }

    function buildDetectionLedgerRows(queueItems = [], parser = radarPrototype) {
        if (!parser?.parseDetectionMessage) return [];
        return queueItems.flatMap(item => {
            const parsed = parser.parseDetectionMessage(item.message);
            if (!parsed.ok) {
                return [{
                    id: item.id,
                    receivedAt: item.receivedAt || '',
                    surveyLine: '-',
                    category: '解析失败',
                    depthM: '-',
                    confidence: '-',
                    coordinate: parsed.error,
                    status: 'error',
                    statusLabel: '解析失败',
                    rawStatus: item.status || ''
                }];
            }
            return parsed.candidates.map(candidate => ({
                id: `${item.id}-${candidate.pipeId}`,
                receivedAt: item.receivedAt || parsed.surveyLine.processingTime || '',
                surveyLine: parsed.surveyLine.fileName || '-',
                category: candidate.categoryLabel || '-',
                depthM: `${formatFixed(candidate.depthM, 2)}m`,
                confidence: `${Math.round(Number(candidate.confidence || 0) * 100)}%`,
                coordinate: formatCandidateCoordinate(candidate),
                status: item.status || 'pending_review',
                statusLabel: normalizeStatusLabel(item.status || 'pending_review'),
                rawStatus: item.status || '',
                longitude: candidate.vertexCoordinate?.longitude,
                latitude: candidate.vertexCoordinate?.latitude,
                elevation: candidate.vertexCoordinate?.elevation_m
            }));
        });
    }

    function buildMapPointsFromLedgerRows(rows = []) {
        const validRows = rows.filter(row => Number.isFinite(Number(row.longitude)) && Number.isFinite(Number(row.latitude)));
        if (!validRows.length) return [];

        const longitudes = validRows.map(row => Number(row.longitude));
        const latitudes = validRows.map(row => Number(row.latitude));
        const minLon = Math.min(...longitudes);
        const maxLon = Math.max(...longitudes);
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const lonSpan = maxLon - minLon || 1;
        const latSpan = maxLat - minLat || 1;

        return validRows.map((row, index) => ({
            id: row.id,
            label: row.category,
            xPercent: 16 + ((Number(row.longitude) - minLon) / lonSpan) * 68,
            yPercent: 84 - ((Number(row.latitude) - minLat) / latSpan) * 68,
            depthM: row.depthM,
            confidence: row.confidence,
            index: index + 1
        }));
    }

    function createAdapter() {
        if (!radarAdapterApi?.createRadarAdapter || !radarPrototype) {
            return null;
        }
        return radarAdapterApi.createRadarAdapter({ radarPrototype });
    }

    function getFieldValues() {
        return {
            surveyLineId: document.getElementById('pcSurveyLineId')?.value,
            scanMode: document.getElementById('pcScanMode')?.value,
            hostPermittivity: document.getElementById('pcHostPermittivity')?.value,
            timeWindowNs: document.getElementById('pcTimeWindowNs')?.value,
            distanceScaleMPerPx: document.getElementById('pcDistanceScale')?.value,
            antennaConfig: document.getElementById('pcAntennaConfig')?.value,
            coordinateSystem: document.getElementById('pcCoordinateSystem')?.value,
            initialX: document.getElementById('pcInitialX')?.value,
            initialY: document.getElementById('pcInitialY')?.value,
            initialElevation: document.getElementById('pcInitialElevation')?.value,
            directionDeg: document.getElementById('pcDirectionDeg')?.value
        };
    }

    function getDeviceById(deviceId) {
        return state.devices.find(device => device.id === deviceId) || null;
    }

    function renderShell() {
        const container = document.getElementById('view-console');
        if (!container) return;
        container.innerHTML = `
            <div id="projectConsoleUnbound" class="hidden h-full">
                <div class="h-full grid place-items-center">
                    <div class="max-w-xl w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-8 text-center">
                        <span class="material-symbols-outlined text-amber-500 text-6xl mb-4">warning</span>
                        <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-2">未绑定设备</h3>
                        <p class="text-slate-600 dark:text-slate-400">当前项目尚未绑定探测设备，请联系管理员进行设备绑定。</p>
                    </div>
                </div>
            </div>
            <div id="projectConsoleWorkspace" class="hidden h-full min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-4">
                <section class="bg-white dark:bg-[#161e27] rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">developer_board</span>
                                <h3 class="text-base font-bold text-slate-900 dark:text-white">项目设备控制台</h3>
                                <span class="px-2 py-0.5 rounded border border-emerald-100 bg-emerald-50 text-[11px] font-medium text-emerald-700">项目负责人 / 勘探人员</span>
                            </div>
                            <p id="pcStatusMessage" class="mt-1 text-xs text-slate-500 dark:text-slate-400">等待设备对接</p>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button id="pcConnectBtn" class="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                                <span class="material-symbols-outlined text-base">settings_input_antenna</span>
                                设备对接
                            </button>
                            <button id="pcInitBtn" class="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <span class="material-symbols-outlined text-base">start</span>
                                下发初始值
                            </button>
                            <button id="pcPullBtn" class="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <span class="material-symbols-outlined text-base">sync</span>
                                同步回传
                            </button>
                        </div>
                    </div>
                    <div id="pcDeviceStatusGrid" class="mt-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-3"></div>
                </section>

                <section class="grid xl:grid-cols-[0.9fr_1.1fr] gap-4">
                    <div class="bg-white dark:bg-[#161e27] rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">tune</span>
                                初始值与方向
                            </h3>
                            <span id="pcAckBadge" class="text-[11px] text-slate-400">未下发</span>
                        </div>
                        <div class="grid sm:grid-cols-2 gap-3">
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">测线编号</span>
                                <input id="pcSurveyLineId" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">扫描模式</span>
                                <select id="pcScanMode" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                    <option value="straight">直线扫描</option>
                                    <option value="zigzag">折线扫描</option>
                                </select>
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">介电常数</span>
                                <input id="pcHostPermittivity" type="number" step="0.1" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">时间窗口(ns)</span>
                                <input id="pcTimeWindowNs" type="number" step="0.1" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">距离比例尺(m/px)</span>
                                <input id="pcDistanceScale" type="number" step="0.001" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">坐标系</span>
                                <select id="pcCoordinateSystem" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                    <option value="CGCS2000">CGCS2000</option>
                                    <option value="WGS84">WGS84</option>
                                </select>
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">初始 X</span>
                                <input id="pcInitialX" type="number" step="0.01" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">初始 Y</span>
                                <input id="pcInitialY" type="number" step="0.01" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">初始高程(m)</span>
                                <input id="pcInitialElevation" type="number" step="0.01" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">天线配置</span>
                                <select id="pcAntennaConfig" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                    <option value="0">单天线</option>
                                    <option value="1">双天线</option>
                                </select>
                            </label>
                            <label class="sm:col-span-2 space-y-2">
                                <span class="text-xs font-medium text-slate-500">设备方向：<b id="pcDirectionLabel" class="text-slate-800 dark:text-slate-100">正北 0°</b></span>
                                <div class="flex items-center gap-3">
                                    <input id="pcDirectionRange" type="range" min="0" max="359" class="flex-1 accent-[#5ad98b]">
                                    <input id="pcDirectionDeg" type="number" min="0" max="359" class="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                </div>
                            </label>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-[#161e27] rounded-lg border border-slate-200 dark:border-slate-700 p-4 flex flex-col min-h-[420px]">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">map</span>
                                实时地图定位
                            </h3>
                            <span id="pcMapSummary" class="text-[11px] text-slate-400">等待回传</span>
                        </div>
                        <div id="pcMapCanvas" class="relative flex-1 min-h-[320px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950"></div>
                    </div>
                </section>

                <section class="bg-white dark:bg-[#161e27] rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">table_chart</span>
                            探测记录回传台账
                        </h3>
                        <span id="pcLedgerCount" class="text-[11px] text-slate-400">0 条</span>
                    </div>
                    <div class="overflow-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table class="w-full min-w-[760px] text-xs">
                            <thead class="bg-slate-50 dark:bg-slate-900/60 sticky top-0">
                                <tr class="border-b border-slate-100 dark:border-slate-800">
                                    <th class="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">回传时间</th>
                                    <th class="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">测线</th>
                                    <th class="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">类型</th>
                                    <th class="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">深度</th>
                                    <th class="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">置信度</th>
                                    <th class="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">定位数据</th>
                                    <th class="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">状态</th>
                                </tr>
                            </thead>
                            <tbody id="pcLedgerBody" class="divide-y divide-slate-100 dark:divide-slate-800"></tbody>
                        </table>
                    </div>
                </section>
            </div>
        `;
    }

    function setWorkspaceVisible(hasBinding) {
        document.getElementById('projectConsoleUnbound')?.classList.toggle('hidden', hasBinding);
        document.getElementById('projectConsoleWorkspace')?.classList.toggle('hidden', !hasBinding);
    }

    function setStatusMessage(message) {
        state.statusMessage = message;
        const el = document.getElementById('pcStatusMessage');
        if (el) el.textContent = message;
    }

    function renderDeviceStatus() {
        const container = document.getElementById('pcDeviceStatusGrid');
        if (!container || !state.binding) return;
        const device = state.currentDevice || getDeviceById(state.binding.deviceId) || {};
        const status = getDeviceStatusMeta(device.status, state.connected);
        const queueCount = Number(device.queueCount || state.queueItems.length || 0);
        const direction = Number(getFieldValues().directionDeg || state.binding.directionDeg || 0);
        const cards = [
            ['precision_manufacturing', '绑定设备', state.binding.deviceId],
            ['sensors', '连接状态', `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border ${status.badge}"><span class="size-1.5 rounded-full ${status.dot}"></span>${status.label}</span>`],
            ['explore', '当前方向', formatDirection(direction)],
            ['article', '回传队列', `${queueCount} 条`]
        ];
        container.innerHTML = cards.map(([icon, label, value]) => `
            <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div class="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <span class="material-symbols-outlined text-sm">${icon}</span>
                    ${label}
                </div>
                <div class="font-bold text-slate-800 dark:text-white min-h-6">${value}</div>
            </div>
        `).join('');
    }

    function fillFormDefaults() {
        if (!state.binding) return;
        const saved = getSavedSettings(window.localStorage, state.projectId);
        const input = buildInitializationInput({ projectId: state.projectId, binding: state.binding, fields: saved });
        const fieldMap = {
            pcSurveyLineId: input.surveyLineId,
            pcScanMode: input.scanMode,
            pcHostPermittivity: input.hostPermittivity,
            pcTimeWindowNs: input.timeWindowNs,
            pcDistanceScale: input.distanceScaleMPerPx,
            pcAntennaConfig: input.antennaConfig,
            pcCoordinateSystem: input.coordinateSystem,
            pcInitialX: input.initialX,
            pcInitialY: input.initialY,
            pcInitialElevation: input.initialElevation,
            pcDirectionDeg: input.directionDeg,
            pcDirectionRange: input.directionDeg
        };
        Object.entries(fieldMap).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.value = value;
        });
        updateDirectionUi(input.directionDeg);
    }

    function updateDirectionUi(value) {
        const normalized = Math.max(0, Math.min(359, Number(value) || 0));
        const numberInput = document.getElementById('pcDirectionDeg');
        const rangeInput = document.getElementById('pcDirectionRange');
        const label = document.getElementById('pcDirectionLabel');
        if (numberInput) numberInput.value = normalized;
        if (rangeInput) rangeInput.value = normalized;
        if (label) label.textContent = formatDirection(normalized);
        renderDeviceStatus();
    }

    function renderMap() {
        const canvas = document.getElementById('pcMapCanvas');
        const summary = document.getElementById('pcMapSummary');
        if (!canvas) return;
        const points = buildMapPointsFromLedgerRows(state.ledgerRows);
        if (summary) summary.textContent = points.length ? `${points.length} 个实时定位点` : '暂无有效定位';

        const pointHtml = points.map(point => `
            <button class="absolute -translate-x-1/2 -translate-y-1/2 group" style="left:${point.xPercent}%; top:${point.yPercent}%;" title="${escapeHtml(point.label)} ${escapeHtml(point.depthM)}">
                <span class="block size-4 rounded-full bg-primary ring-4 ring-primary/25 shadow-lg shadow-primary/30"></span>
                <span class="absolute left-5 top-1/2 -translate-y-1/2 hidden group-hover:block whitespace-nowrap rounded bg-slate-950/95 px-2 py-1 text-[11px] text-white border border-white/10">
                    ${escapeHtml(point.label)} · ${escapeHtml(point.depthM)} · ${escapeHtml(point.confidence)}
                </span>
            </button>
        `).join('');

        canvas.innerHTML = `
            <div class="absolute inset-0 opacity-70" style="background-image: linear-gradient(rgba(148,163,184,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.18) 1px, transparent 1px); background-size: 32px 32px;"></div>
            <div class="absolute inset-x-10 top-1/2 h-px bg-primary/40"></div>
            <div class="absolute inset-y-8 left-1/2 w-px bg-sky-300/35"></div>
            <div class="absolute left-[18%] right-[14%] top-[62%] h-2 rounded-full bg-amber-300/50 rotate-[-8deg]"></div>
            <div class="absolute left-[28%] right-[24%] top-[38%] h-1.5 rounded-full bg-sky-300/50 rotate-[11deg]"></div>
            <div class="absolute top-3 right-3 px-2 py-1 rounded bg-slate-900/90 border border-white/10 text-[11px] text-white">
                <span class="text-primary">●</span> ${state.connected ? '实时更新中' : '等待对接'}
            </div>
            <div class="absolute bottom-3 left-3 px-2 py-1 rounded bg-slate-900/90 border border-white/10 text-[11px] text-slate-200">
                ${escapeHtml(state.binding?.coordinateSystem || 'CGCS2000')}
            </div>
            ${pointHtml || '<div class="absolute inset-0 grid place-items-center text-sm text-slate-400">暂无设备定位回传</div>'}
        `;
    }

    function renderLedger() {
        const tbody = document.getElementById('pcLedgerBody');
        const count = document.getElementById('pcLedgerCount');
        if (count) count.textContent = `${state.ledgerRows.length} 条`;
        if (!tbody) return;
        if (!state.ledgerRows.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-3 py-8 text-center text-slate-400">暂无探测记录回传</td></tr>';
            renderMap();
            return;
        }
        tbody.innerHTML = state.ledgerRows.map(row => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800">
                <td class="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">${escapeHtml(row.receivedAt)}</td>
                <td class="px-3 py-2 text-slate-700 dark:text-slate-300">${escapeHtml(row.surveyLine)}</td>
                <td class="px-3 py-2 text-slate-700 dark:text-slate-300">${escapeHtml(row.category)}</td>
                <td class="px-3 py-2 text-slate-700 dark:text-slate-300">${escapeHtml(row.depthM)}</td>
                <td class="px-3 py-2 text-slate-700 dark:text-slate-300">${escapeHtml(row.confidence)}</td>
                <td class="px-3 py-2 text-slate-500 max-w-[240px] truncate" title="${escapeHtml(row.coordinate)}">${escapeHtml(row.coordinate)}</td>
                <td class="px-3 py-2"><span class="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[11px]">${escapeHtml(row.statusLabel)}</span></td>
            </tr>
        `).join('');
        renderMap();
    }

    async function syncDevices() {
        if (!state.adapter) return;
        state.devices = await state.adapter.listDevices();
        state.currentDevice = getDeviceById(state.binding?.deviceId);
        renderDeviceStatus();
    }

    async function connectBoundDevice(options = {}) {
        if (!state.adapter || !state.binding) return;
        try {
            const connection = await state.adapter.connectDevice(state.binding.deviceId);
            state.connected = true;
            state.currentDevice = connection.device;
            await syncDevices();
            setStatusMessage(`已完成设备对接：${state.binding.deviceId}`);
            await pullDetectionQueue({ silent: true });
        } catch (error) {
            state.connected = false;
            setStatusMessage(error.message);
        }
        if (!options.silent) renderDeviceStatus();
    }

    async function sendInitialValues() {
        if (!state.adapter || !state.binding) return;
        if (!state.connected) {
            await connectBoundDevice({ silent: true });
        }
        try {
            const fields = getFieldValues();
            const input = buildInitializationInput({ projectId: state.projectId, binding: state.binding, fields });
            state.ack = await state.adapter.sendInitialization(input);
            saveSettings(window.localStorage, state.projectId, fields);
            const badge = document.getElementById('pcAckBadge');
            if (badge) {
                badge.className = 'text-[11px] text-emerald-600';
                badge.textContent = `已下发 ${state.ack.ackId}`;
            }
            setStatusMessage(`初始化参数已下发：${state.ack.ackId}`);
            renderDeviceStatus();
        } catch (error) {
            setStatusMessage(error.message);
        }
    }

    async function pullDetectionQueue(options = {}) {
        if (!state.adapter || !state.binding) return;
        if (!state.connected) {
            await connectBoundDevice({ silent: true });
            return;
        }
        try {
            const queue = await state.adapter.pullDetectionQueue(state.binding.deviceId);
            state.queueItems = queue.items || [];
            state.ledgerRows = buildDetectionLedgerRows(state.queueItems, radarPrototype);
            await syncDevices();
            renderLedger();
            setStatusMessage(state.ledgerRows.length ? `已同步 ${state.ledgerRows.length} 条探测回传记录` : '设备已对接，暂无探测记录回传');
        } catch (error) {
            setStatusMessage(error.message);
        }
        if (!options.silent) renderLedger();
    }

    function bindEvents() {
        document.getElementById('pcConnectBtn')?.addEventListener('click', () => connectBoundDevice());
        document.getElementById('pcInitBtn')?.addEventListener('click', sendInitialValues);
        document.getElementById('pcPullBtn')?.addEventListener('click', () => pullDetectionQueue());

        const range = document.getElementById('pcDirectionRange');
        const number = document.getElementById('pcDirectionDeg');
        range?.addEventListener('input', event => updateDirectionUi(event.target.value));
        number?.addEventListener('input', event => updateDirectionUi(event.target.value));
    }

    async function initProjectConsole() {
        const container = document.getElementById('view-console');
        if (!container) return;
        const contentArea = document.getElementById('view-project')?.parentElement;
        if (contentArea && container.parentElement !== contentArea) {
            contentArea.appendChild(container);
        }
        renderShell();
        state.projectId = getCurrentProjectId(window.location);
        state.binding = resolveProjectDeviceBinding(state.projectId, getStoredBindings(window.localStorage));
        if (!state.binding) {
            setWorkspaceVisible(false);
            return;
        }
        setWorkspaceVisible(true);
        state.adapter = createAdapter();
        if (!state.adapter) {
            setStatusMessage('设备适配层未加载');
            return;
        }
        fillFormDefaults();
        bindEvents();
        await syncDevices();
        renderLedger();
        await connectBoundDevice({ silent: true });
    }

    function setTopTabActive(mode) {
        const consoleTab = document.getElementById('consoleTab');
        const tabNav = document.querySelector('nav[aria-label="Tabs"]');
        const workTab = Array.from(tabNav?.querySelectorAll('a') || []).find(link => link.textContent.includes('工作平台'));

        const active = ['border-primary', 'text-primary', 'font-bold'];
        const inactive = ['border-transparent', 'text-slate-500', 'hover:text-slate-700', 'dark:text-slate-400', 'dark:hover:text-slate-200', 'hover:border-slate-300', 'font-medium'];

        function apply(tab, isActive) {
            if (!tab) return;
            tab.classList.remove(...(isActive ? inactive : active));
            tab.classList.add(...(isActive ? active : inactive));
        }

        apply(consoleTab, mode === 'console');
        apply(workTab, mode !== 'console');
    }

    function switchToConsole(event) {
        if (event) event.preventDefault();
        document.getElementById('view-project')?.classList.add('hidden');
        document.getElementById('view-exploration')?.classList.add('hidden');
        document.getElementById('view-console')?.classList.remove('hidden');
        setTopTabActive('console');
        if (window.location.hash !== '#console') {
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#console`);
        }
    }

    function switchToWorkbench(event) {
        if (event) event.preventDefault();
        document.getElementById('view-console')?.classList.add('hidden');
        document.getElementById('view-exploration')?.classList.add('hidden');
        document.getElementById('view-project')?.classList.remove('hidden');
        setTopTabActive('workbench');
        if (window.location.hash === '#console') {
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        }
    }

    if (typeof document !== 'undefined') {
        window.switchToConsole = switchToConsole;
        document.addEventListener('DOMContentLoaded', () => {
            initProjectConsole();
            const tabNav = document.querySelector('nav[aria-label="Tabs"]');
            const workTab = Array.from(tabNav?.querySelectorAll('a') || []).find(link => link.textContent.includes('工作平台'));
            workTab?.addEventListener('click', switchToWorkbench);
            if (window.location.hash === '#console') {
                switchToConsole();
            }
        });
    }

    return {
        BINDINGS_STORAGE_KEY,
        SETTINGS_STORAGE_KEY,
        DEFAULT_PROJECT_DEVICE_BINDINGS,
        resolveProjectDeviceBinding,
        buildInitializationInput,
        buildDetectionLedgerRows,
        buildMapPointsFromLedgerRows,
        formatDirection,
        getDeviceStatusMeta
    };
});
