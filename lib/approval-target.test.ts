import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchesApprovalTarget} from './approval-target';
test('either RAB member notification resolves to same combined approval',()=>{
 const group={id:1,tipe:'RAB',related_rab_ids:[1,2]};
 assert.ok(matchesApprovalTarget(group,'1'));assert.ok(matchesApprovalTarget(group,'2'));assert.equal(matchesApprovalTarget(group,'3'),false);
});
test('single RAB remains separate and SPK membership still resolves',()=>{
 assert.equal(matchesApprovalTarget({id:1,tipe:'RAB'},'2'),false);
 assert.ok(matchesApprovalTarget({id:3,tipe:'SPK',_raw:{spk_group_id:'g',group_members:[{id:3},{id:4}]}},'4'));
});
