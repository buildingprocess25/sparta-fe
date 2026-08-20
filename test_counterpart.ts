const projectListToSearch = [
    {
        id: 2568,
        toko: { nomor_ulok: 'LZ01-2607-0001', lingkup_pekerjaan: 'SIPIL' },
        spk: {
            id: 930,
            pertambahan_spk: null
        }
    },
    {
        id: 2569,
        toko: { nomor_ulok: 'LZ01-2607-0001', lingkup_pekerjaan: 'ME' },
        spk: {
            id: 931,
            pertambahan_spk: {
                id: 339,
                pertambahan_hari: '5'
            }
        }
    }
];

const proj = projectListToSearch[0]; // Sipil

const hasSpk = proj.spk && Object.keys(proj.spk).length > 0;
const spkArray = Array.isArray(proj.spk) ? proj.spk : (proj.spk ? [proj.spk] : []);
let spkTs = hasSpk ? spkArray[0].pertambahan_spk : null;
let tsSuffix = '';

console.log("Initial spkTs:", spkTs);

if ((!spkTs || (Array.isArray(spkTs) && spkTs.length === 0) || Object.keys(spkTs).length === 0) && projectListToSearch) {
    const counterpart = projectListToSearch.find((p: any) => {
        if (p.toko?.nomor_ulok !== proj.toko?.nomor_ulok || p.id === proj.id) return false;
        const pSpk = Array.isArray(p.spk) ? p.spk : (p.spk ? [p.spk] : []);
        if (pSpk.length === 0) return false;
        const pPt = Array.isArray(pSpk[0].pertambahan_spk) ? pSpk[0].pertambahan_spk : (pSpk[0].pertambahan_spk ? [pSpk[0].pertambahan_spk] : []);
        return pPt.length > 0;
    });
    console.log("Counterpart found:", counterpart?.id);
    if (counterpart) {
        const counterpartSpk = Array.isArray(counterpart.spk) ? counterpart.spk : [counterpart.spk];
        const counterpartPt = Array.isArray(counterpartSpk[0].pertambahan_spk) ? counterpartSpk[0].pertambahan_spk : [counterpartSpk[0].pertambahan_spk];
        spkTs = counterpartPt;
        const counterpartScope = counterpart.toko?.lingkup_pekerjaan || '';
        tsSuffix = counterpartScope ? ` (${counterpartScope})` : '';
    }
}

console.log("Final spkTs:", spkTs);
console.log("tsSuffix:", tsSuffix);

if (spkTs) {
    const spkTsArr = Array.isArray(spkTs) ? spkTs : [spkTs];
    if (spkTsArr.length > 0) {
        console.log("PUSHING NODE:", spkTsArr[0]);
    }
}
