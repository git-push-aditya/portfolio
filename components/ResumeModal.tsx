"use client";

import { useRef } from "react";
import { resume } from "@/lib/data";

export default function ResumeModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-full border border-border px-5 py-2.5 text-sm text-foreground transition-colors hover:border-accent/40"
      >
        Resume
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="h-[80vh] w-[80vw] max-w-4xl rounded-xl border border-border bg-card p-0 text-foreground backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm text-muted">Resume preview</span>
            <div className="flex items-center gap-4 text-sm">
              {resume.driveUrl && (
                <a
                  href={resume.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Open in Drive
                </a>
              )}
              <a
                href={resume.pdfUrl}
                download={resume.fileName}
                className="rounded-full bg-accent px-4 py-1.5 font-medium text-black transition-opacity hover:opacity-90"
              >
                Download
              </a>
              <button
                onClick={() => dialogRef.current?.close()}
                aria-label="Close"
                className="text-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>
          </div>
          <iframe src={resume.pdfUrl} title="Resume preview" className="w-full flex-1" />
        </div>
      </dialog>
    </>
  );
}
