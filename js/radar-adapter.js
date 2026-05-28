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

    const DEFAULT_MQTT_ENV = 'pre';

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function toInteger(value, fallback = 0) {
        const number = Number.parseInt(value, 10);
        return Number.isFinite(number) ? number : fallback;
    }

    function buildMqttTopic(env, side, deviceCode) {
        return `/ypd/${env}/${side}/${deviceCode}`;
    }

    function buildMqttMessage(messageId, type, content = {}, responseTo = '') {
        return {
            messageId,
            type,
            content: typeof content === 'string' ? content : JSON.stringify(content),
            responseTo
        };
    }

    function buildDetectionPlanContent(input) {
        const planningSide = toInteger(input.planningSide ?? input.planning_side, 1);
        return {
            center_x_m: toNumber(input.centerXM ?? input.center_x_m ?? input.initialX, 0),
            center_y_m: toNumber(input.centerYM ?? input.center_y_m ?? input.initialY, 0),
            heading_deg: toNumber(input.headingDeg ?? input.heading_deg ?? input.directionDeg, 0),
            length_m: toNumber(input.lengthM ?? input.length_m, 4),
            width_m: toNumber(input.widthM ?? input.width_m, 3.5),
            half_arc_width_m: toNumber(input.halfArcWidthM ?? input.half_arc_width_m, 3.5),
            point_distance_m: toNumber(input.pointDistanceM ?? input.point_distance_m, 1),
            point_count: toInteger(input.pointCount ?? input.point_count, 5),
            planning_side: planningSide === -1 ? -1 : 1
        };
    }

    function buildDefaultTelemetry(seed = {}) {
        const x = toNumber(seed.x, 0);
        const y = toNumber(seed.y, 0);
        const yaw = toNumber(seed.yaw, 0);
        return {
            battery: {
                voltage: 48,
                ampere: 1.2,
                capacity: 80,
                bmusys_status: 0,
                charge_status: 0
            },
            pose: {
                x,
                y,
                yaw,
                origin_x: x,
                origin_y: y,
                origin_yaw: yaw,
                frame_id: 'map'
            },
            task: {
                state: 0,
                stateText: '未开始',
                end_reason: '',
                progress: 0,
                completedCount: 0,
                totalCount: 0,
                rectangle_points: [],
                s_path_points: []
            }
        };
    }

    function updateTaskForCommand(device, type, content = {}) {
        const telemetry = device.telemetry || buildDefaultTelemetry();
        const task = telemetry.task;
        if (type === 'detection_plan') {
            task.state = 2;
            task.stateText = '矩形探测中';
            task.end_reason = '';
            task.progress = 35;
            task.completedCount = 0;
            task.totalCount = 2;
            task.rectangle_points = [
                { x_m: content.center_x_m, y_m: content.center_y_m },
                { x_m: content.center_x_m + content.length_m, y_m: content.center_y_m },
                { x_m: content.center_x_m + content.length_m, y_m: content.center_y_m + content.width_m },
                { x_m: content.center_x_m, y_m: content.center_y_m + content.width_m }
            ];
            task.s_path_points = Array.from({ length: Math.max(0, content.point_count || 0) }, (_, index) => ({
                x_m: content.center_x_m + index * content.point_distance_m,
                y_m: content.center_y_m + content.half_arc_width_m
            }));
            telemetry.pose.x = content.center_x_m;
            telemetry.pose.y = content.center_y_m;
            telemetry.pose.yaw = content.heading_deg;
        } else if (type === 'start_detection' || type === 'continue_task') {
            task.state = 2;
            task.stateText = '矩形探测中';
            task.end_reason = '';
            task.progress = Math.max(task.progress || 0, 35);
        } else if (type === 'pause_task') {
            task.state = 4;
            task.stateText = '已暂停';
        } else if (type === 'finish_task') {
            task.state = 5;
            task.stateText = '已结束';
            task.progress = 100;
            task.end_reason = '平台结束任务';
        } else if (type === 'manual_drive') {
            task.state = 1;
            task.stateText = '手动控制';
            task.end_reason = '';
        }
        device.telemetry = telemetry;
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
                    videoStreamUrl: 'webrtc://LD-GTL310-66P/main',
                    projects: ['WT-250022', 'WT-250024', 'WT-250029'],
                    telemetry: buildDefaultTelemetry({ x: 2347184.25, y: 434427.06, yaw: 45 }),
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
                    videoStreamUrl: 'webrtc://LD-GTL310-77P/main',
                    projects: ['WT-250030', 'WT-250055'],
                    telemetry: buildDefaultTelemetry({ x: 2349122.72, y: 435278.18, yaw: 90 }),
                    queue: []
                },
                {
                    id: 'LD-GTL310-88P',
                    model: 'GTL310',
                    status: 'offline',
                    heartbeatText: '1m',
                    videoStreamUrl: 'webrtc://LD-GTL310-88P/main',
                    projects: ['WT-250022', 'WT-250030', 'WT-250055'],
                    telemetry: buildDefaultTelemetry({ x: 2353180.42, y: 436812.5, yaw: 315 }),
                    queue: []
                }
            ],
            connectedDeviceId: null,
            initializationAcks: [],
            commandLedger: [],
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
        state.commandLedger = state.commandLedger || [];
        const mqttEnv = options.mqttEnv || DEFAULT_MQTT_ENV;

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
                videoStreamUrl: device.videoStreamUrl || '',
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

        async function sendDeviceCommand(deviceId, type, content = {}) {
            const device = findDevice(deviceId);
            if (state.connectedDeviceId !== deviceId) {
                throw new Error(`设备 ${deviceId || '-'} 未连接，无法下发控制指令`);
            }

            const index = state.commandLedger.length + 1;
            const command = buildMqttMessage(`cmd-${String(index).padStart(3, '0')}`, type, content);
            const ackContent = { code: 0, message: '收到消息' };
            const ack = buildMqttMessage(`ack-${String(index).padStart(3, '0')}`, 'ack', ackContent, command.messageId);
            const record = {
                id: `CMD-${String(index).padStart(3, '0')}`,
                adapterMode: 'mock-mqtt',
                env: mqttEnv,
                deviceId,
                topic: buildMqttTopic(mqttEnv, 'device', deviceId),
                platformTopic: buildMqttTopic(mqttEnv, 'platform', deviceId),
                sentAt: now(),
                acknowledgedAt: now(),
                command,
                ack,
                ackCode: ackContent.code,
                ackMessage: ackContent.message,
                status: 'success'
            };

            updateTaskForCommand(device, type, typeof content === 'string' ? {} : content);
            state.commandLedger.unshift(record);
            pushEvent('mqtt_command_ack', `MQTT 指令 ${type} 已确认：${record.id}`, { deviceId, commandType: type, messageId: command.messageId });
            return clone(record);
        }

        async function sendDetectionPlan(input) {
            return sendDeviceCommand(input.deviceId, 'detection_plan', buildDetectionPlanContent(input));
        }

        async function pullDeviceMessages(deviceId) {
            const device = findDevice(deviceId);
            if (state.connectedDeviceId !== deviceId) {
                throw new Error(`设备 ${deviceId} 未连接，无法拉取设备消息`);
            }
            const telemetry = device.telemetry || buildDefaultTelemetry();
            const messages = {
                ok: true,
                adapterMode: 'mock-mqtt',
                env: mqttEnv,
                deviceId,
                battery: buildMqttMessage(`up-battery-${deviceId}`, 'battery_status', telemetry.battery),
                pose: buildMqttMessage(`up-pose-${deviceId}`, 'vehicle_pose', telemetry.pose),
                task: buildMqttMessage(`up-task-${deviceId}`, 'task_status', telemetry.task),
                items: device.queue.map(item => clone({
                    ...item,
                    mqttType: 'gpr_detection',
                    validMapPoint: true
                }))
            };
            pushEvent('mqtt_messages_pulled', `已同步 ${device.id} 的 MQTT 上行消息`, { deviceId, count: messages.items.length + 3 });
            return clone(messages);
        }

        async function getCommandLedger(deviceId) {
            const rows = deviceId
                ? state.commandLedger.filter(item => item.deviceId === deviceId)
                : state.commandLedger;
            return clone(rows);
        }

        async function getEvents() {
            return clone(state.events);
        }

        return {
            listDevices,
            connectDevice,
            sendInitialization,
            sendDetectionPlan,
            sendDeviceCommand,
            pullDetectionQueue,
            pullDeviceMessages,
            getCommandLedger,
            getEvents
        };
    }

    return { createRadarAdapter };
});
