import { useState } from 'react';
import { questions } from '../data/questions';
import type { Answers, Question } from '../types';

export default function SurveyForm({ onComplete }: { onComplete: (id: number) => void }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (q: Question, val: string) =>
    setAnswers((a) => ({ ...a, [q.id]: val }));

  const isValid = questions.every((q) => (answers[q.id] ?? '').toString().trim() !== '');

  const handleSubmit = async () => {
    setError(null);
    if (!isValid) {
      setError('Please complete all fields.');
      return;
    }
    setSubmitting(true);
    try {
      const resp = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      onComplete(data.id);
    } catch (e: any) {
      setError(e.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold">Survey</h1>

      {questions.map((q) => (
        <div key={q.id}>
          <label className="block font-semibold">{q.title}</label>
          {q.description && <p className="text-sm text-gray-600">{q.description}</p>}

          {q.type === 'select' ? (
            <select
              className="mt-1 w-full border rounded p-2"
              value={answers[q.id] || ''}
              onChange={(e) => handleChange(q, e.target.value)}
            >
              <option value="">— select —</option>
              {q.options?.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              className="mt-1 w-full border rounded p-2"
              type={q.type}
              value={answers[q.id] || ''}
              onChange={(e) => handleChange(q, e.target.value)}
            />
          )}
        </div>
      ))}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2 rounded"
      >
        {submitting ? 'Submitting…' : 'Submit'}
      </button>
    </div>
  );
}
