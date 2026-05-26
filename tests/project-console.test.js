const test = require('node:test');
const assert = require('node:assert/strict');

global.RadarPrototype = require('../js/radar-prototype.js');
global.RadarAdapter = require('../js/radar-adapter.js');

const {
    resolveProjectDeviceBinding,
    buildInitializationInput,
    buildDetectionLedgerRows,
    buildMapPointsFromLedgerRows,
    formatDirection,
    getDeviceStatusMeta
} = require('../js/project-console.js');

test('resolveProjectDeviceBinding returns default binding for bound projects', () => {
    const binding = resolveProjectDeviceBinding('PROJ-2024-001');

    assert.equal(binding.deviceId, 'LD-GTL310-66P');
    assert.equal(binding.directionDeg, 45);
    assert.equal(binding.initialPoint.x, 2347184.25);
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
            directionDeg: '88'
        }
    });

    assert.equal(input.deviceId, 'LD-GTL310-66P');
    assert.deepEqual(input.projectIds, ['PROJ-2024-001']);
    assert.equal(input.surveyLineId, 'LINE-001');
    assert.equal(input.initialX, '111.5');
    assert.equal(input.initialY, '222.6');
    assert.equal(input.initialElevation, '5.7');
    assert.equal(input.directionDeg, '88');
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

test('console formatting helpers expose readable state', () => {
    assert.equal(formatDirection(45), '北偏东 45°');
    assert.equal(formatDirection(315), '北偏西 45°');
    assert.equal(getDeviceStatusMeta('online').label, '在线');
    assert.equal(getDeviceStatusMeta('offline', true).label, '已对接');
});
