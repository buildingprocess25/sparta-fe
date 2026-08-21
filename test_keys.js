const id1 = '148801';
const id2 = 148801;

const getWorkItemKey = (item) =>
    item.source_type === 'IL'
        ? `il:${item.id_instruksi_lapangan_item ?? Math.abs(Number(item.id))}`
        : `rab:${item.id}`;

const getOpnameItemKey = (item) =>
    item.id_instruksi_lapangan_item
        ? `il:${item.id_instruksi_lapangan_item}`
        : `rab:${item.id_rab_item}`;

const r = { id: id1, source_type: 'RAB' };
const item = { id_rab_item: id2, id_instruksi_lapangan_item: null };

console.log(getWorkItemKey(r) === getOpnameItemKey(item)); // Should be true
