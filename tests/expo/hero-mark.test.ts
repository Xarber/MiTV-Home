// SPDX-License-Identifier: AGPL-3.0-only
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {heroMarkSize} from '../../src/model/heroMark.ts';
test('wide and square banner marks use equal visible area within safe bounds',()=>{const wide=heroMarkSize(256,128),square=heroMarkSize(256,256);assert.ok(Math.abs(wide.width*wide.height-square.width*square.height)<1);assert.equal(wide.width/wide.height,2);for(const size of [wide,square,heroMarkSize(10,1000)]){assert.ok(size.width<=148&&size.height<=96);}});
