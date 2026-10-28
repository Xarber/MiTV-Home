// SPDX-License-Identifier: AGPL-3.0-only
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nativeSnapshot} from '../../src/launcher/snapshot.ts';
const state=()=>({schema:1,catalog:[{id:'org.example.player',name:'Player',kind:'app'}],preferences:{dock:['hdmi1','live','org.example.player','airplay','inputs','all'],language:'it',glass:true,motion:false},music:{active:false},network:{connected:false},paired:{paired:false},build:{version:'2.0.0',code:26}});
test('native state preserves canonical TV package IDs and saved dock order',()=>{const value=nativeSnapshot(state());assert.equal(value.preferences.dock[0],'hdmi1');assert.equal(value.catalog[0]?.id,'org.example.player');assert.equal(value.music.active,false);});
test('malformed or duplicate native dock never falls back to example apps',()=>{for(const dock of [['inputs'],['inputs','inputs','live','airplay','hdmi1','all'],['all','inputs','live','airplay','hdmi1','hdmi2']]){const value=state();value.preferences.dock=dock;assert.throws(()=>nativeSnapshot(value));}assert.throws(()=>nativeSnapshot({...state(),schema:2}));});
test('unsupported native catalog kinds fail before rendering',()=>{const value=state();value.catalog[0]!.kind='untrusted';assert.throws(()=>nativeSnapshot(value));});
