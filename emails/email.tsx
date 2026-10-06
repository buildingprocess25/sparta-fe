import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Link,
  Preview,
} from "react-email";

export interface AlfamartEmailProps {
  recipientName?: string;
  subjectTitle?: string;
  badgeText?: string;
  mainMessage?: string;
  details?: Array<{ label: string; value: string }>;
  ctaText?: string;
  ctaUrl?: string;
  secondaryNotes?: string;
  assetsBaseUrl?: string;
}

export default function AlfamartEmailTemplate({
  recipientName = "Bapak/Ibu Rekanan & Tim Proyek",
  subjectTitle = "Pemberitahuan Sistem SPARTA Building",
  badgeText = "Pemberitahuan Sistem",
  mainMessage = "Terdapat dokumen baru yang membutuhkan tindakan verifikasi dan persetujuan Anda melalui dashboard sistem SPARTA.",
  details = [
    { label: "Nomor Dokumen", value: "SPARTA/HO/2026/09/TR-018" },
    { label: "Perihal", value: "Persetujuan Penetapan Harga Satuan Material (Trial)" },
    { label: "Departemen", value: "Standard & Budget Controlling" },
    { label: "Tanggal Pengajuan", value: "28 September 2026, 14:30 WIB" },
  ],
  ctaText = "Buka Dokumen",
  ctaUrl = "https://sparta.alfamart.co.id",
  secondaryNotes = "Silakan login ke portal SPARTA menggunakan akun terdaftar untuk memeriksa rincian dokumen dan memberikan konfirmasi.",
  assetsBaseUrl = "/assets",
}: AlfamartEmailProps) {
  // Path logo (mendukung path relatif publik atau URL absolut)
  const emblemLogoUrl = "https://2bu0ndiveq.ufs.sh/f/PQUWrHtIDTYqYOQQZeRxTQaVnpKs7ZqdA5gtI96E8r20UbPm"
  const buildingLogoUrl = assetsBaseUrl
    ? `${assetsBaseUrl.replace(/\/$/, "")}/Building-Logo.png`
    : "/assets/Building-Logo.png";

  return (
    <Html lang="id">
      <Head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{subjectTitle}</title>
      </Head>
      <Preview>{`${subjectTitle} - PT Sumber Alfaria Trijaya, Tbk.`}</Preview>

      <Body
        style={{
          margin: 0,
          padding: "28px 0",
          backgroundColor: "#f1f5f9",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <table
          role="presentation"
          border={0}
          cellPadding={0}
          cellSpacing={0}
          width="100%"
        >
          <tbody>
            <tr>
              <td align="center">
                {/* CONTAINER UTAMA (MAX WIDTH 600PX) */}
                <table
                  role="presentation"
                  border={0}
                  cellPadding={0}
                  cellSpacing={0}
                  width="600"
                  style={{
                    maxWidth: "600px",
                    width: "100%",
                    borderCollapse: "collapse",
                    margin: "0 auto",
                  }}
                >
                  <tbody>
                    {/* ============================================================= */}
                    {/* HEADER KHAS ALFAMART (RATA TENGAH / CENTER-ALIGNED)          */}
                    {/* ============================================================= */}
                    <tr>
                      <td
                        style={{
                          backgroundColor: "#da251c",
                          borderRadius: "8px 8px 0 0",
                          padding: "18px 24px",
                          textAlign: "center",
                        }}
                      >
                        <table
                          role="presentation"
                          border={0}
                          cellPadding={0}
                          cellSpacing={0}
                          style={{
                            margin: "0 auto",
                            display: "inline-table",
                          }}
                        >
                          <tbody>
                            <tr>
                              {/* Logo Alfamart Emblem */}
                              <td
                                valign="middle"
                                style={{
                                  paddingRight: "14px",
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  style={{
                                    backgroundColor: "#ffffff",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    display: "inline-block",
                                  }}
                                >
                                  <img
                                    src="https://2bu0ndiveq.ufs.sh/f/PQUWrHtIDTYqYOQQZeRxTQaVnpKs7ZqdA5gtI96E8r20UbPm"
                                    alt="Alfamart"
                                    width="76"
                                    style={{
                                      display: "block",
                                      border: 0,
                                      maxHeight: "28px",
                                      width: "auto",
                                    }}
                                  />
                                </div>
                              </td>

                              {/* Divider Vertikal */}
                              <td
                                valign="middle"
                                style={{ paddingRight: "14px" }}
                              >
                                <div
                                  style={{
                                    width: "1px",
                                    height: "34px",
                                    backgroundColor: "rgba(255, 255, 255, 0.4)",
                                  }}
                                />
                              </td>

                              {/* Logo SPARTA Building + Teks */}
                              <td
                                valign="middle"
                                style={{ paddingRight: "10px" }}
                              >
                                <img
                                  src="https://2bu0ndiveq.ufs.sh/f/PQUWrHtIDTYq9yAX4cYJ2QCoyYU80if1uN6LpOt9zbZHe4lI"
                                  alt="SPARTA Building"
                                  width="57"
                                  style={{
                                    display: "block",
                                    border: 0,
                                    height: "auto",
                                  }}
                                />
                              </td>
                              
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* ============================================================= */}
                    {/* BODY / KONTEN EMAIL                                           */}
                    {/* ============================================================= */}
                    <tr>
                      <td
                        style={{
                          backgroundColor: "#ffffff",
                          borderLeft: "1px solid #e2e8f0",
                          borderRight: "1px solid #e2e8f0",
                          padding: "32px 28px",
                        }}
                      >
                        {/* Badge Kategori */}
                        {badgeText && (
                          <div style={{ marginBottom: "14px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                backgroundColor: "#fef2f2",
                                color: "#da251c",
                                border: "1px solid #fecaca",
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "3px 10px",
                                borderRadius: "9999px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              {badgeText}
                            </span>
                          </div>
                        )}

                        {/* Title Subject */}
                        <h2
                          style={{
                            color: "#0f172a",
                            fontSize: "18px",
                            fontWeight: 700,
                            lineHeight: "1.35",
                            margin: "0 0 14px 0",
                          }}
                        >
                          {subjectTitle}
                        </h2>

                        {/* Greeting */}
                        <p
                          style={{
                            color: "#334155",
                            fontSize: "13.5px",
                            margin: "0 0 12px 0",
                            lineHeight: "1.5",
                          }}
                        >
                          Yth. <strong>{recipientName}</strong>,
                        </p>

                        {/* Main Paragraph */}
                        <p
                          style={{
                            color: "#334155",
                            fontSize: "13.5px",
                            lineHeight: 1.6,
                            margin: "0 0 20px 0",
                          }}
                        >
                          {mainMessage}
                        </p>

                        {/* Details Table */}
                        {details && details.length > 0 && (
                          <div
                            style={{
                              backgroundColor: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              padding: "16px",
                              marginBottom: "24px",
                            }}
                          >
                            <table
                              role="presentation"
                              border={0}
                              cellPadding={0}
                              cellSpacing={0}
                              width="100%"
                              style={{
                                fontSize: "12.5px",
                                borderCollapse: "collapse",
                              }}
                            >
                              <tbody>
                                {details.map((item, index) => (
                                  <tr
                                    key={index}
                                    style={{
                                      backgroundColor:
                                        index % 2 === 0 ? "#ffffff" : "#f8fafc",
                                    }}
                                  >
                                    <td
                                      style={{
                                        padding: "6px 8px 6px 0",
                                        color: "#64748b",
                                        fontWeight: 500,
                                        width: "36%",
                                        verticalAlign: "top",
                                      }}
                                    >
                                      {item.label}
                                    </td>
                                    <td
                                      style={{
                                        padding: "6px 6px 6px 0",
                                        color: "#94a3b8",
                                        fontWeight: 600,
                                        width: "4%",
                                        verticalAlign: "top",
                                      }}
                                    >
                                      :
                                    </td>
                                    <td
                                      style={{
                                        padding: "6px 0",
                                        color: "#0f172a",
                                        fontWeight: 600,
                                        verticalAlign: "top",
                                      }}
                                    >
                                      {item.value}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Tombol CTA */}
                        {ctaText && ctaUrl && (
                          <table
                            role="presentation"
                            border={0}
                            cellPadding={0}
                            cellSpacing={0}
                            style={{ marginBottom: "22px" }}
                          >
                            <tbody>
                              <tr>
                                <td align="left">
                                  <a
                                    href={ctaUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      backgroundColor: "#da251c",
                                      color: "#ffffff",
                                      textDecoration: "none",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      padding: "11px 24px",
                                      borderRadius: "6px",
                                      display: "inline-block",
                                    }}
                                  >
                                    {ctaText} &rarr;
                                  </a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}

                        {/* Secondary Notes */}
                        {secondaryNotes && (
                          <p
                            style={{
                              color: "#64748b",
                              fontSize: "12px",
                              lineHeight: 1.55,
                              margin: "0 0 16px 0",
                              borderTop: "1px dashed #e2e8f0",
                              paddingTop: "14px",
                            }}
                          >
                            {secondaryNotes}
                          </p>
                        )}
                      </td>
                    </tr>

                    {/* ============================================================= */}
                    {/* FOOTER PROPER KHAS ALFAMART HEAD OFFICE                       */}
                    {/* ============================================================= */}
                    <tr>
                      <td
                        style={{
                          backgroundColor: "#f8fafc",
                          borderRadius: "0 0 8px 8px",
                          border: "1px solid #e2e8f0",
                          borderTop: "none",
                          padding: "20px 24px 24px 24px",
                        }}
                      >
                        <table
                          role="presentation"
                          border={0}
                          cellPadding={0}
                          cellSpacing={0}
                          width="100%"
                        >
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  borderTop: "1px solid #e2e8f0",
                                  paddingTop: "18px",
                                  textAlign: "center",
                                }}
                              >
                                {/* Identitas Divisi & Perusahaan */}
                                <p
                                  style={{
                                    color: "#475569",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    margin: "0 0 4px 0",
                                  }}
                                >
                                  PT Sumber Alfaria Trijaya, Tbk. (Head Office)
                                </p>
                                <p
                                  style={{
                                    color: "#64748b",
                                    fontSize: "11px",
                                    margin: "0 0 12px 0",
                                    lineHeight: 1.5,
                                  }}
                                >
                                  <strong>Alfa Tower</strong>, Lantai 10 &ndash; 12 &bull; Jl. Jalur Sutera Barat Kav. 7 &ndash; 9, Alam Sutera, Tangerang 15143<br />
                                </p>

                                {/* Links / Helpdesk */}
                                <p
                                  style={{
                                    color: "#94a3b8",
                                    fontSize: "11px",
                                    margin: "0 0 14px 0",
                                  }}
                                >
                                  <a
                                    href="https://sparta.alfamart.co.id"
                                    style={{
                                      color: "#da251c",
                                      textDecoration: "none",
                                      fontWeight: 500,
                                    }}
                                  >
                                    Portal SPARTA
                                  </a>
                                  &nbsp;&bull;&nbsp;
                                  <a
                                    href="https://sparta.alfamart.co.id/help"
                                    style={{
                                      color: "#da251c",
                                      textDecoration: "none",
                                      fontWeight: 500,
                                    }}
                                  >
                                    Pusat Bantuan
                                  </a>
                                  &nbsp;&bull;&nbsp;
                                  <a
                                    href="mailto:support-sparta@alfamart.co.id"
                                    style={{
                                      color: "#da251c",
                                      textDecoration: "none",
                                      fontWeight: 500,
                                    }}
                                  >
                                    Hubungi IT Support
                                  </a>
                                </p>

                                {/* Disclaimer Kerahasiaan */}
                                <p
                                  style={{
                                    color: "#94a3b8",
                                    fontSize: "10px",
                                    lineHeight: 1.5,
                                    margin: 0,
                                  }}
                                >
                                  Pesan ini dikirim secara otomatis oleh sistem internal SPARTA Building. Harap tidak membalas langsung ke alamat email ini.<br />
                                  Informasi di dalam email ini bersifat rahasia dan hanya ditujukan untuk pihak yang berwenang.
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}
