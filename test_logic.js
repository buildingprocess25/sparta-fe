const rabItems = [
    { id: '148801', source_type: 'RAB', jenis_pekerjaan: 'Ember Plastik' }
];

const opnameItems = [
    { id_rab_item: 148801, id_instruksi_lapangan_item: null }
];

const getWorkItemKey = (item) =>
    item.source_type === 'IL'
        ? `il:${item.id_instruksi_lapangan_item ?? Math.abs(Number(item.id))}`
        : `rab:${item.id}`;

const getOpnameItemKey = (item) =>
    item.id_instruksi_lapangan_item
        ? `il:${item.id_instruksi_lapangan_item}`
        : `rab:${item.id_rab_item}`;

opnameItems.forEach(item => {
    const itemKey = getOpnameItemKey(item);
    const rabRef = rabItems.find(r => getWorkItemKey(r) === itemKey);
    console.log("rabRef:", rabRef);
    console.log("jenis_pekerjaan:", rabRef?.jenis_pekerjaan || item.rab_item?.jenis_pekerjaan || '-');
});
