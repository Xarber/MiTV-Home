// SPDX-License-Identifier: AGPL-3.0-only
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HeldPress} from '../../src/model/heldPress.ts';
function harness(){const state:{panel:string|null;events:string[];timer?:()=>void}={panel:null,events:[]};const keys=new HeldPress({context:()=>state.panel,hold:(key,id)=>{state.events.push('hold:'+key+':'+id);state.panel='menu';},release:(key,id)=>state.events.push('release:'+key+':'+id)},{schedule:task=>{state.timer=task;return task;},cancel:()=>{state.timer=undefined;}});return {state,keys};}
test('held OK owns its release after opening an app menu',()=>{const {state,keys}=harness();keys.down('select','dock:hdmi2');state.timer?.();keys.up('select');assert.deepEqual(state.events,['hold:select:dock:hdmi2']);});
test('snapshot rerenders do not reset the hold and short OK keeps its original target',()=>{const {state,keys}=harness();keys.down('select','dock:inputs');const timer=state.timer;Object.assign(state,{panel:null});assert.equal(state.timer,timer);keys.up('select');assert.deepEqual(state.events,['release:select:dock:inputs']);});
test('changing or canceling the popup context cannot activate its new focus target',()=>{const {state,keys}=harness();keys.down('back','panel-close');state.panel='control';state.timer?.();keys.up('back');assert.deepEqual(state.events,[]);keys.down('select','panel-close');keys.cancel();keys.up('select');assert.deepEqual(state.events,[]);});
test('Android authoritative long-press flag opens once without releasing a new target',()=>{const {state,keys}=harness();keys.down('select','dock:inputs');keys.long('select');keys.long('select');keys.up('select');assert.deepEqual(state.events,['hold:select:dock:inputs']);});
