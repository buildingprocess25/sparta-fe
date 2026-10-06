"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Store,
  MapPin,
  Upload,
  FileText,
  ExternalLink,
  X,
} from 'lucide-react';
import { SurveyTokoItem } from '@/components/pengajuan-harga/types';

export interface RincianSurvei3TokoCardProps {
  mode: 'edit' | 'readonly';
  surveyToko: SurveyTokoItem[];
  satuan?: string;
  materialCode?: string;
  materialName?: string;
  hideHeader?: boolean;
  onChangeToko?: (index: number, updated: SurveyTokoItem) => void;
}

export function RincianSurvei3TokoCard({
  mode,
  surveyToko,
  satuan = 'm2',
  materialCode,
  materialName,
  hideHeader = false,
  onChangeToko,
}: RincianSurvei3TokoCardProps) {
  // Modal Preview Image State
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState<string>('');

  // Pastikan array selalu memiliki 3 slot toko
  const toko1: SurveyTokoItem = surveyToko[0] || {
    namaToko: '',
    alamatToko: '',
    volumeAcuan: 1,
    hargaSatuan: 0,
    tanggalSurvei: new Date().toISOString().slice(0, 10),
  };
  const toko2: SurveyTokoItem = surveyToko[1] || {
    namaToko: '',
    alamatToko: '',
    volumeAcuan: 1,
    hargaSatuan: 0,
    tanggalSurvei: new Date().toISOString().slice(0, 10),
  };
  const toko3: SurveyTokoItem = surveyToko[2] || {
    namaToko: '',
    alamatToko: '',
    volumeAcuan: 1,
    hargaSatuan: 0,
    tanggalSurvei: new Date().toISOString().slice(0, 10),
  };

  const stores = [toko1, toko2, toko3];

  // Kalkulasi Rata-Rata Harga
  const h1 = Number(toko1.hargaSatuan) || 0;
  const h2 = Number(toko2.hargaSatuan) || 0;
  const h3 = Number(toko3.hargaSatuan) || 0;
  const validCount = [h1, h2, h3].filter((h) => h > 0).length;
  const hargaRataRata = validCount === 3 ? Math.round((h1 + h2 + h3) / 3) : 0;

  const formatRupiah = (val?: number) => {
    if (val === undefined || val === null || isNaN(val) || val === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatRibuan = (val?: number) => {
    if (!val || isNaN(val)) return '';
    return new Intl.NumberFormat('id-ID').format(val);
  };

  const parseNominal = (val: string): number => {
    const clean = val.replace(/[^0-9]/g, '');
    return clean ? parseInt(clean, 10) : 0;
  };

  // Handler Upload Foto (Mode Edit)
  const handleFileUpload = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file && onChangeToko) {
      const fakeUrl = URL.createObjectURL(file);
      onChangeToko(index, {
        ...stores[index],
        buktiSurveiUrl: fakeUrl,
        buktiSurveiName: file.name,
      });
    }
  };

  // Handler Hapus Foto (Mode Edit)
  const handleRemoveFile = (index: number) => {
    if (onChangeToko) {
      onChangeToko(index, {
        ...stores[index],
        buktiSurveiUrl: '',
        buktiSurveiName: '',
      });
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
      {/* Header Card */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/80 border-b border-slate-200 gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-800">
              {materialName ? `Material: ${materialName}` : 'Rincian Survei 3 Toko'}
              <span className="text-slate-400 font-normal ml-1">(Satuan: {satuan})</span>
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-slate-500">
            Rata-Rata:{' '}
            <span className="font-bold text-slate-900 ml-2 font-mono text-sm sm:text-base">
              {formatRupiah(hargaRataRata)} / {satuan}
            </span>
          </div>
        </div>
      )}

      {/* Table Survei 3 Toko */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
          <thead className="text-[11px] text-slate-400 bg-white border-b border-slate-100 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-semibold w-12 text-center">No</th>
              <th className="px-4 py-3 font-semibold min-w-[200px]">Nama Toko / Supplier</th>
              <th className="px-4 py-3 font-semibold min-w-[240px]">Alamat Toko / Lokasi Survei</th>
              <th className="px-4 py-3 font-semibold text-center w-28">
                Volume<br />Acuan
              </th>
              <th className="px-4 py-3 font-semibold text-center w-44">Harga Survei (Rp)</th>
              <th className="px-4 py-3 font-semibold text-center min-w-[200px]">
                Lampiran Bukti Survei
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-700 divide-y divide-slate-100">
            {stores.map((store, idx) => {
              const storeNum = idx + 1;

              return (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  {/* Kolom No */}
                  <td className="px-4 py-3.5 text-center text-slate-400 font-medium">
                    {storeNum}
                  </td>

                  {/* Kolom Nama Toko */}
                  <td className="px-4 py-3.5 font-medium">
                    {mode === 'edit' ? (
                      <div className="relative">
                        <Store className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <Input
                          value={store.namaToko}
                          onChange={(e) =>
                            onChangeToko &&
                            onChangeToko(idx, {
                              ...store,
                              namaToko: e.target.value,
                            })
                          }
                          placeholder={`Nama Toko ${storeNum}`}
                          className="h-8.5 pl-8 text-xs rounded-lg"
                          required
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-900">
                          {store.namaToko || '-'}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Kolom Alamat Toko */}
                  <td className="px-4 py-3.5">
                    {mode === 'edit' ? (
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <Input
                          value={store.alamatToko || ''}
                          onChange={(e) =>
                            onChangeToko &&
                            onChangeToko(idx, {
                              ...store,
                              alamatToko: e.target.value,
                            })
                          }
                          placeholder="Alamat / lokasi survei"
                          className="h-8.5 pl-8 text-xs rounded-lg"
                          required
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 whitespace-normal line-clamp-2 max-w-xs block">
                        {store.alamatToko || '-'}
                      </span>
                    )}
                  </td>

                  {/* Kolom Volume Acuan (Terkunci 1 satuan) */}
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-md text-xs font-semibold font-mono">
                      1 {satuan}
                    </span>
                  </td>

                  {/* Kolom Harga Survei (Rp) */}
                  <td className="px-4 py-3.5">
                    {mode === 'edit' ? (
                      <div className="flex items-center border border-slate-200 rounded-lg px-2.5 py-1 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                        <span className="text-slate-400 text-xs mr-2 font-bold select-none">
                          Rp
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            store.hargaSatuan
                              ? formatRibuan(store.hargaSatuan)
                              : ''
                          }
                          onChange={(e) => {
                            const num = parseNominal(e.target.value);
                            onChangeToko &&
                              onChangeToko(idx, {
                                ...store,
                                hargaSatuan: num,
                              });
                          }}
                          placeholder="0"
                          className="w-full text-right outline-none text-xs sm:text-sm font-semibold font-mono text-slate-800 bg-transparent"
                          required
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-end border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50/50">
                        <span className="text-slate-400 text-xs mr-2">Rp</span>
                        <span className="text-xs sm:text-sm font-semibold font-mono text-slate-800">
                          {formatRibuan(store.hargaSatuan) || '0'}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Kolom Lampiran Bukti Survei */}
                  <td className="px-4 py-3.5 text-center">
                    {store.buktiSurveiUrl ? (
                      <div className="flex items-center justify-center gap-1.5 mx-auto w-max">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewModalUrl(store.buktiSurveiUrl!);
                            setPreviewModalTitle(
                              `Bukti Survei: Toko ${storeNum} - ${store.namaToko || 'Foto'}`
                            );
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-blue-600 font-medium bg-blue-50/70 hover:bg-blue-100 border border-blue-200 rounded-full transition-colors cursor-pointer"
                          title="Klik untuk melihat bukti foto"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="max-w-[140px] truncate">
                            {store.buktiSurveiName || `Bukti_Toko_${storeNum}.jpg`}
                          </span>
                          <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
                        </button>

                        {mode === 'edit' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(idx)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full cursor-pointer"
                            title="Hapus foto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ) : mode === 'edit' ? (
                      <label className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/50 border border-dashed border-slate-300 hover:border-blue-400 rounded-full transition-colors cursor-pointer mx-auto w-max">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>Upload Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(idx, e)}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <span className="text-slate-400 text-xs italic block text-center">
                        Tidak ada lampiran
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Preview Bukti Foto Zoom */}
      <Dialog
        open={Boolean(previewModalUrl)}
        onOpenChange={(open) => !open && setPreviewModalUrl(null)}
      >
        <DialogContent className="max-w-2xl p-4 rounded-2xl">
          <DialogHeader className="pb-2 border-b border-slate-100">
            <DialogTitle className="text-sm font-bold text-slate-900">
              {previewModalTitle || 'Preview Bukti Survei'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-2 bg-slate-100/60 rounded-xl max-h-[70vh] overflow-hidden">
            {previewModalUrl && (
              <img
                src={previewModalUrl}
                alt="Bukti Survei"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-xs"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
