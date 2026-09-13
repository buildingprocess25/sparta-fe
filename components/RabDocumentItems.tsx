import type { RABDetailResponse } from '@/lib/api';

type Scope = Omit<RABDetailResponse, 'document_scopes'>;
const amount=(v:unknown)=>{const raw=String(v??'0');return Number(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)?raw.replace(/\./g,'').replace(',','.'):raw.replace(',','.'))||0;};
const rupiah=(v:unknown)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(amount(v));
export default function RabDocumentItems({scopes}:{scopes:Scope[]}) {
 return <div className="space-y-6">{scopes.map((scope,index)=>{
  const groups=new Map<string,typeof scope.items>();
  scope.items.forEach(item=>{const key=item.kategori_pekerjaan||'LAIN-LAIN';groups.set(key,[...(groups.get(key)||[]),item]);});
  const has=(v:unknown)=>v!=null&&String(v).trim()!=='';
  const subtotal=has(scope.rab.grand_total)?amount(scope.rab.grand_total):scope.items.reduce((sum,item)=>sum+amount(item.total_harga),0);
  const rounded=Math.floor((has(scope.rab.grand_total_non_sbo)?amount(scope.rab.grand_total_non_sbo):subtotal)/10000)*10000;
  const final=has(scope.rab.grand_total_final)?amount(scope.rab.grand_total_final):rounded*(/BATAM|BINTAN/i.test(scope.toko.cabang)?1:1.11);
  return <section key={scope.rab.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
   <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
    <div><h3 className="text-base font-bold text-slate-900">{String.fromCharCode(65+index)}. Pekerjaan {scope.toko.lingkup_pekerjaan}</h3><p className="mt-1 text-xs text-slate-500">{groups.size} kategori · {scope.items.length} item</p></div>
    <div className="text-right"><p className="text-xs text-slate-500">Grand total {scope.toko.lingkup_pekerjaan}</p><p className="font-bold text-slate-900">{rupiah(final)}</p></div>
   </div>
   {[...groups].map(([category,items],i)=><div key={category}>
    <h4 className="border-y border-slate-100 px-6 py-3 text-sm font-semibold text-slate-700">{i+1}. {category}</h4>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['No','Jenis pekerjaan','Satuan','Volume','Material','Upah','Total'].map(label=><th key={label} className="whitespace-nowrap px-4 py-3 text-left font-semibold">{label}</th>)}</tr></thead>
    <tbody>{items.map((item,n)=><tr key={item.id} className="border-t border-slate-100"><td className="px-4 py-3 text-slate-400">{n+1}</td><td className="min-w-64 px-4 py-3 text-slate-800">{item.jenis_pekerjaan}{item.catatan&&<p className="mt-1 text-xs text-slate-500">{item.catatan}</p>}</td><td className="px-4 py-3">{item.satuan}</td><td className="px-4 py-3">{item.volume}</td><td className="whitespace-nowrap px-4 py-3">{rupiah(item.harga_material)}</td><td className="whitespace-nowrap px-4 py-3">{rupiah(item.harga_upah)}</td><td className="whitespace-nowrap px-4 py-3 font-semibold">{rupiah(item.total_harga)}</td></tr>)}</tbody>
    <tfoot><tr className="border-t border-slate-200 bg-slate-50"><td colSpan={6} className="px-4 py-3 text-right font-semibold">Subtotal {category}</td><td className="whitespace-nowrap px-4 py-3 font-bold">{rupiah(items.reduce((s,r)=>s+amount(r.total_harga),0))}</td></tr></tfoot></table></div>
   </div>)}
   <dl className="ml-auto grid max-w-lg grid-cols-2 gap-x-6 gap-y-2 p-6 text-sm">{[['Total',subtotal],['Pembulatan',rounded],['PPN',final-rounded],['Grand total '+scope.toko.lingkup_pekerjaan,final]].map(([label,value])=><div key={String(label)} className="col-span-2 flex justify-between gap-6 last:border-t last:border-slate-200 last:pt-3 last:font-bold"><dt>{label}</dt><dd>{rupiah(value)}</dd></div>)}</dl>
  </section>;
 })}</div>;
}
