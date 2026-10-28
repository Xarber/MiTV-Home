// SPDX-License-Identifier: AGPL-3.0-only
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {neighbor} from '../../src/model/navigation.ts';
import {pin,remove,defaultDock} from '../../src/model/catalog.ts';
test('dock left and right edges do not wrap',()=>{const tiles=[0,1,2].map(i=>({id:String(i),x:i*120,y:600,width:100,height:80}));assert.equal(neighbor(tiles,'0','ArrowLeft'),undefined);assert.equal(neighbor(tiles,'2','ArrowRight'),undefined);assert.equal(neighbor(tiles,'1','ArrowRight'),'2');});
test('dock movement never moves All apps outside slot six',()=>{let dock=pin(defaultDock,'inputs',5);assert.equal(dock[5],'inputs');assert.equal(new Set(dock).size,6);assert(!dock.slice(0,5).includes('all'));dock=remove(dock,'inputs');assert.equal(dock[5],'all');assert.equal(new Set(dock).size,6);assert.deepEqual(pin(dock,'all',2),dock);});
test('repeated app and HDMI pinning retains six unique items',()=>{let dock=[...defaultDock];for(const id of ['hdmi1','hdmi2','music','inputs'])for(let slot=0;slot<6;slot++){dock=pin(dock,id,slot);assert.equal(new Set(dock).size,6);assert(!dock.slice(0,5).includes('all'));}dock=remove(dock,dock[0]!);assert.equal(new Set(dock).size,6);});
