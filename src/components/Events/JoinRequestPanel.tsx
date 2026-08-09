"use client";

import { Check, Loader2, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { EventRequestRecord } from "@/lib/events/requests";

type RequestContext = {
  isOrganizer: boolean;
  request: EventRequestRecord | null;
  requests: EventRequestRecord[];
  acceptedCount: number | null;
};

export function JoinRequestPanel({
  eventId,
  capacity,
}: {
  eventId: string;
  capacity: number | null;
}) {
  const [data, setData] = useState<RequestContext | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/requests`);
      if (!response.ok) return;
      setData((await response.json()) as RequestContext);
    } catch {
      setError("Join requests are temporarily unavailable.");
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const mutate = async (
    url: string,
    options: RequestInit,
    onSuccess: (request: EventRequestRecord) => void,
    key: string,
  ) => {
    setError("");
    setWorking(key);
    try {
      const response = await fetch(url, options);
      const result = (await response.json()) as {
        request?: EventRequestRecord;
        message?: string;
      };
      if (!response.ok || !result.request) {
        setError(result.message ?? "The request could not be completed.");
        return;
      }
      onSuccess(result.request);
    } catch {
      setError("The request could not be completed. Check your connection and try again.");
    } finally {
      setWorking(null);
    }
  };

  if (!data) {
    return error ? <p className="text-xs text-red-500">{error}</p> : null;
  }

  if (data.isOrganizer) {
    const pending = data.requests.filter((request) => request.status === "pending");
    return (
      <div className="space-y-3 border-t border-zinc-200/80 pt-4 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Join requests</p>
          <span className="text-xs text-zinc-500">
            {data.acceptedCount ?? 0}{capacity ? ` / ${capacity}` : ""} accepted
          </span>
        </div>
        {pending.length ? (
          <div className="space-y-2">
            {pending.map((request) => (
              <div
                className="rounded-lg border border-zinc-200/80 bg-white/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                key={request.id}
              >
                <p className="truncate text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Student {request.user_id.slice(0, 8)}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <DecisionButton
                    disabled={working !== null}
                    icon={<Check />}
                    label="Accept"
                    onClick={() =>
                      void mutate(
                        `/api/event-requests/${request.id}`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ decision: "accepted" }),
                        },
                        (updated) =>
                          setData((current) =>
                            current
                              ? {
                                  ...current,
                                  acceptedCount: (current.acceptedCount ?? 0) + 1,
                                  requests: current.requests.map((item) =>
                                    item.id === updated.id ? updated : item,
                                  ),
                                }
                              : current,
                          ),
                        request.id,
                      )
                    }
                  />
                  <DecisionButton
                    disabled={working !== null}
                    icon={<X />}
                    label="Decline"
                    onClick={() =>
                      void mutate(
                        `/api/event-requests/${request.id}`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ decision: "rejected" }),
                        },
                        (updated) =>
                          setData((current) =>
                            current
                              ? {
                                  ...current,
                                  requests: current.requests.map((item) =>
                                    item.id === updated.id ? updated : item,
                                  ),
                                }
                              : current,
                          ),
                        request.id,
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500">No pending requests.</p>
        )}
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </div>
    );
  }

  const request = data.request;
  if (request?.status === "accepted") {
    return <Status icon={<Check />} text="Your request was accepted" />;
  }
  if (request?.status === "rejected") {
    return <Status icon={<X />} text="Your request was declined" />;
  }
  if (request?.status === "cancelled") {
    return <Status icon={<X />} text="You cancelled your request" />;
  }
  if (request?.status === "pending") {
    return (
      <div className="space-y-2">
        <Status icon={<UserPlus />} text="Request pending" />
        <button
          className="w-full text-xs font-semibold text-zinc-500 transition hover:text-zinc-900 disabled:opacity-50 dark:hover:text-zinc-100"
          disabled={working !== null}
          onClick={() =>
            void mutate(
              `/api/events/${eventId}/requests`,
              { method: "DELETE" },
              (updated) => setData((current) => (current ? { ...current, request: updated } : current)),
              request.id,
            )
          }
          type="button"
        >
          Cancel request
        </button>
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        disabled={working !== null}
        onClick={() =>
          void mutate(
            `/api/events/${eventId}/requests`,
            { method: "POST" },
            (created) => setData((current) => (current ? { ...current, request: created } : current)),
            "create",
          )
        }
        type="button"
      >
        {working ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        Request to join
      </button>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

function Status({ icon, text }: { icon: React.ReactElement; text: string }) {
  return (
    <p className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200/80 px-3 py-2 text-sm font-semibold text-zinc-600 dark:border-zinc-800 dark:text-zinc-300 [&>svg]:size-4">
      {icon} {text}
    </p>
  );
}

function DecisionButton({
  icon,
  label,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactElement;
  label: string;
}) {
  return (
    <button
      {...props}
      className="flex items-center justify-center gap-1 rounded-md border border-zinc-200 px-2 py-1.5 text-xs font-semibold transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800 [&>svg]:size-3.5"
      type="button"
    >
      {icon} {label}
    </button>
  );
}
