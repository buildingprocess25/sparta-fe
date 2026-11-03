/**
 * Utility kompresi dokumen client-side untuk Penyimpanan Dokumen DC.
 * Mengompres file gambar (JPEG, PNG, WEBP) via HTML5 Canvas sebelum diunggah ke Google Drive.
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

/**
 * Cek apakah file termasuk tipe yang dapat dikompresi (gambar).
 */
export function isCompressibleFile(file: File): boolean {
    if (!file) return false;
    if (file.type && file.type.startsWith("image/")) {
        // Jangan kompres SVG atau GIF animasi
        if (file.type === "image/svg+xml" || file.type === "image/gif") return false;
        return true;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    return ["jpg", "jpeg", "png", "webp"].includes(ext);
}

/**
 * Mengompresi file gambar menggunakan Canvas HTML5.
 * - Resolusi maksimal default 1920px (Full HD) agar teks/detail gambar tetap terbaca jelas.
 * - Kualitas JPEG default 0.78 (keseimbangan optimal antara kejernihan dan ukuran kecil).
 * - Mengembalikan file baru dengan nama berekstensi .jpg.
 */
export async function compressDocumentFile(
    file: File,
    options: CompressDocumentOptions = {}
): Promise<CompressionResult> {
    const { maxDimension = 1920, quality = 0.78 } = options;
    const originalSize = file.size;

    if (!isCompressibleFile(file)) {
        return {
            file,
            originalSize,
            compressedSize: originalSize,
            ratioPercent: 0,
            mimeType: file.type || "application/octet-stream",
        };
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            let { width, height } = img;

            // Pertahankan aspect ratio jika dimensi melebihi maxDimension
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
                    mimeType: file.type,
                });
                return;
            }

            // Fill background putih untuk PNG transparan sebelum convert ke JPEG
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
                            mimeType: file.type,
                        });
                        return;
                    }

                    // Jika hasil kompresi malah lebih besar (misal file aslinya sudah sangat kecil),
                    // tetap gunakan file asli
                    if (blob.size >= originalSize) {
                        resolve({
                            file,
                            originalSize,
                            compressedSize: originalSize,
                            ratioPercent: 0,
                            mimeType: file.type,
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
