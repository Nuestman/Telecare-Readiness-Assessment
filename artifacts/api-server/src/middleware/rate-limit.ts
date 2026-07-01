import rateLimit from "express-rate-limit";

export const surveySubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many survey submissions. Please try again later." },
});
