export function Field({ label, required, hint, error, children }) {
  return (
    <div className="field">
      {label && (
        <label>
          {label}
          {required && <span className="req"> *</span>}
        </label>
      )}
      {children}
      {hint && <span className="hint">{hint}</span>}
      {error && <span className="err">{error}</span>}
    </div>
  );
}

export function TextInput(props) {
  return <input type="text" {...props} />;
}

export function NumberInput(props) {
  return <input type="number" min="0" step="any" placeholder="0" inputMode="decimal" {...props} />;
}

export function TextArea(props) {
  return <textarea {...props} />;
}

export function Select({ children, ...props }) {
  return <select {...props}>{children}</select>;
}