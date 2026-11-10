import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,transition,visibleRecord,canEditCriteria} from '../clinic-session.mjs';

const act=(state,type,value)=>transition(state,{type,value});
const active=()=>act(act(createSession(),'consent',true),'start');

test('a trial cannot begin or open its aperture without explicit patient consent',()=>{
  const initial=createSession();
  for(const [type,value] of [['start'],['opening',.6],['shade',.8],['filter','bypass']]){
    const next=act(initial,type,value);
    assert.equal(next.status,'idle');assert.equal(next.opening,0);assert.equal(next.shade,.45);
    assert.equal(next.filter,'filtered');assert.equal(next.events.length,0);assert.ok(next.notice);
  }
  const staff=act(initial,'role','staff');
  assert.equal(act(staff,'consent',true).consent,false);
  assert.equal(act(staff,'start').status,'idle');
});

test('patient start records deliberate apparatus changes without mutating earlier states',()=>{
  const started=active(),opened=act(started,'opening',.65),shaded=act(opened,'shade',.8),filtered=act(shaded,'filter','bypass');
  assert.equal(started.opening,0);assert.equal(started.events.length,2);
  assert.equal(filtered.zone,'trial');assert.equal(filtered.recording,true);
  assert.equal(filtered.opening,.65);assert.equal(filtered.shade,.8);assert.equal(filtered.filter,'bypass');
  assert.deepEqual(filtered.events.map(e=>e.seq),[1,2,3,4,5]);
  assert.equal(filtered.events.at(-1).actor,'patient');assert.equal(filtered.events.at(-1).category,'apparatus');
});

test('patient stop closes the aperture and staff cannot resume or change it',()=>{
  const paused=act(act(active(),'opening',.9),'stop');
  assert.equal(paused.status,'paused');assert.equal(paused.opening,0);assert.equal(paused.recording,false);
  const staff=act(paused,'role','staff');
  for(const [type,value] of [['start'],['opening',1],['consent',true]]){
    const denied=act(staff,type,value);
    assert.equal(denied.status,'paused');assert.equal(denied.opening,0);assert.equal(denied.recording,false);
    assert.equal(denied.events.length,staff.events.length);
  }
  const resumed=act(act(staff,'role','patient'),'start');
  assert.equal(resumed.status,'active');assert.equal(resumed.opening,0);
});

test('withdrawal stops an active trial and requires fresh consent before resume',()=>{
  const withdrawn=act(act(active(),'opening',.5),'consent',false);
  assert.equal(withdrawn.consent,false);assert.equal(withdrawn.status,'paused');
  assert.equal(withdrawn.recording,false);assert.equal(withdrawn.opening,0);
  assert.equal(act(withdrawn,'start').status,'paused');
  assert.equal(act(act(withdrawn,'consent',true),'start').status,'active');
});

test('the physical patient stop works in staff perspective without granting staff resume authority',()=>{
  const staff=act(act(active(),'role','staff'),'opening',.85);
  const paused=act(staff,'patient-stop');
  assert.equal(paused.status,'paused');assert.equal(paused.recording,false);assert.equal(paused.opening,0);
  assert.equal(paused.role,'staff');assert.equal(paused.events.at(-1).actor,'patient');
  assert.equal(paused.events.at(-1).type,'patient-stop');
  assert.match(paused.events.at(-1).detail,/physical stop control/);
  assert.equal(act(paused,'start').status,'paused');
  assert.equal(act(staff,'stop').status,'active');
  const ended=act(act(paused,'role','patient'),'end');
  const locked=act(ended,'patient-stop');
  assert.equal(locked.status,'ended');assert.equal(locked.events.length,ended.events.length);
});

test('staff access and the patient-facing record window are distinct',()=>{
  const patient=act(active(),'zone','records');
  assert.equal(patient.zone,'trial');assert.match(patient.notice,/public record window/);
  const staff=act(act(patient,'role','staff'),'zone','records');
  assert.equal(staff.zone,'records');assert.equal(staff.events.at(-1).category,'access');
  const publicView=act(staff,'role','patient');
  assert.equal(publicView.zone,'trial');assert.equal(publicView.role,'patient');
});

test('criteria edits are staff governance, versioned and visible even while observation is paused',()=>{
  const paused=act(active(),'pause'),criteria={ratio:.2,duty:.1,controls:2};
  assert.equal(canEditCriteria(paused),false);
  assert.equal(act(paused,'criteria',criteria).ruleVersion,1);
  const staff=act(paused,'role','staff'),revised=act(staff,'criteria',criteria);
  assert.equal(canEditCriteria(staff),true);assert.equal(revised.ruleVersion,2);
  assert.equal(revised.recording,false);assert.equal(revised.status,'paused');
  assert.deepEqual(paused.criteria,{ratio:.25,duty:.7,controls:1});
  assert.equal(revised.events.at(-1).category,'governance');
  assert.match(revised.events.at(-1).detail,/temperature record is unchanged/);
  assert.equal(act(revised,'criteria',criteria).ruleVersion,2);
  const record=visibleRecord(act(revised,'role','patient'));
  assert.deepEqual(record.criteria,criteria);assert.equal(record.events.find(e=>e.type==='criteria').change.toVersion,2);
  assert.ok(record.events.every(e=>e.caseId==='Room 001'));
  record.criteria.ratio=1.5;record.events.at(-1).detail='changed outside the machine';
  assert.equal(revised.criteria.ratio,.2);assert.notEqual(revised.events.at(-1).detail,'changed outside the machine');
});

test('invalid criteria and out-of-range apparatus positions are refused without coercion',()=>{
  const staff=act(active(),'role','staff');
  for(const criteria of [{ratio:0,duty:.5,controls:1},{ratio:.25,duty:70,controls:1},{ratio:.25,duty:.5,controls:1.5},{ratio:'0.25',duty:.5,controls:1}]){
    const denied=act(staff,'criteria',criteria);assert.equal(denied.ruleVersion,1);assert.equal(denied.events.length,staff.events.length);
  }
  for(const value of [-.1,1.1,NaN,'1'])assert.equal(act(staff,'opening',value).opening,0);
});

test('a staff revision reason is bounded and retained in the patient-visible audit',()=>{
  const staff=act(active(),'role','staff');
  const reason='Testing an alternative institutional threshold. '+ 'x'.repeat(600);
  const action={type:'criteria',value:{ratio:.2,duty:.1,controls:1},reason};
  const revised=transition(staff,action),record=visibleRecord(act(revised,'role','patient'));
  const revision=record.events.find(e=>e.type==='criteria');
  assert.equal(revision.reason,reason.slice(0,500));
  assert.equal(revision.reason.length,500);
  assert.equal(action.reason,reason);
  action.reason='Changed after the transition';
  assert.equal(revised.events.at(-1).reason,reason.slice(0,500));
});

test('ending freezes the case while allowing perspective and zone inspection',()=>{
  const ended=act(act(active(),'opening',1),'end');
  assert.equal(ended.status,'ended');assert.equal(ended.recording,false);assert.equal(ended.opening,0);
  assert.equal(ended.events.at(-1).type,'end');
  const staff=act(ended,'role','staff'),inside=act(staff,'zone','records');
  assert.equal(inside.zone,'records');assert.equal(inside.events.at(-1).type,'end');
  for(const [type,value] of [['criteria',{ratio:.1,duty:.1,controls:1}],['opening',1],['start'],['consent',true]]){
    const denied=act(inside,type,value);assert.equal(denied.status,'ended');assert.equal(denied.ruleVersion,1);assert.equal(denied.events.length,ended.events.length);
  }
  const fresh=createSession();assert.equal(fresh.status,'idle');assert.deepEqual(fresh.events,[]);assert.equal(fresh.consent,false);
});
