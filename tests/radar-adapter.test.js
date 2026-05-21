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
