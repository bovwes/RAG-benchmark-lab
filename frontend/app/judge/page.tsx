"use client";

import { useEffect, useState } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/16/solid";
import { getJudgeConfig, saveJudgeConfig, type JudgeMetric } from "@/lib/api";
import Spinner from "@/components/Spinner";
import ErrorBanner from "@/components/ErrorBanner";
import TextField from "@/components/TextField";

const thCls = "px-5 py-4 text-left text-xs text-neutral-500 whitespace-nowrap";
const tdCls = "px-3 py-1.5 border-b border-neutral-100";

function blankMetric(): JudgeMetric {
  return {
    name: "",
    prompt:
      "Score ... (1-5).\nReply with ONLY a single integer.\n\nContext:\n{context}\n\nQuestion: {question}\nAnswer: {answer}\n\nScore:",
  };
}

export default function JudgePage() {
  const [metrics, setMetrics] = useState<JudgeMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getJudgeConfig()
      .then((cfg) => setMetrics(cfg.metrics))
      .catch(() => setError("Could not load judge config"))
      .finally(() => setLoading(false));
  }, []);

  function updateMetric(i: number, patch: Partial<JudgeMetric>) {
    setMetrics((ms) =>
      ms.map((m, idx) => (idx === i ? { ...m, ...patch } : m)),
    );
    setSaved(false);
  }

  function removeMetric(i: number) {
    setMetrics((ms) => ms.filter((_, idx) => idx !== i));
    setSaved(false);
  }

  function addMetric() {
    setMetrics((ms) => [...ms, blankMetric()]);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveJudgeConfig({ metrics });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex h-14 shrink-0 px-4 items-center justify-between border-b border-neutral-200">
        <p className="text-base font-bold">LLM Judge</p>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-black text-sm text-white px-4 py-2 hover:underline disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center gap-2 text-neutral-400 text-sm p-4">
            <Spinner />
            Loading…
          </div>
        )}

        {error && (
          <div className="p-4">
            <ErrorBanner>{error}</ErrorBanner>
          </div>
        )}

        {!loading && (
          <>
            {metrics.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-neutral-400">
                No metrics configured. Add one below.
              </div>
            ) : (
              <table className="text-sm border-collapse w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-white sticky top-0 z-10">
                    <th className={thCls}>Name</th>
                    <th className={`${thCls} w-full`}>Prompt</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, i) => (
                    <tr key={i} className="hover:bg-neutral-100 group">
                      <td className={tdCls}>
                        <input
                          type="text"
                          value={metric.name}
                          onChange={(e) =>
                            updateMetric(i, { name: e.target.value })
                          }
                          placeholder="Metric name"
                          className="bg-transparent transition-all focus:outline-none ring-1 ring-transparent hover:ring-black focus:ring-black hover:bg-neutral-100 focus:bg-neutral-100 p-2 min-w-40 w-full text-left"
                        />
                      </td>
                      <td className={`${tdCls} w-full`}>
                        <TextField
                          label={metric.prompt.substring(0, 100) || "Prompt"}
                          value={metric.prompt}
                          onChange={(v) => updateMetric(i, { prompt: v })}
                        />
                      </td>
                      <td className={`${tdCls} text-right`}>
                        <button
                          onClick={() => removeMetric(i)}
                          className="p-2 text-neutral-500 hover:text-black hover:cursor-pointer hover:bg-neutral-200/50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <XMarkIcon className="size-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="p-4">
              <button
                onClick={addMetric}
                className="text-sm font-medium flex gap-2 pb-1 hover:cursor-pointer hover:border-b"
              >
                <PlusIcon className="size-5" /> Add metric
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
