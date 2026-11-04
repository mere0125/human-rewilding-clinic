import test from 'node:test';
import assert from 'node:assert/strict';
import {CASE} from '../case.mjs';
import {makeDemo,metrics,parseCSV,toCSV} from '../engine.mjs';
import {initialSettings,calculateStudy,reviewedParameters,EMPTY_REVIEW} from '../study.mjs';

test('the four isolated plans preserve the documented comparisons',()=>{
  const rows=makeDemo(),snapshot=JSON.stringify(rows),s=calculateStudy(rows,initialSettings());
  for(const [id,expected]of Object.entries({baseline:29.1058333333,opening:31.69,range:21.8975,combined:22.4516666667}))assert.ok(Math.abs(s.conditions[id].metrics.energy-expected)<1e-7);
  assert.equal(JSON.stringify(rows),snapshot);assert.equal(s.conditions.reviewed,undefined);
});
test('unverified permissions stay unresolved instead of becoming refusals',()=>{
  assert.equal(reviewedParameters(initialSettings(),EMPTY_REVIEW),null);
  assert.equal(reviewedParameters(initialSettings(),{resident:'accepted',opening:'granted',thermostat:'unverified'}),null);
});
test('a refused opening with a permitted thermostat yields only the range intervention',()=>{
  const rows=makeDemo(),s=calculateStudy(rows,initialSettings(),{resident:'accepted',opening:'refused',thermostat:'granted'});
  assert.equal(s.conditions.reviewed.metrics.energy,s.conditions.range.metrics.energy);
  assert.ok(s.conditions.reviewed.rows.slice(0,-1).every(r=>r.window===0));
});
test('a resident refusal retains existing operation even if building permission was offered',()=>{
  const s=calculateStudy(makeDemo(),initialSettings(),{resident:'declined',opening:'granted',thermostat:'granted'});
  assert.equal(s.conditions.reviewed.metrics.energy,s.conditions.baseline.metrics.energy);
  assert.equal(s.conditions.reviewed.parameters.deadband,CASE.thermal.deadband);
});
test('granting both permissions reproduces the proposed operation',()=>{
  const s=calculateStudy(makeDemo(),initialSettings(),{resident:'accepted',opening:'granted',thermostat:'granted'});
  assert.equal(s.conditions.reviewed.metrics.energy,s.conditions.combined.metrics.energy);
});
test('an imported temperature record without thermal power has unknown energy',()=>{
  const rows=parseCSV(toCSV(makeDemo()));
  assert.equal(metrics(rows).energy,null);
  assert.ok(Number.isFinite(calculateStudy(rows,initialSettings()).conditions.baseline.metrics.energy));
});
