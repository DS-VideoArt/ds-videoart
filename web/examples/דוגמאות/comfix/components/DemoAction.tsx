"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function showComfixDemoNotice(message?: string) {
  window.dispatchEvent(new CustomEvent("comfix:demo-notice", { detail: message }));
}

export function DemoAction({ children, message, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; message?: string }) {
  return (
    <button {...props} className={className} type="button" onClick={() => showComfixDemoNotice(message)}>
      {children}
    </button>
  );
}
