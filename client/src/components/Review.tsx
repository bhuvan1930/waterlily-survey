import { useEffect, useState } from 'react';

export default function Review({ responseId }: { responseId: number }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/responses/${responseId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ error: 'Failed to load' }));
  }, [responseId]);

  if (!data) return <p className="text-center">Loading…</p>;

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 rounded-xl shadow space-y-3">
      <h2 className="text-xl font-semibold">Your Responses</h2>
      <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(data, null, 2)}</pre>
      <a href="/" className="inline-block mt-2 text-blue-600 hover:underline">Submit another response</a>
    </div>
  );
}
