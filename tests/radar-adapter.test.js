const test = require('node:test');
const assert = require('node:assert/strict');

const radarPrototype = require('../js/radar-prototype.js');
const { createRadarAdapter } = require('../js/radar-adapter.js');

test('mock adapter exposes device list with online state and queue count', async () => {
    const adapter = createRadarAdapter({ radarPrototype });
    const devices = await adapter.listDevices();

    assert.equal(devices.length, 3);
    assert.equal(devices[0].id, 'LD-GTL310-66P');
    assert.equal(devices[0].status, 'online');
    assert.equal(devices[0].queueCount, 2);
});

test('mock adapter connects a device and acknowledges initialization payload', async () => {
    const adapter = createRadarAdapter({ radarPrototype, now: () => '2026-05-21T09:00:00.000Z' });

    const connection = await adapter.connectDevice('LD-GTL310-66P');
    const ack = await adapter.sendInitialization({
        deviceId: connection.device.id,
        projectIds: ['WT-250022'],
        surveyLineId: 'A303_2026-04-21_0001_0',
        scanMode: 'straight',
        hostPermittivity: '10',
        timeWindowNs: '21',
        distanceScaleMPerPx: '0.01',
        antennaConfig: '0',
        coordinateSystem: 'CGCS2000'
    });

    assert.equal(connection.ok, true);
    assert.equal(ack.ok, true);
    assert.equal(ack.ackId, 'ACK-LD-GTL310-66P-001');
    assert.equal(ack.payload.command, 'initialize_scan');
    assert.equal(ack.payload.generated_at, '2026-05-21T09:00:00.000Z');
});

test('mock adapter rejects initialization before connection', async () => {
    const adapter = createRadarAdapter({ radarPrototype });

    await assert.rejects(
        () => adapter.sendInitialization({ deviceId: 'LD-GTL310-66P' }),
        /未连接/
    );
});

test('mock adapter pulls detection queue without destroying raw result_json', async () => {
    const adapter = createRadarAdapter({ radarPrototype });
    await adapter.connectDevice('LD-GTL310-66P');

    const queue = await adapter.pullDetectionQueue('LD-GTL310-66P');

    assert.equal(queue.ok, true);
    assert.equal(queue.items.length, 2);
    assert.equal(queue.items[0].status, 'pending_review');
    assert.equal(typeof queue.items[0].message.result_json, 'string');
    assert.match(queue.items[0].message.result_json, /"metadata"/);
});

test('mock adapter sends MQTT detection_plan with topic and correlated ack', async () => {
    const adapter = createRadarAdapter({ radarPrototype, now: () => '2026-05-26T10:00:00.000Z' });
    await adapter.connectDevice('LD-GTL310-66P');

    const record = await adapter.sendDetectionPlan({
        deviceId: 'LD-GTL310-66P',
        initialX: '113.274155',
        initialY: '23.124806',
        directionDeg: '45',
        lengthM: '4',
        widthM: '3.5',
        halfArcWidthM: '3.5',
        pointDistanceM: '1',
        pointCount: '5',
        planningSide: '-1'
    });

    assert.equal(record.topic, '/ypd/pre/device/LD-GTL310-66P');
    assert.equal(record.platformTopic, '/ypd/pre/platform/LD-GTL310-66P');
    assert.equal(record.command.messageId, 'cmd-001');
    assert.equal(record.command.type, 'detection_plan');
    assert.equal(record.command.responseTo, '');
    assert.deepEqual(JSON.parse(record.command.content), {
        center_x_m: 113.274155,
        center_y_m: 23.124806,
        heading_deg: 45,
        length_m: 4,
        width_m: 3.5,
        half_arc_width_m: 3.5,
        point_distance_m: 1,
        point_count: 5,
        planning_side: -1
    });
    assert.equal(record.ack.type, 'ack');
    assert.equal(record.ack.responseTo, record.command.messageId);
    assert.deepEqual(JSON.parse(record.ack.content), { code: 0, message: '收到消息' });
});

test('mock adapter records task commands and returns static device messages', async () => {
    const adapter = createRadarAdapter({ radarPrototype });
    await adapter.connectDevice('LD-GTL310-66P');

    const pause = await adapter.sendDeviceCommand('LD-GTL310-66P', 'pause_task', {});
    const drive = await adapter.sendDeviceCommand('LD-GTL310-66P', 'manual_drive', { linear_x: 0, angular_z: 0 });
    const messages = await adapter.pullDeviceMessages('LD-GTL310-66P');
    const ledger = await adapter.getCommandLedger('LD-GTL310-66P');

    assert.equal(pause.command.type, 'pause_task');
    assert.equal(drive.command.type, 'manual_drive');
    assert.equal(messages.battery.type, 'battery_status');
    assert.equal(messages.pose.type, 'vehicle_pose');
    assert.equal(messages.task.type, 'task_status');
    assert.equal(messages.items.length, 2);
    assert.equal(ledger.length, 2);
    assert.equal(ledger[0].command.type, 'manual_drive');
});
