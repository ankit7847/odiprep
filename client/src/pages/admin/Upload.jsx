import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, FileSpreadsheet, Upload as UploadIcon } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import Button from "../../components/ui/Button";
import { Field, Notice, PageHeader, inputCls } from "../../components/admin/ui";

const steps = [
  "Download the template and fill one question per row.",
  "Use slugs for exam, subject and topic — e.g. osssc-ri, odisha-gk, odisha-history.",
  "Check the file. Fix any rows listed, then save. Questions are saved as drafts.",
  "Review them in the question list, then publish.",
];

function ErrorTable({ errors }) {
  if (!errors?.length) return null;
  return (
    <div className="max-h-80 overflow-auto rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-canvas">
          <tr className="text-left text-[11px] text-muted">
            <th className="w-20 px-3 py-2 font-semibold">ROW</th>
            <th className="px-3 py-2 font-semibold">WHAT TO FIX</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((e) => (
            <tr key={e.row} className="border-t border-line align-top">
              <td className="px-3 py-2 font-bold text-ink">{e.row}</td>
              <td className="px-3 py-2 text-danger">{e.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// After publishing an upload: turn it into a draft test in one step (sections = subjects, sheet order kept)
function MakeTestForm({ uploadBatch }) {
  const navigate = useNavigate();
  const [f, setF] = useState({ title: "", type: "pyq", year: "", minutes: "90", correct: "1", negative: "0.33" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.post("/admin/tests/from-batch", {
        uploadBatch,
        title: f.title.trim(),
        type: f.type,
        year: f.year ? Number(f.year) : null,
        durationMinutes: Number(f.minutes),
        marking: { correct: Number(f.correct), negative: Number(f.negative) },
      });
      navigate(`/admin/tests/${r.data.data._id}`, { state: { notice: { tone: "success", text: r.data.message } } });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={create} className="flex flex-col gap-4 rounded-xl bg-canvas p-4">
      <div>
        <h3 className="text-sm font-extrabold text-ink">Make a test from this upload</h3>
        <p className="text-xs text-muted">One section per subject, questions in the same order as your sheet. Saved as a draft.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Field label="Title" className="sm:col-span-2">
          <input required minLength={3} value={f.title} onChange={set("title")} placeholder="OSSSC RI · 2025 Paper" className={inputCls} />
        </Field>
        <Field label="Type">
          <select value={f.type} onChange={set("type")} className={inputCls}>
            <option value="pyq">Previous-year paper</option>
            <option value="mock">Mock test</option>
          </select>
        </Field>
        <Field label="Year">
          <input type="number" min="1990" max="2100" value={f.year} onChange={set("year")} className={inputCls} />
        </Field>
        <Field label="Minutes">
          <input required type="number" min="1" max="600" value={f.minutes} onChange={set("minutes")} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="+ Right">
            <input required type="number" step="0.25" min="0.25" value={f.correct} onChange={set("correct")} className={inputCls} />
          </Field>
          <Field label="− Wrong">
            <input required type="number" step="0.01" min="0" value={f.negative} onChange={set("negative")} className={inputCls} />
          </Field>
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={busy} className="self-start">
        {busy ? "Creating…" : "Create test draft"}
      </Button>
    </form>
  );
}

export default function Upload() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [check, setCheck] = useState(null); // dry-run result
  const [saved, setSaved] = useState(null); // real upload result
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState("");

  const reset = () => {
    setFile(null);
    setCheck(null);
    setSaved(null);
    setNotice(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const downloadTemplate = async () => {
    try {
      const res = await api.get("/admin/questions/template", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "odiprep-questions-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
    }
  };

  const send = async (dryRun) => {
    const fd = new FormData();
    fd.append("file", file);
    setBusy(dryRun ? "check" : "save");
    setNotice(null);
    try {
      const res = await api.post(`/admin/questions/upload${dryRun ? "?dryRun=true" : ""}`, fd);
      if (dryRun) setCheck(res.data.data);
      else setSaved(res.data.data);
    } catch (err) {
      // A sheet with zero valid rows comes back as 400 with the row errors
      const data = err?.response?.data?.data;
      if (data?.errors) setCheck(data);
      else setNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusy("");
    }
  };

  const publishBatch = async () => {
    setBusy("publish");
    try {
      const res = await api.post("/admin/questions/publish", { uploadBatch: saved.uploadBatch });
      setNotice({ tone: "success", text: res.data.message });
      setSaved((s) => ({ ...s, published: true }));
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusy("");
    }
  };

  const undoBatch = async () => {
    if (!window.confirm("Delete every draft question from this upload?")) return;
    setBusy("undo");
    try {
      const res = await api.delete(`/admin/questions/batch/${saved.uploadBatch}`);
      reset();
      setNotice({ tone: "success", text: res.data.message });
    } catch (err) {
      setNotice({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <PageHeader title="Excel upload" subtitle="Add many questions at once from an .xlsx or .csv file (max 2000 rows, 5 MB).">
        <Button variant="secondary" size="sm" onClick={downloadTemplate}>
          <Download className="size-4" aria-hidden="true" /> Download template
        </Button>
      </PageHeader>

      <ol className="grid gap-3 md:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-3 rounded-2xl border border-line bg-white p-4 text-xs text-muted shadow-card">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-extrabold text-brand">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      {!saved && (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-card md:p-6">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line px-5 py-10 text-center hover:border-brand/50">
            <FileSpreadsheet className="size-8 text-brand" aria-hidden="true" />
            <span className="text-sm font-bold text-ink">{file ? file.name : "Choose a file"}</span>
            <span className="text-xs text-muted">{file ? `${Math.ceil(file.size / 1024)} KB` : ".xlsx, .xls or .csv"}</span>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={(e) => {
                setFile(e.target.files[0] || null);
                setCheck(null);
              }}
            />
          </label>

          <div className="flex flex-wrap justify-end gap-2">
            {file && (
              <Button variant="secondary" onClick={reset}>
                Clear
              </Button>
            )}
            <Button variant="secondary" onClick={() => send(true)} disabled={!file || busy}>
              {busy === "check" ? "Checking…" : "Check file"}
            </Button>
            <Button onClick={() => send(false)} disabled={!file || busy || (check && check.valid === 0)}>
              <UploadIcon className="size-4" aria-hidden="true" />
              {busy === "save" ? "Saving…" : check ? `Save ${check.valid} as draft` : "Save as draft"}
            </Button>
          </div>

          {check && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-success-soft px-3 py-1 font-bold text-success">{check.valid} ready</span>
                <span className={`rounded-full px-3 py-1 font-bold ${check.invalid ? "bg-danger-soft text-danger" : "bg-canvas text-muted"}`}>
                  {check.invalid} need fixing
                </span>
              </div>
              {check.invalid > 0 && (
                <p className="text-xs text-muted">Rows with problems are skipped when you save. Fix them in the sheet and upload them again later.</p>
              )}
              <ErrorTable errors={check.errors} />
            </div>
          )}
        </section>
      )}

      {saved && (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-card md:p-6">
          <h2 className="text-lg font-extrabold text-ink">
            {saved.saved} question{saved.saved === 1 ? "" : "s"} saved{saved.published ? " and published" : " as draft"}
          </h2>
          <p className="text-xs text-muted">
            Upload batch <b className="text-ink">{saved.uploadBatch}</b>
            {saved.invalid > 0 && ` · ${saved.invalid} row(s) skipped`}
          </p>
          <ErrorTable errors={saved.errors} />
          <div className="flex flex-wrap gap-2">
            <Button to={`/admin/questions?batch=${saved.uploadBatch}`} variant="secondary">
              Review questions
            </Button>
            {!saved.published && (
              <>
                <Button onClick={publishBatch} disabled={Boolean(busy)}>
                  {busy === "publish" ? "Publishing…" : `Publish all ${saved.saved}`}
                </Button>
                <Button variant="secondary" onClick={undoBatch} disabled={Boolean(busy)} className="!text-danger">
                  {busy === "undo" ? "Deleting…" : "Undo this upload"}
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={reset}>
              Upload another file
            </Button>
          </div>
          {saved.published && <MakeTestForm uploadBatch={saved.uploadBatch} />}
        </section>
      )}

      <p className="text-xs text-muted">
        Prefer typing one at a time?{" "}
        <Link to="/admin/questions/new" className="font-bold text-brand hover:underline">
          Add a single question
        </Link>
      </p>
    </>
  );
}
