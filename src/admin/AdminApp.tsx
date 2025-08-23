import { useEffect, useState } from 'react'

type TableName = 'projects' | 'work_experience' | 'tools' | 'skills' | 'gallery'

const DEV = import.meta.env.DEV
const API_BASE = DEV ? 'http://localhost:3005/api' : '/api'

function useAdminKey() {
  const [key, setKey] = useState<string>(() => localStorage.getItem('admin_key') || '')
  useEffect(() => {
    localStorage.setItem('admin_key', key)
  }, [key])
  return { key, setKey }
}

async function jsonFetch<T>(url: string, opts: RequestInit = {}, adminKey?: string): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(adminKey ? { 'x-admin-key': adminKey } : {}),
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

type FieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'date' | 'select' | 'image' | 'json-array'
type Field = { key: string; label: string; type: FieldType; options?: string[] }

const tableConfigs: Record<TableName, { titleField: string; fields: Field[] }> = {
  projects: {
    titleField: 'title',
    fields: [
      { key: 'identifier', label: 'Identifier', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'slug', label: 'Slug', type: 'text' },
      { key: 'short_description', label: 'Short Description', type: 'textarea' },
      { key: 'full_description', label: 'Full Description', type: 'textarea' },
      { key: 'project_type', label: 'Type', type: 'select', options: ['web-app','mobile-app','api','ai-project','tool','other'] },
      { key: 'status', label: 'Status', type: 'select', options: ['completed','in-progress','planning','archived'] },
      { key: 'github_url', label: 'GitHub', type: 'text' },
      { key: 'live_demo_url', label: 'Live Demo', type: 'text' },
      { key: 'featured_image_url', label: 'Featured Image', type: 'image' },
      { key: 'tech_stack', label: 'Tech Stack (comma separated)', type: 'json-array' },
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'end_date', label: 'End Date', type: 'date' },
      { key: 'is_featured', label: 'Featured', type: 'checkbox' },
      { key: 'display_order', label: 'Display Order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'checkbox' },
    ],
  },
  work_experience: {
    titleField: 'company_name',
    fields: [
      { key: 'identifier', label: 'Identifier', type: 'text' },
      { key: 'company_name', label: 'Company', type: 'text' },
      { key: 'position_title', label: 'Title', type: 'text' },
      { key: 'employment_type', label: 'Employment', type: 'select', options: ['full-time','part-time','contract','internship','freelance'] },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'start_date', label: 'Start', type: 'date' },
      { key: 'end_date', label: 'End', type: 'date' },
      { key: 'is_current', label: 'Current', type: 'checkbox' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'achievements', label: 'Achievements', type: 'textarea' },
      { key: 'company_logo_url', label: 'Logo', type: 'image' },
      { key: 'company_website', label: 'Website', type: 'text' },
      { key: 'display_order', label: 'Display Order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'checkbox' },
    ],
  },
  tools: {
    titleField: 'name',
    fields: [
      { key: 'identifier', label: 'Identifier', type: 'text' },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'category', label: 'Category', type: 'select', options: ['frontend','backend','database','cloud','design','ai-ml','devops','other'] },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'icon_url', label: 'Icon', type: 'image' },
      { key: 'website_url', label: 'Website', type: 'text' },
      { key: 'proficiency_level', label: 'Proficiency', type: 'select', options: ['beginner','intermediate','advanced','expert'] },
      { key: 'years_experience', label: 'Years', type: 'number' },
      { key: 'is_featured', label: 'Featured', type: 'checkbox' },
      { key: 'display_order', label: 'Display Order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'checkbox' },
    ],
  },
  skills: {
    titleField: 'name',
    fields: [
      { key: 'identifier', label: 'Identifier', type: 'text' },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'category', label: 'Category', type: 'select', options: ['technical','soft','language','certification'] },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'proficiency_percentage', label: 'Proficiency %', type: 'number' },
      { key: 'skill_type', label: 'Skill Type', type: 'select', options: ['programming','framework','soft-skill','language','certification','other'] },
      { key: 'is_featured', label: 'Featured', type: 'checkbox' },
      { key: 'display_order', label: 'Display Order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'checkbox' },
    ],
  },
  gallery: {
    titleField: 'title',
    fields: [
      { key: 'identifier', label: 'Identifier', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image_url', label: 'Image', type: 'image' },
      { key: 'alt_text', label: 'Alt', type: 'text' },
      { key: 'category', label: 'Category', type: 'select', options: ['screenshot','design','photo','certificate','other'] },
      { key: 'metadata', label: 'Metadata (JSON)', type: 'textarea' },
      { key: 'project_id', label: 'Project ID', type: 'number' },
      { key: 'is_featured', label: 'Featured', type: 'checkbox' },
      { key: 'display_order', label: 'Display Order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'checkbox' },
    ],
  },
}

const TABLES: TableName[] = Object.keys(tableConfigs) as TableName[]

export default function AdminApp() {
  const { key, setKey } = useAdminKey()
  const [table, setTable] = useState<TableName>('projects')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<any | null>(null)


  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await jsonFetch<any[]>(`${API_BASE}/admin/${table}`, { method: 'GET' }, key)
      setRows(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  const onSave = async (id?: number) => {
    if (!editing) return
    const cfg = tableConfigs[table]
    const method = id ? 'PUT' : 'POST'
    const url = id ? `${API_BASE}/admin/${table}/${id}` : `${API_BASE}/admin/${table}`
    const body: Record<string, any> = {}
    cfg.fields.forEach((f) => {
      if (editing[f.key] === '' || editing[f.key] === undefined || editing[f.key] === null) return
      let v: any = editing[f.key]
      if (f.type === 'number') v = Number(v)
      if (f.type === 'checkbox') v = Boolean(v)
      if (f.type === 'json-array') v = Array.isArray(v) ? v : String(v).split(',').map(s=>s.trim()).filter(Boolean)
      body[f.key] = v
    })
    await jsonFetch(url, { method, body: JSON.stringify(body) }, key)
    setEditing(null)
    await load()
  }

  const onDelete = async (id: number) => {
    if (!confirm(`Delete #${id}?`)) return
    await jsonFetch(`${API_BASE}/admin/${table}/${id}`, { method: 'DELETE' }, key)
    await load()
  }

  const pickFile = (): Promise<File | null> =>
    new Promise((resolve) => {
      const i = document.createElement('input')
      i.type = 'file'
      i.onchange = () => resolve(i.files ? i.files[0] : null)
      i.click()
    })

  const onUpload = async (targetField: string) => {
    const file = await pickFile()
    if (!file || !editing) return
    const keyPath = `${table}/${Date.now()}-${file.name}`
    const pres = await jsonFetch<{ url: string; publicUrl?: string }>(
      `${API_BASE}/admin/r2/presign`,
      { method: 'POST', body: JSON.stringify({ key: keyPath, contentType: file.type }) },
      key,
    )
    await fetch(pres.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
    const publicUrl = pres.publicUrl || keyPath
    setEditing({ ...editing, [targetField]: publicUrl })
  }

  const cfg = tableConfigs[table]

  return (
    <div className="admin-ui" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh' }}>
      <style>{`
        .admin-ui input, .admin-ui select, .admin-ui textarea { background:#181818; color:#eee; border:1px solid #333; border-radius:8px; padding:8px; }
        .admin-ui input::placeholder, .admin-ui textarea::placeholder { color:#888; }
        .admin-ui label { color:#ddd; font-size:14px; }
        .admin-ui table { color:#eee; }
        .admin-ui button { background:#222; color:#eee; border:1px solid #333; border-radius:8px; padding:8px 10px; }
        .admin-ui button:hover { background:#2a2a2a; }
      `}</style>
      <aside style={{ padding: 16, borderRight: '1px solid #222' }}>
        <h3 style={{ marginTop: 0 }}>Admin</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin Key (ADMIN_PASSWORD)"
          />
          {TABLES.map((t) => (
            <button key={t} onClick={() => setTable(t)} style={{ textAlign: 'left', padding: 8, background: t===table? '#222':'#181818', border: '1px solid #333', borderRadius: 8 }}>
              {t}
            </button>
          ))}
        </div>
      </aside>
      <main style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ margin: 0, flex: 1 }}>{table}</h2>
          <button onClick={load}>Refresh</button>
          <button onClick={() => setEditing({})}>New</button>
        </div>
        {loading && <p>Loading…</p>}
        {error && <p style={{ color: '#ff6' }}>{error}</p>}

        {editing && (
          <div style={{ marginTop: 12, padding: 12, border: '1px solid #333', borderRadius: 8 }}>
            <h4 style={{ margin: 0, marginBottom: 8 }}>{editing.id ? `Edit #${editing.id}` : 'Create new'}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
              {cfg.fields.map((f) => {
                const v = editing[f.key] ?? ''
                if (f.type === 'textarea')
                  return (
                    <label key={f.key} style={{ display: 'grid', gap: 4 }}>
                      {f.label}
                      <textarea value={v} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                    </label>
                  )
                if (f.type === 'checkbox')
                  return (
                    <label key={f.key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={Boolean(v)} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.checked })} />
                      {f.label}
                    </label>
                  )
                if (f.type === 'select')
                  return (
                    <label key={f.key} style={{ display: 'grid', gap: 4 }}>
                      {f.label}
                      <select value={v} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}>
                        <option value="">--</option>
                        {f.options!.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </label>
                  )
                if (f.type === 'image')
                  return (
                    <label key={f.key} style={{ display: 'grid', gap: 6 }}>
                      {f.label}
                      {v ? <img src={v} alt={f.key} style={{ maxWidth: '100%', borderRadius: 8 }} /> : <div style={{ height: 120, border: '1px dashed #333', borderRadius: 8 }} />}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input value={v} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} placeholder={f.key} />
                        <button type="button" onClick={() => onUpload(f.key)}>Upload</button>
                      </div>
                    </label>
                  )
                if (f.type === 'date')
                  return (
                    <label key={f.key} style={{ display: 'grid', gap: 4 }}>
                      {f.label}
                      <input type="date" value={v ? String(v).slice(0, 10) : ''} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                    </label>
                  )
                if (f.type === 'number')
                  return (
                    <label key={f.key} style={{ display: 'grid', gap: 4 }}>
                      {f.label}
                      <input type="number" value={v} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                    </label>
                  )
                if (f.type === 'json-array')
                  return (
                    <label key={f.key} style={{ display: 'grid', gap: 4 }}>
                      {f.label}
                      <input value={Array.isArray(v) ? v.join(', ') : v} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                    </label>
                  )
                return (
                  <label key={f.key} style={{ display: 'grid', gap: 4 }}>
                    {f.label}
                    <input value={v} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                  </label>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => onSave(editing.id)}>Save</button>
              <button onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #333', padding: 8 }}>#</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #333', padding: 8 }}>Title</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #333', padding: 8 }}>Identifier</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #333', padding: 8 }}>Updated</th>
                <th style={{ width: 160 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ borderBottom: '1px solid #222', padding: 8 }}>{r.id}</td>
                  <td style={{ borderBottom: '1px solid #222', padding: 8 }}>{r[cfg.titleField] || r.title || r.name}</td>
                  <td style={{ borderBottom: '1px solid #222', padding: 8 }}>{r.identifier}</td>
                  <td style={{ borderBottom: '1px solid #222', padding: 8 }}>{r.updated_at || ''}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button onClick={() => setEditing(r)} style={{ marginRight: 8 }}>Edit</button>
                    <button onClick={() => onDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}


