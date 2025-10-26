import React, { useMemo, useState } from 'react'
import { enhanceResume } from './ai'

function field(v) {
  return typeof v === 'string' ? v.trim() : ''
}

const defaultData = {
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  links: '', // comma separated
  summary: '',
  skills: '', // comma or newline separated
  experience: '', // multiline: Company | Role | Dates\n- bullet
  education: '', // multiline: School | Degree | Dates\n- bullet
  projects: '', // multiline: Project | Role | Dates\n- bullet
}

function parseList(raw) {
  if (!raw) return []
  return raw
    .split(/\n|,/)
    .map(s => s.trim())
    .filter(Boolean)
}

function parseSections(raw) {
  // Split by blank line into sections; each section first line is header "Org | Role | Dates", bullets start with -
  if (!raw) return []
  return raw
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
      const header = lines.shift() || ''
      const [org = '', role = '', dates = ''] = header.split('|').map(s => s?.trim() || '')
      const bullets = lines
        .map(l => l.replace(/^[-•]\s?/, '').trim())
        .filter(Boolean)
      return { org, role, dates, bullets }
    })
}

function makeAtsResume(data) {
  // Client-side "AI" stub: structure and keyword emphasis for ATS
  const name = field(data.name)
  const title = field(data.title)
  const email = field(data.email)
  const phone = field(data.phone)
  const location = field(data.location)
  const links = parseList(data.links)
  const summary = field(data.summary)
  const skills = parseList(data.skills)
  const exp = parseSections(data.experience)
  const edu = parseSections(data.education)
  const projs = parseSections(data.projects)

  return { name, title, email, phone, location, links, summary, skills, exp, edu, projs }
}

export default function App() {
  const [form, setForm] = useState(defaultData)
  const [generated, setGenerated] = useState(null)
  const [loading, setLoading] = useState(false)
  const [template, setTemplate] = useState('compact') // compact | two-column | minimalist | elegant

  const resume = useMemo(() => generated || makeAtsResume(form), [generated, form])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleGenerate() {
    setLoading(true)
    try {
      // Try real AI; fallback to local structuring
      const ai = await enhanceResume(form)
      if (ai) {
        const base = makeAtsResume(form)
        const merged = {
          ...base,
          summary: ai.summary ?? base.summary,
          skills: Array.isArray(ai.skills) ? ai.skills : base.skills,
          exp: Array.isArray(ai.experience) ? ai.experience : base.exp,
          edu: Array.isArray(ai.education) ? ai.education : base.edu,
          projs: Array.isArray(ai.projects) ? ai.projects : base.projs,
        }
        setGenerated(merged)
      } else {
        await new Promise(r => setTimeout(r, 400))
        setGenerated(makeAtsResume(form))
      }
    } catch (e) {
      setGenerated(makeAtsResume(form))
    }
    setLoading(false)
  }

  function handleReset() {
    setForm(defaultData)
    setGenerated(null)
  }

  function handlePrint() {
    window.print()
  }

  function handleExportPdf() {
    const el = document.getElementById('resume')
    if (!el || !window.html2pdf) return
    const opt = {
      margin:       0.4,
      filename:     `${(form.name || 'resume').toLowerCase().replace(/\s+/g,'-')}-${template}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    window.html2pdf().from(el).set(opt).save()
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 relative">
      {/* Geometric gradient accents */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -left-20 h-80 w-80 bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent blur-3xl rounded-[40%_60%_70%_30%/40%_30%_70%_60%] anim-float" />
        <div className="absolute -bottom-24 -right-28 h-96 w-96 bg-gradient-to-tr from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl rounded-[60%_40%_30%_70%/60%_70%_30%_40%] anim-float [animation-duration:12s]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-72 w-72 bg-gradient-to-b from-emerald-400/10 to-transparent blur-3xl rounded-full anim-float [animation-duration:18s]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-black/50 bg-black/60 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/ai1.svg" alt="logo" className="h-7 w-7" />
            <h1 className="text-lg font-semibold tracking-tight">AI Resume Builder</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="px-2 py-2 text-sm rounded-md border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <option value="compact">Compact</option>
              <option value="two-column">Two Column</option>
              <option value="minimalist">Minimalist</option>
              <option value="elegant">Elegant</option>
            </select>
            <button onClick={handleReset} className="px-3 py-2 text-sm rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-all duration-200 hover:-translate-y-0.5">Reset</button>
            <button onClick={handleGenerate} disabled={loading} className="px-3 py-2 text-sm rounded-md bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5 shadow-md shadow-emerald-900/30">
              {loading ? 'Generating…' : 'Generate ATS Resume'}
            </button>
            <button onClick={handleExportPdf} className="px-3 py-2 text-sm rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-all duration-200 hover:-translate-y-0.5">Export PDF</button>
            <button onClick={handlePrint} className="px-3 py-2 text-sm rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-all duration-200 hover:-translate-y-0.5">Print</button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 grid lg:grid-cols-2 gap-6 print:block">
        {/* Form */}
        <section className="space-y-6 print:hidden">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/30 anim-fade-in">
            <h2 className="font-semibold mb-4">Personal</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Text name="name" label="Full Name" value={form.name} onChange={onChange} />
              <Text name="title" label="Job Title" value={form.title} onChange={onChange} />
              <Text name="email" label="Email" value={form.email} onChange={onChange} />
              <Text name="phone" label="Phone" value={form.phone} onChange={onChange} />
              <Text name="location" label="Location" value={form.location} onChange={onChange} />
              <Text name="links" label="Links (comma or newline)" value={form.links} onChange={onChange} />
            </div>
          </div>

          <Card title="Professional Summary">
            <Textarea name="summary" rows={4} value={form.summary} onChange={onChange} placeholder="3-4 sentence impact-driven summary with key skills and domains" />
          </Card>

          <Card title="Skills (comma or newline separated)">
            <Textarea name="skills" rows={3} value={form.skills} onChange={onChange} placeholder="React, Node.js, TypeScript, Tailwind CSS, PostgreSQL" />
          </Card>

          <Card title="Experience">
            <Textarea name="experience" rows={8} value={form.experience} onChange={onChange} placeholder={`Company | Role | Dates\n- Led X to achieve Y using Z\n- Quantify impact with metrics\n\nNext Company | Next Role | Dates\n- Bullet...`} />
          </Card>

          <Card title="Projects">
            <Textarea name="projects" rows={6} value={form.projects} onChange={onChange} placeholder={`Project | Role | Dates\n- What, how, impact`} />
          </Card>

          <Card title="Education">
            <Textarea name="education" rows={5} value={form.education} onChange={onChange} placeholder={`University | Degree | Dates\n- Highlight GPA, awards, coursework`} />
          </Card>
        </section>

        {/* Preview */}
        <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg shadow-black/30 print:shadow-none print:border-0" id="resume">
          <ResumePreview data={resume} template={template} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 mt-8 bg-black/60 print:hidden">
        <div className="container mx-auto px-4 text-sm text-slate-300 flex items-center justify-between">
          <span>ATS-friendly AI Resume Builder</span>
          <span>made by <strong>vishal singh</strong></span>
        </div>
      </footer>

      {/* Print styles */}
      <style>{`@media print { .print\:hidden{display:none!important} .print\:block{display:block!important} header, footer, .no-print { display: none !important } main{ padding:0 } body{ background:#fff } #resume, #resume * { color:#000 !important } }`}</style>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/30 anim-fade-in">
      <h2 className="font-semibold mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Text({ label, name, value, onChange, placeholder }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-300">{label}</span>
      <input
        className="rounded-md border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </label>
  )
}

function Textarea({ name, value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      className="w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
    />
  )
}

function ResumePreview({ data, template = 'compact' }) {
  const Header = (
    <header className="mb-4">
      <h1 className="text-2xl font-bold leading-tight">{data.name || 'Your Name'}</h1>
      <div className="flex flex-wrap gap-2 items-center text-slate-600 text-sm">
        <span>{data.title || 'Target Title'}</span>
        <span className="mx-1">•</span>
        {data.location && <span>{data.location}</span>}
        {(data.email || data.phone) && <><span className="mx-1">•</span><span>{[data.email, data.phone].filter(Boolean).join(' | ')}</span></>}
        {data.links?.length ? (
          <>
            <span className="mx-1">•</span>
            <span className="truncate max-w-full">
              {data.links.join(' | ')}
            </span>
          </>
        ) : null}
      </div>
    </header>
  )

  const SkillsPills = data.skills?.length ? (
    <ul className="flex flex-wrap gap-2 text-sm">
      {data.skills.map((s, i) => (
        <li key={i} className="rounded-full border border-slate-300/80 px-2 py-1 bg-slate-50">{s}</li>
      ))}
    </ul>
  ) : null

  const CommonSections = (
    <>
      {data.summary && (
        <Section title="Summary">
          <p className="text-sm leading-6 text-slate-700">{data.summary}</p>
        </Section>
      )}

      {data.skills?.length ? (
        <Section title="Skills">{SkillsPills}</Section>
      ) : null}

      {data.exp?.length ? (
        <Section title="Experience">
          {data.exp.map((e, idx) => (
            <div key={idx} className="mb-4 last:mb-0">
              <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold">
                <span>{e.org}{e.role ? ` • ${e.role}` : ''}</span>
                <span className="text-slate-600 font-normal">{e.dates}</span>
              </div>
              {e.bullets?.length ? (
                <ul className="list-disc pl-5 mt-2 text-sm leading-6 text-slate-700">
                  {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              ) : null}
            </div>
          ))}
        </Section>
      ) : null}

      {data.projs?.length ? (
        <Section title="Projects">
          {data.projs.map((e, idx) => (
            <div key={idx} className="mb-4 last:mb-0">
              <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold">
                <span>{e.org}{e.role ? ` • ${e.role}` : ''}</span>
                <span className="text-slate-600 font-normal">{e.dates}</span>
              </div>
              {e.bullets?.length ? (
                <ul className="list-disc pl-5 mt-2 text-sm leading-6 text-slate-700">
                  {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              ) : null}
            </div>
          ))}
        </Section>
      ) : null}

      {data.edu?.length ? (
        <Section title="Education">
          {data.edu.map((e, idx) => (
            <div key={idx} className="mb-4 last:mb-0">
              <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold">
                <span>{e.org}{e.role ? ` • ${e.role}` : ''}</span>
                <span className="text-slate-600 font-normal">{e.dates}</span>
              </div>
              {e.bullets?.length ? (
                <ul className="list-disc pl-5 mt-2 text-sm leading-6 text-slate-700">
                  {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              ) : null}
            </div>
          ))}
        </Section>
      ) : null}
    </>
  )

  if (template === 'two-column') {
    return (
      <div className="text-slate-900 grid md:grid-cols-[240px_1fr] gap-6">
        <aside className="md:sticky md:top-4 h-max">
          {Header}
          {data.skills?.length ? (
            <div className="mt-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200 pb-1 mb-3">Skills</h3>
              {SkillsPills}
            </div>
          ) : null}
          {data.links?.length ? (
            <div className="mt-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200 pb-1 mb-3">Links</h3>
              <ul className="text-sm text-slate-700 space-y-1">
                {data.links.map((l, i) => <li key={i} className="truncate">{l}</li>)}
              </ul>
            </div>
          ) : null}
        </aside>
        <section>
          {data.summary && (
            <Section title="Summary">
              <p className="text-sm leading-6 text-slate-700">{data.summary}</p>
            </Section>
          )}
          {data.exp?.length ? (
            <Section title="Experience">
              {data.exp.map((e, idx) => (
                <div key={idx} className="mb-4 last:mb-0">
                  <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold">
                    <span>{e.org}{e.role ? ` • ${e.role}` : ''}</span>
                    <span className="text-slate-600 font-normal">{e.dates}</span>
                  </div>
                  {e.bullets?.length ? (
                    <ul className="list-disc pl-5 mt-2 text-sm leading-6 text-slate-700">
                      {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  ) : null}
                </div>
              ))}
            </Section>
          ) : null}
          {data.projs?.length ? (
            <Section title="Projects">
              {data.projs.map((e, idx) => (
                <div key={idx} className="mb-4 last:mb-0">
                  <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold">
                    <span>{e.org}{e.role ? ` • ${e.role}` : ''}</span>
                    <span className="text-slate-600 font-normal">{e.dates}</span>
                  </div>
                  {e.bullets?.length ? (
                    <ul className="list-disc pl-5 mt-2 text-sm leading-6 text-slate-700">
                      {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  ) : null}
                </div>
              ))}
            </Section>
          ) : null}
          {data.edu?.length ? (
            <Section title="Education">
              {data.edu.map((e, idx) => (
                <div key={idx} className="mb-4 last:mb-0">
                  <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold">
                    <span>{e.org}{e.role ? ` • ${e.role}` : ''}</span>
                    <span className="text-slate-600 font-normal">{e.dates}</span>
                  </div>
                  {e.bullets?.length ? (
                    <ul className="list-disc pl-5 mt-2 text-sm leading-6 text-slate-700">
                      {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  ) : null}
                </div>
              ))}
            </Section>
          ) : null}
        </section>
      </div>
    )
  }

  if (template === 'elegant') {
    return (
      <div className="text-slate-900">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{data.name || 'Your Name'}</h1>
          <div className="mt-1 text-slate-700">{data.title || 'Target Title'}</div>
          <div className="mt-1 text-slate-600 text-sm">
            {[data.location, data.email, data.phone, ...(data.links || [])]
              .filter(Boolean)
              .join(' • ')}
          </div>
        </header>
        {data.summary && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Summary</h3>
            <div className="mt-2 border-l-4 border-emerald-600/40 pl-4 text-sm leading-7 text-slate-800">
              {data.summary}
            </div>
          </div>
        )}
        {data.skills?.length ? (
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Skills</h3>
            <div className="mt-2 border-l-4 border-emerald-600/40 pl-4">
              <ul className="flex flex-wrap gap-2 text-sm">
                {data.skills.map((s, i) => (
                  <li key={i} className="px-2 py-1 rounded border border-emerald-600/30 bg-emerald-50 text-emerald-900">{s}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
        {data.exp?.length ? (
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Experience</h3>
            <div className="mt-2 space-y-4">
              {data.exp.map((e, idx) => (
                <div key={idx} className="border-l-4 border-emerald-600/40 pl-4">
                  <div className="flex flex-wrap justify-between text-sm font-medium">
                    <span>{e.org}{e.role ? ` • ${e.role}` : ''}</span>
                    <span className="text-slate-600 font-normal">{e.dates}</span>
                  </div>
                  {e.bullets?.length ? (
                    <ul className="list-disc pl-5 mt-2 text-sm leading-7 text-slate-800">
                      {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {data.projs?.length ? (
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Projects</h3>
            <div className="mt-2 space-y-4">
              {data.projs.map((e, idx) => (
                <div key={idx} className="border-l-4 border-emerald-600/40 pl-4">
                  <div className="flex flex-wrap justify-between text-sm font-medium">
                    <span>{e.org}{e.role ? ` • ${e.role}` : ''}</span>
                    <span className="text-slate-600 font-normal">{e.dates}</span>
                  </div>
                  {e.bullets?.length ? (
                    <ul className="list-disc pl-5 mt-2 text-sm leading-7 text-slate-800">
                      {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {data.edu?.length ? (
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Education</h3>
            <div className="mt-2 space-y-4">
              {data.edu.map((e, idx) => (
                <div key={idx} className="border-l-4 border-emerald-600/40 pl-4">
                  <div className="flex flex-wrap justify-between text-sm font-medium">
                    <span>{e.org}{e.role ? ` • ${e.role}` : ''}</span>
                    <span className="text-slate-600 font-normal">{e.dates}</span>
                  </div>
                  {e.bullets?.length ? (
                    <ul className="list-disc pl-5 mt-2 text-sm leading-7 text-slate-800">
                      {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  if (template === 'minimalist') {
    return (
      <div className="text-slate-900">
        <header className="mb-2">
          <h1 className="text-[26px] font-semibold tracking-tight">{data.name || 'Your Name'}</h1>
          <div className="text-slate-700 text-sm">{[data.title, data.location].filter(Boolean).join(' · ')}</div>
          <div className="text-slate-600 text-xs">{[data.email, data.phone, ...(data.links||[])].filter(Boolean).join(' · ')}</div>
        </header>
        {data.summary && (
          <div className="mt-3 text-sm leading-6 text-slate-800">{data.summary}</div>
        )}
        <div className="divide-y divide-slate-200 mt-4">
          {data.skills?.length ? (
            <div className="py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Skills</h3>
              <div className="mt-1 text-sm text-slate-800">{data.skills.join(' · ')}</div>
            </div>
          ) : null}
          {data.exp?.length ? (
            <div className="py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Experience</h3>
              <div className="mt-1 space-y-2">
                {data.exp.map((e, idx) => (
                  <div key={idx}>
                    <div className="flex flex-wrap justify-between text-sm">
                      <span className="font-medium">{e.org}{e.role ? ` • ${e.role}` : ''}</span>
                      <span className="text-slate-600">{e.dates}</span>
                    </div>
                    {e.bullets?.length ? (
                      <ul className="list-disc pl-5 mt-1 text-sm leading-6 text-slate-800">
                        {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {data.projs?.length ? (
            <div className="py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Projects</h3>
              <div className="mt-1 space-y-2">
                {data.projs.map((e, idx) => (
                  <div key={idx}>
                    <div className="flex flex-wrap justify-between text-sm">
                      <span className="font-medium">{e.org}{e.role ? ` • ${e.role}` : ''}</span>
                      <span className="text-slate-600">{e.dates}</span>
                    </div>
                    {e.bullets?.length ? (
                      <ul className="list-disc pl-5 mt-1 text-sm leading-6 text-slate-800">
                        {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {data.edu?.length ? (
            <div className="py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Education</h3>
              <div className="mt-1 space-y-2">
                {data.edu.map((e, idx) => (
                  <div key={idx}>
                    <div className="flex flex-wrap justify-between text-sm">
                      <span className="font-medium">{e.org}{e.role ? ` • ${e.role}` : ''}</span>
                      <span className="text-slate-600">{e.dates}</span>
                    </div>
                    {e.bullets?.length ? (
                      <ul className="list-disc pl-5 mt-1 text-sm leading-6 text-slate-800">
                        {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  // default compact
  return (
    <div className="text-slate-900">
      {Header}
      {CommonSections}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="mb-6">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200 pb-1 mb-3">{title}</h3>
      {children}
    </section>
  )
}
