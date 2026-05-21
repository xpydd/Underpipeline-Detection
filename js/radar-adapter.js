(function (root, factory) {
    const api = factory(root.RadarPrototype);
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.RadarAdapter = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (browserRadarPrototype) {
    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function createSecondSampleMessage(radarPrototype) {
        const message = radarPrototype.buildSampleDetectionMessage();
        const result = JSON.parse(message.result_json);
        result.metadata.file_name = 'A303_2026-04-21_0002_0';
        result.metadata.processing_time = '2026-05-18 14:35:10';
        result.metadata.total_pipes_detected = 1;
        result.metadata.survey_line_length_m = 42.3;
        result.pipes = [result.pipes[0]];
        result.pipes[0].pipe_id = 1;
        result.pipes[0].category = 'PG';
        result.pipes[0].confidence = 0.9;
        result.pipes[0].physical_properties.predicted_burial_depth_m = 0.72;
        result.pipes[0].physical_properties.predicted_outer_diameter_m = 0.16;
        return {
            ...message,
            file_name: result.metadata.file_name,
            survey_line_length: result.metadata.survey_line_length_m,
            total_pipes_detected: result.metadata.total_pipes_detected,
            pipe_category: 'PG',
            confidence: 0.9,
            result_json: JSON.stringify(result, null, 2)
        };
    }

    function buildDefaultState(radarPrototype) {
        return {
            devices: [
                {
                    id: 'LD-GTL310-66P',
                    model: 'GTL310',
                    status: 'online',
                    heartbeatText: '12s',
                    projects: ['WT-250022', 'WT-250024', 'WT-250029'],
                    queue: [
                        {
                            id: 'RX-20260521-001',
                            status: 'pending_review',
                            receivedAt: '2026-05-21 09:12:24',
                            message: radarPrototype.buildSampleDetectionMessage()
                        },
                        {
                            id: 'RX-20260521-002',
                            status: 'pending_review',
                            receivedAt: '2026-05-21 09:13:02',
                            message: createSecondSampleMessage(radarPrototype)
                        }
                    ]
                },
                {
                    id: 'LD-GTL310-77P',
                    model: 'GTL310',
                    status: 'standby',
                    heartbeatText: '35s',
                    projects: ['WT-250030', 'WT-250055'],
                    queue: []
                },
                {
                    id: 'LD-GTL310-88P',
                    model: 'GTL310',
                    status: 'offline',
                    heartbeatText: '1m',
                    projects: ['WT-250022', 'WT-250030', 'WT-250055'],
                    queue: []
                }
            ],
            connectedDeviceId: null,
            initializationAcks: [],
            events: []
        };
    }

    function createRadarAdapter(options = {}) {
        const radarPrototype = options.radarPrototype || browserRadarPrototype;
        if (!radarPrototype) {
            throw new Error('RadarPrototype 未初始化');
        }

        const now = options.now || (() => new Date().toISOString());
        const state = options.initialState ? clone(options.initialState) : buildDefaultState(radarPrototype);

        function findDevice(deviceId) {
            const device = state.devices.find(item => item.id === deviceId);
            if (!device) throw new Error(`设备不存在：${deviceId}`);
            return device;
        }

        function pushEvent(type, message, extra = {}) {
            const event = {
                id: `EVT-${String(state.events.length + 1).padStart(3, '0')}`,
                type,
                message,
                createdAt: now(),
                ...extra
            };
            state.events.unshift(event);
            return event;
        }

        async function listDevices() {
            return state.devices.map(device => ({
                id: device.id,
                model: device.model,
                status: device.status,
                heartbeatText: device.heartbeatText,
                projects: [...device.projects],
                queueCount: device.queue.length,
                connected: device.id === state.connectedDeviceId
            }));
        }

        async function connectDevice(deviceId) {
            const device = findDevice(deviceId);
            state.connectedDeviceId = device.id;
            device.status = 'online';
            pushEvent('device_connected', `设备 ${device.id} 已通过模拟适配层连接`, { deviceId: device.id });
            return {
                ok: true,
                adapterMode: 'mock',
                device: (await listDevices()).find(item => item.id === device.id)
            };
        }

        async function sendInitialization(input) {
            const deviceId = input.deviceId;
            if (state.connectedDeviceId !== deviceId) {
                throw new Error(`设备 ${deviceId || '-'} 未连接，无法下发初始化参数`);
            }
            const payload = radarPrototype.buildInitializationPayload({
                ...input,
                generatedAt: now()
            });
            const ack = {
                ok: true,
                adapterMode: 'mock',
                ackId: `ACK-${deviceId}-${String(state.initializationAcks.length + 1).padStart(3, '0')}`,
                acceptedAt: now(),
                payload
            };
            state.initializationAcks.unshift(ack);
            pushEvent('initialization_ack', `初始化参数已由模拟适配层确认：${ack.ackId}`, { deviceId, ackId: ack.ackId });
            return clone(ack);
        }

        async function pullDetectionQueue(deviceId) {
            const device = findDevice(deviceId);
            if (state.connectedDeviceId !== deviceId) {
                throw new Error(`设备 ${deviceId} 未连接，无法拉取接收队列`);
            }
            const items = device.queue.map(item => clone(item));
            pushEvent('queue_pulled', `已拉取 ${device.id} 的接收队列 ${items.length} 条`, { deviceId, count: items.length });
            return {
                ok: true,
                adapterMode: 'mock',
                deviceId,
                items
            };
        }

        async function getEvents() {
            return clone(state.events);
        }

        return {
            listDevices,
            connectDevice,
            sendInitialization,
            pullDetectionQueue,
            getEvents
        };
    }

    return { createRadarAdapter };
});
