import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { useConfirmEmailQuery } from "@/hooks/useConfirmEmailQuery";
import { useResendEmailConfirmationMutation } from "@/hooks/useResendEmailConfirmationMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

const confirmEmailSchema = z.object({
  token: z.string().min(1, "Token is required."),
});

const resendConfirmationSchema = z.object({
  email: z.string().email("Enter a valid email."),
});

type ConfirmEmailCardProps = {
  initialToken?: string;
};

export function ConfirmEmailCard({ initialToken }: ConfirmEmailCardProps) {
  const [token, setToken] = useState(initialToken ?? "");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"token" | "email", string>>>({});
  const [globalError, setGlobalError] = useState("");
  const autoConfirmedToken = useRef<string | null>(null);
  const confirmQuery = useConfirmEmailQuery(token.trim());
  const resendMutation = useResendEmailConfirmationMutation();

  const canSubmit = token.trim().length > 0;
  const canResend = email.trim().length > 0;
  const isBusy = confirmQuery.isFetching;

  const confirmWithToken = async (nextToken: string) => {
    const parsed = confirmEmailSchema.safeParse({ token: nextToken.trim() });
    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }
    setErrors((c) => ({ ...c, token: undefined }));
    setGlobalError("");
    try {
      await confirmQuery.refetch();
    } catch (error) {
      setGlobalError(getErrorMessage(error));
    }
  };

  const handleConfirm = async () => {
    if (!canSubmit) return;
    await confirmWithToken(token);
  };

  useEffect(() => {
    const trimmed = token.trim();
    if (!initialToken || !trimmed) return;
    if (trimmed !== initialToken.trim()) return;
    if (autoConfirmedToken.current === trimmed) return;
    autoConfirmedToken.current = trimmed;
    void confirmWithToken(trimmed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken, token]);

  const handleResend = async () => {
    if (!canResend) return;
    const parsed = resendConfirmationSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setErrors((c) => ({ ...c, ...mapZodErrors(parsed.error) }));
      return;
    }
    setErrors((c) => ({ ...c, email: undefined }));
    setGlobalError("");
    try {
      await resendMutation.mutateAsync(parsed.data);
    } catch (error) {
      setGlobalError(getErrorMessage(error));
    }
  };

  const confirmStatusText = () => {
    if (confirmQuery.isFetching) return "Confirming your email…";
    if (confirmQuery.data) return confirmQuery.data.text || "Email confirmed successfully.";
    return null;
  };

  const resendStatusText = () => {
    if (resendMutation.isPending) return "Sending confirmation email…";
    if (resendMutation.data) return resendMutation.data.text || "Confirmation email sent.";
    return null;
  };

  const isConfirmed = Boolean(confirmQuery.data) && !confirmQuery.isFetching;

  return (
    <div className="card card-pad-lg col" style={{ gap: 24 }}>
      {/* Token field */}
      <div className="field">
        <label className="field-label" htmlFor="confirm-token">Confirmation token</label>
        <div className={`input-wrap${errors.token ? " error" : ""}`}>
          <input
            id="confirm-token"
            className="input"
            placeholder="Paste token from your email"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        {errors.token && <span className="field-error">{errors.token}</span>}
      </div>

      {/* Email field */}
      <div className="field">
        <label className="field-label" htmlFor="confirm-email">Email address</label>
        <div className={`input-wrap${errors.email ? " error" : ""}`}>
          <input
            id="confirm-email"
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      {/* Actions */}
      <div className="row" style={{ gap: 10 }}>
        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={!canSubmit || isBusy}
        >
          {isBusy ? "Confirming…" : "Confirm email"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleResend}
          disabled={!canResend || resendMutation.isPending}
        >
          {resendMutation.isPending ? "Sending…" : "Resend confirmation"}
        </button>
      </div>

      {/* Status messages */}
      {globalError && (
        <p style={{ fontSize: 13.5, color: "var(--red-600, #DC2626)", margin: 0 }}>{globalError}</p>
      )}
      {isConfirmed && (
        <div style={{ background: "var(--emerald-100)", border: "1px solid #6EE7B7", borderRadius: 10, padding: "12px 16px" }}>
          <p style={{ fontSize: 13.5, color: "var(--emerald-700)", margin: 0, fontWeight: 500 }}>
            ✓ {confirmStatusText()}
          </p>
        </div>
      )}
      {!isConfirmed && confirmStatusText() && (
        <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0 }}>{confirmStatusText()}</p>
      )}
      {resendStatusText() && (
        <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0 }}>{resendStatusText()}</p>
      )}

      <div className="divider" />
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.55 }}>
        <b>Confirm email:</b> paste the token from your inbox above.<br />
        <b>Resend:</b> enter your email address to get a new link.
      </p>
    </div>
  );
}
