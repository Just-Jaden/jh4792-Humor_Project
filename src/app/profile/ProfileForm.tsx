"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type ProfileFormProps = {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

const maxAvatarSize = 5 * 1024 * 1024;

export default function ProfileForm({
  userId,
  firstName,
  lastName,
  avatarUrl,
}: ProfileFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [file, setFile] = useState<File | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [preview, setPreview] = useState(avatarUrl);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function selectFile(nextFile: File | null) {
    setStatus("");

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (!nextFile) {
      setFile(null);
      setPreview(currentAvatarUrl);
      return;
    }

    if (!nextFile.type.startsWith("image/")) {
      setFile(null);
      setPreview(currentAvatarUrl);
      setStatus("Choose an image file.");
      return;
    }

    if (nextFile.size > maxAvatarSize) {
      setFile(null);
      setPreview(currentAvatarUrl);
      setStatus("Choose an image smaller than 5 MB.");
      return;
    }

    objectUrlRef.current = URL.createObjectURL(nextFile);
    setFile(nextFile);
    setPreview(objectUrlRef.current);
  }

  async function handleSave() {
    const trimmedFirst = first.trim();
    const trimmedLast = last.trim();

    if (!trimmedFirst || !trimmedLast) {
      setStatus("First and last name are required.");
      return;
    }

    setIsSaving(true);
    setStatus("Saving...");
    let nextAvatarUrl = currentAvatarUrl;
    let uploadedPath: string | null = null;

    if (file) {
      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "") || "jpg";
      uploadedPath = `${userId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(uploadedPath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setStatus(`Upload failed: ${uploadError.message}`);
        setIsSaving(false);
        return;
      }

      nextAvatarUrl = supabase.storage
        .from("avatars")
        .getPublicUrl(uploadedPath).data.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: trimmedFirst,
        last_name: trimmedLast,
        avatar_url: nextAvatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      if (uploadedPath) {
        await supabase.storage.from("avatars").remove([uploadedPath]);
      }
      setStatus(`Save failed: ${error.message}`);
      setIsSaving(false);
      return;
    }

    setCurrentAvatarUrl(nextAvatarUrl);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreview(nextAvatarUrl);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setStatus("Profile saved.");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-col gap-5">
      {preview ? (
        // A plain img supports Supabase's dynamic public Storage URL without remote image configuration.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Profile"
          className="h-28 w-28 rounded-full border border-black/10 object-cover dark:border-white/15"
        />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-zinc-200 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          No photo
        </div>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Profile photo</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <span className="text-xs text-zinc-500">Image files up to 5 MB.</span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">First name</span>
        <input
          value={first}
          onChange={(event) => setFirst(event.target.value)}
          autoComplete="given-name"
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black dark:border-white/20 dark:focus:border-white"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Last name</span>
        <input
          value={last}
          onChange={(event) => setLast(event.target.value)}
          autoComplete="family-name"
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black dark:border-white/20 dark:focus:border-white"
        />
      </label>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {isSaving ? "Saving..." : "Save profile"}
      </button>

      {status ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{status}</p>
      ) : null}
    </div>
  );
}
