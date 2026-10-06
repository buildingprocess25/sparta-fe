import React, { useState, useEffect } from "react";
import { Input } from "./input";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number | "";
  onChange?: (value: number | "") => void;
  prefix?: string;
}

export function CurrencyInput({ value, onChange, prefix = "Rp ", className, ...props }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value === undefined || value === null || value === "") {
      setDisplayValue("");
    } else {
      setDisplayValue(formatRibuan(value.toString()));
    }
  }, [value]);

  const formatRibuan = (val: string) => {
    const numberString = val.replace(/[^,\d]/g, "").toString();
    const split = numberString.split(",");
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      const separator = sisa ? "." : "";
      rupiah += separator + ribuan.join(".");
    }

    rupiah = split[1] !== undefined ? rupiah + "," + split[1] : rupiah;
    return rupiah ? (prefix ? prefix + rupiah : rupiah) : "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/[^0-9]/g, "");
    if (rawValue === "") {
      setDisplayValue("");
      if (onChange) onChange("");
      return;
    }

    setDisplayValue(formatRibuan(rawValue));
    if (onChange) onChange(parseInt(rawValue, 10));
  };

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={className}
      {...props}
    />
  );
}
