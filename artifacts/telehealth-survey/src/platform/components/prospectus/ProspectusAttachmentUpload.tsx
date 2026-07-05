import { useRef, useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  formatBytes,
  PROSPECTUS_ATTACHMENT_ACCEPT,
  validateProspectusAttachment,
} from '@/platform/lib/prospectus-form';
import type { ProspectusAttachment } from '@/platform/lib/types';

type Props = {
  attachments: ProspectusAttachment[];
  uploading: boolean;
  onUpload: (file: File) => void;
  onDelete: (id: number) => void;
};

export function ProspectusAttachmentUpload({ attachments, uploading, onUpload, onDelete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file || uploading) return;

    const validationError = validateProspectusAttachment(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onUpload(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0]);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-1">Supporting documents</h3>
        <p className="text-sm text-muted-foreground">
          Optional protocol drafts, consent forms, or other supporting files.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={PROSPECTUS_ATTACHMENT_ACCEPT}
        disabled={uploading}
        onChange={onInputChange}
      />

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          if (!uploading) setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragActive(false);
        }}
        onDrop={onDrop}
        className={cn(
          'rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          dragActive && 'border-primary bg-primary/5',
          !dragActive && !uploading && 'border-muted-foreground/25',
          uploading && 'opacity-70',
        )}
      >
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-muted">
            {uploading ? <Spinner className="size-5" /> : <Upload className="size-5 text-muted-foreground" />}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {uploading ? 'Uploading…' : dragActive ? 'Drop file to upload' : 'Drag and drop a file here'}
            </p>
            <p className="text-xs text-muted-foreground">PDF or Word · max 10 MB per file</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            {uploading ? 'Uploading…' : 'Choose file'}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {attachments.length > 0 ? (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-md border bg-card px-3 py-2.5 text-sm"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.filename}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(a.sizeBytes)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={uploading}
                onClick={() => onDelete(a.id)}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Remove {a.filename}</span>
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No files uploaded yet.</p>
      )}
    </div>
  );
}
