export type AvatarStyle =
  | "adventurer"
  | "avataaars"
  | "lorelei"
  | "notionists"
  | "fun-emoji";

export type AvatarPreset = {
  id: string;
  label: string;
  style: AvatarStyle;
  seed: string;
};

/** Gmail-style illustrated premade avatars (DiceBear). */
export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "aria", label: "Aria", style: "lorelei", seed: "aria-rose" },
  { id: "jordan", label: "Jordan", style: "adventurer", seed: "jordan-peak" },
  { id: "milo", label: "Milo", style: "avataaars", seed: "milo-wave" },
  { id: "nova", label: "Nova", style: "notionists", seed: "nova-glow" },
  { id: "kai", label: "Kai", style: "adventurer", seed: "kai-forest" },
  { id: "luna", label: "Luna", style: "lorelei", seed: "luna-mist" },
  { id: "rio", label: "Rio", style: "avataaars", seed: "rio-sun" },
  { id: "zara", label: "Zara", style: "notionists", seed: "zara-sky" },
  { id: "leo", label: "Leo", style: "adventurer", seed: "leo-stone" },
  { id: "maya", label: "Maya", style: "lorelei", seed: "maya-bloom" },
  { id: "finn", label: "Finn", style: "fun-emoji", seed: "finn-joy" },
  { id: "sage", label: "Sage", style: "avataaars", seed: "sage-calm" },
];

const LEGACY_COLOR_IDS = new Set([
  "ocean",
  "violet",
  "emerald",
  "amber",
  "rose",
  "indigo",
  "teal",
  "orange",
]);

export function getAvatarPreset(id: string | null | undefined): AvatarPreset {
  return (
    AVATAR_PRESETS.find((preset) => preset.id === id) ?? AVATAR_PRESETS[0]
  );
}

export function isValidAvatarId(id: string | null | undefined): boolean {
  return Boolean(id && AVATAR_PRESETS.some((preset) => preset.id === id));
}

export function getDefaultAvatarId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PRESETS[hash % AVATAR_PRESETS.length].id;
}

export function resolveAvatarId(
  storedId: string | null | undefined,
  userId: string,
): string {
  if (isValidAvatarId(storedId)) {
    return storedId as string;
  }
  if (storedId && LEGACY_COLOR_IDS.has(storedId)) {
    return getDefaultAvatarId(userId);
  }
  return getDefaultAvatarId(userId);
}

export function getAvatarImageUrl(preset: AvatarPreset): string {
  const params = new URLSearchParams({
    seed: preset.seed,
    backgroundColor: "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf",
  });
  return `https://api.dicebear.com/9.x/${preset.style}/svg?${params.toString()}`;
}

export function getAvatarInitials(
  username?: string | null,
  publicId?: string | null,
): string {
  const source = username?.trim() || publicId?.trim() || "U";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
