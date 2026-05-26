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
            coordinateSystem: 'WGS84'
        },
        'PROJ-2024-003': {
            deviceId: 'LD-GTL310-88P',
            directionDeg: 315,
            initialPoint: { x: 2353180.42, y: 436812.5, elevation: 5.36 },
            surveyLineId: 'HV404_2026-04-21_0001_0',
            scanMode: 'straight',
            coordinateSystem: 'WGS84'
        },
        'PROJ-2024-005': {
            deviceId: 'LD-GTL310-77P',
            directionDeg: 90,
            initialPoint: { x: 2349122.72, y: 435278.18, elevation: 4.95 },
            surveyLineId: 'TXGX_2026-04-21_0001_0',
            scanMode: 'zigzag',
            coordinateSystem: 'WGS84'
        }
    };

    const state = {
        adapter: null,
        projectId: '',
        binding: null,
        devices: [],
        currentDevice: null,
        connected: false,
        mapPickPoint: null,
        queueItems: [],
        ledgerRows: [],
        commandRows: [],
        telemetry: null,
        ack: null,
        statusMessage: '等待设备对接'
    };

    const COMMAND_TYPE_LABELS = {
        detection_plan: '探测规划',
        start_detection: '继续探测',
        continue_task: '继续任务',
        pause_task: '暂停任务',
        finish_task: '结束任务',
        manual_drive: '遥杆控制'
    };

    const PARAMETER_GROUPS = {
        controlPlan: [
            'surveyLineId',
            'coordinateSystem',
            'initialX',
            'initialY',
            'directionDeg',
            'widthM',
            'halfArcWidthM',
            'pointCount',
            'planningSide'
        ],
        radarReserved: [
            'scanMode',
            'hostPermittivity',
            'timeWindowNs',
            'distanceScaleMPerPx',
            'antennaConfig'
        ],
        positionReserved: [
            'initialElevation'
        ],
        autoComputed: [
            'lengthM'
        ],
        advanced: [
            'pointDistanceM'
        ]
    };

    const ACTION_LAYOUT = {
        headerActions: ['connectDevice'],
        initialPanelActions: ['sendPlan'],
        commandLedgerActions: ['syncReturn'],
        buttonSize: 'compact'
    };

    const TASK_CONTROL_LAYOUT = {
        title: '设备控制',
        placement: 'belowMap',
        density: 'compact',
        sections: ['taskCommands', 'controlSummary', 'manualDrivePad'],
        taskCommands: ['continue_task', 'pause_task', 'finish_task'],
        summaryMetrics: ['connectionState', 'taskProgress', 'returnQueue'],
        manualDriveButtons: [
            { command: 'forward', linear_x: 0.3, angular_z: 0 },
            { command: 'left', linear_x: 0, angular_z: 10 },
            { command: 'zero', linear_x: 0, angular_z: 0 },
            { command: 'right', linear_x: 0, angular_z: -10 },
            { command: 'backward', linear_x: -0.3, angular_z: 0 }
        ]
    };

    const INPUT_BEHAVIOR = {
        initialPointSource: 'mapPick',
        readonlyFields: ['initialX', 'initialY', 'lengthM'],
        editableFields: ['surveyLineId', 'widthM', 'halfArcWidthM', 'pointCount', 'planningSide', 'directionDeg', 'pointDistanceM']
    };

    const BUTTON_CLASSES = {
        primary: 'inline-flex h-7 items-center justify-center gap-1 px-2 bg-primary text-white rounded-md text-[11px] font-medium leading-none hover:bg-primary/90 transition-colors',
        neutral: 'inline-flex h-7 items-center justify-center gap-1 px-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-medium leading-none hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
        success: 'inline-flex h-7 items-center justify-center gap-1 px-2 rounded-md border border-emerald-200 bg-emerald-50 text-[11px] font-medium leading-none text-emerald-700 hover:bg-emerald-100 transition-colors',
        warning: 'inline-flex h-7 items-center justify-center gap-1 px-2 rounded-md border border-amber-200 bg-amber-50 text-[11px] font-medium leading-none text-amber-700 hover:bg-amber-100 transition-colors',
        danger: 'inline-flex h-7 items-center justify-center gap-1 px-2 rounded-md border border-rose-200 bg-rose-50 text-[11px] font-medium leading-none text-rose-700 hover:bg-rose-100 transition-colors',
        icon: 'inline-flex size-7 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
        iconActive: 'inline-flex size-7 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
        controlSuccess: 'inline-flex h-8 min-w-[76px] items-center justify-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors',
        controlWarning: 'inline-flex h-8 min-w-[76px] items-center justify-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors',
        controlDanger: 'inline-flex h-8 min-w-[76px] items-center justify-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors',
        pad: 'inline-flex size-7 items-center justify-center rounded-md border border-slate-600 bg-slate-800 text-slate-100 hover:border-primary hover:bg-slate-700 transition-colors',
        padActive: 'inline-flex size-7 items-center justify-center rounded-md border border-primary/60 bg-primary/20 text-primary hover:bg-primary/30 transition-colors'
    };

    const WORKBENCH_MENU_CLASSES = {
        active: 'h-9 px-2 rounded-lg bg-primary/10 text-primary flex items-center gap-2 text-xs font-semibold transition-colors',
        inactive: 'h-9 px-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-2 text-xs font-medium transition-colors'
    };

    const FIELD_DESCRIPTIONS = {
        initialX: '在地图上点击标记后自动获取的起点 X 坐标。',
        initialY: '在地图上点击标记后自动获取的起点 Y 坐标。',
        lengthM: '对应 MQTT detection_plan.length_m，单位米，由系统按规划范围自动计算，只读展示。',
        widthM: '对应 MQTT detection_plan.width_m，单位米，表示矩形探测区域的横向宽度，影响小车覆盖范围。',
        halfArcWidthM: '几字型测点之间的间距，影响折返测点疏密。',
        pointDistanceM: '到目标测点多少米内算命中，用于任务进度判定。',
        planningSide: '从起点和方向看，选择向左侧或右侧生成探测区域。'
    };

    const FIELD_LABELS = {
        lengthM: '探测长度',
        widthM: '探测宽度'
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function getConsoleParameterGroups() {
        return clone(PARAMETER_GROUPS);
    }

    function getConsoleFieldDescriptions() {
        return clone(FIELD_DESCRIPTIONS);
    }

    function getConsoleFieldLabels() {
        return clone(FIELD_LABELS);
    }

    function getConsoleActionLayout() {
        return clone(ACTION_LAYOUT);
    }

    function getConsoleTaskControlLayout() {
        return clone(TASK_CONTROL_LAYOUT);
    }

    function getConsoleInputBehavior() {
        return clone(INPUT_BEHAVIOR);
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

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function calculateMapPickPoint({ offsetX, offsetY, width, height, originX = 0, originY = 0, spanM = 20 }) {
        const safeWidth = Math.max(1, toNumber(width, 1));
        const safeHeight = Math.max(1, toNumber(height, 1));
        const xRatio = Math.max(0, Math.min(1, toNumber(offsetX, 0) / safeWidth));
        const yRatio = Math.max(0, Math.min(1, toNumber(offsetY, 0) / safeHeight));
        const span = toNumber(spanM, 20);
        return {
            x: Number((toNumber(originX, 0) + (xRatio - 0.5) * span).toFixed(2)),
            y: Number((toNumber(originY, 0) + (0.5 - yRatio) * span).toFixed(2)),
            xPercent: Number((xRatio * 100).toFixed(2)),
            yPercent: Number((yRatio * 100).toFixed(2))
        };
    }

    function calculateMapPickPointFromCoordinates({ x, y, originX = 0, originY = 0, spanM = 20 }) {
        const span = Math.max(0.01, toNumber(spanM, 20));
        const xRatio = Math.max(0, Math.min(1, 0.5 + ((toNumber(x, originX) - toNumber(originX, 0)) / span)));
        const yRatio = Math.max(0, Math.min(1, 0.5 - ((toNumber(y, originY) - toNumber(originY, 0)) / span)));
        return {
            x: Number(toNumber(x, originX).toFixed(2)),
            y: Number(toNumber(y, originY).toFixed(2)),
            xPercent: Number((xRatio * 100).toFixed(2)),
            yPercent: Number((yRatio * 100).toFixed(2))
        };
    }

    function hasFiniteNumber(value) {
        return Number.isFinite(Number(value));
    }

    function percentFromMeters(meters, spanM = 20) {
        return (toNumber(meters, 0) / Math.max(0.01, toNumber(spanM, 20))) * 100;
    }

    function clampPercent(value) {
        return Math.max(4, Math.min(96, toNumber(value, 50)));
    }

    const MAP_LABEL_BASE_CLASS = 'map-overlay-label items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-semibold leading-none shadow-lg backdrop-blur-sm';
    const MAP_LABEL_TONES = {
        slate: 'border-white/10 bg-slate-950/95 text-slate-100 shadow-slate-950/20',
        cyan: 'border-cyan-200/30 bg-slate-950/95 text-cyan-50 shadow-cyan-950/20',
        amber: 'border-amber-200/30 bg-slate-950/95 text-amber-50 shadow-amber-950/20',
        rose: 'border-rose-200/30 bg-slate-950/95 text-rose-50 shadow-rose-950/20'
    };

    function getMapLabelClass(tone = 'slate', extraClass = 'inline-flex') {
        return `${MAP_LABEL_BASE_CLASS} ${MAP_LABEL_TONES[tone] || MAP_LABEL_TONES.slate} ${extraClass}`.trim();
    }

    function getMapLabelTransform(anchor = 'right-center') {
        const transforms = {
            center: 'translate(-50%, -50%)',
            'right-center': 'translate(14px, -50%)',
            'top-center': 'translate(-50%, 10px)',
            'top-right': 'translate(10px, 10px)'
        };
        return transforms[anchor] || transforms['right-center'];
    }

    function buildMapOverlayLabel({ xPercent, yPercent, text, html, tone = 'slate', anchor = 'right-center', role = '', extraClass = 'inline-flex' } = {}) {
        const content = html || escapeHtml(text || '');
        if (!content) return '';
        return `
            <div ${role ? `data-role="${role}"` : ''} data-map-label="true" class="absolute z-30 pointer-events-none ${getMapLabelClass(tone, extraClass)}" style="left:${formatFixed(clampPercent(xPercent), 2)}%; top:${formatFixed(clampPercent(yPercent), 2)}%; transform:${getMapLabelTransform(anchor)};">
                ${content}
            </div>
        `;
    }

    function directionVector(degrees, scale = 1) {
        const radians = (toNumber(degrees, 0) * Math.PI) / 180;
        return {
            x: Math.sin(radians) * scale,
            y: -Math.cos(radians) * scale
        };
    }

    function buildMapDirectionStatus(directionDeg, { connected = false } = {}) {
        if (!hasFiniteNumber(directionDeg)) return '';
        const angle = toNumber(directionDeg, 0);
        return `
            <div data-role="map-direction-status" data-map-label="true" class="absolute right-3 top-3 z-30 pointer-events-none ${getMapLabelClass('cyan')}">
                <span class="${connected ? 'text-primary' : 'text-slate-400'}">●</span>
                <span>设备方向</span>
                <span>${escapeHtml(formatDirection(angle))}</span>
                <span class="font-mono text-cyan-100">角度 ${formatFixed(angle, 1)}°</span>
            </div>
        `;
    }

    function buildDetectionRangeOverlay({ startPoint, directionDeg, lengthM, widthM, planningSide = 1, spanM = 20 } = {}) {
        if (!startPoint || !hasFiniteNumber(directionDeg) || toNumber(lengthM, 0) <= 0 || toNumber(widthM, 0) <= 0) return '';
        const rangeLengthPercent = percentFromMeters(lengthM, spanM);
        const forward = directionVector(directionDeg, rangeLengthPercent);
        const sideScale = percentFromMeters(widthM, spanM) * (toNumber(planningSide, 1) === -1 ? -1 : 1);
        const side = { x: forward.y * sideScale / Math.max(0.01, Math.hypot(forward.x, forward.y)), y: -forward.x * sideScale / Math.max(0.01, Math.hypot(forward.x, forward.y)) };
        const p1 = { x: toNumber(startPoint.xPercent, 50), y: toNumber(startPoint.yPercent, 50) };
        const p2 = { x: p1.x + forward.x, y: p1.y + forward.y };
        const p3 = { x: p2.x + side.x, y: p2.y + side.y };
        const p4 = { x: p1.x + side.x, y: p1.y + side.y };
        const points = [p1, p2, p3, p4].map(point => `${formatFixed(point.x, 2)},${formatFixed(point.y, 2)}`).join(' ');
        const label = {
            x: clampPercent((p1.x + p2.x + p3.x + p4.x) / 4),
            y: clampPercent((p1.y + p2.y + p3.y + p4.y) / 4)
        };
        const rangeLabelHtml = buildMapOverlayLabel({
            xPercent: label.x,
            yPercent: label.y,
            html: `
                <span>探测长度 ${formatFixed(lengthM, 2)}m</span>
                <span class="h-3 w-px bg-white/20"></span>
                <span>探测宽度 ${formatFixed(widthM, 2)}m</span>
            `,
            tone: 'amber',
            anchor: 'center',
            role: 'detection-range-label'
        });
        return `
            <svg data-role="detection-range-box" class="absolute inset-0 z-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon data-range-length-percent="${formatFixed(rangeLengthPercent, 2)}" points="${points}" fill="rgba(250,204,21,.12)" stroke="#facc15" stroke-width="0.62" stroke-dasharray="2 1.5"></polygon>
                <circle cx="${formatFixed(p1.x, 2)}" cy="${formatFixed(p1.y, 2)}" r="1.2" fill="#fb7185"></circle>
            </svg>
            ${rangeLabelHtml}
        `;
    }

    function metersToGuidePercent(meters, distanceScaleMPerPx, canvasSizePx, spanM = 20, min = 0, max = 100) {
        const value = toNumber(meters, 0);
        const scale = toNumber(distanceScaleMPerPx, 0);
        const size = Math.max(1, toNumber(canvasSizePx, 0));
        const percent = scale > 0 ? (value / scale / size) * 100 : percentFromMeters(value, spanM);
        if (!Number.isFinite(percent)) return min;
        return Math.max(min, Math.min(max, percent));
    }

    function buildScanGuideOverlay({
        startPoint,
        directionDeg,
        scanMode = 'straight',
        lengthM = 4,
        halfArcWidthM = 3.5,
        pointDistanceM = 1,
        distanceScaleMPerPx = 0.01,
        planningSide = 1,
        canvasWidth = 640,
        canvasHeight = 360,
        spanM = 20
    } = {}) {
        if (!startPoint || !hasFiniteNumber(directionDeg)) return '';
        const mode = scanMode === 'zigzag' ? 'zigzag' : 'straight';
        const angle = toNumber(directionDeg, 0);
        const origin = {
            x: clampPercent(startPoint.xPercent),
            y: clampPercent(startPoint.yPercent)
        };
        const forwardUnit = directionVector(angle, 1);
        const sideSign = toNumber(planningSide, 1) === -1 ? -1 : 1;
        const sideUnit = { x: forwardUnit.y * sideSign, y: -forwardUnit.x * sideSign };
        const toPoint = (forwardPercent, sidePercent = 0) => ({
            x: origin.x + forwardUnit.x * forwardPercent + sideUnit.x * sidePercent,
            y: origin.y + forwardUnit.y * forwardPercent + sideUnit.y * sidePercent
        });
        const pointToString = point => `${formatFixed(point.x, 2)},${formatFixed(point.y, 2)}`;
        const lengthPercent = metersToGuidePercent(lengthM, distanceScaleMPerPx, canvasHeight, spanM, 18, 42);
        const markerId = mode === 'zigzag' ? 'scanGuideArrowZigzag' : 'scanGuideArrowStraight';
        const marker = `
            <defs>
                <marker id="${markerId}" markerWidth="5" markerHeight="5" refX="4.2" refY="2.5" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L4.5,2.5 L0,5" fill="none" stroke="white" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"></path>
                </marker>
            </defs>
        `;
        const commonAttrs = `fill="none" stroke="white" stroke-width="0.42" stroke-dasharray="1.4 1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.92" marker-end="url(#${markerId})"`;

        if (mode === 'straight') {
            const start = toPoint(0, 0);
            const end = toPoint(lengthPercent, 0);
            return `
                <svg data-role="scan-guide-overlay" data-guide-origin="startPoint" data-scan-mode="straight" data-guide-heading="${formatFixed(angle, 1)}" class="absolute inset-0 z-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    ${marker}
                    <line x1="${formatFixed(start.x, 2)}" y1="${formatFixed(start.y, 2)}" x2="${formatFixed(end.x, 2)}" y2="${formatFixed(end.y, 2)}" ${commonAttrs}></line>
                </svg>
            `;
        }

        const rawStepPercent = metersToGuidePercent(pointDistanceM, distanceScaleMPerPx, canvasHeight, spanM, 5, 14);
        const sidePercent = metersToGuidePercent(halfArcWidthM, distanceScaleMPerPx, canvasWidth, spanM, 8, 24);
        const legCount = Math.max(2, Math.min(5, Math.floor(lengthPercent / Math.max(5, rawStepPercent))));
        const stepPercent = lengthPercent / (legCount + 1);
        const points = [toPoint(0, 0)];
        let currentSide = 0;
        for (let index = 1; index <= legCount; index += 1) {
            points.push(toPoint(index * stepPercent, currentSide));
            currentSide = currentSide === 0 ? sidePercent : 0;
            points.push(toPoint(index * stepPercent, currentSide));
        }
        points.push(toPoint((legCount + 1) * stepPercent, currentSide));
        return `
            <svg data-role="scan-guide-overlay" data-guide-origin="startPoint" data-scan-mode="zigzag" data-guide-heading="${formatFixed(angle, 1)}" data-distance-scale="${escapeHtml(distanceScaleMPerPx)}" class="absolute inset-0 z-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                ${marker}
                <polyline points="${points.map(pointToString).join(' ')}" ${commonAttrs}></polyline>
            </svg>
        `;
    }

    function validatePlanReadiness({ vehiclePoint, directionDeg, startPoint, lengthM, widthM } = {}) {
        const missing = [];
        if (!vehiclePoint) missing.push('vehiclePoint');
        if (!hasFiniteNumber(directionDeg)) missing.push('directionDeg');
        if (!startPoint) missing.push('startPoint');
        if (toNumber(lengthM, 0) <= 0) missing.push('lengthM');
        if (toNumber(widthM, 0) <= 0) missing.push('widthM');
        return {
            canSend: missing.length === 0,
            missing
        };
    }

    function buildVehiclePoseMapPoint(pose = {}, binding = {}) {
        const x = Number(pose.x);
        const y = Number(pose.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        const origin = binding.initialPoint || {};
        const point = calculateMapPickPointFromCoordinates({
            x,
            y,
            originX: Number.isFinite(Number(origin.x)) ? origin.x : pose.origin_x,
            originY: Number.isFinite(Number(origin.y)) ? origin.y : pose.origin_y,
            spanM: 20
        });
        return {
            ...point,
            yaw: toNumber(pose.yaw, 0)
        };
    }

    function buildRadarVehicleSvg(yaw = 0) {
        const rotation = toNumber(yaw, 0);
        return `
            <svg data-icon="radar-detection-vehicle" viewBox="0 0 64 64" class="block size-14 drop-shadow-lg" style="transform: rotate(${rotation}deg); transform-origin: 32px 32px;" role="img" aria-label="雷达探测小车">
                <defs>
                    <linearGradient id="radarCarBody" x1="10" y1="12" x2="52" y2="48" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stop-color="#67e8f9"></stop>
                        <stop offset="1" stop-color="#22c55e"></stop>
                    </linearGradient>
                </defs>
                <path d="M32 5 38 17H26L32 5Z" fill="#38bdf8"></path>
                <rect x="12" y="18" width="40" height="30" rx="7" fill="#0f172a" stroke="#dbeafe" stroke-width="2"></rect>
                <rect x="17" y="23" width="30" height="16" rx="4" fill="url(#radarCarBody)"></rect>
                <rect x="10" y="22" width="6" height="22" rx="3" fill="#94a3b8"></rect>
                <rect x="48" y="22" width="6" height="22" rx="3" fill="#94a3b8"></rect>
                <circle cx="22" cy="50" r="4" fill="#e2e8f0" stroke="#0f172a" stroke-width="2"></circle>
                <circle cx="42" cy="50" r="4" fill="#e2e8f0" stroke="#0f172a" stroke-width="2"></circle>
                <path d="M24 31h16" stroke="#0f172a" stroke-width="3" stroke-linecap="round"></path>
                <path d="M32 27c4 0 7 2 9 5" stroke="#fef08a" stroke-width="2.5" stroke-linecap="round" fill="none"></path>
                <path d="M32 23c7 0 12 4 15 9" stroke="#fef08a" stroke-width="2" stroke-linecap="round" fill="none" opacity=".72"></path>
                <circle cx="32" cy="31" r="3" fill="#fef08a"></circle>
            </svg>
        `;
    }

    function buildRadarVehicleMarker(vehiclePoint) {
        if (!vehiclePoint) return '';
        return `
            <div data-role="radar-vehicle-marker" class="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style="left:${vehiclePoint.xPercent}%; top:${vehiclePoint.yPercent}%;" aria-label="雷达探测小车实时定位">
                <div class="relative flex items-center">
                    <span class="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/20 ring-8 ring-cyan-300/10"></span>
                    ${buildRadarVehicleSvg(vehiclePoint.yaw)}
                    <span data-map-label="true" class="absolute left-14 top-1/2 -translate-y-1/2 ${getMapLabelClass('cyan')}">
                        雷达探测小车 ${formatFixed(vehiclePoint.x, 2)}, ${formatFixed(vehiclePoint.y, 2)}
                    </span>
                </div>
            </div>
        `;
    }

    function parseMqttContent(message, fallback = {}) {
        if (!message) return fallback;
        try {
            if (typeof message.content === 'string') return JSON.parse(message.content);
            if (message.content && typeof message.content === 'object') return message.content;
        } catch (error) {
            return fallback;
        }
        return fallback;
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

    function getDeviceControlReadiness({ connected = false, device = null } = {}) {
        if (!device) {
            return { canOperate: false, message: '未找到绑定设备，请先完成设备绑定' };
        }
        if (device.status === 'offline') {
            return { canOperate: false, message: '设备离线，无法下发控制指令' };
        }
        if (!connected) {
            return { canOperate: false, message: '设备未对接，请先点击设备对接' };
        }
        return { canOperate: true, message: '设备已对接，可下发控制指令' };
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
            coordinateSystem: 'WGS84',
            initialX: fields.initialX ?? initialPoint.x ?? '',
            initialY: fields.initialY ?? initialPoint.y ?? '',
            initialElevation: fields.initialElevation ?? initialPoint.elevation ?? '',
            directionDeg: fields.directionDeg ?? binding?.directionDeg ?? 0,
            lengthM: toNumber(fields.lengthM ?? binding?.lengthM, 4),
            widthM: toNumber(fields.widthM ?? binding?.widthM, 3.5),
            halfArcWidthM: toNumber(fields.halfArcWidthM ?? binding?.halfArcWidthM, 3.5),
            pointDistanceM: toNumber(fields.pointDistanceM ?? binding?.pointDistanceM, 1),
            pointCount: toNumber(fields.pointCount ?? binding?.pointCount, 5),
            planningSide: toNumber(fields.planningSide ?? binding?.planningSide, 1) === -1 ? -1 : 1
        };
    }

    function buildCommandLedgerRows(records = []) {
        return records.map(record => {
            const ackCode = record.ackCode ?? parseMqttContent(record.ack).code;
            const ackMessage = record.ackMessage || parseMqttContent(record.ack).message || '-';
            const success = record.status === 'success' || ackCode === 0;
            return {
                id: record.id || record.command?.messageId || '',
                sentAt: record.sentAt || '',
                topic: record.topic || '',
                typeLabel: COMMAND_TYPE_LABELS[record.command?.type] || record.command?.type || '-',
                messageId: record.command?.messageId || '',
                ackLabel: ackCode === undefined || ackCode === null ? ackMessage : `${ackCode} ${ackMessage}`,
                status: success ? 'success' : 'failed',
                statusLabel: success ? '已确认' : '失败'
            };
        });
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
            coordinateSystem: 'WGS84',
            initialX: document.getElementById('pcInitialX')?.value,
            initialY: document.getElementById('pcInitialY')?.value,
            initialElevation: document.getElementById('pcInitialElevation')?.value,
            directionDeg: document.getElementById('pcDirectionDeg')?.value,
            lengthM: document.getElementById('pcLengthM')?.value,
            widthM: document.getElementById('pcWidthM')?.value,
            halfArcWidthM: document.getElementById('pcHalfArcWidthM')?.value,
            pointDistanceM: document.getElementById('pcPointDistanceM')?.value,
            pointCount: document.getElementById('pcPointCount')?.value,
            planningSide: document.getElementById('pcPlanningSide')?.value
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
                <section class="bg-white dark:bg-[#161e27] rounded-lg border border-slate-200 dark:border-slate-700 p-2.5">
                    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">developer_board</span>
                                <h3 class="text-base font-bold text-slate-900 dark:text-white">项目设备控制台</h3>
                                <span class="px-2 py-0.5 rounded border border-emerald-100 bg-emerald-50 text-[11px] font-medium text-emerald-700">项目负责人 / 勘探人员</span>
                            </div>
                            <p id="pcStatusMessage" class="mt-1 text-xs text-slate-500 dark:text-slate-400">等待设备对接</p>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button id="pcConnectBtn" class="${BUTTON_CLASSES.primary}">
                                <span class="material-symbols-outlined text-base">settings_input_antenna</span>
                                设备对接
                            </button>
                        </div>
                    </div>
                    <div id="pcDeviceStatusGrid" class="mt-3 grid sm:grid-cols-2 xl:grid-cols-4 gap-2"></div>
                </section>

                <section class="grid xl:grid-cols-[0.9fr_1.1fr] gap-3">
                    <div class="bg-white dark:bg-[#161e27] rounded-lg border border-slate-200 dark:border-slate-700 p-2.5">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">tune</span>
                                初始值与方向
                            </h3>
                            <div class="flex items-center gap-2">
                                <span id="pcAckBadge" class="text-[11px] text-slate-400">未下发</span>
                            </div>
                        </div>
                        <div id="pcPlanSteps" class="mb-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
                            <div data-plan-step="vehiclePoint" class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                                <div class="text-[10px] text-slate-400">1</div>
                                <div class="text-[11px] font-bold text-slate-600">车辆定位</div>
                            </div>
                            <div data-plan-step="directionDeg" class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                                <div class="text-[10px] text-slate-400">2</div>
                                <div class="text-[11px] font-bold text-slate-600">方向放线</div>
                            </div>
                            <div data-plan-step="startPoint" class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                                <div class="text-[10px] text-slate-400">3</div>
                                <div class="text-[11px] font-bold text-slate-600">起点打点</div>
                            </div>
                            <div data-plan-step="rangeBox" class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                                <div class="text-[10px] text-slate-400">4</div>
                                <div class="text-[11px] font-bold text-slate-600">范围确认</div>
                            </div>
                        </div>
                        <div class="grid sm:grid-cols-2 gap-3">
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">测线编号</span>
                                <input id="pcSurveyLineId" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">坐标系</span>
                                <input id="pcCoordinateSystem" value="WGS84" readonly class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">初始 X</span>
                                <span class="block text-[11px] leading-4 text-slate-400">${FIELD_DESCRIPTIONS.initialX}</span>
                                <input id="pcInitialX" type="number" step="0.01" readonly class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">初始 Y</span>
                                <span class="block text-[11px] leading-4 text-slate-400">${FIELD_DESCRIPTIONS.initialY}</span>
                                <input id="pcInitialY" type="number" step="0.01" readonly class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">${FIELD_LABELS.lengthM}</span>
                                <span class="block text-[11px] leading-4 text-slate-400">${FIELD_DESCRIPTIONS.lengthM}</span>
                                <input id="pcLengthM" type="number" step="0.1" readonly class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">${FIELD_LABELS.widthM}</span>
                                <span class="block text-[11px] leading-4 text-slate-400">${FIELD_DESCRIPTIONS.widthM}</span>
                                <input id="pcWidthM" type="number" step="0.1" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">几字间距(m)</span>
                                <span class="block text-[11px] leading-4 text-slate-400">${FIELD_DESCRIPTIONS.halfArcWidthM}</span>
                                <input id="pcHalfArcWidthM" type="number" step="0.1" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">测点数量</span>
                                <input id="pcPointCount" type="number" min="1" step="1" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            </label>
                            <label class="space-y-1">
                                <span class="text-xs font-medium text-slate-500">规划侧</span>
                                <span class="block text-[11px] leading-4 text-slate-400">${FIELD_DESCRIPTIONS.planningSide}</span>
                                <select id="pcPlanningSide" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                    <option value="1">左侧</option>
                                    <option value="-1">右侧</option>
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
                        <div class="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-2.5">
                            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <div class="text-xs font-bold text-emerald-800">执行命令</div>
                                    <div id="pcPlanReadiness" class="mt-0.5 text-[11px] text-emerald-700">等待车辆定位、方向、起点和范围确认</div>
                                </div>
                                <button id="pcInitBtn" class="${BUTTON_CLASSES.primary}" disabled>
                                    <span class="material-symbols-outlined text-base">start</span>
                                    下发规划
                                </button>
                            </div>
                        </div>
                        <details class="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40">
                            <summary class="cursor-pointer select-none px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                                高级设置
                            </summary>
                            <div class="grid sm:grid-cols-2 gap-3 px-3 pb-3 pt-1">
                                <label class="space-y-1">
                                    <span class="text-xs font-medium text-slate-500">命中距离(m)</span>
                                    <span class="block text-[11px] leading-4 text-slate-400">${FIELD_DESCRIPTIONS.pointDistanceM}</span>
                                    <input id="pcPointDistanceM" type="number" step="0.1" class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                </label>
                            </div>
                        </details>
                        <details class="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40">
                            <summary class="cursor-pointer select-none px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                                雷达采集参数（预留）
                            </summary>
                            <div class="grid sm:grid-cols-2 gap-3 px-3 pb-3 pt-1">
                                <label class="space-y-1">
                                    <span class="text-xs font-medium text-slate-500">扫描模式</span>
                                    <select id="pcScanMode" class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                        <option value="straight">直线扫描</option>
                                        <option value="zigzag">折线扫描</option>
                                    </select>
                                </label>
                                <label class="space-y-1">
                                    <span class="text-xs font-medium text-slate-500">介电常数</span>
                                    <input id="pcHostPermittivity" type="number" step="0.1" class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                </label>
                                <label class="space-y-1">
                                    <span class="text-xs font-medium text-slate-500">时间窗口(ns)</span>
                                    <input id="pcTimeWindowNs" type="number" step="0.1" class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                </label>
                                <label class="space-y-1">
                                    <span class="text-xs font-medium text-slate-500">距离比例尺(m/px)</span>
                                    <input id="pcDistanceScale" type="number" step="0.001" class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                </label>
                                <label class="space-y-1">
                                    <span class="text-xs font-medium text-slate-500">天线配置</span>
                                    <select id="pcAntennaConfig" class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                        <option value="0">单天线</option>
                                        <option value="1">双天线</option>
                                    </select>
                                </label>
                            </div>
                        </details>
                        <details class="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40">
                            <summary class="cursor-pointer select-none px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                                定位扩展参数（预留）
                            </summary>
                            <div class="grid sm:grid-cols-2 gap-3 px-3 pb-3 pt-1">
                                <label class="space-y-1">
                                    <span class="text-xs font-medium text-slate-500">起始高程(m)</span>
                                    <input id="pcInitialElevation" type="number" step="0.01" class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                                </label>
                            </div>
                        </details>
                    </div>

                    <div class="self-start bg-white dark:bg-[#161e27] rounded-lg border border-slate-200 dark:border-slate-700 p-3 flex flex-col min-h-[420px]">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">map</span>
                                实时地图定位
                            </h3>
                            <div class="text-right">
                                <span id="pcMapSummary" class="block text-[11px] text-slate-400">等待回传</span>
                                <span class="block text-[11px] text-slate-400">点击地图标记探测起点</span>
                            </div>
                        </div>
                        <div id="pcMapCanvas" class="relative h-[360px] min-h-[280px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950"></div>
                        <div data-role="device-control-card" class="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-2 shadow-sm">
                            <div class="grid lg:grid-cols-[minmax(0,1fr)_132px] gap-2 items-stretch">
                                <div class="rounded-md border border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 p-2">
                                    <div class="flex flex-wrap items-center justify-between gap-2">
                                        <h4 class="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <span class="material-symbols-outlined text-primary text-base">settings_remote</span>
                                            设备控制
                                        </h4>
                                        <span id="pcCommandBadge" class="inline-flex h-6 items-center rounded-full bg-white dark:bg-slate-800 px-2 text-[11px] font-medium text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700">等待指令</span>
                                    </div>
                                    <div data-role="task-command-strip" class="mt-2 flex flex-wrap gap-2">
                                        <button id="pcContinueBtn" class="${BUTTON_CLASSES.controlSuccess}">
                                            <span class="material-symbols-outlined text-base">play_arrow</span>
                                            继续
                                        </button>
                                        <button id="pcPauseBtn" class="${BUTTON_CLASSES.controlWarning}">
                                            <span class="material-symbols-outlined text-base">pause</span>
                                            暂停
                                        </button>
                                        <button id="pcFinishBtn" class="${BUTTON_CLASSES.controlDanger}">
                                            <span class="material-symbols-outlined text-base">flag</span>
                                            结束
                                        </button>
                                    </div>
                                    <div data-role="control-summary" class="mt-2 grid grid-cols-3 gap-1.5">
                                        <div class="rounded-md border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1.5">
                                            <span class="block text-[10px] leading-4 text-slate-400">连接</span>
                                            <strong id="pcControlLinkState" class="block truncate text-xs leading-5 text-slate-700 dark:text-slate-100">未连接</strong>
                                        </div>
                                        <div class="rounded-md border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1.5">
                                            <span class="block text-[10px] leading-4 text-slate-400">任务</span>
                                            <strong id="pcControlTaskState" class="block truncate text-xs leading-5 text-slate-700 dark:text-slate-100">待机</strong>
                                        </div>
                                        <div class="rounded-md border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1.5">
                                            <span class="block text-[10px] leading-4 text-slate-400">回传</span>
                                            <strong id="pcControlQueueCount" class="block truncate text-xs leading-5 text-slate-700 dark:text-slate-100">0 条</strong>
                                        </div>
                                    </div>
                                </div>
                                <div data-role="manual-drive-pad" class="rounded-md border border-slate-800 bg-slate-950 p-2 shadow-inner">
                                    <div class="mb-1.5 flex items-center justify-between">
                                        <span class="text-[11px] font-medium text-slate-300">遥杆</span>
                                        <span class="text-[10px] font-semibold text-emerald-300">0 速归零</span>
                                    </div>
                                    <div class="mx-auto grid w-[94px] grid-cols-3 gap-1.5">
                                        <div></div>
                                        <button data-manual-drive data-linear="0.3" data-angular="0" class="${BUTTON_CLASSES.pad}" title="前进">
                                            <span class="material-symbols-outlined text-base">keyboard_arrow_up</span>
                                        </button>
                                        <div></div>
                                        <button data-manual-drive data-linear="0" data-angular="10" class="${BUTTON_CLASSES.pad}" title="左转">
                                            <span class="material-symbols-outlined text-base">keyboard_arrow_left</span>
                                        </button>
                                        <button data-manual-drive data-linear="0" data-angular="0" class="${BUTTON_CLASSES.padActive}" title="归零">
                                            <span class="material-symbols-outlined text-sm">radio_button_checked</span>
                                        </button>
                                        <button data-manual-drive data-linear="0" data-angular="-10" class="${BUTTON_CLASSES.pad}" title="右转">
                                            <span class="material-symbols-outlined text-base">keyboard_arrow_right</span>
                                        </button>
                                        <div></div>
                                        <button data-manual-drive data-linear="-0.3" data-angular="0" class="${BUTTON_CLASSES.pad}" title="后退">
                                            <span class="material-symbols-outlined text-base">keyboard_arrow_down</span>
                                        </button>
                                        <div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="bg-white dark:bg-[#161e27] rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <h3 class="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">receipt_long</span>
                            指令回执台账
                        </h3>
                        <div class="flex items-center gap-2">
                            <span id="pcCommandCount" class="text-[11px] text-slate-400">0 条</span>
                            <button id="pcPullBtn" class="${BUTTON_CLASSES.neutral}">
                                <span class="material-symbols-outlined text-base">sync</span>
                                同步回传
                            </button>
                        </div>
                    </div>
                    <div class="overflow-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table class="w-full min-w-[840px] text-xs">
                            <thead class="bg-slate-50 dark:bg-slate-900/60 sticky top-0">
                                <tr class="border-b border-slate-100 dark:border-slate-800">
                                    <th class="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">下发时间</th>
                                    <th class="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">指令</th>
                                    <th class="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">Topic</th>
                                    <th class="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">Message ID</th>
                                    <th class="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">ACK</th>
                                    <th class="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">状态</th>
                                </tr>
                            </thead>
                            <tbody id="pcCommandBody" class="divide-y divide-slate-100 dark:divide-slate-800"></tbody>
                        </table>
                    </div>
                </section>

                <section class="bg-white dark:bg-[#161e27] rounded-lg border border-slate-200 dark:border-slate-700 p-3">
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

    function applyDeviceControlReadiness(readiness) {
        const buttons = document.querySelectorAll('#pcContinueBtn, #pcPauseBtn, #pcFinishBtn, [data-manual-drive]');
        buttons.forEach(button => {
            if (button.dataset.readyTitleCaptured !== 'true') {
                button.dataset.readyTitle = button.getAttribute('title') || '';
                button.dataset.readyTitleCaptured = 'true';
            }
            button.disabled = !readiness.canOperate;
            button.title = readiness.canOperate ? button.dataset.readyTitle : readiness.message;
            button.classList.toggle('opacity-50', !readiness.canOperate);
            button.classList.toggle('cursor-not-allowed', !readiness.canOperate);
        });
    }

    function renderDeviceStatus() {
        const container = document.getElementById('pcDeviceStatusGrid');
        if (!container || !state.binding) return;
        const device = state.currentDevice || getDeviceById(state.binding.deviceId) || {};
        const status = getDeviceStatusMeta(device.status, state.connected);
        const controlReadiness = getDeviceControlReadiness({ connected: state.connected, device });
        const queueCount = Number(device.queueCount || state.queueItems.length || 0);
        const direction = Number(getFieldValues().directionDeg || state.binding.directionDeg || 0);
        const battery = state.telemetry?.battery || {};
        const pose = state.telemetry?.pose || {};
        const task = state.telemetry?.task || {};
        const cards = [
            ['precision_manufacturing', '绑定设备', state.binding.deviceId],
            ['sensors', '连接状态', `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border ${status.badge}"><span class="size-1.5 rounded-full ${status.dot}"></span>${status.label}</span>`],
            ['explore', '当前方向', formatDirection(direction)],
            ['battery_5_bar', '电池状态', battery.capacity === undefined ? '-' : `${formatFixed(battery.capacity, 0)}% / ${formatFixed(battery.voltage, 1)}V`],
            ['my_location', '当前位置', pose.x === undefined ? '-' : `${formatFixed(pose.x, 2)}, ${formatFixed(pose.y, 2)}`],
            ['near_me', '车身角度', pose.yaw === undefined ? '-' : `${formatFixed(pose.yaw, 1)}°`],
            ['progress_activity', '任务进度', task.stateText ? `${task.stateText} ${formatFixed(task.progress, 0)}%` : '-'],
            ['article', '回传队列', `${queueCount} 条`]
        ];
        container.innerHTML = cards.map(([icon, label, value]) => `
            <div class="min-h-[72px] p-2.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700">
                <div class="flex items-center gap-1.5 text-[11px] leading-4 text-slate-500 mb-1">
                    <span class="material-symbols-outlined text-sm">${icon}</span>
                    ${label}
                </div>
                <div class="font-bold text-sm leading-5 text-slate-800 dark:text-white min-h-5">${value}</div>
            </div>
        `).join('');

        const linkState = document.getElementById('pcControlLinkState');
        const taskState = document.getElementById('pcControlTaskState');
        const queueState = document.getElementById('pcControlQueueCount');
        if (linkState) linkState.textContent = controlReadiness.canOperate ? status.label : controlReadiness.message.replace('，无法下发控制指令', '').replace('，请先点击设备对接', '');
        if (taskState) taskState.textContent = task.stateText ? `${task.stateText} ${formatFixed(task.progress, 0)}%` : '待机';
        if (queueState) queueState.textContent = `${queueCount} 条`;
        applyDeviceControlReadiness(controlReadiness);
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
            pcLengthM: input.lengthM,
            pcWidthM: input.widthM,
            pcHalfArcWidthM: input.halfArcWidthM,
            pcPointDistanceM: input.pointDistanceM,
            pcPointCount: input.pointCount,
            pcPlanningSide: input.planningSide,
            pcDirectionDeg: input.directionDeg,
            pcDirectionRange: input.directionDeg
        };
        Object.entries(fieldMap).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.value = value;
        });
        const hasSavedStart = saved.initialX !== undefined && saved.initialY !== undefined && saved.initialX !== '' && saved.initialY !== '';
        if (hasSavedStart) {
            state.mapPickPoint = {
                ...calculateMapPickPointFromCoordinates({
                    x: input.initialX,
                    y: input.initialY,
                    originX: state.binding?.initialPoint?.x,
                    originY: state.binding?.initialPoint?.y,
                    spanM: 20
                }),
                confirmed: true
            };
        } else {
            state.mapPickPoint = null;
            const xInput = document.getElementById('pcInitialX');
            const yInput = document.getElementById('pcInitialY');
            if (xInput) xInput.value = '';
            if (yInput) yInput.value = '';
        }
        updateDirectionUi(input.directionDeg);
        updatePlanActionState();
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
        renderMap();
        updatePlanActionState();
    }

    function updateInitialPointFromMap(pickPoint) {
        state.mapPickPoint = { ...pickPoint, confirmed: true };
        const xInput = document.getElementById('pcInitialX');
        const yInput = document.getElementById('pcInitialY');
        if (xInput) xInput.value = pickPoint.x;
        if (yInput) yInput.value = pickPoint.y;
        saveSettings(window.localStorage, state.projectId, getFieldValues());
        renderMap();
        updatePlanActionState();
        setStatusMessage(`已从地图标记起点：X ${formatFixed(pickPoint.x, 2)}，Y ${formatFixed(pickPoint.y, 2)}`);
    }

    function handleMapPick(event) {
        if (!state.binding || event.target.closest('button')) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const initialPoint = state.binding.initialPoint || {};
        updateInitialPointFromMap(calculateMapPickPoint({
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top,
            width: rect.width,
            height: rect.height,
            originX: initialPoint.x,
            originY: initialPoint.y,
            spanM: 20
        }));
    }

    function getCurrentPlanReadiness() {
        const fields = getFieldValues();
        const vehiclePoint = buildVehiclePoseMapPoint(state.telemetry?.pose || {}, state.binding);
        const startPoint = state.mapPickPoint?.confirmed ? state.mapPickPoint : null;
        return {
            fields,
            vehiclePoint,
            startPoint,
            readiness: validatePlanReadiness({
                vehiclePoint,
                directionDeg: fields.directionDeg,
                startPoint,
                lengthM: fields.lengthM,
                widthM: fields.widthM
            })
        };
    }

    function updatePlanActionState() {
        const button = document.getElementById('pcInitBtn');
        const readinessEl = document.getElementById('pcPlanReadiness');
        const { readiness, fields, vehiclePoint, startPoint } = getCurrentPlanReadiness();
        const missingLabels = {
            vehiclePoint: '车辆定位',
            directionDeg: '设备方向',
            startPoint: '起点打点',
            lengthM: '探测长度',
            widthM: '探测宽度'
        };
        if (button) {
            button.disabled = !readiness.canSend;
            button.className = `${BUTTON_CLASSES.primary} ${readiness.canSend ? '' : 'opacity-50 cursor-not-allowed'}`.trim();
            button.title = readiness.canSend ? '下发 detection_plan' : `请先完成：${readiness.missing.map(key => missingLabels[key]).join('、')}`;
        }
        if (readinessEl) {
            readinessEl.textContent = readiness.canSend
                ? `已完成车辆定位、方向、起点和范围确认，可下发 detection_plan`
                : `请先完成：${readiness.missing.map(key => missingLabels[key]).join('、')}`;
        }
        const stepState = {
            vehiclePoint: !!vehiclePoint,
            directionDeg: hasFiniteNumber(fields.directionDeg),
            startPoint: !!startPoint,
            rangeBox: toNumber(fields.lengthM, 0) > 0 && toNumber(fields.widthM, 0) > 0 && !!startPoint
        };
        Object.entries(stepState).forEach(([step, done]) => {
            const el = document.querySelector(`[data-plan-step="${step}"]`);
            if (!el) return;
            el.className = done
                ? 'rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5'
                : 'rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5';
        });
    }

    function renderMap() {
        const canvas = document.getElementById('pcMapCanvas');
        const summary = document.getElementById('pcMapSummary');
        if (!canvas) return;
        const points = buildMapPointsFromLedgerRows(state.ledgerRows);
        const pose = state.telemetry?.pose || {};
        const vehiclePoint = buildVehiclePoseMapPoint(pose, state.binding);
        const hasPose = !!vehiclePoint;
        const fields = getFieldValues();
        const startPoint = state.mapPickPoint?.confirmed ? state.mapPickPoint : null;
        const currentDirectionDeg = hasFiniteNumber(vehiclePoint?.yaw) ? vehiclePoint.yaw : fields.directionDeg;
        const directionStatusHtml = buildMapDirectionStatus(currentDirectionDeg, { connected: state.connected });
        const rangeHtml = buildDetectionRangeOverlay({
            startPoint,
            directionDeg: fields.directionDeg,
            lengthM: fields.lengthM,
            widthM: fields.widthM,
            planningSide: fields.planningSide
        });
        const scanGuideHtml = buildScanGuideOverlay({
            startPoint,
            directionDeg: fields.directionDeg,
            scanMode: fields.scanMode,
            lengthM: fields.lengthM,
            halfArcWidthM: fields.halfArcWidthM,
            pointDistanceM: fields.pointDistanceM,
            distanceScaleMPerPx: fields.distanceScaleMPerPx,
            planningSide: fields.planningSide,
            canvasWidth: canvas.clientWidth || 640,
            canvasHeight: canvas.clientHeight || 360
        });
        if (summary) {
            if (points.length && hasPose) summary.textContent = `${points.length} 个探测回传点 / 小车位置已同步`;
            else if (points.length) summary.textContent = `${points.length} 个探测回传点`;
            else if (hasPose) summary.textContent = '小车位置已同步';
            else summary.textContent = '暂无设备定位回传';
        }

        const pointHtml = points.map(point => `
            <button data-role="map-detection-return-point" class="absolute z-20 -translate-x-1/2 -translate-y-1/2 group" style="left:${point.xPercent}%; top:${point.yPercent}%;" title="探测回传点：${escapeHtml(point.label)} ${escapeHtml(point.depthM)}">
                <span class="grid size-5 place-items-center rounded-full border border-slate-950 bg-amber-300 text-[10px] font-bold leading-none text-slate-950 ring-4 ring-amber-300/20 shadow-lg shadow-amber-950/30">${point.index}</span>
                <span data-map-label="true" class="absolute left-5 top-1/2 -translate-y-1/2 hidden ${getMapLabelClass('slate', 'group-hover:inline-flex')}">
                    探测回传点 ${point.index} · ${escapeHtml(point.label)} · ${escapeHtml(point.depthM)} · ${escapeHtml(point.confidence)}
                </span>
            </button>
        `).join('');
        const pointLegendHtml = points.length ? `
            <div data-role="map-detection-point-legend" data-map-label="true" class="absolute bottom-3 right-3 ${getMapLabelClass('amber')}">
                <span class="grid size-4 place-items-center rounded-full bg-amber-300 text-[9px] font-bold leading-none text-slate-950">1</span>
                <span>探测回传点</span>
            </div>
        ` : '';
        const startPointHtml = startPoint ? `
            <div data-role="start-point-marker" class="absolute z-20 -translate-x-1/2 -translate-y-full pointer-events-none" style="left:${startPoint.xPercent}%; top:${startPoint.yPercent}%;">
                <div class="relative flex flex-col items-center">
                    <span class="material-symbols-outlined text-rose-400 text-3xl drop-shadow">location_on</span>
                    <span data-map-label="true" class="${getMapLabelClass('rose')}">
                        起点 X ${formatFixed(startPoint.x, 2)} / Y ${formatFixed(startPoint.y, 2)}
                    </span>
                </div>
            </div>
        ` : '';
        const vehicleHtml = buildRadarVehicleMarker(vehiclePoint);

        canvas.innerHTML = `
            <div class="absolute inset-0 opacity-70" style="background-image: linear-gradient(rgba(148,163,184,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.18) 1px, transparent 1px); background-size: 32px 32px;"></div>
            ${directionStatusHtml}
            <div data-map-label="true" class="absolute bottom-3 left-3 ${getMapLabelClass('slate')}">
                WGS84
            </div>
            ${pointLegendHtml}
            ${rangeHtml}
            ${scanGuideHtml}
            ${startPointHtml}
            ${vehicleHtml}
            ${pointHtml || (vehicleHtml ? '' : '<div class="absolute inset-0 grid place-items-center text-sm text-slate-400">暂无设备定位回传</div>')}
        `;
        updatePlanActionState();
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

    function renderCommandLedger() {
        const tbody = document.getElementById('pcCommandBody');
        const count = document.getElementById('pcCommandCount');
        if (count) count.textContent = `${state.commandRows.length} 条`;
        if (!tbody) return;
        if (!state.commandRows.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-3 py-8 text-center text-slate-400">暂无指令回执</td></tr>';
            return;
        }
        tbody.innerHTML = state.commandRows.map(row => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800">
                <td class="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">${escapeHtml(row.sentAt)}</td>
                <td class="px-3 py-2 text-slate-700 dark:text-slate-300">${escapeHtml(row.typeLabel)}</td>
                <td class="px-3 py-2 text-slate-500 max-w-[260px] truncate" title="${escapeHtml(row.topic)}">${escapeHtml(row.topic)}</td>
                <td class="px-3 py-2 text-slate-500">${escapeHtml(row.messageId)}</td>
                <td class="px-3 py-2 text-slate-500">${escapeHtml(row.ackLabel)}</td>
                <td class="px-3 py-2">
                    <span class="px-2 py-0.5 rounded text-[11px] ${row.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}">${escapeHtml(row.statusLabel)}</span>
                </td>
            </tr>
        `).join('');
    }

    function applyDeviceMessages(messages) {
        if (!messages) return;
        state.telemetry = {
            battery: parseMqttContent(messages.battery),
            pose: parseMqttContent(messages.pose),
            task: parseMqttContent(messages.task)
        };
        state.queueItems = messages.items || [];
        state.ledgerRows = buildDetectionLedgerRows(state.queueItems, radarPrototype);
    }

    async function refreshCommandLedger() {
        if (!state.adapter?.getCommandLedger || !state.binding) return;
        const records = await state.adapter.getCommandLedger(state.binding.deviceId);
        state.commandRows = buildCommandLedgerRows(records);
        renderCommandLedger();
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
        const planState = getCurrentPlanReadiness();
        if (!planState.readiness.canSend) {
            updatePlanActionState();
            const labels = { vehiclePoint: '车辆定位', directionDeg: '设备方向', startPoint: '起点打点', lengthM: '探测长度', widthM: '探测宽度' };
            setStatusMessage(`暂不能下发规划，请先完成：${planState.readiness.missing.map(key => labels[key] || key).join('、')}`);
            return;
        }
        if (!state.connected) {
            await connectBoundDevice({ silent: true });
        }
        try {
            const fields = getFieldValues();
            const input = buildInitializationInput({ projectId: state.projectId, binding: state.binding, fields });
            state.ack = state.adapter.sendDetectionPlan
                ? await state.adapter.sendDetectionPlan(input)
                : await state.adapter.sendInitialization(input);
            saveSettings(window.localStorage, state.projectId, fields);
            const badge = document.getElementById('pcAckBadge');
            const commandBadge = document.getElementById('pcCommandBadge');
            const commandId = state.ack.command?.messageId || state.ack.ackId;
            if (badge) {
                badge.className = 'text-[11px] text-emerald-600';
                badge.textContent = `已下发 ${commandId}`;
            }
            if (commandBadge) {
                commandBadge.className = 'inline-flex h-6 items-center rounded-full bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700 border border-emerald-100';
                commandBadge.textContent = `已确认 ${commandId}`;
            }
            await refreshCommandLedger();
            setStatusMessage(`探测规划已下发：${commandId}`);
            renderDeviceStatus();
        } catch (error) {
            setStatusMessage(error.message);
        }
    }

    async function sendTaskCommand(type, content = {}) {
        if (!state.adapter || !state.binding) return;
        const device = state.currentDevice || getDeviceById(state.binding.deviceId);
        const readiness = getDeviceControlReadiness({ connected: state.connected, device });
        if (!readiness.canOperate) {
            applyDeviceControlReadiness(readiness);
            const commandBadge = document.getElementById('pcCommandBadge');
            if (commandBadge) {
                commandBadge.className = 'inline-flex h-6 items-center rounded-full bg-rose-50 px-2 text-[11px] font-medium text-rose-700 border border-rose-100';
                commandBadge.textContent = '设备未对接';
            }
            setStatusMessage(readiness.message);
            return;
        }
        try {
            const record = await state.adapter.sendDeviceCommand(state.binding.deviceId, type, content);
            const commandBadge = document.getElementById('pcCommandBadge');
            if (commandBadge) {
                commandBadge.className = 'inline-flex h-6 items-center rounded-full bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700 border border-emerald-100';
                commandBadge.textContent = `已确认 ${record.command.messageId}`;
            }
            await refreshCommandLedger();
            if (state.adapter.pullDeviceMessages) {
                applyDeviceMessages(await state.adapter.pullDeviceMessages(state.binding.deviceId));
            }
            await syncDevices();
            renderDeviceStatus();
            renderLedger();
            setStatusMessage(`${COMMAND_TYPE_LABELS[type] || type} 已下发：${record.command.messageId}`);
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
            if (state.adapter.pullDeviceMessages) {
                applyDeviceMessages(await state.adapter.pullDeviceMessages(state.binding.deviceId));
            } else {
                const queue = await state.adapter.pullDetectionQueue(state.binding.deviceId);
                state.queueItems = queue.items || [];
                state.ledgerRows = buildDetectionLedgerRows(state.queueItems, radarPrototype);
            }
            await syncDevices();
            await refreshCommandLedger();
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
        document.getElementById('pcContinueBtn')?.addEventListener('click', () => sendTaskCommand('continue_task', {}));
        document.getElementById('pcPauseBtn')?.addEventListener('click', () => sendTaskCommand('pause_task', {}));
        document.getElementById('pcFinishBtn')?.addEventListener('click', () => sendTaskCommand('finish_task', {}));
        document.querySelectorAll('[data-manual-drive]').forEach(button => {
            button.addEventListener('click', () => sendTaskCommand('manual_drive', {
                linear_x: toNumber(button.dataset.linear, 0),
                angular_z: toNumber(button.dataset.angular, 0)
            }));
        });
        document.getElementById('pcMapCanvas')?.addEventListener('click', handleMapPick);

        const range = document.getElementById('pcDirectionRange');
        const number = document.getElementById('pcDirectionDeg');
        range?.addEventListener('input', event => updateDirectionUi(event.target.value));
        number?.addEventListener('input', event => updateDirectionUi(event.target.value));
        ['pcWidthM', 'pcLengthM', 'pcPlanningSide', 'pcScanMode', 'pcDistanceScale', 'pcHalfArcWidthM', 'pcPointDistanceM'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                renderMap();
                updatePlanActionState();
            });
        });
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
        renderCommandLedger();
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

    function setWorkbenchMenuActive(menuKey) {
        document.querySelectorAll('[data-workbench-menu]').forEach(item => {
            item.className = item.dataset.workbenchMenu === menuKey
                ? WORKBENCH_MENU_CLASSES.active
                : WORKBENCH_MENU_CLASSES.inactive;
        });
    }

    function switchToConsole(event) {
        if (event) event.preventDefault();
        document.getElementById('view-project')?.classList.add('hidden');
        document.getElementById('view-exploration')?.classList.add('hidden');
        document.getElementById('view-console')?.classList.remove('hidden');
        setTopTabActive('console');
        setWorkbenchMenuActive('console');
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
        setWorkbenchMenuActive('project');
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
        getConsoleParameterGroups,
        getConsoleFieldLabels,
        getConsoleFieldDescriptions,
        getConsoleActionLayout,
        getConsoleTaskControlLayout,
        getConsoleInputBehavior,
        buildInitializationInput,
        buildCommandLedgerRows,
        buildDetectionLedgerRows,
        buildMapPointsFromLedgerRows,
        buildVehiclePoseMapPoint,
        buildRadarVehicleMarker,
        buildMapDirectionStatus,
        buildDetectionRangeOverlay,
        buildScanGuideOverlay,
        validatePlanReadiness,
        calculateMapPickPoint,
        calculateMapPickPointFromCoordinates,
        formatDirection,
        getDeviceStatusMeta,
        getDeviceControlReadiness
    };
});
