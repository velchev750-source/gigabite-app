import { getPublicAppUrl } from "@/lib/env";

export function getPublicImageUrl(imageUrl?: string | null) {
  if (!imageUrl?.trim()) {
    return null;
  }

  const normalizedImageUrl = imageUrl.trim();

  if (/^https?:\/\//i.test(normalizedImageUrl)) {
    return normalizedImageUrl;
  }

  const publicAppUrl = getPublicAppUrl();
  const normalizedPath = normalizedImageUrl.startsWith("/")
    ? normalizedImageUrl
    : `/${normalizedImageUrl}`;

  return new URL(normalizedPath, publicAppUrl).toString();
}
