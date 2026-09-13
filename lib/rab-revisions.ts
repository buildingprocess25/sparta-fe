type Row={id:number;id_toko?:number;status?:string;nomor_ulok?:string;lingkup_pekerjaan?:string;nama_pt?:string;email_pembuat?:string;[key:string]:any};
const norm=(v:unknown)=>String(v??'').trim().toUpperCase();
export function groupRabRevisions(rows:Row[]){
 const latest=new Map<string,Row>();
 for(const row of rows){const key=String(row.id_toko??row.toko?.id??`row:${row.id}`);if(!latest.has(key)||row.id>latest.get(key)!.id)latest.set(key,row);}
 const groups=new Map<string,Row[]>();
 for(const row of latest.values()){
  if(!/TOLAK|REJECTED/.test(norm(row.status)))continue;
  const key=JSON.stringify([row.nomor_ulok??row.toko?.nomor_ulok??`row:${row.id}`,norm(row.cabang??row.toko?.cabang),norm(row.proyek??row.toko?.proyek),norm(row.nama_pt),norm(row.status)]);
  groups.set(key,[...(groups.get(key)??[]),row]);
 }
 const scope=(r:Row)=>norm(r.lingkup_pekerjaan??r.toko?.lingkup_pekerjaan);
 return [...groups.values()].flatMap(group=>{
  const pair=group.length===2&&group.some(r=>scope(r)==='SIPIL')&&group.some(r=>scope(r)==='ME');
  return (pair?[[...group].sort((a,b)=>(scope(a)==='SIPIL'?0:1)-(scope(b)==='SIPIL'?0:1))]:group.map(r=>[r])).map(members=>{
   const r=members[0];return {id:r.id,ids:members.map(m=>m.id),'Nomor Ulok':r.nomor_ulok??r.toko?.nomor_ulok,lingkup_pekerjaan:members.length===2?'SIPIL + ME':scope(r),nama_toko:r.nama_toko??r.toko?.nama_toko,Proyek:r.proyek??r.toko?.proyek,alasan_penolakan:r.alasan_penolakan};
  });
 });
}
