const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildInitializationPayload,
    parseDetectionMessage,
    buildSampleDetectionMessage,
    buildExplorationRecordsFromCandidates,
    mergeRadarExplorationRecords,
    buildExplorationMapModelLinks
} = require('../js/radar-prototype.js');

test('buildInitializationPayload creates device initialization command', () => {
    const payload = buildInitializationPayload({
        deviceId: 'LD-GTL310-66P',
        projectIds: ['WT-250022'],
        surveyLineId: 'A303-0001',
        scanMode: 'zigzag',
        hostPermittivity: '10',
        timeWindowNs: '21',
        distanceScaleMPerPx: '0.01',
        antennaConfig: '1',
        coordinateSystem: 'CGCS2000'
    });

    assert.equal(payload.command, 'initialize_scan');
    assert.equal(payload.device_id, 'LD-GTL310-66P');
    assert.deepEqual(payload.project_ids, ['WT-250022']);
    assert.equal(payload.parameters.survey_line_id, 'A303-0001');
    assert.equal(payload.parameters.scan_mode, 'zigzag');
    assert.equal(payload.parameters.host_permittivity, 10);
    assert.equal(payload.parameters.time_window_ns, 21);
    assert.equal(payload.parameters.distance_scale_m_per_px, 0.01);
    assert.equal(payload.parameters.antenna_config, 1);
    assert.equal(payload.parameters.coordinate_system, 'CGCS2000');
});

test('parseDetectionMessage expands result_json into survey line and candidates', () => {
    const parsed = parseDetectionMessage(buildSampleDetectionMessage());

    assert.equal(parsed.ok, true);
    assert.equal(parsed.surveyLine.fileName, 'A303_2026-04-21_0001_0');
    assert.equal(parsed.surveyLine.totalPipesDetected, 2);
    assert.equal(parsed.candidates.length, 2);
    assert.equal(parsed.candidates[0].categoryLabel, '给水');
    assert.equal(parsed.candidates[0].typeKey, 'water');
    assert.equal(parsed.candidates[0].materialLabel, '非金属');
    assert.equal(parsed.candidates[0].depthM, 0.85);
    assert.equal(parsed.candidates[1].categoryLabel, '电力');
    assert.equal(parsed.candidates[1].materialLabel, '金属');
    assert.equal(parsed.warnings.length, 0);
});

test('parseDetectionMessage reports invalid json without throwing', () => {
    const parsed = parseDetectionMessage({
        file_name: 'bad-file',
        result_json: '{bad json'
    });

    assert.equal(parsed.ok, false);
    assert.match(parsed.error, /result_json/);
});

test('buildExplorationRecordsFromCandidates maps parsed candidates to exploration records', () => {
    const parsed = parseDetectionMessage(buildSampleDetectionMessage());
    const records = buildExplorationRecordsFromCandidates({
        candidates: parsed.candidates,
        surveyLine: parsed.surveyLine,
        deviceId: 'LD-GTL310-66P',
        accuracyDecision: 'accepted',
        importedAt: '2026-05-21T10:00:00.000Z'
    });

    assert.equal(records.length, 2);
    assert.equal(records[0].explorationNo, 'EXP-W9001');
    assert.equal(records[0].stage, 'exploration');
    assert.equal(records[0].accuracyDecision, 'accepted');
    assert.equal(records[0].categoryLabel, '给水');
    assert.equal(records[0].diameter, 'DN110');
    assert.equal(records[0].depthM, 0.85);
    assert.match(records[0].remark, /雷达候选成果/);
    assert.equal(records[1].explorationNo, 'EXP-E9002');
    assert.equal(records[1].categoryLabel, '电力');
});

test('mergeRadarExplorationRecords appends new records and skips duplicate radar source ids', () => {
    const parsed = parseDetectionMessage(buildSampleDetectionMessage());
    const records = buildExplorationRecordsFromCandidates({
        candidates: parsed.candidates,
        surveyLine: parsed.surveyLine,
        deviceId: 'LD-GTL310-66P'
    });

    const result = mergeRadarExplorationRecords([records[0]], records);

    assert.equal(result.records.length, 2);
    assert.equal(result.inserted.length, 1);
    assert.equal(result.skipped.length, 1);
    assert.equal(result.skipped[0].sourceCandidateId, records[0].sourceCandidateId);
});

test('buildExplorationMapModelLinks creates automatic map and model links from exploration records', () => {
    const parsed = parseDetectionMessage(buildSampleDetectionMessage());
    const records = buildExplorationRecordsFromCandidates({
        candidates: parsed.candidates,
        surveyLine: parsed.surveyLine,
        deviceId: 'LD-GTL310-66P'
    });
    const links = buildExplorationMapModelLinks(records, parsed.surveyLine);

    assert.equal(links.mapFeatures.length, 2);
    assert.equal(links.mapFeatures[0].sourceExplorationId, records[0].id);
    assert.equal(links.mapFeatures[0].geometry.type, 'Point');
    assert.equal(links.modelLinks[0].modelLayer, 'radar-candidate-pipes');
    assert.equal(links.modelLinks[0].surveyLineFileName, parsed.surveyLine.fileName);
    assert.equal(links.modelLinks[0].autoLinked, true);
});
