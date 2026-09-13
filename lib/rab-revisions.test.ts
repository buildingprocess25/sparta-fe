import {test} from 'node:test';
import assert from 'node:assert/strict';
import {groupRabRevisions} from './rab-revisions';
const row=(id:number,scope:string):any=>({id,id_toko:id,nomor_ulok:'U1',cabang:'HO',proyek:'Reguler',nama_pt:'CV A',status:'Ditolak oleh Manajer',lingkup_pekerjaan:scope});
test('rejected pair resolves either ID in SIPIL-first order',()=>{
 const groups=groupRabRevisions([row(2,'ME'),row(1,'SIPIL')]);assert.equal(groups.length,1);assert.deepEqual(groups[0].ids,[1,2]);assert.equal(groups[0].lingkup_pekerjaan,'SIPIL + ME');
});
test('different contractor and rejection stages remain separate',()=>{
 assert.equal(groupRabRevisions([row(1,'SIPIL'),{...row(2,'ME'),nama_pt:'CV B'}]).length,2);
 assert.equal(groupRabRevisions([row(1,'SIPIL'),{...row(2,'ME'),status:'Ditolak oleh Koordinator'}]).length,2);
});
test('older rejected row is omitted when superseded',()=>{
 const groups=groupRabRevisions([row(1,'SIPIL'),row(2,'ME'),{...row(3,'SIPIL'),id_toko:1,status:'Disetujui'}]);
 assert.equal(groups.length,1);assert.deepEqual(groups[0].ids,[2]);
});
