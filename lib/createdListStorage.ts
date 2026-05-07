const STORAGE_KEY = "ri_created_prompt_list_ids";
const MAX_IDS = 50;

export function rememberCreatedPromptListId(id: string) {
  if (typeof window === "undefined" || !id) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const prev = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
    const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_IDS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore corrupt storage */
  }
}

export function getRememberedCreatedPromptListIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.length > 0);
  } catch {
    return [];
  }
}
