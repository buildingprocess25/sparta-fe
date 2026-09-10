import assert from 'node:assert/strict';
import test from 'node:test';
import type { SPKListItem } from './api';
import { groupSPKForPresentation, presentSPK } from './spk-groups';

const row = (id: number, scope: string, cost: number, group?: string): SPKListItem => ({
    id, id_toko: id, nomor_ulok: 'ULOK-SAMA', lingkup_pekerjaan: scope,
    grand_total: cost, spk_group_id: group ?? null,
} as SPKListItem);

test('legacy same-ULOK SPKs stay separate alongside a new explicit group', () => {
    const legacy = [row(1, 'SIPIL', 100), row(2, 'ME', 200)];
    const members = [row(3, 'SIPIL', 300, 'new-group'), row(4, 'ME', 400, 'new-group')];
    const result = groupSPKForPresentation([...legacy, ...members]);
    assert.equal(result.length, 3);
    assert.equal(result[0], legacy[0]);
    assert.equal(result[1], legacy[1]);
    assert.equal(result[2].grand_total, 700);
    assert.equal(result[2].lingkup_pekerjaan, 'SIPIL + ME');
    assert.deepEqual(result[2].group_members?.map(member => member.id), [3, 4]);
    assert.equal(members[0].grand_total, 300);
});

test('duplicate member rows are counted once and approved zero is preserved', () => {
    const sipil = row(1, 'SIPIL', 0, 'group');
    const me = row(2, 'ME', 200, 'group');
    assert.equal(groupSPKForPresentation([sipil, me, sipil])[0].grand_total, 200);
    assert.equal(presentSPK({ ...me, group_grand_total: 0 }).grand_total, 0);
});

test('detail through either member uses only explicit group membership', () => {
    const members = [row(1, 'SIPIL', 100, 'group'), row(2, 'ME', 200, 'group')];
    for (const member of members) {
        assert.equal(presentSPK({ ...member, group_members: [...members, row(3, 'ME', 999)] }).grand_total, 300);
    }
    const legacy = row(4, 'SIPIL', 50);
    assert.equal(presentSPK({ ...legacy, group_members: members }).grand_total, 50);
});
