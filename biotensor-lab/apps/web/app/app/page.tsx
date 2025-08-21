"use client";

import { useState } from "react";

export default function AppDashboard() {
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  async function runPredict() {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/predict`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ features: [0.1, 0.2, 0.3], modelVersion: "demo-1" })
      });
      const data = await res.json();
      setScore(data?.score ?? null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h2 className="text-3xl font-semibold">Dashboard</h2>
      <p className="mt-2 text-neutral-600 dark:text-neutral-300">
        Demo: call API → inference and show a prediction score.
      </p>
      <button onClick={runPredict} className="mt-6 rounded-xl px-5 py-3 bg-black text-white disabled:opacity-50" disabled={loading}>
        {loading ? "Predicting..." : "Run Prediction"}
      </button>
      {score !== null && (
        <div className="mt-6 rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Model Score</div>
          <div className="text-2xl font-medium">{score.toFixed(4)}</div>
        </div>
      )}
    </main>
  );
}