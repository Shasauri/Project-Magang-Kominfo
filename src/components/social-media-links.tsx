"use client";

import { isSafeExternalUrl } from "@/app/lib/security";
import {
  getSocialMediaLinkLabel,
  parseSocialMediaAnswer,
  serializeSocialMediaAnswer,
  SOCIAL_MEDIA_PLATFORMS,
  type SocialMediaLink,
  type SocialMediaPlatformKey,
} from "@/app/lib/social-media";

type SocialMediaLinksFieldProps = {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
};

export function SocialMediaLinksField({ value, onChange, readOnly = false }: SocialMediaLinksFieldProps) {
  const links = parseSocialMediaAnswer(value);

  const updateLinks = (nextLinks: SocialMediaLink[]) => {
    onChange?.(serializeSocialMediaAnswer(nextLinks));
  };

  const togglePlatform = (key: SocialMediaPlatformKey, label: string) => {
    if (links.some((link) => link.key === key)) {
      updateLinks(links.filter((link) => link.key !== key));
      return;
    }

    updateLinks([
      ...links,
      { key, label, url: "", customName: key === "other" ? "" : undefined },
    ]);
  };

  const updateLink = (key: SocialMediaPlatformKey, patch: Partial<SocialMediaLink>) => {
    updateLinks(links.map((link) => (link.key === key ? { ...link, ...patch } : link)));
  };

  if (readOnly) {
    return (
      <div className="mt-4 space-y-2">
        {links.length > 0 ? (
          links.map((link) => (
            <div key={link.key} className="break-words text-xs font-medium text-slate-700">
              <span className="font-bold">{getSocialMediaLinkLabel(link)}: </span>
              {isSafeExternalUrl(link.url) ? (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {link.url}
                </a>
              ) : (
                <span className="text-slate-500">{link.url || "-"}</span>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs italic text-slate-400">-</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="mb-3 text-[10px] font-bold text-slate-500">
        Pilih platform sosial media (bisa lebih dari satu)
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {SOCIAL_MEDIA_PLATFORMS.map((platform) => {
          const link = links.find((item) => item.key === platform.key);

          return (
            <div key={platform.key}>
              <button
                type="button"
                aria-pressed={Boolean(link)}
                onClick={() => togglePlatform(platform.key, platform.label)}
                className={`w-full rounded-xl border px-4 py-2.5 text-left text-xs font-bold transition-colors ${
                  link
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                {platform.label}
              </button>

              {link && (
                <div className="mt-2 space-y-2 pl-2">
                  {platform.key === "other" && (
                    <div>
                      <label htmlFor={`social-name-${platform.key}`} className="sr-only">
                        Nama platform
                      </label>
                      <input
                        id={`social-name-${platform.key}`}
                        type="text"
                        value={link.customName || ""}
                        onChange={(event) => updateLink(platform.key, { customName: event.target.value })}
                        placeholder="Nama platform"
                        className="w-full border-b border-slate-300 bg-transparent py-2 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-blue-600"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor={`social-url-${platform.key}`} className="sr-only">
                      Link {platform.label}
                    </label>
                    <input
                      id={`social-url-${platform.key}`}
                      type="url"
                      value={link.url}
                      onChange={(event) => updateLink(platform.key, { url: event.target.value })}
                      placeholder={`Link ${platform.label}`}
                      className="w-full border-b border-slate-300 bg-transparent py-2 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-blue-600"
                    />
                  </div>

                  {link.url.trim() && !isSafeExternalUrl(link.url.trim()) && (
                    <p className="text-[10px] font-semibold text-red-500">
                      Link harus diawali http:// atau https://
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
