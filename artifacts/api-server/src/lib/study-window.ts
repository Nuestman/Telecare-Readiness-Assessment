export type CollectionStatus = {
  is_open: boolean;
  opens_at: string | null;
  closes_at: string | null;
  message: string | null;
};

function parseEnvDate(value: string | undefined): Date | null {
  if (!value || value.trim() === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getCollectionStatus(): CollectionStatus {
  const opensAt = parseEnvDate(process.env.SURVEY_OPENS_AT);
  const closesAt = parseEnvDate(process.env.SURVEY_CLOSES_AT);
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

export function assertCollectionOpen(): { ok: true } | { ok: false; message: string } {
  const status = getCollectionStatus();
  if (!status.is_open) {
    return { ok: false, message: status.message ?? "Survey collection is closed." };
  }
  return { ok: true };
}

const MIN_FORM_SECONDS = parseInt(process.env.SURVEY_MIN_SECONDS ?? "30", 10);

export function validateSubmissionTiming(
  formStartedAt: string | undefined,
): { ok: true } | { ok: false; message: string } {
  if (!formStartedAt) return { ok: true };

  const started = new Date(formStartedAt);
  if (Number.isNaN(started.getTime())) return { ok: true };

  const elapsed = (Date.now() - started.getTime()) / 1000;
  if (elapsed < MIN_FORM_SECONDS) {
    return {
      ok: false,
      message: "Please take a moment to complete the survey before submitting.",
    };
  }
  return { ok: true };
}
