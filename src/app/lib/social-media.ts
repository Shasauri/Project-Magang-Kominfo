import { isSafeExternalUrl } from "./security";

export type SocialMediaPlatformKey = "youtube" | "instagram" | "facebook" | "tiktok" | "other";

export type SocialMediaLink = {
  key: SocialMediaPlatformKey;
  label: string;
  url: string;
  customName?: string;
};

const FIXED_PLATFORMS = [
  { key: "youtube", label: "YouTube" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" },
] as const;

export const SOCIAL_MEDIA_PLATFORMS: { key: SocialMediaPlatformKey; label: string }[] = [
  ...FIXED_PLATFORMS,
  { key: "other", label: "Yang lainnya" },
];

const FIXED_PLATFORM_BY_NAME = new Map(
  FIXED_PLATFORMS.map((platform) => [platform.label.toLowerCase(), platform])
);

const PLATFORM_ORDER = new Map(
  SOCIAL_MEDIA_PLATFORMS.map((platform, index) => [platform.key, index])
);

export const isSocialMediaLinkQuestion = (question?: { question_text?: string }) =>
  question?.question_text?.toLowerCase().includes("link sosial media") ?? false;

const getPlatformLabel = (link: SocialMediaLink) => {
  if (link.key !== "other") return link.label;
  return link.customName?.trim() ? `Lainnya (${link.customName})` : "Lainnya";
};

export const getSocialMediaLinkLabel = (link: SocialMediaLink) =>
  link.key === "other"
    ? `Yang lainnya${link.customName?.trim() ? ` (${link.customName.trim()})` : ""}`
    : link.label;

const inferLegacyLink = (url: string): SocialMediaLink => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    if (hostname === "youtu.be" || hostname.endsWith("youtube.com")) {
      return { key: "youtube", label: "YouTube", url };
    }
    if (hostname.endsWith("instagram.com")) {
      return { key: "instagram", label: "Instagram", url };
    }
    if (hostname.endsWith("facebook.com") || hostname === "fb.com") {
      return { key: "facebook", label: "Facebook", url };
    }
    if (hostname.endsWith("tiktok.com")) {
      return { key: "tiktok", label: "TikTok", url };
    }
    return { key: "other", label: "Yang lainnya", customName: hostname, url };
  } catch {
    return { key: "other", label: "Yang lainnya", customName: "", url };
  }
};

export const parseSocialMediaAnswer = (value?: string | null): SocialMediaLink[] => {
  const raw = value?.trim();
  if (!raw) return [];

  const links: SocialMediaLink[] = [];

  raw.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const fixedMatch = trimmedLine.match(/^(YouTube|Instagram|Facebook|TikTok)\s*:\s*(.*)$/i);
    if (fixedMatch) {
      const platform = FIXED_PLATFORM_BY_NAME.get(fixedMatch[1].toLowerCase());
      if (platform && !links.some((link) => link.key === platform.key)) {
        links.push({ ...platform, url: fixedMatch[2] ?? "" });
      }
      return;
    }

    const otherMatch = trimmedLine.match(/^Lainnya(?:\s*\((.*)\))?\s*:\s*(.*)$/i);
    if (otherMatch && !links.some((link) => link.key === "other")) {
      links.push({
        key: "other",
        label: "Yang lainnya",
        customName: otherMatch[1] ?? "",
        url: otherMatch[2] ?? "",
      });
    }
  });

  if (links.length > 0) return links;
  if (!raw.includes("\n") && isSafeExternalUrl(raw)) return [inferLegacyLink(raw)];

  return [];
};

export const serializeSocialMediaAnswer = (links: SocialMediaLink[]) =>
  [...links]
    .sort((a, b) => (PLATFORM_ORDER.get(a.key) ?? 0) - (PLATFORM_ORDER.get(b.key) ?? 0))
    .map((link) => `${getPlatformLabel(link)}: ${link.url.trim()}`)
    .join("\n");

export const isSocialMediaLinkComplete = (link: SocialMediaLink) =>
  isSafeExternalUrl(link.url.trim()) &&
  (link.key !== "other" || Boolean(link.customName?.trim()));

export const hasCompleteSocialMediaAnswer = (value?: string | null) =>
  parseSocialMediaAnswer(value).some(isSocialMediaLinkComplete);

export const getCompleteSocialMediaAnswer = (value?: string | null) =>
  serializeSocialMediaAnswer(
    parseSocialMediaAnswer(value)
      .filter(isSocialMediaLinkComplete)
      .map((link) => ({
        ...link,
        url: link.url.trim(),
        customName: link.customName?.trim(),
      }))
  );
