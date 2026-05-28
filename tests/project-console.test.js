const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

global.RadarPrototype = require('../js/radar-prototype.js');
global.RadarAdapter = require('../js/radar-adapter.js');

const {
    resolveProjectDeviceBinding,
    buildInitializationInput,
    buildCommandLedgerRows,
    getConsoleParameterGroups,
    getConsoleFieldLabels,
    getConsoleFieldDescriptions,
    getConsoleActionLayout,
    getConsoleTaskControlLayout,
    getConsoleVideoLiveLayout,
    getConsoleInputBehavior,
    getConsoleWorkModeConfig,
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
    getVideoProtocol,
    buildDeviceLiveVideoPanel,
    getDeviceControlReadiness
} = require('../js/project-console.js');

test('resolveProjectDeviceBinding returns default binding for bound projects', () => {
    const binding = resolveProjectDeviceBinding('PROJ-2024-001');

    assert.equal(binding.deviceId, 'LD-GTL310-66P');
    assert.equal(binding.directionDeg, 45);
    assert.equal(binding.initialPoint.x, 2347184.25);
    assert.equal(binding.coordinateSystem, 'WGS84');
});

test('resolveProjectDeviceBinding prefers stored admin binding and returns null when unbound', () => {
    const binding = resolveProjectDeviceBinding('PROJ-2024-002', {
        'PROJ-2024-002': {
            deviceId: 'LD-GTL310-77P',
            directionDeg: 120,
            initialPoint: { x: 1, y: 2, elevation: 3 }
        }
    });

    assert.equal(binding.deviceId, 'LD-GTL310-77P');
    assert.equal(binding.directionDeg, 120);
    assert.equal(resolveProjectDeviceBinding('PROJ-2024-006'), null);
});

test('buildInitializationInput carries project initial point and direction', () => {
    const binding = resolveProjectDeviceBinding('PROJ-2024-001');
    const input = buildInitializationInput({
        projectId: 'PROJ-2024-001',
        binding,
        fields: {
            surveyLineId: 'LINE-001',
            initialX: '111.5',
            initialY: '222.6',
            initialElevation: '5.7',
            directionDeg: '88',
            coordinateSystem: 'CGCS2000'
        }
    });

    assert.equal(input.deviceId, 'LD-GTL310-66P');
    assert.deepEqual(input.projectIds, ['PROJ-2024-001']);
    assert.equal(input.surveyLineId, 'LINE-001');
    assert.equal(input.initialX, '111.5');
    assert.equal(input.initialY, '222.6');
    assert.equal(input.initialElevation, '5.7');
    assert.equal(input.directionDeg, '88');
    assert.equal(input.coordinateSystem, 'WGS84');
    assert.equal(input.workMode, 'exploration');
    assert.equal(input.workModeLabel, '探索模式');
    assert.equal(input.laneSpacingM, 3.5);
    assert.equal(input.edgeDistanceM, 0.3);
    assert.equal(input.lengthM, 4);
    assert.equal(input.widthM, 3.5);
    assert.equal(input.planningSide, 1);
});

test('buildInitializationInput applies PRD work mode defaults', () => {
    const binding = resolveProjectDeviceBinding('PROJ-2024-001');
    const traversal = buildInitializationInput({
        projectId: 'PROJ-2024-001',
        binding,
        fields: {
            workMode: 'traversal'
        }
    });
    const recheck = buildInitializationInput({
        projectId: 'PROJ-2024-001',
        binding,
        fields: {
            workMode: 'recheck',
            recheckMode: 'fine'
        }
    });
    const customSpacing = buildInitializationInput({
        projectId: 'PROJ-2024-001',
        binding,
        fields: {
            workMode: 'exploration',
            laneSpacingM: '2.2',
            halfArcWidthM: '9.9'
        }
    });

    assert.equal(traversal.workModeLabel, '遍历模式');
    assert.equal(traversal.scanMode, 'zigzag');
    assert.equal(traversal.laneSpacingM, 0.5);
    assert.equal(traversal.halfArcWidthM, 0.5);
    assert.equal(recheck.workModeLabel, '复检模式');
    assert.equal(recheck.recheckModeLabel, '精细扫');
    assert.equal(recheck.pointDistanceM, 0.25);
    assert.equal(recheck.fineScanStepM, 0.25);
    assert.equal(customSpacing.laneSpacingM, 2.2);
    assert.equal(customSpacing.halfArcWidthM, 2.2);
});

test('buildDetectionLedgerRows parses adapter queue into console ledger rows', async () => {
    const adapter = global.RadarAdapter.createRadarAdapter({ radarPrototype: global.RadarPrototype });
    await adapter.connectDevice('LD-GTL310-66P');
    const queue = await adapter.pullDetectionQueue('LD-GTL310-66P');

    const rows = buildDetectionLedgerRows(queue.items, global.RadarPrototype);

    assert.equal(rows.length, 3);
    assert.equal(rows[0].category, '给水');
    assert.equal(rows[0].depthM, '0.85m');
    assert.equal(rows[0].statusLabel, '待研判');
    assert.match(rows[0].coordinate, /CGCS2000/);
});

test('buildMapPointsFromLedgerRows maps valid coordinates into bounded map percentages', async () => {
    const rows = buildDetectionLedgerRows([
        { id: 'A', receivedAt: 'now', status: 'pending_review', message: global.RadarPrototype.buildSampleDetectionMessage() }
    ], global.RadarPrototype);

    const points = buildMapPointsFromLedgerRows(rows);

    assert.equal(points.length, 2);
    assert.ok(points[0].xPercent >= 16 && points[0].xPercent <= 84);
    assert.ok(points[0].yPercent >= 16 && points[0].yPercent <= 84);
});

test('console map removes decorative solid guide lines and labels return points', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'project-console.js'), 'utf8');

    assert.doesNotMatch(source, /bg-primary\/40/);
    assert.doesNotMatch(source, /bg-sky-300\/35/);
    assert.doesNotMatch(source, /left-\[18%\][\s\S]*rotate-\[-8deg\]/);
    assert.match(source, /data-role="map-detection-return-point"/);
    assert.match(source, /data-role="map-detection-point-legend"/);
    assert.match(source, /探测回传点/);
});

test('calculateMapPickPoint converts map click position into initial coordinates', () => {
    const center = calculateMapPickPoint({
        offsetX: 100,
        offsetY: 50,
        width: 200,
        height: 100,
        originX: 2347184.25,
        originY: 434427.06,
        spanM: 20
    });
    const offset = calculateMapPickPoint({
        offsetX: 150,
        offsetY: 25,
        width: 200,
        height: 100,
        originX: 2347184.25,
        originY: 434427.06,
        spanM: 20
    });

    assert.deepEqual(center, { x: 2347184.25, y: 434427.06, xPercent: 50, yPercent: 50 });
    assert.deepEqual(offset, { x: 2347189.25, y: 434432.06, xPercent: 75, yPercent: 25 });
});

test('calculateMapPickPointFromCoordinates restores saved marker position', () => {
    const point = calculateMapPickPointFromCoordinates({
        x: 2347189.25,
        y: 434432.06,
        originX: 2347184.25,
        originY: 434427.06,
        spanM: 20
    });

    assert.deepEqual(point, { x: 2347189.25, y: 434432.06, xPercent: 75, yPercent: 25 });
});

test('buildVehiclePoseMapPoint converts realtime vehicle_pose to map position', () => {
    const point = buildVehiclePoseMapPoint(
        { x: 2347189.25, y: 434432.06, yaw: 45 },
        { initialPoint: { x: 2347184.25, y: 434427.06 } }
    );

    assert.deepEqual(point, { x: 2347189.25, y: 434432.06, yaw: 45, xPercent: 75, yPercent: 25 });
});

test('buildRadarVehicleMarker renders radar detection vehicle svg marker', () => {
    const marker = buildRadarVehicleMarker({
        x: 2347189.25,
        y: 434432.06,
        yaw: 45,
        xPercent: 75,
        yPercent: 25
    });

    assert.match(marker, /data-role="radar-vehicle-marker"/);
    assert.match(marker, /data-icon="radar-detection-vehicle"/);
    assert.match(marker, /data-map-label="true"/);
    assert.match(marker, /map-overlay-label/);
    assert.match(marker, /雷达探测小车/);
    assert.match(marker, /left:75%; top:25%;/);
    assert.match(marker, /rotate\(45deg\)/);
    assert.doesNotMatch(marker, /material-symbols-outlined|navigation/);
});

test('buildMapDirectionStatus renders current device bearing without dashed guidance', () => {
    const overlay = buildMapDirectionStatus(45, { connected: true });

    assert.match(overlay, /data-role="map-direction-status"/);
    assert.match(overlay, /data-map-label="true"/);
    assert.match(overlay, /map-overlay-label/);
    assert.match(overlay, /设备方向/);
    assert.match(overlay, /角度 45.0°/);
    assert.match(overlay, /北偏东 45°/);
    assert.doesNotMatch(overlay, /stroke-dasharray|marker-end|data-role="direction-guide"/);
});

test('buildDetectionRangeOverlay renders range box from start point and dimensions', () => {
    const overlay = buildDetectionRangeOverlay({
        startPoint: { x: 2347189.25, y: 434432.06, xPercent: 50, yPercent: 50 },
        directionDeg: 90,
        lengthM: 4,
        widthM: 3.5,
        planningSide: 1
    });

    assert.match(overlay, /data-role="detection-range-box"/);
    assert.match(overlay, /data-map-label="true"/);
    assert.match(overlay, /map-overlay-label/);
    assert.match(overlay, /探测长度 4.00m/);
    assert.match(overlay, /探测宽度 3.50m/);
    assert.doesNotMatch(overlay, /length_m|width_m/);
    assert.match(overlay, /polygon/);
    assert.doesNotMatch(overlay, /<text/);
});

test('buildScanGuideOverlay draws thin white dashed guidance by scan mode and heading', () => {
    const startPoint = { xPercent: 55, yPercent: 62 };
    const straight = buildScanGuideOverlay({
        startPoint,
        directionDeg: 90,
        scanMode: 'straight',
        lengthM: 4,
        distanceScaleMPerPx: 0.01,
        canvasWidth: 640,
        canvasHeight: 360
    });
    const zigzag = buildScanGuideOverlay({
        startPoint,
        directionDeg: 45,
        scanMode: 'zigzag',
        lengthM: 4,
        halfArcWidthM: 3.5,
        pointDistanceM: 1,
        distanceScaleMPerPx: 0.01,
        canvasWidth: 640,
        canvasHeight: 360
    });

    assert.match(straight, /data-role="scan-guide-overlay"/);
    assert.match(straight, /data-guide-origin="startPoint"/);
    assert.match(straight, /data-scan-mode="straight"/);
    assert.match(straight, /data-guide-heading="90.0"/);
    assert.match(straight, /<line/);
    assert.match(straight, /x1="55.00"/);
    assert.match(straight, /y1="62.00"/);
    assert.match(straight, /stroke="white"/);
    assert.match(straight, /stroke-width="0.42"/);
    assert.match(straight, /stroke-dasharray="1.4 1.5"/);
    assert.match(straight, /marker-end=/);
    assert.match(zigzag, /data-scan-mode="zigzag"/);
    assert.match(zigzag, /data-guide-heading="45.0"/);
    assert.match(zigzag, /data-distance-scale="0.01"/);
    assert.match(zigzag, /<polyline/);
    assert.match(zigzag, /stroke="white"/);
    assert.notStrictEqual(straight, zigzag);
});

test('buildScanGuideOverlay requires initial point as guide origin', () => {
    const overlay = buildScanGuideOverlay({
        directionDeg: 90,
        scanMode: 'straight',
        lengthM: 4
    });

    assert.equal(overlay, '');
});

test('validatePlanReadiness blocks plan downlink until all map setup steps are ready', () => {
    const ready = validatePlanReadiness({
        workMode: 'exploration',
        vehiclePoint: { x: 1, y: 2, xPercent: 50, yPercent: 50 },
        directionDeg: 45,
        startPoint: { x: 1, y: 2, xPercent: 55, yPercent: 45 },
        lengthM: 4,
        widthM: 3.5
    });
    const missingStart = validatePlanReadiness({
        workMode: 'exploration',
        vehiclePoint: { x: 1, y: 2, xPercent: 50, yPercent: 50 },
        directionDeg: 45,
        lengthM: 4,
        widthM: 3.5
    });
    const missingMode = validatePlanReadiness({
        vehiclePoint: { x: 1, y: 2, xPercent: 50, yPercent: 50 },
        directionDeg: 45,
        startPoint: { x: 1, y: 2, xPercent: 55, yPercent: 45 },
        lengthM: 4,
        widthM: 3.5
    });

    assert.equal(ready.canSend, true);
    assert.deepEqual(ready.missing, []);
    assert.equal(missingStart.canSend, false);
    assert.deepEqual(missingStart.missing, ['startPoint']);
    assert.equal(missingMode.canSend, false);
    assert.deepEqual(missingMode.missing, ['workMode']);
});

test('console formatting helpers expose readable state', () => {
    assert.equal(formatDirection(45), '北偏东 45°');
    assert.equal(formatDirection(315), '北偏西 45°');
    assert.equal(getDeviceStatusMeta('online').label, '在线');
    assert.equal(getDeviceStatusMeta('offline', true).label, '已对接');
});

test('device control readiness requires an actively connected device', () => {
    assert.deepEqual(
        getDeviceControlReadiness({ connected: false, device: { status: 'online' } }),
        { canOperate: false, message: '设备未对接，请先点击设备对接' }
    );
    assert.deepEqual(
        getDeviceControlReadiness({ connected: true, device: { status: 'offline' } }),
        { canOperate: false, message: '设备离线，无法下发控制指令' }
    );
    assert.deepEqual(
        getDeviceControlReadiness({ connected: true, device: { status: 'online' } }),
        { canOperate: true, message: '设备已对接，可下发控制指令' }
    );
});

test('buildCommandLedgerRows exposes MQTT command ack status for realtime stream', () => {
    const rows = buildCommandLedgerRows([
        {
            id: 'CMD-001',
            sentAt: '2026-05-26T10:00:00.000Z',
            topic: '/ypd/pre/device/LD-GTL310-66P',
            command: { messageId: 'cmd-001', type: 'detection_plan' },
            ackCode: 0,
            ackMessage: '收到消息',
            status: 'success'
        }
    ]);

    assert.equal(rows.length, 1);
    assert.equal(rows[0].typeLabel, '探测规划');
    assert.equal(rows[0].messageId, 'cmd-001');
    assert.equal(rows[0].ackLabel, '0 收到消息');
    assert.equal(rows[0].statusLabel, '已确认');
});

test('console parameter groups separate control plan fields from reserved radar acquisition fields', () => {
    const groups = getConsoleParameterGroups();

    assert.deepEqual(groups.operationMode, [
        'workMode',
        'recheckMode',
        'laneSpacingM',
        'edgeDistanceM',
        'fineScanStepM'
    ]);
    assert.deepEqual(groups.controlPlan, [
        'surveyLineId',
        'coordinateSystem',
        'initialX',
        'initialY',
        'directionDeg',
        'widthM',
        'pointCount',
        'planningSide'
    ]);
    assert.deepEqual(groups.radarReserved, [
        'scanMode',
        'hostPermittivity',
        'timeWindowNs',
        'distanceScaleMPerPx',
        'antennaConfig'
    ]);
    assert.deepEqual(groups.positionReserved, [
        'initialElevation'
    ]);
    assert.deepEqual(groups.autoComputed, [
        'lengthM'
    ]);
    assert.deepEqual(groups.advanced, [
        'pointDistanceM'
    ]);
});

test('console field descriptions explain key planning parameters', () => {
    const labels = getConsoleFieldLabels();
    const descriptions = getConsoleFieldDescriptions();

    assert.equal(labels.lengthM, '探测长度');
    assert.equal(labels.widthM, '探测宽度');
    assert.match(descriptions.initialX, /起点/);
    assert.match(descriptions.initialY, /起点/);
    assert.match(descriptions.initialX, /地图/);
    assert.match(descriptions.initialY, /地图/);
    assert.match(descriptions.widthM, /矩形探测区域/);
    assert.match(descriptions.widthM, /width_m/);
    assert.match(descriptions.lengthM, /自动计算/);
    assert.match(descriptions.lengthM, /length_m/);
    assert.match(descriptions.halfArcWidthM, /探测行间距/);
    assert.match(descriptions.halfArcWidthM, /不再作为独立配置项/);
    assert.match(descriptions.pointDistanceM, /命中/);
    assert.match(descriptions.planningSide, /左侧/);
});

test('console initial point is picked from map instead of manual coordinate inputs', () => {
    const behavior = getConsoleInputBehavior();

    assert.equal(behavior.initialPointSource, 'mapPick');
    assert.deepEqual(behavior.readonlyFields, ['initialX', 'initialY', 'lengthM']);
    assert.ok(behavior.editableFields.includes('workMode'));
    assert.ok(behavior.editableFields.includes('recheckMode'));
    assert.ok(!behavior.editableFields.includes('confidenceThreshold'));
    assert.ok(!behavior.editableFields.includes('initialX'));
    assert.ok(!behavior.editableFields.includes('initialY'));
    assert.ok(!behavior.editableFields.includes('lengthM'));
    assert.ok(!behavior.editableFields.includes('halfArcWidthM'));
});

test('console work mode config reflects PRD operation modes', () => {
    const config = getConsoleWorkModeConfig();

    assert.deepEqual(Object.keys(config.modes), ['exploration', 'traversal', 'recheck']);
    assert.equal(config.modes.exploration.label, '探索模式');
    assert.equal(config.modes.exploration.laneSpacingM, 3.5);
    assert.match(config.modes.exploration.planning, /5 帧/);
    assert.equal(config.modes.traversal.label, '遍历模式');
    assert.equal(config.modes.traversal.laneSpacingM, 0.5);
    assert.match(config.modes.traversal.planning, /覆盖/);
    assert.equal(config.modes.recheck.label, '复检模式');
    assert.deepEqual(Object.keys(config.recheckModes), ['rescan', 'reinforce', 'fine']);
    assert.match(config.recheckModes.reinforce.planning, /补强/);
    assert.match(config.recheckModes.fine.planning, /精扫/);
    assert.deepEqual(config.parameterViews.exploration.visibleParams, ['scope', 'direction', 'laneSpacingM']);
    assert.deepEqual(config.parameterViews.traversal.visibleParams, ['scope', 'direction', 'laneSpacingM', 'edgeDistanceM']);
    assert.deepEqual(config.recheckParameterViews.fine.visibleParams, ['scope', 'direction', 'recheckRule', 'fineScanStepM']);
});

test('console keeps start direction and range fields on the main planning panel', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'project-console.js'), 'utf8');
    const railStart = source.indexOf('data-role="planning-compact-rail"');
    const modalStart = source.indexOf('id="pcPlanningModal"');
    const mapStart = source.indexOf('data-role="map-video-grid"');
    const mainPlanningSource = source.slice(railStart, modalStart);
    const modalSource = source.slice(modalStart, mapStart);
    const inlinePlanningFields = [
        'pcSurveyLineId',
        'pcCoordinateSystem',
        'pcInitialX',
        'pcInitialY',
        'pcLengthM',
        'pcWidthM',
        'pcPointCount',
        'pcPlanningSide',
        'pcDirectionRange',
        'pcDirectionDeg'
    ];

    assert.match(source, /data-role="work-mode-planning-card"/);
    assert.match(source, /作业模式与规划/);
    assert.match(source, /data-role="planning-compact-rail"/);
    assert.match(source, /id="pcPlanningModal"/);
    assert.match(source, /id="pcOpenPlanningBtn"/);
    assert.match(source, /data-role="work-mode-card"/);
    assert.match(mainPlanningSource, /data-role="inline-planning-fields"/);
    for (const fieldId of inlinePlanningFields) {
        assert.match(mainPlanningSource, new RegExp(`id="${fieldId}"`));
        assert.doesNotMatch(modalSource, new RegExp(`id="${fieldId}"`));
    }
    assert.doesNotMatch(source, /id="pcPlanSteps"/);
    assert.doesNotMatch(source, /data-plan-step=/);
    assert.doesNotMatch(mainPlanningSource, />\s*模式\s*<\/div>\s*<\/div>\s*<div[^>]+>\s*<div[^>]+>\s*2\s*<\/div>\s*<div[^>]+>\s*定位\s*<\/div>/);
    assert.match(source, /data-plan-submit/);
    assert.match(source, /更多参数/);
    assert.doesNotMatch(source, /data-role="initial-values-section"/);
    assert.doesNotMatch(source, />\s*初始值与方向\s*</);
    assert.doesNotMatch(source, /id="pcHalfArcWidthM"/);
    assert.doesNotMatch(source, />\s*几字间距\(m\)\s*</);
    assert.doesNotMatch(source, /id="pcConfidenceThreshold"/);
    assert.doesNotMatch(source, />\s*置信阈值\(%\)\s*</);
});

test('console plan submit panel uses concise action copy', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'project-console.js'), 'utf8');
    const panelStart = source.indexOf('data-role="plan-submit-panel"');
    const modalStart = source.indexOf('id="pcPlanningModal"');
    const panelSource = source.slice(panelStart, modalStart);

    assert.ok(panelStart > -1);
    assert.match(panelSource, /data-plan-submit-title/);
    assert.match(panelSource, /规划已就绪/);
    assert.match(panelSource, /下发规划/);
    assert.match(source, /检查通过，可下发探测规划/);
    assert.match(source, /BUTTON_CLASSES\.planSubmitReady/);
    assert.match(source, /BUTTON_CLASSES\.planSubmitDisabled/);
    assert.doesNotMatch(panelSource, /执行命令/);
    assert.doesNotMatch(panelSource, /detection_plan/);
});

test('console map is primary canvas with floating video overlay', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'project-console.js'), 'utf8');

    assert.match(source, /lg:grid-cols-\[280px_minmax\(0,1fr\)\]/);
    assert.match(source, /id="pcMapCanvas" class="relative h-\[clamp\(420px,54vh,520px\)\] min-h-\[420px\]/);
    assert.match(source, /id="pcLiveVideoPanel" class="absolute right-3 top-14 z-20/);
    assert.match(source, /data-role="map-video-grid" class="relative"/);
    assert.doesNotMatch(source, /xl:grid-cols-\[minmax\(0,1fr\)_220px\]/);
});

test('console exposes fullscreen toggle for focused operation view', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'project-console.js'), 'utf8');

    assert.match(source, /id="pcFullscreenBtn"/);
    assert.match(source, /open_in_full/);
    assert.match(source, /close_fullscreen/);
    assert.match(source, /function applyConsoleFullscreenState/);
    assert.match(source, /workspace\.dataset\.fullscreen/);
    assert.match(source, /fixed', 'inset-0', 'z-\[70\]/);
    assert.match(source, /workspace\.scrollTop = 0/);
    assert.match(source, /canvas\.style\.height = state\.consoleFullscreen/);
    assert.match(source, /if \(state\.consoleFullscreen\)/);
});

test('console mode parameter panel uses dynamic fields instead of one shared input set', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'project-console.js'), 'utf8');

    assert.match(source, /id="pcModeParameterCaption"/);
    assert.match(source, /data-mode-param="scope"/);
    assert.match(source, /data-mode-param="direction"/);
    assert.match(source, /data-mode-param="recheckRule"/);
    assert.match(source, /data-mode-param="fineScanStepM"/);
    assert.match(source, /toggleModeParam\(param, visibleParams\)/);
    assert.match(source, /pcFineScanStepM/);
    assert.match(source, /动态字段/);
    assert.doesNotMatch(source, /后续扩展矩形、多边形、圆形区域绘制/);
    assert.doesNotMatch(source, /多次扫描后融合并处理数据冲突/);
});

test('console action layout keeps primary actions in their owning panels with compact buttons', () => {
    const layout = getConsoleActionLayout();

    assert.deepEqual(layout.headerActions, ['connectDevice']);
    assert.equal(layout.planningPanel, 'workModeAndInitialValues');
    assert.deepEqual(layout.planningPanelActions, ['sendPlan']);
    assert.deepEqual(layout.commandStatusActions, ['syncReturn']);
    assert.equal(layout.buttonSize, 'compact');
});

test('device control layout sits below map and separates task commands from manual drive pad', () => {
    const layout = getConsoleTaskControlLayout();

    assert.equal(layout.title, '设备控制');
    assert.equal(layout.placement, 'belowMap');
    assert.equal(layout.density, 'compact');
    assert.deepEqual(layout.sections, ['taskCommands', 'controlSummary', 'manualDrivePad', 'commandStatusStream']);
    assert.deepEqual(layout.taskCommands, ['continue_task', 'pause_task', 'finish_task']);
    assert.deepEqual(layout.summaryMetrics, ['connectionState', 'taskProgress', 'returnQueue']);
    assert.equal(layout.manualDriveButtons.length, 5);
    assert.deepEqual(layout.manualDriveButtons.find(button => button.command === 'zero'), {
        command: 'zero',
        linear_x: 0,
        angular_z: 0
    });
});

test('console renders command acknowledgements as rolling status stream', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'project-console.js'), 'utf8');
    const panelStart = source.indexOf('data-role="command-status-panel"');
    const ledgerStart = source.indexOf('探测记录回传台账');
    const panelSource = source.slice(panelStart, ledgerStart);

    assert.ok(panelStart > -1);
    assert.match(panelSource, /实时指令状态/);
    assert.match(panelSource, /data-role="command-status-stream"/);
    assert.match(panelSource, /id="pcCommandStream"/);
    assert.match(panelSource, /overflow-y-auto/);
    assert.match(panelSource, /id="pcPullBtn"/);
    assert.match(source, /renderCommandStatusStream/);
    assert.doesNotMatch(source, /指令回执台账/);
    assert.doesNotMatch(source, /id="pcCommandBody"/);
    assert.doesNotMatch(panelSource, /<table/);
});

test('video live layout overlays map and uses device stream field', () => {
    const layout = getConsoleVideoLiveLayout();

    assert.equal(layout.title, '视频直播');
    assert.equal(layout.placement, 'mapOverlay');
    assert.equal(layout.streamField, 'videoStreamUrl');
    assert.deepEqual(layout.statusMetrics, ['sourceState', 'protocol', 'latency']);
    assert.ok(layout.supportedSources.includes('WebRTC'));
});

test('buildDeviceLiveVideoPanel renders configured realtime stream state', () => {
    const waiting = buildDeviceLiveVideoPanel({
        binding: { deviceId: 'LD-GTL310-66P', videoStreamUrl: 'webrtc://LD-GTL310-66P/main' },
        connected: false
    });
    const ready = buildDeviceLiveVideoPanel({
        binding: { deviceId: 'LD-GTL310-66P' },
        device: { id: 'LD-GTL310-66P', videoStreamUrl: 'https://example.test/live.m3u8' },
        connected: true
    });

    assert.equal(getVideoProtocol('webrtc://LD-GTL310-66P/main'), 'WebRTC');
    assert.equal(getVideoProtocol('https://example.test/live.m3u8'), 'HLS');
    assert.match(waiting, /data-role="device-live-video-card"/);
    assert.match(waiting, /data-live-state="waiting"/);
    assert.match(waiting, /data-video-stream-url="webrtc:\/\/LD-GTL310-66P\/main"/);
    assert.match(waiting, /视频直播/);
    assert.match(ready, /data-live-state="ready"/);
    assert.match(ready, /src="https:\/\/example.test\/live.m3u8"/);
    assert.match(ready, /<120ms/);
});
