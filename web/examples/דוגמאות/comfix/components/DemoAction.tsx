"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function showDemoNotice(message?: string) {
  window.dispatchEvent(new CustomEvent("demo:demo-notice", { detail: message }));
}

export function DemoAction({ children, message, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; message?: string }) {
  return (
    <button {...props} className={className} type="button" onClick={() => showDemoNotice(message)}>
      {children}
    </button>
  );
}
