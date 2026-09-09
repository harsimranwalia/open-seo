import { ShieldAlert } from "lucide-react";

type AuthConfigErrorCardProps = {
  message: string;
  onRetry?: () => void;
};

export function AuthConfigErrorCard({
  message,
  onRetry,
}: AuthConfigErrorCardProps) {
  return (
    <div className="card w-full max-w-2xl bg-base-100 border border-base-300 shadow-xl">
      <div className="card-body gap-4">
        <h2 className="card-title gap-2">
          <ShieldAlert className="size-5 text-error" />
          Authentication setup required
        </h2>

        <div className="alert alert-error">
          <span>{message}</span>
        </div>

        <p className="text-sm text-base-content/70">
          Auth requires <code className="mx-1">BETTER_AUTH_SECRET</code>
          (32+ characters) and <code className="mx-1">BETTER_AUTH_URL</code> on
          the deployment.
        </p>

        <div className="card-actions justify-end">
          {onRetry ? (
            <button className="btn btn-ghost btn-sm" onClick={onRetry}>
              Try Again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
