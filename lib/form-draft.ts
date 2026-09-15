export type DraftValues = Record<string, string | string[]>;
export function captureDraft(fields: { name: string; type: string; value: string; checked?: boolean }[]): DraftValues {
  const values: DraftValues = {};
  for (const field of fields) {
    if (!field.name || ["password", "file", "hidden", "submit", "button"].includes(field.type)) continue;
    if (field.type === "checkbox") {
      const selected = Array.isArray(values[field.name]) ? values[field.name] as string[] : [];
      if (field.checked) selected.push(field.value);
      values[field.name] = selected;
    } else if (field.type === "radio") {
      if (field.checked) values[field.name] = field.value;
    } else values[field.name] = field.value;
  }
  return values;
}
