"use client";
import { createContext, useCallback, useContext } from "react";
const Scope = createContext("");
export function DraftScope({ memberId, children }: { memberId: string; children: React.ReactNode }) { return <Scope.Provider value={memberId}>{children}</Scope.Provider>; }
export function clearSessionDrafts() { try { for (const key of Object.keys(sessionStorage)) if (key.startsWith("rotary-draft:")) sessionStorage.removeItem(key); } catch { /* Storage can be disabled. */ } }

/** Opt-in recovery for uncontrolled forms. Passwords, files and hidden fields are never saved. */
export function useFormDraft(name: string) {
  const memberId = useContext(Scope);
  const key = `rotary-draft:${memberId}:${name}`;
  const clear = useCallback(() => { try { sessionStorage.removeItem(key); } catch {} }, [key]);
  const attach = useCallback((form: HTMLFormElement | null) => {
    if (!form || !memberId) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) ?? "null") as Record<string, string | boolean> | null;
      if (!saved) return;
      for (const element of Array.from(form.elements)) {
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) || !element.name || !(element.name in saved)) continue;
        if (element instanceof HTMLInputElement && ["password", "file", "hidden"].includes(element.type)) continue;
        if (element instanceof HTMLInputElement && ["checkbox", "radio"].includes(element.type)) element.checked = saved[element.name] === true;
        else if (typeof saved[element.name] === "string") element.value = String(saved[element.name]);
      }
    } catch { /* A corrupt or unavailable draft must not block the form. */ }
  }, [key, memberId]);
  const onInput = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    if (!memberId) return;
    const values: Record<string, string | boolean> = {};
    for (const element of Array.from(event.currentTarget.elements)) {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) || !element.name) continue;
      if (element instanceof HTMLInputElement && ["password", "file", "hidden", "submit", "button"].includes(element.type)) continue;
      values[element.name] = element instanceof HTMLInputElement && ["checkbox", "radio"].includes(element.type) ? element.checked : element.value;
    }
    try { sessionStorage.setItem(key, JSON.stringify(values)); } catch {}
  }, [key, memberId]);
  return { attach, onInput, clear };
}
