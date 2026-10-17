import { useState } from "react";

const workerResultText = (result) => {
  if (!result || typeof result !== "object") return "پاسخ نامعتبر";
  const d1 = result.d1?.verified === true || result.d1?.idempotent === true;
  const github = result.github?.ok === true;
  if (result.ok === true && d1 && github) return "همگام‌سازی کامل تأیید شد";
  if (d1 && !github) return "D1 همگام شد؛ GitHub مسدود یا ناموفق است";
  return result.error || result.d1?.error || result.github?.error || "همگام‌سازی تأیید نشد";
};

export default function GraphSyncPanel() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function runSync() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/control-plane/graph-sync/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: true })
      });
      const payload = await response.json().catch(() => null);
      if (!payload || typeof payload !== "object") throw new Error("پاسخ سرویس قابل‌خواندن نیست");
      setResult({ ...payload, http_status: response.status });
      if (!response.ok && !payload.error) setError("درخواست همگام‌سازی ناموفق بود (HTTP " + response.status + ")");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ارتباط با درگاه همگام‌سازی برقرار نشد");
    } finally {
      setBusy(false);
    }
  }

  return <section className="graph-sync-panel" aria-live="polite">
    <div className="graph-sync-heading">
      <div>
        <strong>همگام‌سازی مقصدها</strong>
        <p>منبع: VPS Master Memory · ابتدا D1، سپس GitHub · بدون ارسال گراف محلی</p>
      </div>
      <button type="button" className="primary" disabled={busy} onClick={runSync}>
        {busy ? "در حال همگام‌سازی…" : "همگام‌سازی از Master Memory"}
      </button>
    </div>
    {error && <p role="alert" className="graph-sync-error">{error}</p>}
    {result && <div className="graph-sync-result">
      <strong>{workerResultText(result)}</strong>
      <div>منبع: {result.source ? "VPS Master Memory · نسخه " + result.source.version + " · گراف r" + result.source.graph_revision : "تأیید نشده"}</div>
      <div>D1: {result.d1?.verified === true || result.d1?.idempotent === true ? "تأییدشده" : result.d1?.error || "نامشخص"}</div>
      <div>GitHub: {result.github?.ok === true ? "تأییدشده · " + result.github.branch + " · " + result.github.commit_sha : result.github?.error || result.github?.status || "نامشخص"}</div>
      {result.source?.sha256 && <code>SHA-256: {result.source.sha256}</code>}
      {result.d1?.synced_at && <div>زمان D1: {result.d1.synced_at}</div>}
      {result.github?.updated_at && <div>زمان GitHub: {result.github.updated_at}</div>}
    </div>}
  </section>;
}
