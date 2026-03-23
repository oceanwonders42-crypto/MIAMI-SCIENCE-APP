"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postMessageAction } from "./actions";

interface PostMessageFormProps {
  roomId: string;
}

export function PostMessageForm({ roomId }: PostMessageFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await postMessageAction(roomId, content);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setContent("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 col-span-full">
          {error}
        </p>
      )}
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a message..."
        maxLength={2000}
        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 text-sm disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
