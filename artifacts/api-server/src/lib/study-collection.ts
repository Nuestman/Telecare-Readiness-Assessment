import type { Study } from "@workspace/db";
import { TELEHEALTH_STUDY_SLUG } from "@workspace/db";
import { getCollectionStatus as getEnvCollectionStatus } from "./study-window";

export type CollectionStatus = {
  is_open: boolean;
  opens_at: string | null;
  closes_at: string | null;
  message: string | null;
};

function parseDate(value: Date | null | undefined): Date | null {
  if (!value) return null;
  return Number.isNaN(value.getTime()) ? null : value;
}

export function getStudyCollectionStatus(study: Study): CollectionStatus {
  if (study.status === "paused") {
    return {
      is_open: false,
      opens_at: study.opens_at?.toISOString() ?? null,
      closes_at: study.closes_at?.toISOString() ?? null,
      message: "This study is temporarily unavailable.",
    };
  }

  if (study.status === "closed" || study.status === "archived" || study.status === "draft") {
    return {
      is_open: false,
      opens_at: study.opens_at?.toISOString() ?? null,
      closes_at: study.closes_at?.toISOString() ?? null,
      message: "Survey collection is not open for this study.",
    };
  }

  const opensAt = parseDate(study.opens_at);
  const closesAt = parseDate(study.closes_at);
  const now = new Date();

  if (opensAt && now < opensAt) {
    return {
      is_open: false,
      opens_at: opensAt.toISOString(),
      closes_at: closesAt?.toISOString() ?? null,
      message: "Survey collection has not started yet.",
    };
  }

  if (closesAt && now > closesAt) {
    return {
      is_open: false,
      opens_at: opensAt?.toISOString() ?? null,
      closes_at: closesAt.toISOString(),
      message: "Survey collection has ended.",
    };
  }

  return {
    is_open: true,
    opens_at: opensAt?.toISOString() ?? null,
    closes_at: closesAt?.toISOString() ?? null,
    message: null,
  };
}

export function assertStudyCollectionOpen(
  study: Study,
): { ok: true } | { ok: false; message: string } {
  if (study.slug === TELEHEALTH_STUDY_SLUG) {
    const envStatus = getEnvCollectionStatus();
    if (!envStatus.is_open) {
      return { ok: false, message: envStatus.message ?? "Survey collection is closed." };
    }
  }

  const status = getStudyCollectionStatus(study);
  if (!status.is_open) {
    return { ok: false, message: status.message ?? "Survey collection is closed." };
  }
  return { ok: true };
}

export function isStudyPubliclyListed(study: Study): boolean {
  return study.status === "active" || study.status === "paused";
}
