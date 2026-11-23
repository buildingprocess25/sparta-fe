type Target = {id: number | string; tipe: string; related_rab_ids?: number[]; _raw?: any};
export function matchesApprovalTarget(item: Target, id: string) {
 if (String(item.id)===String(id)) return true;
 if (item.tipe==='RAB') return [...(item.related_rab_ids??[]),...(item._raw?.related_rab_ids??[])].some(member=>String(member)===String(id));
 return item.tipe==='SPK' && Boolean(item._raw?.spk_group_id) && Boolean(item._raw?.group_members?.some((member:{id:number|string})=>String(member.id)===String(id)));
}
