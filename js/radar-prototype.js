(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.RadarPrototype = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    const CATEGORY_MAP = {
        PW: { label: '给水', typeKey: 'water' },
        PG: { label: '燃气', typeKey: 'gas' },
        EC: { label: '电力', typeKey: 'electricity' },
        MW: { label: '给水', typeKey: 'water' }
    };

    const MATERIAL_MAP = {
        0: '非金属',
        1: '金属'
    };

    const LEDGER_TYPE_META = {
        water: { prefix: 'W', label: '给水', owner: '自来水公司' },
        gas: { prefix: 'G', label: '燃气', owner: '燃气公司' },
        drainage: { prefix: 'D', label: '排水', owner: '市政公司' },
        electricity: { prefix: 'E', label: '电力', owner: '电力公司' },
        heat: { prefix: 'H', label: '热力', owner: '热力公司' },
        telecom: { prefix: 'T', label: '通信', owner: '通信公司' },
        industrial: { prefix: 'I', label: '工业', owner: '工业园区' },
        other: { prefix: 'O', label: '其他', owner: '综合管养单位' }
    };

    function toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function buildInitializationPayload(input) {
        const projectIds = Array.isArray(input.projectIds)
            ? input.projectIds.filter(Boolean)
            : String(input.projectIds || '').split(',').map(item => item.trim()).filter(Boolean);

        return {
            command: 'initialize_scan',
            device_id: input.deviceId || '',
            project_ids: projectIds,
            generated_at: input.generatedAt || new Date().toISOString(),
            parameters: {
                survey_line_id: input.surveyLineId || '',
                scan_mode: input.scanMode || 'straight',
                host_permittivity: toNumber(input.hostPermittivity, 10),
                time_window_ns: toNumber(input.timeWindowNs, 21),
                distance_scale_m_per_px: toNumber(input.distanceScaleMPerPx, 0.01),
                antenna_config: toNumber(input.antennaConfig, 0),
                coordinate_system: input.coordinateSystem || 'CGCS2000',
                initial_point: {
                    x: toNumber(input.initialX, 0),
                    y: toNumber(input.initialY, 0),
                    elevation_m: toNumber(input.initialElevation, 0)
                },
                heading_degrees: toNumber(input.directionDeg, 0)
            }
        };
    }

    function parseResultJson(rawJson) {
        if (typeof rawJson === 'string') return JSON.parse(rawJson);
        if (rawJson && typeof rawJson === 'object') return rawJson;
        throw new Error('result_json 不是有效 JSON 字符串');
    }

    function hasValidCoordinate(point) {
        if (!point) return false;
        return ['latitude', 'longitude', 'elevation_m'].some(key => toNumber(point[key], 0) !== 0);
    }

    function getVertexCoordinate(pipe) {
        const gps = pipe.gps_coordinates || {};
        const cgcsVertex = gps.cgcs2000?.vertex;
        const wgsVertex = gps.wgs84?.vertex;
        return {
            coordinateSystem: hasValidCoordinate(cgcsVertex) ? 'CGCS2000' : 'WGS84',
            point: hasValidCoordinate(cgcsVertex) ? cgcsVertex : wgsVertex,
            valid: hasValidCoordinate(cgcsVertex) || hasValidCoordinate(wgsVertex)
        };
    }

    function normalizeCandidate(pipe, surveyLine) {
        const category = CATEGORY_MAP[pipe.category] || { label: '其他/待确认', typeKey: 'other' };
        const physical = pipe.physical_properties || {};
        const materialCode = pipe.pipe_material?.material_code;
        const coordinate = getVertexCoordinate(pipe);

        return {
            id: `${surveyLine.fileName || 'radar'}-${pipe.pipe_id || surveyLine.candidatesCount + 1}`,
            pipeId: pipe.pipe_id,
            categoryCode: pipe.category || '',
            categoryLabel: category.label,
            typeKey: category.typeKey,
            confidence: toNumber(pipe.confidence, 0),
            depthM: toNumber(physical.predicted_burial_depth_m, 0),
            diameterM: toNumber(physical.predicted_outer_diameter_m, 0),
            curvature: toNumber(physical.vertex_curvature_1_per_m, 0),
            peakAmplitude: toNumber(physical.peak_amplitude, 0),
            minAmplitude: toNumber(physical.min_amplitude, 0),
            reflectTimeNs: toNumber(physical.vertex_reflect_time_ns, 0),
            materialCode,
            materialLabel: MATERIAL_MAP[materialCode] || '待确认',
            antennaConfig: pipe.antenna_configuration?.antenna_config ?? '',
            vertexPixel: pipe.vertex_position || {},
            coordinateSystem: coordinate.coordinateSystem,
            coordinateValid: coordinate.valid,
            vertexCoordinate: coordinate.point || {}
        };
    }

    function parseDetectionMessage(message) {
        try {
            const source = typeof message === 'string' ? JSON.parse(message) : message;
            if (!source || typeof source !== 'object') throw new Error('检测消息为空');

            const parsedJson = parseResultJson(source.result_json);
            const metadata = parsedJson.metadata || {};
            const pipes = Array.isArray(parsedJson.pipes) ? parsedJson.pipes : [];
            const expectedCount = toNumber(metadata.total_pipes_detected ?? source.total_pipes_detected, pipes.length);
            const warnings = [];

            if (expectedCount !== pipes.length) {
                warnings.push(`识别数量不一致：元数据为 ${expectedCount}，实际管线数组为 ${pipes.length}`);
            }

            const surveyLine = {
                fileName: metadata.file_name || source.file_name || '',
                processingTime: metadata.processing_time || '',
                totalPipesDetected: expectedCount,
                actualPipeCount: pipes.length,
                surveyLineLengthM: toNumber(metadata.survey_line_length_m ?? source.survey_line_length, 0),
                timeWindowNs: toNumber(metadata.time_window_ns ?? source.time_window, 0),
                distanceScaleMPerPx: toNumber(metadata.distance_scale_m_per_px, 0),
                timeScaleNsPerPx: toNumber(metadata.time_scale_ns_per_px, 0),
                hostPermittivity: toNumber(metadata.host_permittivity, 0),
                dataFormat: metadata.data_format || '',
                rotationAngle: toNumber(source.rotation_angle, 0),
                candidatesCount: pipes.length
            };

            const candidates = pipes.map(pipe => normalizeCandidate(pipe, surveyLine));
            candidates.forEach(candidate => {
                if (candidate.categoryLabel === '其他/待确认') warnings.push(`管线 ${candidate.pipeId} 存在未知类别 ${candidate.categoryCode}`);
                if (!candidate.coordinateValid) warnings.push(`管线 ${candidate.pipeId} 无有效 GPS 坐标`);
            });

            return {
                ok: true,
                surveyLine,
                candidates,
                warnings,
                raw: parsedJson
            };
        } catch (error) {
            return {
                ok: false,
                error: `result_json 解析失败：${error.message}`,
                warnings: [],
                candidates: []
            };
        }
    }

    function buildSampleDetectionMessage() {
        const result = {
            metadata: {
                file_name: 'A303_2026-04-21_0001_0',
                processing_time: '2026-05-18 14:30:25',
                total_pipes_detected: 2,
                survey_line_length_m: 45.67,
                time_window_ns: 21.0,
                distance_scale_m_per_px: 0.01,
                time_scale_ns_per_px: 0.07,
                host_permittivity: 10.0,
                data_format: 'int16'
            },
            pipes: [
                {
                    pipe_id: 1,
                    category: 'PW',
                    confidence: 0.95,
                    vertex_position: { x: 150.5, y: 95.9 },
                    physical_properties: {
                        predicted_burial_depth_m: 0.85,
                        predicted_outer_diameter_m: 0.11,
                        vertex_curvature_1_per_m: 0.0245,
                        peak_amplitude: 1250.5,
                        min_amplitude: -980.3,
                        vertex_reflect_time_ns: 6.713
                    },
                    gps_coordinates: {
                        cgcs2000: {
                            vertex: { latitude: 39.904595, longitude: 116.407698, elevation_m: 50.8 }
                        },
                        wgs84: {
                            vertex: { latitude: 39.9046, longitude: 116.4077, elevation_m: 50.8 }
                        }
                    },
                    antenna_configuration: { antenna_config: 0 },
                    pipe_material: { material_code: 0 }
                },
                {
                    pipe_id: 2,
                    category: 'EC',
                    confidence: 0.88,
                    vertex_position: { x: 220.8, y: 128.9 },
                    physical_properties: {
                        predicted_burial_depth_m: 1.12,
                        predicted_outer_diameter_m: 0.08,
                        vertex_curvature_1_per_m: 0.0201,
                        peak_amplitude: 980.2,
                        min_amplitude: -750.6,
                        vertex_reflect_time_ns: 9.023
                    },
                    gps_coordinates: {
                        cgcs2000: {
                            vertex: { latitude: 39.904695, longitude: 116.407798, elevation_m: 50.9 }
                        },
                        wgs84: {
                            vertex: { latitude: 39.9047, longitude: 116.4078, elevation_m: 50.9 }
                        }
                    },
                    antenna_configuration: { antenna_config: 0 },
                    pipe_material: { material_code: 1 }
                }
            ]
        };

        return {
            file_name: result.metadata.file_name,
            survey_line_length: result.metadata.survey_line_length_m,
            time_window: result.metadata.time_window_ns,
            total_pipes_detected: result.metadata.total_pipes_detected,
            rotation_angle: 0,
            pipe_category: 'PW',
            confidence: 0.95,
            result_json: JSON.stringify(result, null, 2)
        };
    }

    function formatFixed(value, digits = 2) {
        return toNumber(value, 0).toFixed(digits);
    }

    function formatDiameter(diameterM) {
        const diameterMm = Math.round(toNumber(diameterM, 0) * 1000);
        return diameterMm > 0 ? `DN${diameterMm}` : '';
    }

    function buildExplorationRecordsFromCandidates({ candidates, surveyLine, deviceId = '', accuracyDecision = 'pending_review', importedAt = new Date().toISOString() }) {
        return (candidates || []).map((candidate, index) => {
            const typeMeta = LEDGER_TYPE_META[candidate.typeKey] || LEDGER_TYPE_META.other;
            const sequence = 9001 + index;
            const explorationNo = `EXP-${typeMeta.prefix}${sequence}`;
            const elevation = toNumber(candidate.vertexCoordinate?.elevation_m, 0);
            const topElev = elevation ? elevation - candidate.depthM : 0;
            const bottomElev = topElev && candidate.diameterM ? topElev - candidate.diameterM : 0;
            const sourceCandidateId = candidate.id || `${surveyLine?.fileName || 'radar'}-${candidate.pipeId || index + 1}`;

            return {
                id: `EXPLORATION-${sourceCandidateId}`,
                source: 'radar',
                stage: 'exploration',
                status: 'accepted',
                accuracyDecision,
                sourceCandidateId,
                sourceSurveyLine: surveyLine?.fileName || '',
                sourceDeviceId: deviceId,
                acceptedAt: importedAt,
                type: candidate.typeKey || 'other',
                categoryLabel: typeMeta.label,
                explorationNo,
                feature: '雷达识别点',
                material: candidate.materialLabel || '',
                diameter: formatDiameter(candidate.diameterM),
                x: formatFixed(candidate.vertexCoordinate?.longitude, 6),
                y: formatFixed(candidate.vertexCoordinate?.latitude, 6),
                groundElevM: elevation ? toNumber(formatFixed(elevation, 2), 0) : 0,
                topElevM: topElev ? toNumber(formatFixed(topElev, 2), 0) : 0,
                bottomElevM: bottomElev ? toNumber(formatFixed(bottomElev, 2), 0) : 0,
                depthM: toNumber(formatFixed(candidate.depthM, 2), 0),
                confidence: toNumber(candidate.confidence, 0),
                owner: typeMeta.owner,
                remark: `雷达候选成果；测线 ${surveyLine?.fileName || '-'}；置信度 ${Math.round(toNumber(candidate.confidence, 0) * 100)}%；原始类别 ${candidate.categoryCode || '-'}`
            };
        });
    }

    function mergeRadarExplorationRecords(existingRecords, incomingRecords) {
        const records = Array.isArray(existingRecords) ? [...existingRecords] : [];
        const existingSourceIds = new Set(records.map(record => record.sourceCandidateId).filter(Boolean));
        const inserted = [];
        const skipped = [];

        (incomingRecords || []).forEach(record => {
            if (record.sourceCandidateId && existingSourceIds.has(record.sourceCandidateId)) {
                skipped.push(record);
                return;
            }
            records.push(record);
            inserted.push(record);
            if (record.sourceCandidateId) existingSourceIds.add(record.sourceCandidateId);
        });

        return { records, inserted, skipped };
    }

    function buildExplorationMapModelLinks(records, surveyLine) {
        const mapFeatures = (records || []).map(record => ({
            id: `MAP-${record.id}`,
            sourceExplorationId: record.id,
            sourceCandidateId: record.sourceCandidateId,
            geometry: {
                type: 'Point',
                coordinates: [toNumber(record.x, 0), toNumber(record.y, 0)]
            },
            properties: {
                explorationNo: record.explorationNo,
                category: record.categoryLabel,
                depthM: toNumber(record.depthM, 0),
                diameter: record.diameter,
                surveyLineFileName: record.sourceSurveyLine || surveyLine?.fileName || '',
                autoLinked: true
            }
        }));

        const modelLinks = (records || []).map(record => ({
            id: `MODEL-${record.id}`,
            sourceExplorationId: record.id,
            sourceCandidateId: record.sourceCandidateId,
            modelLayer: 'radar-candidate-pipes',
            surveyLineFileName: record.sourceSurveyLine || surveyLine?.fileName || '',
            displayName: `${record.explorationNo} ${record.categoryLabel}`,
            depthM: toNumber(record.depthM, 0),
            diameter: record.diameter,
            status: 'sample-linked',
            autoLinked: true
        }));

        return { mapFeatures, modelLinks };
    }

    return {
        buildInitializationPayload,
        parseDetectionMessage,
        buildSampleDetectionMessage,
        buildExplorationRecordsFromCandidates,
        mergeRadarExplorationRecords,
        buildExplorationMapModelLinks
    };
});
