import { useEffect, useState } from "react";

export default function Review({ responseId }: { responseId: number }) {
  const [data, setData] = useState<any>();
  const [err, setErr] = useState<string>();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/responses/${responseId}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setData(await r.json());
      } catch (e: any) {
        setErr(e.message || "Failed to load response.");
      }
    })();
  }, [responseId]);

  const restart = () => window.location.reload();

  if (err)
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow">
        <p className="text-sm text-red-600">{err}</p>
        <button onClick={restart} className="mt-3 text-blue-600">
          Try again
        </button>
      </div>
    );

  if (!data)
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow">
        <p className="text-gray-600">Loading…</p>
      </div>
    );

  const gender =
    String(data.gender || "").toLowerCase() === "other"
      ? `Other${data.genderOther ? ` — ${data.genderOther}` : ""}`
      : data.gender;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Thank you!</h1>
        <p className="text-gray-600">Your responses are below.</p>
      </div>

      <ul className="text-sm text-gray-900 space-y-1">
        <li>
          <span className="font-medium">Age:</span> {data.age}
        </li>
        <li>
          <span className="font-medium">Gender:</span> {gender}
        </li>
        <li>
          <span className="font-medium">Short Bio:</span>
          <div className="whitespace-pre-wrap mt-1">{data.bio}</div>
        </li>
      </ul>

      <button onClick={restart} className="text-blue-600 hover:text-blue-700">
        Submit another response
      </button>
    </div>
  );
}



