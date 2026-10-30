import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock, Plus, Shuffle, Trash2, X } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { useCatalog } from "../../lib/useCatalog";
import Button from "../../components/ui/Button";
import { ErrorState, Loading } from "../../components/ui/PageState";
import QuestionPicker from "../../components/admin/QuestionPicker";
import { Field, Notice, PageHeader, Select, StatusPill, inputCls } from "../../components/admin/ui";

const blankMeta = { title: "", exam: "", type: "mock", year: "", sequence: "", durationMinutes: "60", correct: "1", negative: "0.25" };
let keySeq = 0;
const newSection = (title = "", subject = "") => ({ key: ++keySeq, title, subject, questions: [], count: "25", picking: false });

// Turn the form's meta fields into the API shape
const metaBody = (m) => ({
  title: m.title.trim(),
  exam: m.exam,
  type: m.type,
  year: m.year ? Number(m.year) : null,
  ...(m.sequence !== "" && { sequence: Number(m.sequence) }),
  durationMinutes: Number(m.durationMinutes),
  marking: { correct: Number(m.correct), negative: Number(m.negative) },
});

export default function TestEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const location = useLocation();
  const catalog = useCatalog();

  const [mode, setMode] = useState("pick"); // new tests: "pick" questions or "auto" generate
  const [meta, setMeta] = useState(blankMeta);
  const [sections, setSections] = useState(() => [newSection("Section 1")]);
  const [info, setInfo] = useState(null); // saved test: isPublished, attempts, slug
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (isNew) return;
    api
      .get(`/admin/tests/${id}`)
      .then((r) => {
        const t = r.data.data;
        setMeta({
          title: t.title,
          exam: t.exam?._id || t.exam,
          type: t.type,
          year: t.year ? String(t.year) : "",
          sequence: String(t.sequence ?? ""),
          durationMinutes: String(t.durationMinutes),
          correct: String(t.marking.correct),
          negative: String(t.marking.negative),
        });
        setSections(t.sections.map((s) => ({ ...newSection(s.title, s.subject || ""), questions: s.questions })));
        setInfo({ isPublished: t.isPublished, attempts: t.attempts, slug: t.slug, totalQuestions: t.totalQuestions });
      })
      .catch((err) => setLoadError(errorMessage(err)));
  }, [id, isNew]);

  const usedIds = useMemo(() => new Set(sections.flatMap((s) => s.questions.map((q) => q._id))), [sections]);
  const total = usedIds.size;
  const locked = Boolean(info?.attempts);

  if (loadError) return <ErrorState message={loadError} backTo="/admin/tests" />;
  if (!catalog.ready || (!isNew && !info)) return <Loading />;

  const setM = (patch) => setMeta((m) => ({ ...m, ...patch }));
  const updateSection = (key, patch) => setSections((ss) => ss.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const addQuestion = (key, q) =>
    setSections((ss) => ss.map((s) => (s.key === key && !s.questions.some((x) => x._id === q._id) ? { ...s, questions: [...s.questions, q] } : s)));
  const removeQuestion = (key, qid) => setSections((ss) => ss.map((s) => (s.key === key ? { ...s, questions: s.questions.filter((q) => q._id !== qid) } : s)));
  const subjectName = (sid) => catalog.subjects.find((s) => s._id === sid)?.name.en || "";

  const fail = (err) => {
    const d = err?.response?.data?.details;
    setNotice({ tone: "error", text: d?.length ? `${d[0].field || "Form"}: ${d[0].message}` : errorMessage(err) });
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy("save");
    setNotice(null);
    try {
      if (isNew && mode === "auto") {
        const body = {
          ...metaBody(meta),
          sections: sections.map((s) => ({ title: s.title.trim(), subject: s.subject, count: Number(s.count) })),
        };
        const r = await api.post("/admin/tests/auto-generate", body);
        navigate(`/admin/tests/${r.data.data._id}`, { replace: true, state: { notice: { tone: r.data.warnings?.length ? "warn" : "success", text: r.data.message } } });
        return;
      }
      const body = {
        ...metaBody(meta),
        ...(!locked && {
          sections: sections.map((s) => ({ title: s.title.trim(), subject: s.subject || null, questions: s.questions.map((q) => q._id) })),
        }),
      };
      if (locked) delete body.marking;
      if (isNew) {
        const r = await api.post("/admin/tests", body);
        navigate(`/admin/tests/${r.data.data._id}`, { replace: true, state: { notice: { tone: "success", text: r.data.message } } });
      } else {
        const r = await api.patch(`/admin/tests/${id}`, body);
        setInfo((i) => ({ ...i, totalQuestions: r.data.data.totalQuestions }));
        setNotice({ tone: "success", text: r.data.message });
      }
    } catch (err) {
      fail(err);
    } finally {
      setBusy("");
    }
  };

  const togglePublish = async () => {
    setBusy("publish");
    try {
      const r = await api.post(`/admin/tests/${id}/publish`, { isPublished: !info.isPublished });
      setInfo((i) => ({ ...i, isPublished: r.data.data.isPublished }));
      setNotice({ tone: "success", text: r.data.message });
    } catch (err) {
      fail(err);
    } finally {
      setBusy("");
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this test? This can’t be undone.")) return;
    setBusy("delete");
    try {
      await api.delete(`/admin/tests/${id}`);
      navigate("/admin/tests", { replace: true });
    } catch (err) {
      fail(err);
      setBusy("");
    }
  };

  const auto = isNew && mode === "auto";

  return (
    <>
      <Link to="/admin/tests" className="flex min-h-11 items-center gap-1.5 self-start text-xs font-bold text-brand">
        <ArrowLeft className="size-4" aria-hidden="true" /> Tests
      </Link>
      <PageHeader title={isNew ? "New test" : meta.title || "Edit test"} subtitle={isNew ? "Saved as a draft. Publish when it’s ready." : null}>
        {!isNew && (
          <>
            <StatusPill status={info.isPublished ? "live" : "draft"} />
            {info.isPublished && (
              <Button to={`/test/${info.slug}`} variant="secondary" size="sm">
                View as student
              </Button>
            )}
            <Button size="sm" variant={info.isPublished ? "secondary" : "primary"} onClick={togglePublish} disabled={Boolean(busy)}>
              {info.isPublished ? "Unpublish" : "Publish"}
            </Button>
          </>
        )}
      </PageHeader>

      {isNew && (
        <div role="tablist" aria-label="How to add questions" className="flex gap-2">
          {[
            { k: "pick", label: "Pick questions" },
            { k: "auto", label: "Auto-generate", icon: Shuffle },
          ].map(({ k, label, icon: Icon }) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={mode === k}
              onClick={() => setMode(k)}
              className={`flex min-h-11 items-center gap-2 rounded-xl border px-4 text-xs font-bold ${mode === k ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"}`}
            >
              {Icon && <Icon className="size-4" aria-hidden="true" />}
              {label}
            </button>
          ))}
        </div>
      )}

      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}
      {locked && (
        <Notice tone="warn">
          <span className="flex items-center gap-2">
            <Lock className="size-4" aria-hidden="true" />
            {info.attempts} student{info.attempts === 1 ? " has" : "s have"} taken this test, so its questions and marking are locked. You can still edit the title and time.
          </span>
        </Notice>
      )}

      <form onSubmit={save} className="flex flex-col gap-5">
        <section className="grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Title" className="sm:col-span-2">
            <input required minLength={3} value={meta.title} onChange={(e) => setM({ title: e.target.value })} placeholder="OSSSC RI · 2022 Paper" className={inputCls} />
          </Field>
          <Field label="Exam">
            <Select required value={meta.exam} onChange={(v) => setM({ exam: v })} disabled={locked}>
              <option value="">Choose…</option>
              {catalog.exams.map((x) => (
                <option key={x._id} value={x._id}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select value={meta.type} onChange={(v) => setM({ type: v })}>
              <option value="mock">Mock test</option>
              <option value="pyq">Previous-year paper</option>
              <option value="daily_quiz">Daily quiz</option>
            </Select>
          </Field>
          <Field label="Year" hint="For PYQs">
            <input type="number" min="1990" max="2100" value={meta.year} onChange={(e) => setM({ year: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Order" hint="Lower shows first">
            <input type="number" min="0" value={meta.sequence} onChange={(e) => setM({ sequence: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Time (minutes)">
            <input required type="number" min="1" max="600" value={meta.durationMinutes} onChange={(e) => setM({ durationMinutes: e.target.value })} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="+ Correct">
              <input required type="number" step="0.25" min="0.25" value={meta.correct} onChange={(e) => setM({ correct: e.target.value })} disabled={locked} className={inputCls} />
            </Field>
            <Field label="− Wrong">
              <input required type="number" step="0.05" min="0" value={meta.negative} onChange={(e) => setM({ negative: e.target.value })} disabled={locked} className={inputCls} />
            </Field>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-ink">
              Sections {!auto && <span className="text-sm font-semibold text-muted">· {total} questions</span>}
            </h2>
            {!locked && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setSections((ss) => [...ss, newSection(`Section ${ss.length + 1}`)])}>
                <Plus className="size-4" aria-hidden="true" /> Add section
              </Button>
            )}
          </div>

          {sections.map((s, i) => (
            <div key={s.key} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-card">
              <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto] lg:grid-cols-[1fr_1fr_160px_auto]">
                <Field label={`Section ${i + 1} title`}>
                  <input required value={s.title} onChange={(e) => updateSection(s.key, { title: e.target.value })} disabled={locked} placeholder="General Knowledge" className={inputCls} />
                </Field>
                <Field label={auto ? "Subject" : "Subject (filters the picker)"}>
                  <Select
                    required={auto}
                    value={s.subject}
                    disabled={locked}
                    onChange={(v) => updateSection(s.key, { subject: v, title: s.title && !s.title.startsWith("Section ") ? s.title : subjectName(v) })}
                  >
                    <option value="">{auto ? "Choose…" : "Any subject"}</option>
                    {catalog.subjects.map((x) => (
                      <option key={x._id} value={x._id}>
                        {x.name.en}
                      </option>
                    ))}
                  </Select>
                </Field>
                {auto && (
                  <Field label="How many">
                    <input required type="number" min="1" max="200" value={s.count} onChange={(e) => updateSection(s.key, { count: e.target.value })} className={inputCls} />
                  </Field>
                )}
                {!locked && sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSections((ss) => ss.filter((x) => x.key !== s.key))}
                    aria-label={`Remove section ${i + 1}`}
                    className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              {!auto && (
                <>
                  {s.questions.length > 0 ? (
                    <ol className="flex flex-col divide-y divide-line rounded-xl border border-line">
                      {s.questions.map((q, n) => (
                        <li key={q._id} className="flex items-start gap-3 px-3 py-2 text-xs">
                          <span className="w-6 shrink-0 pt-1 font-bold text-muted">{n + 1}.</span>
                          <span className="flex-1 pt-1 text-ink">{q.text.en}</span>
                          <span className="shrink-0 pt-1 text-[11px] text-muted">Ans {q.correctOption}</span>
                          {!locked && (
                            <button type="button" onClick={() => removeQuestion(s.key, q._id)} aria-label="Remove question" className="-my-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:text-danger">
                              <X className="size-4" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="rounded-xl bg-canvas px-4 py-4 text-xs text-muted">No questions in this section yet.</p>
                  )}

                  {!locked &&
                    (s.picking ? (
                      meta.exam ? (
                        <QuestionPicker
                          exam={meta.exam}
                          subject={s.subject}
                          usedIds={usedIds}
                          onAdd={(q) => addQuestion(s.key, q)}
                          onClose={() => updateSection(s.key, { picking: false })}
                        />
                      ) : (
                        <p className="text-xs text-warn">Choose the exam first.</p>
                      )
                    ) : (
                      <Button type="button" variant="secondary" size="sm" className="self-start" onClick={() => updateSection(s.key, { picking: true })}>
                        <Plus className="size-4" aria-hidden="true" /> Add questions
                      </Button>
                    ))}
                </>
              )}
            </div>
          ))}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="text-xs text-muted">
            {auto ? "Random published questions are picked for each section. You can edit the draft after." : `${total} question${total === 1 ? "" : "s"} · ${meta.durationMinutes || 0} min`}
          </p>
          <div className="flex gap-2">
            {!isNew && !locked && (
              <Button type="button" variant="secondary" onClick={remove} disabled={Boolean(busy)} className="!text-danger">
                Delete
              </Button>
            )}
            <Button type="submit" disabled={Boolean(busy) || (!auto && !locked && total === 0)}>
              {busy === "save" ? "Saving…" : auto ? "Generate draft" : isNew ? "Create draft" : "Save changes"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
