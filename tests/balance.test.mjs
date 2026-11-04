import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDemo,simulate} from '../engine.mjs';
import {CASE,volume} from '../case.mjs';
test('each modelled interval closes its signed heat balance',()=>{
  const rows=simulate(makeDemo(),{permission:true,deadband:2.5});
  const C=CASE.thermal.fabricCapacity+CASE.thermal.rho*CASE.thermal.cp*volume;
  rows.slice(0,-1).forEach((r,i)=>{
    const b=r.balance;
    assert.ok(Math.abs(b.envelope+b.ventilation+b.internal+b.conditioning-b.storage)<1e-7);
    assert.ok(Math.abs(b.storage-C*(rows[i+1].indoor-r.indoor)/3600)<1e-7);
    assert.ok(Math.abs(b.conditioning)<=r.thermalWh+1e-7);
    if(r.window===0)assert.ok(Math.abs(b.ventilation-(CASE.thermal.rho*CASE.thermal.cp*volume*CASE.thermal.baseACH/3600/CASE.thermal.ua)*b.envelope)<1e-7);
  });
  assert.equal(rows.at(-1).balance,null);
});
test('missing record intervals have no invented heat-flow components',()=>{
  const rows=makeDemo().filter((_,i)=>i<20||i>28),sim=simulate(rows);
  assert.equal(sim[19].balance,null);
});
test('a fully isolated room retains a finite internal and equipment balance',()=>{
  const rows=simulate(makeDemo(),{ua:0,baseACH:0,extraACH:0});
  rows.slice(0,-1).forEach(r=>{assert.ok(Number.isFinite(r.balance.storage));assert.equal(r.balance.envelope,0);assert.equal(r.balance.ventilation,0);assert.ok(Math.abs(r.balance.internal+r.balance.conditioning-r.balance.storage)<1e-7);});
});
