import type { GanttNoteItem } from "@/lib/api";

export type ExportableGanttBar = {
    start: number;
    end: number;
    duration: number;
    delay: number;
    shift?: number;
};

export type ExportableGanttRow = {
    taskId: number;
    id: string;
    label: string;
    dependencies: number[];
    bars: ExportableGanttBar[];
};

export type ExportableGanttScope = {
    id_toko: number;
    scopeName: string;
    ganttId: number | null;
    status: string | null;
    rows: ExportableGanttRow[];
};

export type ExportableTimelineColumn = {
    dayIndex: number;
    dateLabel: string;
    subLabel?: string;
    fullDate: string;
    badgeText?: string;
    badgeTone?: "amber" | "teal" | "rose" | "orange" | "blue" | "red" | "emerald" | "yellow";
    colTone?: "normal" | "today" | "todayCheckpoint" | "needsInput" | "filled" | "checkpoint" | "extension" | "spkEnd" | "stTarget" | "stPenalty" | "stBuffer" | "takeover";
};

export interface GanttPdfProjectMeta {
    nomorUlok: string;
    storeName: string;
    branch: string;
    pic: string;
    scopeLabel: string;
    spkStatusLabel: string;
    targetStText: string;
    targetStSubtext?: string;
    handoverStatusText?: string;
    modeLabel: string;
    takeoverDate?: string | null;
}

export interface ExportGanttPdfInput {
    meta: GanttPdfProjectMeta;
    columns: ExportableTimelineColumn[];
    scopes: ExportableGanttScope[];
    scopeSummaries?: Array<{
        scopeName: string;
        readyCount: number;
        opnameCount: number;
    }>;
    notes: GanttNoteItem[];
    isBelumSpk?: boolean;
}

type LoadedJpegAsset = {
    name: string;
    bytes: Uint8Array;
    width: number;
    height: number;
};

// ---------------------------------------------------------------------------
// Native Zero-Dependency Vector PDF 1.4 Builder (Bebas masalah SSR/Turbopack)
// ---------------------------------------------------------------------------
class VectorPdfDocument {
    private pageWidth: number;
    private pageHeight: number;
    private pages: string[][] = [];
    private currentPageIndex = -1;
    private fillRgb: [number, number, number] = [0, 0, 0];
    private strokeRgb: [number, number, number] = [0, 0, 0];
    private textRgb: [number, number, number] = [0, 0, 0];
    private lineWidthVal = 1;
    private fontBold = false;
    private fontSizeVal = 10;
    private images = new Map<string, LoadedJpegAsset>();

    constructor(format: "a4" | "a3" = "a4") {
        // Landscape dimensions in points (1 pt = 1/72 inch)
        if (format === "a3") {
            this.pageWidth = 1190.55;
            this.pageHeight = 841.89;
        } else {
            this.pageWidth = 841.89;
            this.pageHeight = 595.28;
        }
        this.addPage();
    }

    getWidth() {
        return this.pageWidth;
    }

    getHeight() {
        return this.pageHeight;
    }

    getNumberOfPages() {
        return this.pages.length;
    }

    getCurrentPageNumber() {
        return this.currentPageIndex + 1;
    }

    setPage(pageNumber1Based: number) {
        const idx = Math.max(0, Math.min(this.pages.length - 1, pageNumber1Based - 1));
        this.currentPageIndex = idx;
    }

    addPage() {
        this.pages.push([]);
        this.currentPageIndex = this.pages.length - 1;
    }

    private pushCmd(cmd: string) {
        this.pages[this.currentPageIndex].push(cmd);
    }

    private toPdfY(y: number) {
        return this.pageHeight - y;
    }

    private fmt(n: number) {
        return Number(n.toFixed(2));
    }

    private rgbFrac(r: number, g: number, b: number) {
        return `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)}`;
    }

    saveGraphicsState() {
        this.pushCmd("q");
    }

    restoreGraphicsState() {
        this.pushCmd("Q");
    }

    setFillColor(r: number, g: number, b: number) {
        this.fillRgb = [r, g, b];
        this.pushCmd(`${this.rgbFrac(r, g, b)} rg`);
    }

    setDrawColor(r: number, g: number, b: number) {
        this.strokeRgb = [r, g, b];
        this.pushCmd(`${this.rgbFrac(r, g, b)} RG`);
    }

    setTextColor(r: number, g: number, b: number) {
        this.textRgb = [r, g, b];
    }

    setLineWidth(w: number) {
        this.lineWidthVal = w;
        this.pushCmd(`${this.fmt(w)} w`);
    }

    setFont(_family: string, style: "normal" | "bold" = "normal") {
        this.fontBold = style === "bold";
    }

    setFontSize(size: number) {
        this.fontSizeVal = size;
    }

    private paintOp(style: "F" | "D" | "FD" = "F") {
        if (style === "FD") return "B";
        if (style === "D") return "S";
        return "f";
    }

    rect(x: number, y: number, w: number, h: number, style: "F" | "D" | "FD" = "F") {
        const pdfY = this.toPdfY(y + h);
        this.pushCmd(`${this.fmt(x)} ${this.fmt(pdfY)} ${this.fmt(w)} ${this.fmt(h)} re ${this.paintOp(style)}`);
    }

    roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style: "F" | "D" | "FD" = "F") {
        const r = Math.min(rx, ry, w / 2, h / 2);
        if (r <= 0.5) {
            this.rect(x, y, w, h, style);
            return;
        }
        const k = 0.5522847498;
        const c = r * k;
        const top = this.toPdfY(y);
        const bottom = this.toPdfY(y + h);
        const left = x;
        const right = x + w;

        this.pushCmd([
            `${this.fmt(left + r)} ${this.fmt(top)} m`,
            `${this.fmt(right - r)} ${this.fmt(top)} l`,
            `${this.fmt(right - r + c)} ${this.fmt(top)} ${this.fmt(right)} ${this.fmt(top - r + c)} ${this.fmt(right)} ${this.fmt(top - r)} c`,
            `${this.fmt(right)} ${this.fmt(bottom + r)} l`,
            `${this.fmt(right)} ${this.fmt(bottom + r - c)} ${this.fmt(right - r + c)} ${this.fmt(bottom)} ${this.fmt(right - r)} ${this.fmt(bottom)} c`,
            `${this.fmt(left + r)} ${this.fmt(bottom)} l`,
            `${this.fmt(left + r - c)} ${this.fmt(bottom)} ${this.fmt(left)} ${this.fmt(bottom + r - c)} ${this.fmt(left)} ${this.fmt(bottom + r)} c`,
            `${this.fmt(left)} ${this.fmt(top - r)} l`,
            `${this.fmt(left)} ${this.fmt(top - r + c)} ${this.fmt(left + r - c)} ${this.fmt(top)} ${this.fmt(left + r)} ${this.fmt(top)} c`,
            `h ${this.paintOp(style)}`,
        ].join(" "));
    }

    line(x1: number, y1: number, x2: number, y2: number) {
        this.pushCmd(`${this.fmt(x1)} ${this.fmt(this.toPdfY(y1))} m ${this.fmt(x2)} ${this.fmt(this.toPdfY(y2))} l S`);
    }

    polyline(points: Array<[number, number]>) {
        if (points.length < 2) return;
        const cmds: string[] = ["1 J 1 j"];
        points.forEach(([x, y], idx) => {
            cmds.push(`${this.fmt(x)} ${this.fmt(this.toPdfY(y))} ${idx === 0 ? "m" : "l"}`);
        });
        cmds.push("S");
        this.pushCmd(cmds.join(" "));
    }

    circle(cx: number, cy: number, r: number, style: "F" | "D" | "FD" = "F") {
        const k = 0.5522847498;
        const c = r * k;
        const py = this.toPdfY(cy);
        this.pushCmd([
            `${this.fmt(cx)} ${this.fmt(py + r)} m`,
            `${this.fmt(cx + c)} ${this.fmt(py + r)} ${this.fmt(cx + r)} ${this.fmt(py + c)} ${this.fmt(cx + r)} ${this.fmt(py)} c`,
            `${this.fmt(cx + r)} ${this.fmt(py - c)} ${this.fmt(cx + c)} ${this.fmt(py - r)} ${this.fmt(cx)} ${this.fmt(py - r)} c`,
            `${this.fmt(cx - c)} ${this.fmt(py - r)} ${this.fmt(cx - r)} ${this.fmt(py - c)} ${this.fmt(cx - r)} ${this.fmt(py)} c`,
            `${this.fmt(cx - r)} ${this.fmt(py + c)} ${this.fmt(cx - c)} ${this.fmt(py + r)} ${this.fmt(cx)} ${this.fmt(py + r)} c`,
            `h ${this.paintOp(style)}`,
        ].join(" "));
    }

    triangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, style: "F" | "D" | "FD" = "F") {
        this.pushCmd(
            `${this.fmt(x1)} ${this.fmt(this.toPdfY(y1))} m ${this.fmt(x2)} ${this.fmt(this.toPdfY(y2))} l ${this.fmt(x3)} ${this.fmt(this.toPdfY(y3))} l h ${this.paintOp(style)}`
        );
    }

    private escapePdfText(raw: string): string {
        // Normalize non-WinAnsi characters to safe ASCII/Latin1 equivalents
        const sanitized = String(raw ?? "")
            .replace(/[—–]/g, "-")
            .replace(/[“”]/g, '"')
            .replace(/[‘’]/g, "'")
            .replace(/•/g, "*")
            .replace(/[^\x20-\x7E\xA0-\xFF]/g, " ");
        return sanitized
            .replace(/\\/g, "\\\\")
            .replace(/\(/g, "\\(")
            .replace(/\)/g, "\\)");
    }

    getTextWidth(text: string): number {
        const str = String(text ?? "");
        const avgFactor = this.fontBold ? 0.56 : 0.52;
        let widthUnits = 0;
        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            if ("ilI.,:;|! ".includes(ch)) widthUnits += 0.28;
            else if ("MW@#%&".includes(ch)) widthUnits += 0.82;
            else if (ch >= "A" && ch <= "Z") widthUnits += 0.66;
            else widthUnits += avgFactor;
        }
        return widthUnits * this.fontSizeVal;
    }

    splitTextToSize(text: string, maxWidth: number): string[] {
        const rawParagraphs = String(text ?? "").split(/\r?\n/);
        const lines: string[] = [];

        for (const para of rawParagraphs) {
            const words = para.trim().split(/\s+/).filter(Boolean);
            if (words.length === 0) {
                lines.push("");
                continue;
            }
            let currentLine = words[0];
            for (let i = 1; i < words.length; i++) {
                const candidate = `${currentLine} ${words[i]}`;
                if (this.getTextWidth(candidate) <= maxWidth) {
                    currentLine = candidate;
                } else {
                    lines.push(currentLine);
                    currentLine = words[i];
                }
            }
            // If a single word is still wider than maxWidth, truncate it cleanly
            if (this.getTextWidth(currentLine) > maxWidth && maxWidth > 12) {
                let clipped = currentLine;
                while (clipped.length > 1 && this.getTextWidth(clipped + "..") > maxWidth) {
                    clipped = clipped.slice(0, -1);
                }
                lines.push(clipped + (clipped.length < currentLine.length ? ".." : ""));
            } else {
                lines.push(currentLine);
            }
        }
        return lines;
    }

    text(
        content: string | string[],
        x: number,
        y: number,
        options?: { align?: "left" | "center" | "right"; angle?: number; lineHeightFactor?: number }
    ) {
        const lines = Array.isArray(content) ? content : [content];
        const fontRef = this.fontBold ? "/F2" : "/F1";
        const lh = (options?.lineHeightFactor || 1.25) * this.fontSizeVal;
        const [tr, tg, tb] = this.textRgb;

        lines.forEach((lineStr, idx) => {
            const lineY = y + idx * lh;
            const pdfY = this.toPdfY(lineY);
            const w = this.getTextWidth(lineStr);
            let drawX = x;
            if (options?.align === "center") drawX = x - w / 2;
            else if (options?.align === "right") drawX = x - w;

            const escaped = this.escapePdfText(lineStr);

            if (options?.angle) {
                const rad = (options.angle * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                this.pushCmd(
                    `q ${this.rgbFrac(tr, tg, tb)} rg BT ${fontRef} ${this.fmt(this.fontSizeVal)} Tf ${this.fmt(cos)} ${this.fmt(sin)} ${this.fmt(-sin)} ${this.fmt(cos)} ${this.fmt(drawX)} ${this.fmt(pdfY)} Tm (${escaped}) Tj ET Q`
                );
            } else {
                this.pushCmd(
                    `q ${this.rgbFrac(tr, tg, tb)} rg BT ${fontRef} ${this.fmt(this.fontSizeVal)} Tf ${this.fmt(drawX)} ${this.fmt(pdfY)} Td (${escaped}) Tj ET Q`
                );
            }
        });
    }

    addJpegImage(asset: LoadedJpegAsset, x: number, y: number, w: number, h: number) {
        this.images.set(asset.name, asset);
        const pdfY = this.toPdfY(y + h);
        this.pushCmd(
            `q ${this.fmt(w)} 0 0 ${this.fmt(h)} ${this.fmt(x)} ${this.fmt(pdfY)} cm /${asset.name} Do Q`
        );
    }

    buildPdfBytes(): Uint8Array {
        const encoder = new TextEncoder();
        const chunks: Uint8Array[] = [];
        const offsets: number[] = [0]; // 1-based object IDs
        let byteLength = 0;

        const writeStr = (str: string) => {
            const arr = encoder.encode(str);
            chunks.push(arr);
            byteLength += arr.byteLength;
        };

        const writeBytes = (arr: Uint8Array) => {
            chunks.push(arr);
            byteLength += arr.byteLength;
        };

        // Object allocation:
        // 1: Catalog
        // 2: Pages
        // 3: Font F1 (Helvetica)
        // 4: Font F2 (Helvetica-Bold)
        // 5..4+M: Image XObjects
        // Remaining: Page + Content pairs
        const imageList = Array.from(this.images.values());
        const firstImageObjId = 5;
        const firstPageObjId = firstImageObjId + imageList.length;

        writeStr("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");

        // Obj 1: Catalog
        offsets[1] = byteLength;
        writeStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

        // Obj 2: Pages
        const kidsRefs = this.pages.map((_, idx) => `${firstPageObjId + idx * 2} 0 R`).join(" ");
        offsets[2] = byteLength;
        writeStr(`2 0 obj\n<< /Type /Pages /Kids [ ${kidsRefs} ] /Count ${this.pages.length} >>\nendobj\n`);

        // Obj 3: Helvetica
        offsets[3] = byteLength;
        writeStr("3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n");

        // Obj 4: Helvetica-Bold
        offsets[4] = byteLength;
        writeStr("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n");

        // Image XObjects
        imageList.forEach((img, idx) => {
            const objId = firstImageObjId + idx;
            offsets[objId] = byteLength;
            writeStr(
                `${objId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.byteLength} >>\nstream\n`
            );
            writeBytes(img.bytes);
            writeStr("\nendstream\nendobj\n");
        });

        const xObjectDict =
            imageList.length > 0
                ? `/XObject << ${imageList.map((img, idx) => `/${img.name} ${firstImageObjId + idx} 0 R`).join(" ")} >>`
                : "";

        // Pages & Content Streams
        this.pages.forEach((cmds, idx) => {
            const pageObjId = firstPageObjId + idx * 2;
            const contentObjId = pageObjId + 1;
            const contentBytes = encoder.encode(cmds.join("\n"));

            offsets[pageObjId] = byteLength;
            writeStr(
                `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.fmt(this.pageWidth)} ${this.fmt(this.pageHeight)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> ${xObjectDict} >> /Contents ${contentObjId} 0 R >>\nendobj\n`
            );

            offsets[contentObjId] = byteLength;
            writeStr(`${contentObjId} 0 obj\n<< /Length ${contentBytes.byteLength} >>\nstream\n`);
            writeBytes(contentBytes);
            writeStr("\nendstream\nendobj\n");
        });

        const totalObjs = firstPageObjId + this.pages.length * 2;
        const xrefOffset = byteLength;
        writeStr(`xref\n0 ${totalObjs}\n0000000000 65535 f \n`);
        for (let id = 1; id < totalObjs; id++) {
            const padded = String(offsets[id] || 0).padStart(10, "0");
            writeStr(`${padded} 00000 n \n`);
        }
        writeStr(`trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

        const output = new Uint8Array(byteLength);
        let pos = 0;
        for (const chunk of chunks) {
            output.set(chunk, pos);
            pos += chunk.byteLength;
        }
        return output;
    }

    save(filename: string) {
        const bytes = this.buildPdfBytes();
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
}

async function loadImageOnRedBannerAsJpeg(src: string, name: string): Promise<LoadedJpegAsset | null> {
    if (typeof window === "undefined") return null;
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth || img.width || 120;
                canvas.height = img.naturalHeight || img.height || 60;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve(null);
                    return;
                }
                // Composite onto Alfamart Red (#DC2626) so transparent PNGs blend seamlessly
                ctx.fillStyle = "#dc2626";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.96);
                const base64 = dataUrl.split(",")[1];
                if (!base64) {
                    resolve(null);
                    return;
                }
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                resolve({
                    name,
                    bytes,
                    width: canvas.width,
                    height: canvas.height,
                });
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

function containImageSize(asset: LoadedJpegAsset, maxWidth: number, maxHeight: number) {
    const ratio = Math.min(maxWidth / Math.max(asset.width, 1), maxHeight / Math.max(asset.height, 1));
    return {
        width: asset.width * ratio,
        height: asset.height * ratio,
    };
}

function sanitizeFilenamePart(value: string): string {
    return String(value || "")
        .trim()
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function drawWatermark(doc: VectorPdfDocument, pageWidth: number, pageHeight: number) {
    doc.saveGraphicsState();
    doc.setTextColor(244, 245, 247);
    doc.setFontSize(54);
    doc.setFont("helvetica", "bold");
    doc.text("SPARTA BUILDING", pageWidth / 2, pageHeight / 2, {
        align: "center",
        angle: -20,
    });
    doc.restoreGraphicsState();
}

function drawBrandedHeader(
    doc: VectorPdfDocument,
    pageWidth: number,
    marginX: number,
    topY: number,
    meta: GanttPdfProjectMeta,
    logo: LoadedJpegAsset | null,
    spartaLogo: LoadedJpegAsset | null
): number {
    const headerWidth = pageWidth - marginX * 2;
    const headerHeight = 54;
    const headerCenterY = topY + headerHeight / 2;

    doc.setFillColor(220, 38, 38);
    doc.roundedRect(marginX, topY, headerWidth, headerHeight, 5, 5, "F");

    if (logo) {
        const logoSize = containImageSize(logo, 64, 26);
        doc.addJpegImage(
            logo,
            marginX + 14,
            headerCenterY - logoSize.height / 2,
            logoSize.width,
            logoSize.height
        );
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1);
        doc.line(marginX + 90, topY + 10, marginX + 90, topY + headerHeight - 10);
    }

    const brandStartX = logo ? marginX + 104 : marginX + 16;
    if (spartaLogo) {
        const spartaLogoSize = containImageSize(spartaLogo, 24, 28);
        doc.addJpegImage(
            spartaLogo,
            brandStartX,
            headerCenterY - spartaLogoSize.height / 2,
            spartaLogoSize.width,
            spartaLogoSize.height
        );
    }

    const brandTextX = spartaLogo ? brandStartX + 30 : brandStartX;
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("SPARTA", brandTextX, headerCenterY - 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Building & Maintenance", brandTextX, headerCenterY + 9);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("JADWAL PELAKSANAAN PROYEK (GANTT CHART)", pageWidth - marginX - 14, topY + 23, {
        align: "right",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const printedAt = new Date().toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
    doc.text(
        `${meta.modeLabel} | Dicetak: ${printedAt}`,
        pageWidth - marginX - 14,
        topY + 38,
        { align: "right" }
    );

    return topY + headerHeight + 10;
}

function drawProjectInfoCard(
    doc: VectorPdfDocument,
    pageWidth: number,
    marginX: number,
    startY: number,
    meta: GanttPdfProjectMeta
): number {
    const cardWidth = pageWidth - marginX * 2;
    const cardHeight = 46;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.roundedRect(marginX, startY, cardWidth, cardHeight, 4, 4, "FD");

    const fields = [
        { label: "ULOK", value: meta.nomorUlok || "-", ratio: 0.14 },
        { label: "NAMA TOKO", value: meta.storeName || "-", ratio: 0.20 },
        { label: "BRANCH", value: meta.branch || "-", ratio: 0.13 },
        { label: "PIC PROYEK", value: meta.pic || "-", ratio: 0.15 },
        { label: "RUANG LINGKUP", value: meta.scopeLabel || "-", ratio: 0.13 },
        { label: "STATUS SPK", value: meta.spkStatusLabel || "-", ratio: 0.12 },
        {
            label: "TARGET ST",
            value: meta.targetStSubtext
                ? `${meta.targetStText || "-"} (${meta.targetStSubtext})`
                : meta.targetStText || "-",
            ratio: 0.13,
        },
    ];

    let cursorX = marginX;
    fields.forEach((field, idx) => {
        const colW = cardWidth * field.ratio;
        if (idx > 0) {
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.6);
            doc.line(cursorX, startY + 4, cursorX, startY + cardHeight - 4);
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(185, 28, 28);
        doc.text(field.label, cursorX + 8, startY + 13);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.2);
        doc.setTextColor(15, 23, 42);
        const lines = doc.splitTextToSize(String(field.value || "-"), colW - 14);
        doc.text(lines.slice(0, 2), cursorX + 8, startY + 26);

        cursorX += colW;
    });

    return startY + cardHeight + 8;
}

function drawLegendStrip(
    doc: VectorPdfDocument,
    pageWidth: number,
    marginX: number,
    startY: number,
    isBelumSpk?: boolean
): number {
    const stripWidth = pageWidth - marginX * 2;
    const stripHeight = 22;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.6);
    doc.roundedRect(marginX, startY, stripWidth, stripHeight, 3, 3, "FD");

    let x = marginX + 10;
    const centerY = startY + stripHeight / 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(185, 28, 28);
    doc.text("LEGENDA:", x, centerY + 2.5);
    x += 48;

    const items: Array<{ label: string; fill: [number, number, number]; border?: [number, number, number] }> = [
        { label: "Jadwal Rencana", fill: [34, 197, 94] },
        { label: "Bergeser (Shift)", fill: [249, 115, 22] },
        { label: "Terlambat (+N)", fill: [254, 226, 226], border: [244, 63, 94] },
        { label: "Pengawasan", fill: [219, 234, 254], border: [37, 99, 235] },
        { label: "Pengawasan Terisi", fill: [204, 251, 241], border: [13, 148, 136] },
        { label: "Perlu Input / Opname", fill: [254, 226, 226], border: [220, 38, 38] },
        { label: "Hari Ini", fill: [209, 250, 229], border: [16, 185, 129] },
    ];

    if (!isBelumSpk) {
        items.push(
            { label: "Akhir SPK", fill: [180, 83, 9] },
            { label: "Target ST", fill: [15, 118, 110] },
            { label: "SPK+ / Jeda ST", fill: [249, 115, 22] },
            { label: "Denda", fill: [225, 29, 72] }
        );
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);

    items.forEach((item) => {
        doc.setFillColor(...item.fill);
        if (item.border) {
            doc.setDrawColor(...item.border);
            doc.setLineWidth(0.6);
            doc.roundedRect(x, centerY - 4, 8, 8, 1.5, 1.5, "FD");
        } else {
            doc.roundedRect(x, centerY - 4, 8, 8, 1.5, 1.5, "F");
        }
        doc.setTextColor(51, 65, 85);
        doc.text(item.label, x + 11, centerY + 2.2);
        x += doc.getTextWidth(item.label) + 22;
    });

    return startY + stripHeight + 8;
}

function getColumnColors(colTone?: ExportableTimelineColumn["colTone"]) {
    switch (colTone) {
        case "spkEnd":
            return { headerBg: [254, 243, 199] as [number, number, number], bodyBg: [255, 251, 235] as [number, number, number], text: [120, 53, 15] as [number, number, number] };
        case "stTarget":
            return { headerBg: [204, 251, 241] as [number, number, number], bodyBg: [240, 253, 250] as [number, number, number], text: [19, 78, 74] as [number, number, number] };
        case "stPenalty":
            return { headerBg: [255, 228, 230] as [number, number, number], bodyBg: [255, 241, 242] as [number, number, number], text: [136, 19, 55] as [number, number, number] };
        case "stBuffer":
            return { headerBg: [240, 253, 250] as [number, number, number], bodyBg: [245, 255, 253] as [number, number, number], text: [15, 118, 110] as [number, number, number] };
        case "extension":
            return { headerBg: [254, 243, 199] as [number, number, number], bodyBg: [255, 251, 235] as [number, number, number], text: [146, 64, 14] as [number, number, number] };
        case "needsInput":
            return { headerBg: [254, 226, 226] as [number, number, number], bodyBg: [254, 242, 242] as [number, number, number], text: [185, 28, 28] as [number, number, number] };
        case "filled":
            return { headerBg: [204, 251, 241] as [number, number, number], bodyBg: [240, 253, 250] as [number, number, number], text: [17, 94, 89] as [number, number, number] };
        case "todayCheckpoint":
            return { headerBg: [254, 249, 195] as [number, number, number], bodyBg: [254, 252, 232] as [number, number, number], text: [133, 77, 14] as [number, number, number] };
        case "today":
            return { headerBg: [209, 250, 229] as [number, number, number], bodyBg: [236, 253, 245] as [number, number, number], text: [6, 95, 70] as [number, number, number] };
        case "checkpoint":
            return { headerBg: [219, 234, 254] as [number, number, number], bodyBg: [239, 246, 255] as [number, number, number], text: [30, 64, 175] as [number, number, number] };
        case "takeover":
            return { headerBg: [51, 65, 85] as [number, number, number], bodyBg: [241, 245, 249] as [number, number, number], text: [248, 250, 252] as [number, number, number] };
        default:
            return { headerBg: [248, 250, 252] as [number, number, number], bodyBg: [255, 255, 255] as [number, number, number], text: [71, 85, 105] as [number, number, number] };
    }
}

function getBadgeFill(tone?: ExportableTimelineColumn["badgeTone"]): [number, number, number] {
    switch (tone) {
        case "amber":
            return [180, 83, 9];
        case "teal":
            return [15, 118, 110];
        case "rose":
            return [225, 29, 72];
        case "orange":
            return [234, 88, 12];
        case "red":
            return [220, 38, 38];
        case "emerald":
            return [16, 185, 129];
        case "yellow":
            return [217, 119, 6];
        case "blue":
        default:
            return [37, 99, 235];
    }
}

function drawTimelineHeader(
    doc: VectorPdfDocument,
    marginX: number,
    topY: number,
    noColW: number,
    labelColW: number,
    dayColW: number,
    headerH: number,
    columns: ExportableTimelineColumn[]
): number {
    const totalTableW = noColW + labelColW + columns.length * dayColW;

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.7);
    doc.rect(marginX, topY, totalTableW, headerH, "FD");

    // Left columns
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text("No.", marginX + noColW / 2, topY + headerH / 2 + 2.5, { align: "center" });
    doc.line(marginX + noColW, topY, marginX + noColW, topY + headerH);

    doc.text("Tahapan / Uraian Pekerjaan", marginX + noColW + 8, topY + headerH / 2 + 2.5);
    doc.setLineWidth(1.1);
    doc.line(marginX + noColW + labelColW, topY, marginX + noColW + labelColW, topY + headerH);

    const gridStartX = marginX + noColW + labelColW;
    const dateFontSize = dayColW < 16 ? 5.2 : dayColW < 20 ? 6 : 6.8;
    const subFontSize = dayColW < 16 ? 4.5 : 5.4;

    columns.forEach((col, i) => {
        const colX = gridStartX + i * dayColW;
        const colors = getColumnColors(col.colTone);

        doc.setFillColor(...colors.headerBg);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.4);
        doc.rect(colX, topY, dayColW, headerH, "FD");

        if (col.badgeText) {
            const badgeFill = getBadgeFill(col.badgeTone);
            doc.setFillColor(...badgeFill);
            const bw = Math.min(dayColW - 2, Math.max(10, dayColW - 3));
            doc.roundedRect(colX + (dayColW - bw) / 2, topY + 2, bw, 7.5, 1.2, 1.2, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(Math.min(5.2, dateFontSize - 0.6));
            doc.text(String(col.badgeText).slice(0, 6), colX + dayColW / 2, topY + 7.2, { align: "center" });
        } else if (
            col.colTone === "checkpoint" ||
            col.colTone === "filled" ||
            col.colTone === "needsInput" ||
            col.colTone === "todayCheckpoint" ||
            col.colTone === "today"
        ) {
            const dotColor: [number, number, number] =
                col.colTone === "needsInput"
                    ? [220, 38, 38]
                    : col.colTone === "filled"
                        ? [13, 148, 136]
                        : col.colTone === "todayCheckpoint"
                            ? [245, 158, 11]
                            : col.colTone === "today"
                                ? [16, 185, 129]
                                : [37, 99, 235];
            doc.setFillColor(...dotColor);
            doc.circle(colX + dayColW / 2, topY + 5.5, 1.8, "F");
        }

        doc.setTextColor(...colors.text);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(dateFontSize);
        doc.text(col.dateLabel, colX + dayColW / 2, topY + (col.subLabel ? headerH - 8.5 : headerH / 2 + 2), {
            align: "center",
        });

        if (col.subLabel) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(subFontSize);
            doc.text(col.subLabel, colX + dayColW / 2, topY + headerH - 2.8, { align: "center" });
        }
    });

    return topY + headerH;
}

function drawCommunicationNotesTable(
    doc: VectorPdfDocument,
    pageWidth: number,
    pageHeight: number,
    marginX: number,
    bottomMargin: number,
    startY: number,
    notes: GanttNoteItem[],
    meta: GanttPdfProjectMeta,
    logo: LoadedJpegAsset | null,
    spartaLogo: LoadedJpegAsset | null
) {
    const tableW = pageWidth - marginX * 2;
    const colWidths = [30, 125, 125, 110, tableW - 390];
    const headers = ["No", "Penulis", "Role / Jabatan", "Waktu", "Isi Catatan"];
    const headerRowH = 22;

    let cursorY = startY;

    const drawNotesTableHeader = (y: number) => {
        doc.setFillColor(30, 41, 59);
        doc.setDrawColor(30, 41, 59);
        doc.setLineWidth(0.6);
        doc.rect(marginX, y, tableW, headerRowH, "FD");

        let colX = marginX;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.8);
        doc.setTextColor(255, 255, 255);

        headers.forEach((h, idx) => {
            const w = colWidths[idx];
            if (idx > 0) {
                doc.setDrawColor(71, 85, 105);
                doc.line(colX, y, colX, y + headerRowH);
            }
            if (idx === 0 || idx === 3) {
                doc.text(h, colX + w / 2, y + headerRowH / 2 + 2.6, { align: "center" });
            } else {
                doc.text(h, colX + 8, y + headerRowH / 2 + 2.6);
            }
            colX += w;
        });

        return y + headerRowH;
    };

    cursorY = drawNotesTableHeader(cursorY);

    const rows =
        notes.length > 0
            ? notes.map((n, index) => [
                  String(index + 1),
                  n.author_name || "-",
                  n.author_role || "-",
                  n.created_at
                      ? new Date(n.created_at).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                        })
                      : "-",
                  String(n.note || "-"),
              ])
            : [["-", "-", "-", "-", "Belum ada catatan komunikasi untuk proyek ini."]];

    rows.forEach((rowCells, rowIdx) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);

        const wrappedCols = rowCells.map((cellText, colIdx) =>
            doc.splitTextToSize(cellText, colWidths[colIdx] - 14)
        );
        const maxLines = Math.max(1, ...wrappedCols.map((lines) => lines.length));
        const rowH = Math.max(20, maxLines * 10 + 10);

        if (cursorY + rowH > pageHeight - bottomMargin) {
            doc.addPage();
            drawWatermark(doc, pageWidth, pageHeight);
            cursorY = drawBrandedHeader(doc, pageWidth, marginX, 20, meta, logo, spartaLogo);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9.5);
            doc.setTextColor(15, 23, 42);
            doc.text("CATATAN KOMUNIKASI GANTT (Lanjutan)", marginX, cursorY + 10);
            cursorY += 16;
            cursorY = drawNotesTableHeader(cursorY);
        }

        doc.setFillColor(rowIdx % 2 === 0 ? 255 : 248, rowIdx % 2 === 0 ? 255 : 250, rowIdx % 2 === 0 ? 255 : 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.rect(marginX, cursorY, tableW, rowH, "FD");

        let colX = marginX;
        wrappedCols.forEach((lines, colIdx) => {
            const w = colWidths[colIdx];
            if (colIdx > 0) {
                doc.setDrawColor(226, 232, 240);
                doc.line(colX, cursorY, colX, cursorY + rowH);
            }
            doc.setFont("helvetica", colIdx === 1 ? "bold" : "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(30, 41, 59);

            const textStartY = cursorY + 12;
            if (colIdx === 0 || colIdx === 3) {
                doc.text(lines, colX + w / 2, textStartY, { align: "center", lineHeightFactor: 1.3 });
            } else {
                doc.text(lines, colX + 7, textStartY, { lineHeightFactor: 1.3 });
            }
            colX += w;
        });

        cursorY += rowH;
    });
}

export async function exportGanttChartToPdf(input: ExportGanttPdfInput): Promise<void> {
    const totalDays = Math.max(1, input.columns.length);
    const useA3 = totalDays > 32;
    const doc = new VectorPdfDocument(useA3 ? "a3" : "a4");

    const pageWidth = doc.getWidth();
    const pageHeight = doc.getHeight();
    const marginX = 28;
    const bottomMargin = 32;

    const [logo, spartaLogo] = await Promise.all([
        loadImageOnRedBannerAsJpeg("/assets/Alfamart-Emblem.png", "ImLogo1"),
        loadImageOnRedBannerAsJpeg("/assets/Building-Logo.png", "ImLogo2"),
    ]);

    drawWatermark(doc, pageWidth, pageHeight);

    let cursorY = drawBrandedHeader(doc, pageWidth, marginX, 20, input.meta, logo, spartaLogo);
    cursorY = drawProjectInfoCard(doc, pageWidth, marginX, cursorY, input.meta);
    cursorY = drawLegendStrip(doc, pageWidth, marginX, cursorY, input.isBelumSpk);

    const availableTableW = pageWidth - marginX * 2;
    const noColW = 26;
    const labelColW = useA3 ? 210 : 165;
    const dayColW = (availableTableW - noColW - labelColW) / totalDays;
    const gridStartX = marginX + noColW + labelColW;
    const headerH = 28;
    const groupH = 20;
    const rowH = 22;

    cursorY = drawTimelineHeader(doc, marginX, cursorY, noColW, labelColW, dayColW, headerH, input.columns);

    const ensureVerticalSpace = (neededH: number) => {
        if (cursorY + neededH <= pageHeight - bottomMargin) return;
        doc.addPage();
        drawWatermark(doc, pageWidth, pageHeight);
        cursorY = drawBrandedHeader(doc, pageWidth, marginX, 20, input.meta, logo, spartaLogo);
        cursorY = drawTimelineHeader(doc, marginX, cursorY, noColW, labelColW, dayColW, headerH, input.columns);
    };

    input.scopes.forEach((scope) => {
        const showScopeHeader = input.scopes.length > 1 || Boolean(scope.scopeName);
        if (showScopeHeader) {
            ensureVerticalSpace(groupH + rowH);

            const isSipil = scope.scopeName.toUpperCase() === "SIPIL";
            doc.setFillColor(isSipil ? 254 : 239, isSipil ? 242 : 246, isSipil ? 242 : 255);
            doc.setDrawColor(148, 163, 184);
            doc.setLineWidth(0.6);
            doc.rect(marginX, cursorY, availableTableW, groupH, "FD");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(isSipil ? 185 : 29, isSipil ? 28 : 78, isSipil ? 28 : 216);
            const scopeHeaderText = scope.ganttId
                ? `LINGKUP: ${scope.scopeName} (Gantt #${scope.ganttId}) - ${scope.status || "-"}`
                : `LINGKUP: ${scope.scopeName}`;
            doc.text(scopeHeaderText, marginX + 8, cursorY + groupH / 2 + 2.8);

            cursorY += groupH;
        }

        interface PageRowCoord {
            rowIdx: number;
            rowTop: number;
            rowBottom: number;
            centerY: number;
            startX: number;
            firstEndX: number;
        }

        interface QueuedBarRender {
            rowTop: number;
            centerY: number;
            barX: number;
            barW: number;
            hasShift: boolean;
            duration: number;
            delayInfo?: {
                delayX: number;
                delayW: number;
                delay: number;
            };
        }

        let rowCoordsOnPage = new Map<number, PageRowCoord>();
        let queuedBarsOnPage: QueuedBarRender[] = [];

        const flushPageBarsAndConnectors = () => {
            if (queuedBarsOnPage.length === 0 && rowCoordsOnPage.size === 0) return;

            const connectorArrows: Array<{
                parentX: number;
                parentY: number;
                childX: number;
                childY: number;
            }> = [];

            // 1. Draw dependency connector lines BEHIND task bars using gutter routing
            doc.setDrawColor(59, 130, 246);
            doc.setLineWidth(0.75);

            scope.rows.forEach((row) => {
                const parent = rowCoordsOnPage.get(row.taskId);
                if (!parent) return;

                row.dependencies.forEach((childId) => {
                    const child = rowCoordsOnPage.get(childId);
                    if (!child) return;

                    const isAdjacentRow = Math.abs(child.rowIdx - parent.rowIdx) === 1;
                    const hasForwardClearance = child.startX >= parent.firstEndX + 9;

                    if (isAdjacentRow && hasForwardClearance) {
                        const midX = parent.firstEndX + Math.min(7, (child.startX - parent.firstEndX) / 2);
                        doc.polyline([
                            [parent.firstEndX, parent.centerY],
                            [midX, parent.centerY],
                            [midX, child.centerY],
                            [child.startX - 2.5, child.centerY],
                        ]);
                    } else {
                        const maxGridX = gridStartX + totalDays * dayColW - 2;
                        const outX = Math.min(maxGridX, parent.firstEndX + 4.5);
                        const inX = Math.max(gridStartX + 2, child.startX - 5.5);
                        const gutterY = child.centerY >= parent.centerY ? child.rowTop : child.rowBottom;

                        doc.polyline([
                            [parent.firstEndX, parent.centerY],
                            [outX, parent.centerY],
                            [outX, gutterY],
                            [inX, gutterY],
                            [inX, child.centerY],
                            [child.startX - 2.5, child.centerY],
                        ]);
                    }

                    connectorArrows.push({
                        parentX: parent.firstEndX,
                        parentY: parent.centerY,
                        childX: child.startX,
                        childY: child.centerY,
                    });
                });
            });

            // 2. Draw task bars & labels ON TOP of any vertical pass-through lines
            const barH = rowH - 8;
            queuedBarsOnPage.forEach((item) => {
                const barTop = item.rowTop + 4;

                if (item.hasShift) {
                    doc.setFillColor(249, 115, 22);
                    doc.setDrawColor(234, 88, 12);
                } else {
                    doc.setFillColor(34, 197, 94);
                    doc.setDrawColor(22, 163, 74);
                }
                doc.setLineWidth(0.5);
                doc.roundedRect(item.barX, barTop, item.barW, barH, 2, 2, "FD");

                doc.setFont("helvetica", "bold");
                doc.setFontSize(6.2);
                doc.setTextColor(255, 255, 255);
                const durText = item.barW >= 28 ? `${item.duration} Hari` : `${item.duration}h`;
                doc.text(durText, item.barX + item.barW / 2, item.centerY + 2, { align: "center" });

                if (item.delayInfo) {
                    const { delayX, delayW, delay } = item.delayInfo;
                    doc.setFillColor(254, 226, 226);
                    doc.setDrawColor(244, 63, 94);
                    doc.setLineWidth(0.6);
                    doc.roundedRect(delayX, barTop, delayW, barH, 2, 2, "FD");

                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(6);
                    doc.setTextColor(159, 18, 57);
                    const delayLabel = delayW >= 42 ? `+${delay} hari` : `+${delay}`;
                    doc.text(delayLabel, delayX + delayW / 2, item.centerY + 2, { align: "center" });
                }
            });

            // 3. Draw connector start dots & target arrowheads at bar edges
            doc.setFillColor(37, 99, 235);
            connectorArrows.forEach(({ parentX, parentY, childX, childY }) => {
                doc.circle(parentX, parentY, 1.3, "F");
                doc.triangle(
                    childX - 3.4,
                    childY - 2.1,
                    childX - 3.4,
                    childY + 2.1,
                    childX - 0.2,
                    childY,
                    "F"
                );
            });

            rowCoordsOnPage = new Map();
            queuedBarsOnPage = [];
        };

        scope.rows.forEach((row, rIdx) => {
            if (cursorY + rowH > pageHeight - bottomMargin) {
                flushPageBarsAndConnectors();
                ensureVerticalSpace(rowH);
            }

            // Background row
            doc.setFillColor(rIdx % 2 === 0 ? 255 : 248, rIdx % 2 === 0 ? 255 : 250, rIdx % 2 === 0 ? 255 : 252);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.4);
            doc.rect(marginX, cursorY, availableTableW, rowH, "FD");

            // Day column background tints
            input.columns.forEach((col, cIdx) => {
                const colX = gridStartX + cIdx * dayColW;
                const colors = getColumnColors(col.colTone);
                if (col.colTone && col.colTone !== "normal") {
                    doc.setFillColor(...colors.bodyBg);
                    doc.rect(colX, cursorY, dayColW, rowH, "F");
                }
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.35);
                doc.line(colX + dayColW, cursorY, colX + dayColW, cursorY + rowH);
            });

            // Left cells: No + Label
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.5);
            doc.line(marginX + noColW, cursorY, marginX + noColW, cursorY + rowH);
            doc.setLineWidth(1);
            doc.setDrawColor(148, 163, 184);
            doc.line(gridStartX, cursorY, gridStartX, cursorY + rowH);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.text(String(rIdx + 1), marginX + noColW / 2, cursorY + rowH / 2 + 2.3, { align: "center" });

            const rawLabel = String(row.label || "-");
            const isIl = rawLabel.toUpperCase().startsWith("[IL]");
            const cleanLabel = rawLabel.replace(/^\[IL\]\s*/i, "");
            let labelX = marginX + noColW + 6;

            if (isIl) {
                doc.setFillColor(79, 70, 229);
                doc.roundedRect(labelX, cursorY + (rowH - 9) / 2, 13, 9, 1.5, 1.5, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(5.5);
                doc.text("IL", labelX + 6.5, cursorY + rowH / 2 + 1.8, { align: "center" });
                labelX += 16;
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.2);
            doc.setTextColor(30, 41, 59);
            const maxLabelW = labelColW - (labelX - (marginX + noColW)) - 6;
            const truncatedLabel = doc.splitTextToSize(cleanLabel, maxLabelW)[0] || cleanLabel;
            doc.text(truncatedLabel, labelX, cursorY + rowH / 2 + 2.3);

            if (row.bars.length > 0) {
                const starts = row.bars.map((b) => Math.max(1, b.start));
                const minStart = Math.min(...starts);
                const firstBar = row.bars.reduce(
                    (winner, b) => (Math.max(1, b.start) < Math.max(1, winner.start) ? b : winner),
                    row.bars[0]
                );
                const firstS = Math.max(1, firstBar.start);
                const firstE = Math.min(totalDays, firstBar.end);
                const firstDelay = Math.max(0, Number(firstBar.delay || 0));
                const firstBarX = gridStartX + (firstS - 1) * dayColW + 1;
                const firstBarW = Math.max(dayColW * 0.65, (firstE - firstS + 1) * dayColW - 2);

                let firstEndX = firstBarX + firstBarW;
                if (firstDelay > 0 && firstE < totalDays) {
                    const effectiveDelayDays = Math.min(firstDelay, totalDays - firstE);
                    const delayX = gridStartX + firstE * dayColW + 1;
                    const delayW = Math.max(dayColW * 0.65, effectiveDelayDays * dayColW - 2);
                    firstEndX = delayX + delayW;
                }

                rowCoordsOnPage.set(row.taskId, {
                    rowIdx: rIdx,
                    rowTop: cursorY,
                    rowBottom: cursorY + rowH,
                    centerY: cursorY + rowH / 2,
                    startX: gridStartX + (minStart - 1) * dayColW + 1,
                    firstEndX,
                });
            }

            row.bars.forEach((bar) => {
                const s = Math.max(1, bar.start);
                const e = Math.min(totalDays, bar.end);
                const delay = Math.max(0, Number(bar.delay || 0));
                if (e < 1 || s > totalDays) return;

                const barX = gridStartX + (s - 1) * dayColW + 1;
                const barW = Math.max(dayColW * 0.65, (e - s + 1) * dayColW - 2);
                const hasShift = Number(bar.shift || 0) > 0;

                let delayInfo: QueuedBarRender["delayInfo"];
                if (delay > 0 && e < totalDays) {
                    const effectiveDelayDays = Math.min(delay, totalDays - e);
                    const delayX = gridStartX + e * dayColW + 1;
                    const delayW = Math.max(dayColW * 0.65, effectiveDelayDays * dayColW - 2);
                    delayInfo = { delayX, delayW, delay };
                }

                queuedBarsOnPage.push({
                    rowTop: cursorY,
                    centerY: cursorY + rowH / 2,
                    barX,
                    barW,
                    hasShift,
                    duration: bar.duration,
                    delayInfo,
                });
            });

            cursorY += rowH;
        });

        flushPageBarsAndConnectors();
    });

    // Scope Opname Summary Bar
    if (input.scopeSummaries && input.scopeSummaries.length > 0) {
        if (cursorY + 24 > pageHeight - bottomMargin) {
            doc.addPage();
            drawWatermark(doc, pageWidth, pageHeight);
            cursorY = drawBrandedHeader(doc, pageWidth, marginX, 20, input.meta, logo, spartaLogo);
        }
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.rect(marginX, cursorY, availableTableW, 20, "FD");

        let sumX = marginX + 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.2);
        input.scopeSummaries.forEach((summary) => {
            const isSipil = summary.scopeName.toUpperCase() === "SIPIL";
            doc.setFillColor(isSipil ? 239 : 59, isSipil ? 68 : 130, isSipil ? 68 : 246);
            doc.circle(sumX + 3, cursorY + 10, 2.5, "F");
            doc.setTextColor(51, 65, 85);
            const txt = `${summary.scopeName}: ${summary.readyCount} siap opname, ${summary.opnameCount} sudah opname`;
            doc.text(txt, sumX + 9, cursorY + 12.5);
            sumX += doc.getTextWidth(txt) + 28;
        });

        cursorY += 28;
    } else {
        cursorY += 12;
    }

    // Section: Catatan Komunikasi Gantt (Wajib)
    if (cursorY + 64 > pageHeight - bottomMargin) {
        doc.addPage();
        drawWatermark(doc, pageWidth, pageHeight);
        cursorY = drawBrandedHeader(doc, pageWidth, marginX, 20, input.meta, logo, spartaLogo);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`CATATAN KOMUNIKASI GANTT (${input.notes.length} Catatan)`, marginX, cursorY + 10);
    cursorY += 16;

    drawCommunicationNotesTable(
        doc,
        pageWidth,
        pageHeight,
        marginX,
        bottomMargin,
        cursorY,
        input.notes,
        input.meta,
        logo,
        spartaLogo
    );

    // Page footers
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(
            `SPARTA Gantt Chart - ${input.meta.nomorUlok || "-"} (${input.meta.storeName || "-"}) | Halaman ${p} dari ${pageCount}`,
            pageWidth - marginX,
            pageHeight - 14,
            { align: "right" }
        );
    }

    const safeUlok = sanitizeFilenamePart(input.meta.nomorUlok || "Proyek");
    const safeStore = sanitizeFilenamePart(input.meta.storeName || "Toko");
    const dateStamp = new Date().toISOString().slice(0, 10);
    doc.save(`Gantt_Chart_${safeUlok}_${safeStore}_${dateStamp}.pdf`);
}
