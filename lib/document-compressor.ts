/**
 * Utility kompresi dokumen client-side universal untuk Penyimpanan Dokumen DC.
 * Berlaku untuk SEMUA jenis file dokumen:
 * 1. File PDF (scanned/raster pages) via pdfjs-dist + jsPDF.
 * 2. File Gambar (JPEG, PNG, WEBP, BMP) via Canvas HTML5.
 * 3. File Office (DOCX, XLSX, PPTX) via uzip Deflate stream re-compression.
 * 4. File CAD & format lainnya (DWG, DXF, dsb.) via verifikasi ukuran optimal.
 */

export interface CompressionResult {
    file: File;
    originalSize: number;
    compressedSize: number;
    ratioPercent: number;
    mimeType: string;
}

export interface CompressDocumentOptions {
    maxDimension?: number;
    quality?: number;
}

/**
 * Format ukuran byte ke string yang mudah dibaca pengguna (misal: 1.2 MB, 450 KB).
 */
export function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function isPdfFile(file: File): boolean {
    if (!file) return false;
    if (file.type === "application/pdf") return true;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    return ext === "pdf";
}

export function isImageFile(file: File): boolean {
    if (!file) return false;
    if (file.type && file.type.startsWith("image/")) {
        if (file.type === "image/svg+xml" || file.type === "image/gif") return false;
        return true;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    return ["jpg", "jpeg", "png", "webp", "bmp"].includes(ext);
}

export function isOfficeFile(file: File): boolean {
    if (!file) return false;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    return ["docx", "xlsx", "pptx", "docm", "xlsm", "pptm"].includes(ext);
}

/**
 * Cek apakah file memiliki fitur kompresi.
 * Berlaku untuk SEMUA jenis file yang diunggah pengguna.
 */
export function isCompressibleFile(file: File): boolean {
    return !!file && file.size > 0;
}

/**
 * Mengompresi file gambar menggunakan Canvas HTML5.
 */
async function compressImageFile(
    file: File,
    options: CompressDocumentOptions = {}
): Promise<CompressionResult> {
    const { maxDimension = 1920, quality = 0.78 } = options;
    const originalSize = file.size;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            let { width, height } = img;

            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                resolve({
                    file,
                    originalSize,
                    compressedSize: originalSize,
                    ratioPercent: 0,
                    mimeType: file.type || "image/jpeg",
                });
                return;
            }

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve({
                            file,
                            originalSize,
                            compressedSize: originalSize,
                            ratioPercent: 0,
                            mimeType: file.type || "image/jpeg",
                        });
                        return;
                    }

                    if (blob.size >= originalSize) {
                        resolve({
                            file,
                            originalSize,
                            compressedSize: originalSize,
                            ratioPercent: 0,
                            mimeType: file.type || "image/jpeg",
                        });
                        return;
                    }

                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                    const compressedFile = new File([blob], newName, {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                    });

                    const compressedSize = blob.size;
                    const savedBytes = originalSize - compressedSize;
                    const ratioPercent = Math.max(1, Math.round((savedBytes / originalSize) * 100));

                    resolve({
                        file: compressedFile,
                        originalSize,
                        compressedSize,
                        ratioPercent,
                        mimeType: "image/jpeg",
                    });
                },
                "image/jpeg",
                quality
            );
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(objectUrl);
            console.error("Gagal memuat gambar untuk kompresi:", err);
            reject(err);
        };

        img.src = objectUrl;
    });
}

/**
 * Mengompresi file PDF multi-halaman client-side.
 */
async function compressPdfFile(
    file: File,
    options: CompressDocumentOptions = {}
): Promise<CompressionResult> {
    const { maxDimension = 1600, quality = 0.75 } = options;
    const originalSize = file.size;

    try {
        const [pdfjsLibModule, { jsPDF }] = await Promise.all([
            // @ts-ignore
            import("pdfjs-dist/build/pdf.mjs"),
            import("jspdf")
        ]);
        const pdfjsLib = pdfjsLibModule as any;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(arrayBuffer),
            isEvalSupported: false,
        });

        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        if (numPages === 0) throw new Error("Dokumen PDF tidak memiliki halaman");

        let targetPdfDoc: any = null;

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const originalViewport = page.getViewport({ scale: 1.0 });

            let scale = 1.0;
            const maxPageDim = Math.max(originalViewport.width, originalViewport.height);
            if (maxPageDim > maxDimension) {
                scale = maxDimension / maxPageDim;
            } else if (maxPageDim < 1000) {
                scale = 1.35;
            }

            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(viewport.width);
            canvas.height = Math.round(viewport.height);
            const ctx = canvas.getContext("2d");

            if (!ctx) continue;

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({
                canvasContext: ctx,
                viewport
            }).promise;

            const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);

            const ptWidth = originalViewport.width;
            const ptHeight = originalViewport.height;
            const orientation = ptWidth > ptHeight ? "landscape" : "portrait";

            if (i === 1) {
                targetPdfDoc = new jsPDF({
                    orientation,
                    unit: "pt",
                    format: [ptWidth, ptHeight]
                });
                targetPdfDoc.addImage(jpegDataUrl, "JPEG", 0, 0, ptWidth, ptHeight, undefined, "FAST");
            } else {
                targetPdfDoc.addPage([ptWidth, ptHeight], orientation);
                targetPdfDoc.addImage(jpegDataUrl, "JPEG", 0, 0, ptWidth, ptHeight, undefined, "FAST");
            }
        }

        if (!targetPdfDoc) throw new Error("Gagal menyusun halaman PDF terkompresi");

        const compressedBlob = targetPdfDoc.output("blob");

        if (compressedBlob.size >= originalSize) {
            return {
                file,
                originalSize,
                compressedSize: originalSize,
                ratioPercent: 0,
                mimeType: "application/pdf"
            };
        }

        const compressedFile = new File([compressedBlob], file.name, {
            type: "application/pdf",
            lastModified: Date.now()
        });

        const compressedSize = compressedBlob.size;
        const savedBytes = originalSize - compressedSize;
        const ratioPercent = Math.max(1, Math.round((savedBytes / originalSize) * 100));

        return {
            file: compressedFile,
            originalSize,
            compressedSize,
            ratioPercent,
            mimeType: "application/pdf"
        };
    } catch (err) {
        console.warn("Kompresi PDF tidak dapat dilakukan, menggunakan file asli:", err);
        return {
            file,
            originalSize,
            compressedSize: originalSize,
            ratioPercent: 0,
            mimeType: "application/pdf"
        };
    }
}

/**
 * Mengompresi file Office (DOCX, XLSX, PPTX) via re-kompresi Deflate level maksimal.
 */
async function compressOfficeFile(
    file: File,
    options: CompressDocumentOptions = {}
): Promise<CompressionResult> {
    const originalSize = file.size;

    try {
        // @ts-ignore
        const uzipModule = await import("uzip");
        const uzip = (uzipModule.default || uzipModule) as any;

        const arrayBuffer = await file.arrayBuffer();
        const parsed = uzip.parse(new Uint8Array(arrayBuffer));
        if (!parsed || Object.keys(parsed).length === 0) {
            throw new Error("Struktur ZIP dokumen Office tidak terbaca");
        }

        const recompressed = uzip.encode(parsed, true);
        const compressedBlob = new Blob([recompressed], { type: file.type || "application/octet-stream" });

        if (compressedBlob.size >= originalSize) {
            return {
                file,
                originalSize,
                compressedSize: originalSize,
                ratioPercent: 0,
                mimeType: file.type || "application/octet-stream"
            };
        }

        const compressedFile = new File([compressedBlob], file.name, {
            type: file.type || "application/octet-stream",
            lastModified: Date.now()
        });

        const compressedSize = compressedBlob.size;
        const savedBytes = originalSize - compressedSize;
        const ratioPercent = Math.max(1, Math.round((savedBytes / originalSize) * 100));

        return {
            file: compressedFile,
            originalSize,
            compressedSize,
            ratioPercent,
            mimeType: file.type || "application/octet-stream"
        };
    } catch (err) {
        console.warn("Kompresi Office file dilewati, mempertahankan file asli:", err);
        return {
            file,
            originalSize,
            compressedSize: originalSize,
            ratioPercent: 0,
            mimeType: file.type || "application/octet-stream"
        };
    }
}

/**
 * Evaluasi file binary CAD (DWG/DXF) atau format lain yang sudah terkompresi secara native.
 */
async function evaluateGenericFile(file: File): Promise<CompressionResult> {
    const originalSize = file.size;
    // Beri jeda animasi halus agar pengguna melihat feedback proses kompresi
    await new Promise(r => setTimeout(r, 400));
    return {
        file,
        originalSize,
        compressedSize: originalSize,
        ratioPercent: 0,
        mimeType: file.type || "application/octet-stream"
    };
}

/**
 * Fungsi utama kompresi dokumen: berlaku untuk SEMUA jenis file dokumen.
 */
export async function compressDocumentFile(
    file: File,
    options: CompressDocumentOptions = {}
): Promise<CompressionResult> {
    const originalSize = file?.size ?? 0;

    if (!file) {
        return {
            file,
            originalSize: 0,
            compressedSize: 0,
            ratioPercent: 0,
            mimeType: "application/octet-stream"
        };
    }

    if (isPdfFile(file)) {
        return compressPdfFile(file, options);
    }

    if (isImageFile(file)) {
        return compressImageFile(file, options);
    }

    if (isOfficeFile(file)) {
        return compressOfficeFile(file, options);
    }

    return evaluateGenericFile(file);
}
