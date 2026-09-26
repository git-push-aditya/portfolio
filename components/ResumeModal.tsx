"use client";

import { useRef } from "react";
import { resume } from "@/lib/data";

// ponytail: the browser's built-in PDF viewer (toolbar, its own scrollbar) runs as
// sandboxed native UI — no page CSS reaches inside it. #toolbar=0&navpanes=0 is the
// one thing browsers actually honor, so we strip their chrome instead of styling it.
// Full themed scrollbar/toolbar would mean swapping to a pdf.js canvas renderer.
const VIEWER_SRC = `${resume.pdfUrl}#toolbar=0&navpanes=0`;

export default function ResumeModal({
  triggerClassName = "rounded-full border border-border px-5 py-2.5 text-sm text-foreground transition-colors hover:border-accent/40",
  label = "Resume",
}: {
  triggerClassName?: string;
  label?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button onClick={() => dialogRef.current?.showModal()} className={triggerClassName}>
        {label}
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="resume-dialog fixed top-auto bottom-0 left-1/2 h-[90vh] w-[80vw] rounded-t-xl border border-b-0 border-border bg-card p-0 text-foreground"
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
          <iframe src={VIEWER_SRC} title="Resume preview" className="w-full flex-1" />
        </div>
      </dialog>
    </>
  );
}
