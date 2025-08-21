"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Chunk = {
  id: string;
  patientId: string;
  channel: string;
  tStart: string;
  tEnd: string;
  fs: number;
  values: number[];
};

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function StreamPage() {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(false);
  const patientId = "demo-patient";
  const channel = "ECG:leadI";

  async function fetchRecent() {
    const res = await fetch(`${API}/signals/recent?patientId=${patientId}&channel=${encodeURIComponent(channel)}&sinceMs=120000`);
    const data = await res.json();
    setChunks(data);
  }

  async function startDemoIngest() {
    setLoading(true);
    try {
      for (let i = 0; i < 10; i++) {
        const fs = 200;
        const len = 1000;
        const now = new Date(Date.now() + i * 1000);
        const tStart = now.toISOString();
        const values: number[] = [];
        for (let n = 0; n < len; n++) {
          const t = n / fs;
          const base = 0.05 * Math.sin(2 * Math.PI * 1.2 * t) + 0.02 * Math.sin(2 * Math.PI * 3 * t);
          const spike = (n % 200 === 5) ? 0.9 : 0;
          values.push(base + spike + (Math.random() - 0.5) * 0.01);
        }
        await fetch(`${API}/signals/ingest`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ patientId, channel, fs, tStart, values })
        });
      }
      await fetchRecent();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecent();
    const id = setInterval(fetchRecent, 3000);
    return () => clearInterval(id);
  }, []);

  const last = chunks[chunks.length - 1];
  const data = last ? last.values.slice(0, 800).map((v, i) => ({ x: i, y: v })) : [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <h2 className="text-3xl font-semibold">Live Stream (Demo)</h2>
      <p className="text-neutral-600 dark:text-neutral-300">
        Click "Start Demo Ingest" to push synthetic ECG chunks into TimescaleDB.
      </p>
      <div className="flex gap-3">
        <button onClick={startDemoIngest} className="rounded-xl px-5 py-3 bg-black text-white disabled:opacity-50" disabled={loading}>
          {loading ? "Streaming..." : "Start Demo Ingest"}
        </button>
        <button onClick={async () => {
          const res = await fetch(`${API}/signals/extract-and-predict`, { 
            method: "POST", 
            headers: { "content-type": "application/json" }, 
            body: JSON.stringify({ patientId, channel }) 
          });
          const out = await res.json();
          alert("Prediction: " + JSON.stringify(out));
        }} className="rounded-xl px-5 py-3 border">
          Extract & Predict
        </button>
      </div>
      <div className="h-80 w-full border rounded-xl p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="x" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="y" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}