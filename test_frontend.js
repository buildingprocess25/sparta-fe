function isSameWorkText(str1, str2) {
    return (str1 || '').toString().toUpperCase().trim() === (str2 || '').toString().toUpperCase().trim();
}

function findWorkItemForMemo(projectData, catName, itemJenis, memoItem) {
    if (memoItem && memoItem.source_type !== 'PLACEHOLDER' && memoItem.source_type !== 'HISTORY') {
        return memoItem;
    }
    const cat = projectData?.rab_list?.find(c => isSameWorkText(c.category.name, catName));
    const rabMatch = cat?.items.find(i => isSameWorkText(i.jenis_pekerjaan || cat.category.name, itemJenis));
    if (rabMatch) return rabMatch;

    const ilMatch = projectData?.instruksi_lapangan?.find(i => 
        isSameWorkText(i.kategori_pekerjaan, catName) && 
        isSameWorkText(i.jenis_pekerjaan || i.kategori_pekerjaan, itemJenis)
    );
    if (ilMatch) return ilMatch;
    
    return undefined;
}
