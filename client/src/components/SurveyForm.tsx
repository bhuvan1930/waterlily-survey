import { useEffect, useMemo, useState } from "react";
import { questions } from "../data/questions";
import type { Answers, Question } from "../types";

const LS_KEY = "waterlily_survey_answers_v1";
const BIO_CHAR_LIMIT = 500; // non-space characters

// Count **non-whitespace** characters (spaces, tabs, newlines excluded)
const countCharsNoSpace = (s: string) => s.replace(/\s/g, "").length;

// Cap text to a maximum number of **non-whitespace** characters, preserving spaces
const capToCharsNoSpace = (s: string, max: number) => {
  let used = 0;
  let out = "";
  for (const ch of s) {
    if (/\s/.test(ch)) {
      out += ch; // whitespace doesn't count toward limit
    } else {
      if (used >= max) continue; // ignore extra non-space chars
      out += ch;
      used++;
    }
  }
  return out;
};

export default function SurveyForm({
  onComplete,
}: {
  onComplete: (id: number) => void;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [i, setI] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load draft once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setAnswers(JSON.parse(raw));
    } catch {}
  }, []);

  // Autosave
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(answers));
    } catch {}
  }, [answers]);

  const q = questions[i];
  const total = questions.length;

  const get = (key: string) => (answers[key] ?? "").toString();

  // Base field validation
  const isFilled = (id: string) => {
    const v = get(id);
    if (id === "bio")
      return countCharsNoSpace(v) > 0 && countCharsNoSpace(v) <= BIO_CHAR_LIMIT;
    if (id === "age") {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 && n <= 120; // must be > 0
    }
    return v.trim() !== "";
  };

  const genderIsOther = get("gender") === "Other";
  const genderOtherFilled = get("genderOther").trim() !== "";

  // Is the current question valid? (special cases for gender & bio)
  const isQuestionValid = (qq: Question) => {
    if (qq.id === "gender") {
      return isFilled("gender") && (!genderIsOther || genderOtherFilled);
    }
    if (qq.id === "bio") {
      const c = countCharsNoSpace(get("bio"));
      return c > 0 && c <= BIO_CHAR_LIMIT;
    }
    if (qq.id === "age") {
      const n = Number(get("age"));
      return Number.isFinite(n) && n > 0 && n <= 120;
    }
    return isFilled(qq.id);
  };

  const allValid = useMemo(
    () => questions.every(isQuestionValid),
    [answers, genderIsOther, genderOtherFilled]
  );

  const progressPct = Math.round(((i + 1) / total) * 100);
  const remaining = questions.filter((qq) => !isQuestionValid(qq)).length;

  const handleChange = (qq: Question, val: string) => {
    // Enforce hard cap for bio (non-space chars)
    if (qq.id === "bio") {
      setAnswers((a) => ({
        ...a,
        [qq.id]: capToCharsNoSpace(val, BIO_CHAR_LIMIT),
      }));
      return;
    }
    // If gender changes away from "Other", clear genderOther
    if (qq.id === "gender") {
      setAnswers((a) => ({
        ...a,
        gender: val,
        ...(val !== "Other" ? { genderOther: "" } : {}),
      }));
      return;
    }
    setAnswers((a) => ({ ...a, [qq.id]: val }));
  };

  const handleOtherGenderChange = (val: string) =>
    setAnswers((a) => ({ ...a, genderOther: val }));

  const markTouched = (id: string) =>
    setTouched((t) => ({ ...t, [id]: true }));

  const next = () => {
    if (!isQuestionValid(q)) {
      setTouched((t) => ({
        ...t,
        [q.id]: true,
        ...(q.id === "gender" && genderIsOther ? { genderOther: true } : {}),
      }));
      return;
    }
    setI((x) => Math.min(x + 1, total - 1));
  };

  const prev = () => setI((x) => Math.max(x - 1, 0));

  const submit = async () => {
    // Age must be > 0 (defensive)
    const ageNum = Number(get("age"));
    if (!Number.isFinite(ageNum) || ageNum <= 0) {
      setError("Age must be greater than 0.");
      setTouched((t) => ({ ...t, age: true }));
      return;
    }

    // Bio limit (defensive)
    const bioCount = countCharsNoSpace(get("bio"));
    if (bioCount > BIO_CHAR_LIMIT) {
      setError(`Bio must be ≤ ${BIO_CHAR_LIMIT} characters.`);
      setTouched((t) => ({ ...t, bio: true }));
      return;
    }

    if (!allValid) {
      setError("Please complete all fields.");
      setTouched(Object.fromEntries(questions.map((qq) => [qq.id, true])));
      if (genderIsOther) setTouched((t) => ({ ...t, genderOther: true }));
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const resp = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      localStorage.removeItem(LS_KEY); // clear draft on success
      onComplete(data.id);
    } catch (e: any) {
      setError(e.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const clearDraft = () => {
    setAnswers({});
    setTouched({});
    setI(0);
    setError(null);
    localStorage.removeItem(LS_KEY);
  };

  const value = get(q.id);
  const baseInput =
    "mt-2 w-full border rounded p-2 outline-none focus:ring-2 focus:ring-blue-400";
  const invalidBio =
    q.id === "bio" &&
    (countCharsNoSpace(value) === 0 ||
      countCharsNoSpace(value) > BIO_CHAR_LIMIT);
  const invalidGender =
    q.id === "gender" &&
    (!isFilled("gender") || (genderIsOther && !genderOtherFilled));
  const invalidAge =
    q.id === "age" &&
    (!Number.isFinite(Number(value)) || Number(value) <= 0 || Number(value) > 120);

  const showFieldError =
    (touched[q.id] || !!error) &&
    (invalidBio || invalidGender || invalidAge || !isQuestionValid(q));

  const className = showFieldError
    ? `${baseInput} border-red-500`
    : `${baseInput} border-gray-300`;

  // Bio counter (non-space characters)
  const bioChars = q.id === "bio" ? countCharsNoSpace(value) : 0;
  const nearLimit = bioChars >= Math.floor(BIO_CHAR_LIMIT * 0.9);

  // Is current step allowed to proceed?
  const currentStepValid = isQuestionValid(q);

  return (
    // widen card on bio step
    <div
      className={`w-full ${
        q.id === "bio" ? "max-w-xl" : "max-w-md"
      } mx-auto p-6 bg-white rounded-2xl shadow space-y-6`}
    >
      {/* Header + progress */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Question <span className="font-medium">{i + 1}</span> of {total}
        </div>
        <button
          type="button"
          onClick={clearDraft}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Clear draft
        </button>
      </div>
      <div className="h-2 bg-gray-100 rounded">
        <div
          className="h-2 bg-blue-600 rounded transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Single question */}
      <div>
        <label className="block font-semibold">{q.title}</label>
        {q.description && (
          <p className="text-sm text-gray-600">{q.description}</p>
        )}

        {q.id === "gender" ? (
          <>
            <select
              className={className}
              value={get("gender")}
              onChange={(e) => handleChange(q, e.target.value)}
              onBlur={() => markTouched("gender")}
              required
            >
              <option value="">— select —</option>
              {q.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            {genderIsOther && (
              <input
                className={`${className} mt-2`}
                type="text"
                value={get("genderOther")}
                onChange={(e) => handleOtherGenderChange(e.target.value)}
                onBlur={() => markTouched("genderOther")}
                placeholder="Please specify your gender"
                required
              />
            )}
          </>
        ) : q.id === "bio" ? (
          <>
            <textarea
              className={`${className} min-h-40 resize-y leading-6`}
              rows={8}
              value={value}
              onChange={(e) => handleChange(q, e.target.value)}
              onBlur={() => markTouched("bio")}
              required
              placeholder="Write a short bio about yourself…"
            />
            <div
              className={`mt-1 text-xs text-right ${
                nearLimit || bioChars > BIO_CHAR_LIMIT
                  ? "text-orange-600"
                  : "text-gray-500"
              }`}
            >
              {bioChars}/{BIO_CHAR_LIMIT} characters
            </div>
            {bioChars > BIO_CHAR_LIMIT && (
              <p className="text-xs text-red-600 mt-1">
                Bio is over the {BIO_CHAR_LIMIT}-character limit.
              </p>
            )}
          </>
        ) : q.type === "select" ? (
          <select
            className={className}
            value={value}
            onChange={(e) => handleChange(q, e.target.value)}
            onBlur={() => markTouched(q.id)}
            required
          >
            <option value="">— select —</option>
            {q.options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <input
            className={className}
            type={q.type}
            value={value}
            onChange={(e) => handleChange(q, e.target.value)}
            onBlur={() => markTouched(q.id)}
            required
            {...(q.id === "age" ? { min: 1, max: 120 } : {})} // UI min aligns with rule
          />
        )}

        {showFieldError && (
          <p className="text-xs text-red-600 mt-1">
            {q.id === "age"
              ? "Age must be greater than 0."
              : q.id === "gender" && genderIsOther && !genderOtherFilled
              ? "Please specify your gender."
              : "This field is required."}
          </p>
        )}
      </div>

      {/* Hint / status */}
      {!allValid && (
        <p className="text-sm text-gray-600">
          {total - remaining} of {total} completed — finish all to submit.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={prev}
          disabled={i === 0}
          className="px-4 py-2 rounded border disabled:opacity-50"
        >
          Previous
        </button>

        {i < total - 1 ? (
          <button
            type="button"
            onClick={next}
            className="ml-auto px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            disabled={!currentStepValid}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !allValid}
            className="ml-auto px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
}




