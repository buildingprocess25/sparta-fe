import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy API Route: /api/proxy-file?url=<encoded_url>
 *
 * Streams Google Drive (or any file URL) through the server so users
 * don't need personal Drive access. The server-side service account / cookie
 * (or simply open sharing) handles the auth.
 *
 * Usage in frontend:
 *   href={`/api/proxy-file?url=${encodeURIComponent(driveUrl)}`}
 */
export async function GET(req: NextRequest) {
    const rawUrl = req.nextUrl.searchParams.get("url");

    if (!rawUrl) {
        return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    let targetUrl: string;
    try {
        targetUrl = decodeURIComponent(rawUrl);
        // Validate it's a proper URL
        new URL(targetUrl);
    } catch {
        return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 });
    }

    // Convert Google Drive share/view URL → direct download URL
    // Pattern: https://drive.google.com/file/d/<FILE_ID>/view
    //      or: https://drive.google.com/open?id=<FILE_ID>
    const driveFileMatch = targetUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    const driveOpenMatch = targetUrl.match(/drive\.google\.com\/open\?id=([^&]+)/);
    const fileId = driveFileMatch?.[1] ?? driveOpenMatch?.[1];

    if (fileId) {
        targetUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    try {
        const upstream = await fetch(targetUrl, {
            headers: {
                // Forward a browser-like UA so Drive doesn't block
                "User-Agent":
                    "Mozilla/5.0 (compatible; SPARTA-Proxy/1.0)",
            },
            // Follow redirects (Drive often issues a redirect to the actual file)
            redirect: "follow",
        });

        if (!upstream.ok) {
            return NextResponse.json(
                { error: `Upstream responded with ${upstream.status}` },
                { status: upstream.status }
            );
        }

        const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
        const contentDisposition = upstream.headers.get("content-disposition");

        const responseHeaders: HeadersInit = {
            "Content-Type": contentType,
            // Allow browser to open inline (PDF viewer, image), fall back to download
            "Content-Disposition": contentDisposition ?? "inline",
            // Cache for 5 minutes — avoids hammering Drive on every reload
            "Cache-Control": "public, max-age=300",
        };

        return new NextResponse(upstream.body, {
            status: 200,
            headers: responseHeaders,
        });
    } catch (err) {
        console.error("[proxy-file] fetch error:", err);
        return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
    }
}
