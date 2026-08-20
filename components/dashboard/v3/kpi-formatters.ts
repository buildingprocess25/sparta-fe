export const numberFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
export const percentFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
export const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});
export const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

export const formatRupiahKpi = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return rupiahFormatter.format(value);
};

export const formatNumberKpi = (value: number | null | undefined, suffix = "") => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${numberFormatter.format(value)}${suffix}`;
};

export const formatPercentKpi = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${percentFormatter.format(value)}%`;
};

export const formatDateKpi = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return dateFormatter.format(date);
};

export const formatSignedDays = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  if (value < 0) return `${numberFormatter.format(value)} hari / lebih cepat ${numberFormatter.format(Math.abs(value))} hari`;
  if (value > 0) return `+${numberFormatter.format(value)} hari / terlambat ${numberFormatter.format(value)} hari`;
  return "0 hari / tepat waktu";
};
