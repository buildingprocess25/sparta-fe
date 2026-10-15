/**
 * Utility kompresi gambar client-side via HTML Canvas.
 * Menghindari pengiriman file berukuran belasan/puluhan MB melalui koneksi cabang.
 */

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export interface CompressOptions {
    maxDimension?: number;
    quality?: number;
}

/**
 * Mengompres file gambar di browser menggunakan canvas.
 * - Resolusi maksimal default 1920px (Full HD)
 * - Kualitas JPEG default 0.8
 * - Output file JPEG dengan ukuran terkompresi
 */
export async function compressImageToJpeg(
    file: File,
    options: CompressOptions = {}
): Promise<File> {
    const { maxDimension = 1920, quality = 0.8 } = options;

    if (!file.type.startsWith("image/")) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            let { width, height } = img;

            // Pertahankan aspect ratio jika melebihi batas maxDimension
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
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                resolve(file);
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }
                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                    const compressedFile = new File([blob], newName, {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                },
                "image/jpeg",
                quality
            );
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(objectUrl);
            reject(err);
        };

        img.src = objectUrl;
    });
}
