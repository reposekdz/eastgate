"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageUploadProps {
  value: string;
  onChange: (dataUrlOrEmpty: string) => void;
  label?: string;
  placeholder?: string;
  accept?: string;
  className?: string;
  disabled?: boolean;
  /** Compact mode: smaller preview, single row */
  compact?: boolean;
  /** Optional hint below button */
  hint?: string;
}

/**
 * Upload image from local computer/device (file picker or drag-and-drop).
 * Stores as data URL — no external link. Full functional, works everywhere.
 */
export default function ImageUpload({
  value,
  onChange,
  label = "Image",
  placeholder = "Upload from device",
  accept = "image/*",
  className,
  disabled,
  compact,
  hint,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      onChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(!disabled);
  };

  const handleDragLeave = () => setDragOver(false);

  const clear = () => onChange("");

  const size = compact ? "w-16 h-16" : "w-24 h-24";

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label className="text-sm">{label}</Label>}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFile}
          className="hidden"
          disabled={disabled}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer",
            size,
            dragOver && "border-primary bg-primary/5",
            !value && "bg-muted/50 hover:bg-muted",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          {value ? (
            <div className={cn("relative rounded overflow-hidden bg-muted", size)}>
              <img src={value} alt="Upload" className="w-full h-full object-cover" />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-0.5 right-0.5 h-6 w-6 rounded-full shadow"
                onClick={(e) => { e.stopPropagation(); clear(); }}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground text-center px-1">
                {placeholder}
              </span>
              <span className="text-[9px] text-muted-foreground">or drag & drop</span>
            </>
          )}
        </div>
        {!compact && !value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="gap-2 shrink-0"
          >
            <Upload className="h-4 w-4" />
            Choose file
          </Button>
        )}
      </div>
      {(hint || value) && (
        <p className="text-xs text-muted-foreground">
          {value ? "Image from your device (saved with data)." : hint}
        </p>
      )}
    </div>
  );
}
