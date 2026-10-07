"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { generateCaptions } from "./actions";

const maxImageBytes = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function UploadForm() {
  const router = useRouter();
  const previewUrl = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl.current) {
        URL.revokeObjectURL(previewUrl.current);
      }
    };
  }, []);

  function selectFile(nextFile: File | null) {
    setStatus("");

    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }

    if (!nextFile) {
      setFile(null);
      setPreview(null);
      return;
    }

    if (!allowedImageTypes.has(nextFile.type)) {
      setFile(null);
      setPreview(null);
      setStatus("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (nextFile.size > maxImageBytes) {
      setFile(null);
      setPreview(null);
      setStatus("Choose an image smaller than 5 MB.");
      return;
    }

    previewUrl.current = URL.createObjectURL(nextFile);
    setFile(nextFile);
    setPreview(previewUrl.current);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || isWorking) {
      return;
    }

    setIsWorking(true);
    setStatus("Uploading your photo...");

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setStatus("Sign in before creating a post.");
      setIsWorking(false);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    const safeExtension =
      extension && ["jpg", "jpeg", "png", "webp"].includes(extension)
        ? extension
        : file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "jpg";
    const storagePath = `${user.id}/${crypto.randomUUID()}.${safeExtension}`;
    const { error: uploadError } = await supabase.storage
      .from("memes")
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      setStatus(`Upload failed: ${uploadError.message}`);
      setIsWorking(false);
      return;
    }

    setStatus("Gemini is writing five caption options...");
    let result: Awaited<ReturnType<typeof generateCaptions>>;
    try {
      result = await generateCaptions(storagePath);
    } catch {
      setStatus(
        "The caption request was interrupted. Refresh the page and try again."
      );
      setIsWorking(false);
      return;
    }

    if ("error" in result) {
      setStatus(result.error);
      setIsWorking(false);
      return;
    }

    setStatus("Captions created. Opening the feed...");
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Photo</span>
        <span
          className={`flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-black/20 bg-zinc-50 p-5 transition hover:border-black/40 hover:bg-zinc-100 dark:border-white/20 dark:bg-zinc-950 dark:hover:border-white/40 dark:hover:bg-zinc-900 ${
            isWorking ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 16V4" />
              <path d="m7 9 5-5 5 5" />
              <path d="M5 20h14" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block font-medium">
              {file ? "Choose a different photo" : "Upload a photo"}
            </span>
            <span className="mt-1 block truncate text-sm text-zinc-500">
              {file?.name ?? "JPEG, PNG, or WebP up to 5 MB"}
            </span>
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={isWorking}
            onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            className="sr-only"
          />
        </span>
        <span className="text-xs text-zinc-500">
          Pick a clear moment from campus, your social life, or wherever the
          weekend took you.
        </span>
      </label>

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Selected upload preview"
          className="max-h-[28rem] w-full rounded-2xl border border-black/10 object-contain dark:border-white/15"
        />
      ) : null}

      <button
        type="submit"
        disabled={!file || isWorking}
        className="rounded-lg bg-black px-4 py-3 font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {isWorking ? "Creating captions..." : "Generate five captions"}
      </button>

      {status ? (
        <p aria-live="polite" className="text-sm text-zinc-600 dark:text-zinc-400">
          {status}
        </p>
      ) : null}
    </form>
  );
}
