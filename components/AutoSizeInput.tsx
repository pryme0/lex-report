"use client";

import { useRef, useEffect, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AutoSizeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  minWidth?: number;
}

export function AutoSizeInput({
  value,
  onChange,
  minWidth = 60,
  className,
  placeholder,
  ...props
}: AutoSizeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (measureRef.current && inputRef.current) {
      const textToMeasure = value || placeholder || "";
      measureRef.current.textContent = textToMeasure;
      const width = Math.max(measureRef.current.offsetWidth + 8, minWidth);
      inputRef.current.style.width = `${width}px`;
    }
  }, [value, placeholder, minWidth]);

  return (
    <span className="auto-size-input-wrapper">
      <span
        ref={measureRef}
        className={cn("auto-size-input-measure", className)}
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        {...props}
      />
    </span>
  );
}

interface AutoSizeTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
}

export function AutoSizeTextarea({
  value,
  onChange,
  minRows = 2,
  className,
  ...props
}: AutoSizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24;
    const minHeight = lineHeight * minRows;
    textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
  }, [value, minRows]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("auto-size-textarea", className)}
      {...props}
    />
  );
}
