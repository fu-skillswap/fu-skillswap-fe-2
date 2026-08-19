import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> { label: string; error?: string; }
export function TextField({ label, error, id, ...props }: TextFieldProps) {
  const fieldId = id ?? props.name;
  return <label className="field" htmlFor={fieldId}><span>{label}</span><input id={fieldId} {...props} />{error && <small className="error">{error}</small>}</label>;
}
