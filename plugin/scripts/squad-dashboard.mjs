#!/usr/bin/env node
// Generates .squad/dashboard/index.html from the project's own files and, when available, GitHub.
// Read-only: it never changes tickets, status or GitHub. No dependencies beyond Node 20.
//
// Sources
//   squad.config.json                      project, gates, bmad.tickets_file
//   _bmad-output/**/tickets/tickets.toml   tickets (id, title, after, verify, hitl, model)
//   _bmad-output/**/{brief,prd,architecture,ux}-*.md   planning documents
//   .squad/status.json                     orchestrator state
//   .squad/log.jsonl                       one JSON event per line (see EVENTS below)
//   gh (optional)                          issues, pull requests, checks
//
// EVENTS written by the orchestrator, dev and verifier (all fields optional except ts, ticket, event):
//   {"ts":"2026-10-19T14:02:11Z","ticket":"E2-S2","event":"dev.start","attempt":1,"model":"opus"}
//   {"ts":"…","ticket":"E2-S2","event":"dev.end","attempt":1,"result":"pr","pr":14,"tokens":84000}
//   {"ts":"…","ticket":"E2-S2","event":"verify.start","attempt":1}
//   {"ts":"…","ticket":"E2-S2","event":"verify.end","attempt":1,"verdict":"pass","findings":0,"tokens":41000}
//   {"ts":"…","ticket":"E2-S2","event":"awaiting-human","pr":14}
//   {"ts":"…","ticket":"E2-S2","event":"merged","pr":14}
//   {"ts":"…","ticket":"E1-S4","event":"blocked","reason":"dependency-new","detail":"react-native-logs"}
//   {"ts":"…","ticket":"E1-S4","event":"guard","hook":"dep-guard"}

import {existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs'
import {dirname, join, relative} from 'node:path'
import {execFileSync} from 'node:child_process'

const root = process.argv[2] ? process.argv[2] : process.cwd()
const outDir = join(root, '.squad', 'dashboard')
const now = new Date()

const readJson = (p, fallback) => {
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}
const readText = p => (existsSync(p) ? readFileSync(p, 'utf8') : '')

const walk = (dir, matcher, depth = 6, acc = []) => {
  if (depth < 0 || !existsSync(dir)) return acc
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.git')) continue
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) walk(p, matcher, depth - 1, acc)
    else if (matcher(p)) acc.push(p)
  }
  return acc
}

// ---------- TOML subset parser (tables, arrays of tables, strings, numbers, booleans, arrays, multiline strings)
const parseToml = text => {
  const result = {}
  let current = result
  const lines = text.split(/\r?\n/)
  const setPath = (obj, path, isArray) => {
    let node = obj
    path.forEach((key, i) => {
      const last = i === path.length - 1
      if (last && isArray) {
        if (!Array.isArray(node[key])) node[key] = []
        const entry = {}
        node[key].push(entry)
        node = entry
      } else {
        if (Array.isArray(node[key])) node = node[key][node[key].length - 1]
        else {
          if (typeof node[key] !== 'object' || node[key] === null) node[key] = {}
          node = node[key]
        }
      }
    })
    return node
  }
  const parseValue = raw => {
    const v = raw.trim()
    if (v === 'true') return true
    if (v === 'false') return false
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
    if (v.startsWith('[')) {
      const inner = v.slice(1, v.lastIndexOf(']'))
      const items = []
      let buf = ''
      let quote = null
      for (const ch of inner) {
        if (quote) {
          buf += ch
          if (ch === quote) quote = null
        } else if (ch === '"' || ch === "'") {
          quote = ch
          buf += ch
        } else if (ch === ',') {
          if (buf.trim()) items.push(parseValue(buf))
          buf = ''
        } else buf += ch
      }
      if (buf.trim()) items.push(parseValue(buf))
      return items
    }
    if (v.startsWith('"') || v.startsWith("'")) return v.slice(1, -1).replace(/\\"/g, '"')
    return v
  }
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    const stripped = line.replace(/^\s*#.*$/, '').trim()
    if (!stripped) continue
    const arr = stripped.match(/^\[\[(.+)\]\]$/)
    const tbl = stripped.match(/^\[(.+)\]$/)
    if (arr) {
      current = setPath(result, arr[1].split('.').map(s => s.trim()), true)
      continue
    }
    if (tbl) {
      current = setPath(result, tbl[1].split('.').map(s => s.trim()), false)
      continue
    }
    const kv = stripped.match(/^([A-Za-z0-9_.-]+|"[^"]+")\s*=\s*(.*)$/)
    if (!kv) continue
    const key = kv[1].replace(/^"|"$/g, '')
    let raw = kv[2]
    if (raw.startsWith('"""') || raw.startsWith("'''")) {
      const q = raw.slice(0, 3)
      let body = raw.slice(3)
      while (!body.includes(q) && i + 1 < lines.length) body += '\n' + lines[++i]
      current[key] = body.slice(0, body.indexOf(q)).replace(/^\n/, '')
      continue
    }
    if (raw.startsWith('[') && !raw.includes(']')) {
      while (!raw.includes(']') && i + 1 < lines.length) raw += lines[++i]
    }
    current[key] = parseValue(raw.replace(/\s+#.*$/, ''))
  }
  return result
}

// ---------- load sources
const config = readJson(join(root, 'squad.config.json'), {})
const project = config.project || {}
const bmadOut = join(root, '_bmad-output')

const ticketFiles = config.bmad?.tickets_file && existsSync(join(root, config.bmad.tickets_file))
  ? [join(root, config.bmad.tickets_file)]
  : walk(bmadOut, p => p.endsWith('tickets.toml'))

const findTicketArrays = (node, epic, acc) => {
  if (Array.isArray(node)) {
    if (node.length && typeof node[0] === 'object' && node[0] && ('id' in node[0] || 'title' in node[0])) {
      node.forEach(t => acc.push({...t, epic}))
    } else node.forEach(n => findTicketArrays(n, epic, acc))
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) findTicketArrays(v, node.epic || node.id || epic, acc)
  }
  return acc
}

const tickets = []
for (const f of ticketFiles) {
  const parsed = parseToml(readText(f))
  const epicGuess = relative(bmadOut, dirname(dirname(f))).split('/').pop() || ''
  findTicketArrays(parsed, parsed.epic || parsed.id || epicGuess, []).forEach(t => {
    const text = [t.description, t.summary, t.body, t.notes].filter(Boolean).join('\n')
    const verifyMatch = text.match(/Verify:\s*(.+)/i)
    tickets.push({
      id: String(t.id || t.key || ''),
      title: String(t.title || t.name || (t.description || '').split('\n')[0] || ''),
      epic: String(t.epic || epicGuess),
      after: Array.isArray(t.after) ? t.after.map(String) : t.after ? [String(t.after)] : [],
      verify: t.verify || (verifyMatch ? verifyMatch[1].trim() : ''),
      hitl: Boolean(t.hitl),
      unknown: Boolean(t.unknown),
      model: t.model || '',
      status: t.status || '',
      file: relative(root, f)
    })
  })
}

const docs = walk(bmadOut, p => /\/(brief|prd|architecture|ux|epic)-[^/]*\.md$/.test(p)).map(p => {
  const text = readText(p)
  const statusMatch = text.match(/^\s*(?:\*\*)?status(?:\*\*)?:\s*(.+)$/im)
  return {
    path: relative(root, p),
    kind: p.match(/\/(brief|prd|architecture|ux|epic)-/)[1],
    status: statusMatch ? statusMatch[1].trim() : 'present',
    assumptions: (text.match(/\[ASSUMPTION\][^\n]*/g) || []).map(s => s.replace('[ASSUMPTION]', '').trim())
  }
})

const status = readJson(join(root, '.squad', 'status.json'), {})
const events = readText(join(root, '.squad', 'log.jsonl'))
  .split('\n')
  .filter(Boolean)
  .map(l => {
    try {
      return JSON.parse(l)
    } catch {
      return null
    }
  })
  .filter(Boolean)
  .sort((a, b) => String(a.ts).localeCompare(String(b.ts)))

const gh = args => {
  try {
    return JSON.parse(execFileSync('gh', args, {cwd: root, encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'ignore']}))
  } catch {
    return null
  }
}
const ghRepo = gh(['repo', 'view', '--json', 'nameWithOwner,url'])
const ghPrs = ghRepo ? gh(['pr', 'list', '--state', 'all', '--limit', '100', '--json', 'number,title,state,url,labels,headRefName,statusCheckRollup,mergedAt,createdAt']) || [] : []
const ghIssues = ghRepo ? gh(['issue', 'list', '--state', 'all', '--limit', '200', '--json', 'number,title,state,url,labels']) || [] : []

// ---------- derive per-ticket state
const minutes = (a, b) => (a && b ? Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000)) : 0)
const ticketIdFrom = s => {
  const m = String(s || '').match(/\b[A-Z][A-Z0-9]*-S?\d+\b/)
  return m ? m[0] : ''
}
const byTicket = {}
for (const e of events) {
  const t = (byTicket[e.ticket] ||= {events: [], attempts: 0, devMin: 0, verifyMin: 0, tokens: 0, guards: 0, open: {}})
  t.events.push(e)
  if (e.event === 'dev.start') {
    t.attempts = Math.max(t.attempts, e.attempt || 1)
    t.open.dev = e.ts
    t.model = e.model || t.model
  }
  if (e.event === 'dev.end') {
    t.devMin += minutes(t.open.dev, e.ts)
    t.open.dev = null
    if (e.pr) t.pr = e.pr
  }
  if (e.event === 'verify.start') t.open.verify = e.ts
  if (e.event === 'verify.end') {
    t.verifyMin += minutes(t.open.verify, e.ts)
    t.open.verify = null
    t.lastVerdict = e.verdict
    t.findings = e.findings
  }
  if (e.event === 'guard') t.guards++
  if (e.tokens) t.tokens += Number(e.tokens)
  if (e.pr) t.pr = e.pr
  if (e.event === 'blocked') t.blockedReason = [e.reason, e.detail].filter(Boolean).join(': ')
  t.last = e
}
const doneIds = new Set(tickets.filter(t => /done|merged/i.test(t.status)).map(t => t.id))
for (const [id, t] of Object.entries(byTicket)) if (t.last?.event === 'merged') doneIds.add(id)
for (const pr of ghPrs) if (pr.mergedAt) doneIds.add(ticketIdFrom(pr.headRefName) || ticketIdFrom(pr.title))

const deriveState = t => {
  const log = byTicket[t.id]
  if (doneIds.has(t.id)) return 'done'
  if (status.current_ticket === t.id && status.state && !/done|blocked/.test(status.state)) return 'in-progress'
  if (log?.last) {
    const ev = log.last.event
    if (ev === 'blocked') return 'blocked'
    if (ev === 'awaiting-human') return 'awaiting-human'
    if (ev === 'merged') return 'done'
    if (['dev.start', 'dev.end', 'verify.start'].includes(ev)) return 'in-progress'
    if (ev === 'verify.end') return log.last.verdict === 'pass' ? (t.hitl ? 'awaiting-human' : 'merging') : 'in-progress'
  }
  const issue = ghIssues.find(i => i.title.includes(t.id))
  if (issue) {
    const labels = issue.labels.map(l => l.name)
    if (labels.includes('blocked')) return 'blocked'
    if (labels.includes('needs-human')) return 'awaiting-human'
    if (issue.state === 'CLOSED') return 'done'
  }
  if (/blocked/i.test(t.status)) return 'blocked'
  const depsDone = t.after.every(d => doneIds.has(d))
  return depsDone ? 'ready' : 'waiting'
}
const rows = tickets.map(t => ({...t, state: deriveState(t), log: byTicket[t.id] || null}))
const epicTitle = e => {
  const dir = dirname(dirname(join(root, rows.find(r => r.epic === e)?.file || '')))
  const md = existsSync(dir) ? readdirSync(dir).find(n => /^epic-.*\.md$/.test(n)) : null
  const h1 = md ? readText(join(dir, md)).match(/^#\s+(.+)$/m) : null
  return h1 ? h1[1].trim() : dir.split('/').pop()
}
const epics = [...new Set(rows.map(r => r.epic))].sort().map(e => ({id: e, title: epicTitle(e), stories: rows.filter(r => r.epic === e)}))

const count = s => rows.filter(r => r.state === s).length
const prOf = r => ghPrs.find(p => (r.log?.pr && p.number === r.log.pr) || ticketIdFrom(p.headRefName) === r.id)
const prUrl = r => prOf(r)?.url || (ghRepo && r.log?.pr ? `${ghRepo.url}/pull/${r.log.pr}` : '')
const issueUrl = r => ghIssues.find(i => i.title.includes(r.id))?.url || ''
const verified = rows.filter(r => r.log?.lastVerdict)
const passRate = verified.length ? `${verified.filter(r => r.log.lastVerdict === 'pass').length} / ${verified.length}` : '—'
const doneRows = rows.filter(r => r.state === 'done' && r.log)
const avgAgent = doneRows.length ? Math.round(doneRows.reduce((s, r) => s + r.log.devMin + r.log.verifyMin, 0) / doneRows.length) : 0
const current = rows.find(r => r.id === status.current_ticket) || rows.find(r => r.state === 'in-progress')
const elapsedCurrent = current?.log?.open?.dev || current?.log?.open?.verify ? minutes(current.log.open.dev || current.log.open.verify, now.toISOString()) : minutes(status.updated_at, now.toISOString())
const blockers = [
  ...docs.filter(d => d.kind === 'prd').flatMap(d => d.assumptions.map(a => ({kind: 'PRD assumption', text: a, path: d.path}))),
  ...rows.filter(r => !r.verify).map(r => ({kind: `Ticket ${r.id} has no Verify step`, text: 'The verifier cannot judge it. Add one in the ticket file.', path: r.file}))
]
const guardsFired = events.filter(e => e.event === 'guard').reduce((m, e) => ((m[e.hook] = (m[e.hook] || 0) + 1), m), {})
const releasePr = ghPrs.find(p => p.state === 'OPEN' && p.labels.some(l => /autorelease/.test(l.name)))

// ---------- render
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]))
const stateMeta = {
  ready: ['Ready', '#6B6963', '#F3F2EE'],
  waiting: ['Waiting deps', '#9A978F', '#F3F2EE'],
  'in-progress': ['In progress', '#0F6E6E', '#E6F4F4'],
  merging: ['Merging', '#0F6E6E', '#E6F4F4'],
  'awaiting-human': ['Awaiting you', '#8A5A00', '#FFF4DD'],
  blocked: ['Blocked', '#B3261E', '#FDECEC'],
  done: ['Done', '#2E7D4F', '#EAF5EE']
}
const badge = s => {
  const [label, color, bg] = stateMeta[s] || [s, '#6B6963', '#F3F2EE']
  return `<span class="badge" style="color:${color};background:${bg}">${esc(label)}</span>`
}
const mono = s => `<span class="mono">${esc(s)}</span>`
const link = (href, text) => (href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>` : `<span class="muted">${esc(text)}</span>`)
const fmtTime = iso => (iso ? new Date(iso).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'}) : '—')
const agentTime = r => (r.log ? `${r.log.devMin + r.log.verifyMin} min <span class="muted">(dev ${r.log.devMin} · verify ${r.log.verifyMin})</span>` : '—')

const planningPhase = () => {
  const has = k => docs.some(d => d.kind === k)
  const steps = [
    ['Brief', has('brief')],
    ['PRD', has('prd'), docs.find(d => d.kind === 'prd')?.assumptions.length ? `${docs.find(d => d.kind === 'prd').assumptions.length} assumptions` : ''],
    ['UX', has('ux'), has('ux') ? '' : 'skipped'],
    ['Architecture', has('architecture')],
    ['Tickets', tickets.length > 0, tickets.length ? `${tickets.length} stories` : 'not sliced yet'],
    ['Published', ghIssues.length > 0, ghIssues.length ? `${ghIssues.length} issues` : '']
  ]
  return steps
    .map(([name, ok, note]) => `<div class="step ${ok ? 'ok' : ''}"><span class="dot"></span><span class="name">${name}</span>${note ? `<span class="muted">${esc(note)}</span>` : ''}</div>`)
    .join('')
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Squad · ${esc(project.name || 'project')}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{--ink:#1B1B1A;--bg:#F3F2EE;--line:#DAD8D1;--soft:#ECEAE4;--muted:#6B6963;--faint:#9A978F;--teal:#0F6E6E;--amber:#8A5A00;--red:#B3261E;--green:#2E7D4F}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);font-family:'IBM Plex Sans',system-ui,sans-serif;color:var(--ink);font-size:14px}
a{color:var(--teal)}
header{display:flex;align-items:center;gap:20px;padding:14px 32px;background:#1B1B1A;color:#F3F2EE;flex-wrap:wrap}
header .brand{font-weight:700;letter-spacing:.02em;display:flex;align-items:center;gap:10px}
header nav{display:flex;gap:4px}
header nav button{padding:6px 12px;border-radius:6px;border:0;background:transparent;color:#D9D7D1;font:inherit;cursor:pointer}
header nav button[aria-selected=true]{background:var(--teal);color:#fff;font-weight:600}
header .meta{margin-left:auto;display:flex;gap:16px;align-items:center;font-size:13px;color:#B5B2AA;flex-wrap:wrap}
header .refresh{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border:1px solid #4A4946;border-radius:6px;color:#F3F2EE;background:transparent;font:inherit;font-weight:600;cursor:pointer}
.mono{font-family:'IBM Plex Mono',monospace}
.muted{color:var(--muted)}
.faint{color:var(--faint)}
.badge{font-size:12px;padding:2px 8px;border-radius:10px;font-weight:600;white-space:nowrap}
.view{display:none}.view.active{display:block}
.wrap{padding:20px 32px 32px}
.steps{display:flex;flex-wrap:wrap}
.step{display:flex;align-items:center;gap:8px;padding:8px 14px 8px 10px;background:#fff;border:1px solid var(--line);margin-left:-1px}
.step:first-child{border-radius:8px 0 0 8px;margin-left:0}.step:last-child{border-radius:0 8px 8px 0}
.step .dot{width:18px;height:18px;border-radius:50%;border:1.5px solid var(--line);display:inline-block}
.step.ok .dot{background:var(--green);border-color:var(--green)}
.step .name{font-weight:600}.step:not(.ok) .name{color:var(--faint)}
.cols{display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start;margin-top:20px}
.side{flex:1 1 260px;max-width:320px;display:flex;flex-direction:column;gap:16px}
.main{flex:999 1 560px;min-width:0;display:flex;flex-direction:column;gap:16px}
.card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:16px}
.card.warn{border-color:#E0A33A}.card.danger{border-color:var(--red)}
.card h2{margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.card h2.plain{text-transform:none;letter-spacing:0;font-size:15px;color:var(--ink)}
.epic{background:#fff;border:1px solid var(--line);border-radius:10px;overflow:hidden}
.epic .head{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--soft);flex-wrap:wrap}
.epic .head h3{margin:0;font-size:16px}
.epic .head .muted{margin-left:auto;font-size:13px}
.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;min-width:720px}
th{text-align:left;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.06em;font-weight:600;padding:10px 12px}
td{padding:10px 12px;border-top:1px solid var(--soft);vertical-align:top}
td:first-child,th:first-child{padding-left:18px}td:last-child,th:last-child{padding-right:18px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.tile{background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.tile .n{font-size:26px;font-weight:700}
.tile small{font-size:12px;color:var(--muted)}
.bar{height:6px;border-radius:3px;background:var(--soft);margin-top:6px}.bar i{display:block;height:6px;border-radius:3px;background:var(--teal)}
.pipeline{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}
.pipeline>div{padding:12px;border-right:1px solid var(--soft)}.pipeline>div:last-child{border-right:0}
.pipeline .col{font-size:12px;font-weight:600;margin-bottom:8px}
.pipeline .item{padding:8px;border-radius:6px;background:var(--bg);font-size:13px;margin-bottom:6px}
.steps5{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.steps5 li{padding:10px 12px;border-radius:8px;background:var(--bg);font-size:12px}
.steps5 li.ok{background:#EAF5EE}.steps5 li.now{background:#E6F4F4;outline:2px solid var(--teal)}
.queue{display:flex;flex-direction:column;gap:10px}
.queue>div{padding:12px;border-radius:8px;display:flex;flex-direction:column;gap:6px}
.queue .amber{background:#FFF8EC}.queue .red{background:#FDECEC}
dl{margin:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 12px;font-size:13px}dt{color:var(--muted)}dd{margin:0;font-weight:500}
ul.plain{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
@media (max-width:720px){.wrap{padding:16px}header{padding:12px 16px}.side{max-width:none}}
</style>
</head>
<body>
<header>
  <div class="brand"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7CC8C8" stroke-width="2" aria-hidden="true"><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 11l6-4M9 13l6 4"/></svg>Squad AI</div>
  <nav role="tablist" aria-label="Views">
    <button role="tab" aria-selected="${rows.length && events.length ? 'false' : 'true'}" data-view="plan">Plan</button>
    <button role="tab" aria-selected="${rows.length && events.length ? 'true' : 'false'}" data-view="delivery">Delivery</button>
  </nav>
  <div class="meta">
    <span class="mono">${esc(project.name || root.split('/').pop())} · ${esc(project.type || '')}${ghRepo ? ' · ' + esc(ghRepo.nameWithOwner) : ''}</span>
    <span class="mono">structure ${esc(config.structure_version || '?')}</span>
    <span class="mono">generated ${now.toISOString().replace('T', ' ').slice(0, 19)}</span>
    <button class="refresh" type="button" onclick="location.reload()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>Refresh</button>
  </div>
</header>

<section class="view wrap" id="view-plan">
  <div class="steps">${planningPhase()}</div>
  <div class="cols">
    <aside class="side">
      <div class="card"><h2>Documents</h2><ul class="plain">${docs.length ? docs.map(d => `<li style="display:flex;justify-content:space-between;gap:8px"><span class="mono" style="font-size:12px">${esc(d.path.split('/').pop())}</span><span class="muted" style="font-size:12px">${esc(d.status)}</span></li>`).join('') : '<li class="muted">No planning documents under _bmad-output yet.</li>'}</ul></div>
      <div class="card"><h2>Backlog shape</h2><div class="tiles" style="grid-template-columns:repeat(3,1fr)"><div class="tile"><div class="n">${epics.length}</div><small>epics</small></div><div class="tile"><div class="n">${rows.length}</div><small>stories</small></div><div class="tile"><div class="n" style="color:var(--amber)">${rows.filter(r => r.hitl).length}</div><small>human review</small></div></div></div>
    </aside>
    <main class="main">
      ${epics.length ? epics.map(e => `<section class="epic"><div class="head"><span class="mono muted" style="font-size:12px">${esc(e.id)}</span><h3>${esc(e.title)}</h3><span class="muted">${e.stories.length} stories · ${e.stories.filter(s => s.hitl).length} human review</span></div><div class="scroll"><table><thead><tr><th>Story</th><th>After</th><th>Verify</th><th>Model</th><th>Human review</th><th>State</th></tr></thead><tbody>${e.stories.map(s => `<tr${s.verify ? '' : ' style="background:#FFF8EC"'}><td>${mono(s.id)} ${esc(s.title)}</td><td class="mono" style="font-size:13px">${s.after.length ? esc(s.after.join(', ')) : '<span class="faint">—</span>'}</td><td>${s.verify ? `<span style="color:var(--green)">✓</span> ${esc(s.verify)}` : '<span style="color:var(--red);font-weight:600">missing</span>'}</td><td>${s.model ? `<span class="badge" style="color:var(--teal);background:#EEF3F3">${esc(s.model)}</span>` : '<span class="faint">—</span>'}</td><td>${s.hitl ? '<span class="badge" style="color:var(--amber);background:#FFF4DD">yes</span>' : '<span class="faint">—</span>'}</td><td>${badge(s.state)}</td></tr>`).join('')}</tbody></table></div></section>`).join('') : '<div class="card muted">No tickets.toml found. Run the planning skills first.</div>'}
    </main>
    <aside class="side" style="max-width:340px">
      <div class="card ${blockers.length ? 'warn' : ''}"><h2 class="plain">Needs your decision</h2><p class="muted" style="margin:0 0 12px;font-size:13px">${blockers.length ? 'Resolve these in the files; this page only reads them.' : 'Nothing pending.'}</p><div class="queue">${blockers.map(b => `<div class="${/no Verify/.test(b.kind) ? 'red' : 'amber'}"><span style="font-size:12px;font-weight:600;color:${/no Verify/.test(b.kind) ? 'var(--red)' : 'var(--amber)'}">${esc(b.kind)}</span><span>${esc(b.text)}</span><span class="mono muted" style="font-size:12px">${esc(b.path)}</span></div>`).join('')}</div></div>
    </aside>
  </div>
</section>

<section class="view wrap" id="view-delivery">
  <div class="tiles">
    <div class="tile"><small>Done</small><div class="n" style="color:var(--green)">${count('done')}</div><small>of ${rows.length}${avgAgent ? ` · avg ${avgAgent} min agent time` : ''}</small></div>
    <div class="tile"><small>In progress</small><div class="n" style="color:var(--teal)">${count('in-progress') + count('merging')}</div><small>${current ? esc(current.id) + (status.attempt ? ` · attempt ${status.attempt}` : '') : '—'}</small></div>
    <div class="tile" style="border-color:#E0A33A"><small style="color:var(--amber)">Awaiting you</small><div class="n" style="color:var(--amber)">${count('awaiting-human')}</div><small>${rows.filter(r => r.state === 'awaiting-human').map(r => r.id).join(', ') || '—'}</small></div>
    <div class="tile" style="border-color:var(--red)"><small style="color:var(--red)">Blocked</small><div class="n" style="color:var(--red)">${count('blocked')}</div><small>${rows.filter(r => r.state === 'blocked').map(r => r.id).join(', ') || '—'}</small></div>
    <div class="tile"><small>Verifier pass rate</small><div class="n">${passRate}</div><small>${verified.filter(r => r.log.lastVerdict !== 'pass').length} fails caught</small></div>
    <div class="tile"><small>Ready next</small><div class="n">${count('ready')}</div><small>${rows.filter(r => r.state === 'ready').slice(0, 2).map(r => r.id).join(', ') || '—'}</small></div>
  </div>
  <div class="cols">
    <main class="main">
      ${current ? `<section class="card"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px">${badge(current.state)}<h2 class="plain" style="margin:0">${mono(current.id)} ${esc(current.title)}</h2><span class="muted" style="margin-left:auto;font-size:13px">${esc(current.log?.model || current.model || '')}${current.hitl ? ' · human review' : ''}${status.attempt ? ` · attempt ${status.attempt}` : ''} · <span class="mono" style="color:var(--ink)">${elapsedCurrent} min</span> elapsed</span></div>
      <ol class="steps5">${['dev.start', 'dev.end', 'pr', 'verify', 'human'].map((k, i) => {
        const ev = current.log?.events || []
        const has = {
          'dev.start': ev.some(e => e.event === 'dev.start'),
          'dev.end': ev.some(e => e.event === 'dev.end'),
          pr: Boolean(current.log?.pr),
          verify: ev.some(e => e.event === 'verify.end' && e.verdict === 'pass'),
          human: current.state === 'done'
        }
        const names = {'dev.start': 'Dev started', 'dev.end': 'Quality green', pr: 'PR opened', verify: 'Verifier', human: current.hitl ? 'Your review' : 'Auto-merge'}
        const nowStep = !has[k] && (i === 0 || has[['dev.start', 'dev.end', 'pr', 'verify', 'human'][i - 1]])
        const sub = {'dev.start': 'worktree', 'dev.end': 'typecheck · lint · test', pr: current.log?.pr ? `#${current.log.pr}` : '—', verify: current.log?.lastVerdict ? `verdict ${current.log.lastVerdict}` : 'runs Verify steps', human: current.hitl ? 'no auto-merge' : 'required checks'}[k]
        return `<li class="${has[k] ? 'ok' : nowStep ? 'now' : ''}"><div style="font-weight:600;color:${has[k] ? 'var(--green)' : nowStep ? 'var(--teal)' : 'var(--faint)'}">${i + 1} · ${names[k]}</div><div class="muted">${esc(sub)}</div></li>`
      }).join('')}</ol>
      <div style="margin-top:14px;font-size:13px"><strong>Verify:</strong> ${current.verify ? esc(current.verify) : '<span style="color:var(--red)">missing</span>'} ${prUrl(current) ? ' · ' + link(prUrl(current), 'Open PR') : ''}${issueUrl(current) ? ' · ' + link(issueUrl(current), 'Open issue') : ''}</div></section>` : '<section class="card muted">No ticket in progress.</section>'}

      <section class="epic"><div class="head"><h3>Pipeline</h3><span class="muted">${ghRepo ? 'mirrors GitHub Issues and the Projects board' : 'from tickets.toml and .squad/log.jsonl'}</span></div><div class="pipeline">${['ready', 'in-progress', 'awaiting-human', 'blocked', 'done'].map(s => `<div><div class="col" style="color:${stateMeta[s][1]}">${stateMeta[s][0]} · ${count(s) + (s === 'in-progress' ? count('merging') : 0)}</div>${rows.filter(r => r.state === s || (s === 'in-progress' && r.state === 'merging')).slice(0, 8).map(r => `<div class="item" style="background:${stateMeta[s][2]}">${mono(r.id)} ${esc(r.title).slice(0, 48)}${r.state === 'blocked' && r.log?.blockedReason ? `<div class="muted" style="font-size:12px">${esc(r.log.blockedReason)}</div>` : ''}</div>`).join('')}</div>`).join('')}</div></section>

      <section class="epic"><div class="head"><h3>Run log</h3><span class="muted">.squad/log.jsonl</span></div><div class="scroll"><table><thead><tr><th>Time</th><th>Ticket</th><th>Outcome</th><th>Attempts</th><th>PR</th><th>Agent time</th><th>Tokens</th></tr></thead><tbody>${rows.filter(r => r.log).sort((a, b) => String(b.log.last.ts).localeCompare(String(a.log.last.ts))).map(r => `<tr><td class="mono">${fmtTime(r.log.last.ts)}</td><td class="mono">${esc(r.id)}</td><td>${badge(r.state)}${r.log.blockedReason ? ` <span class="muted">${esc(r.log.blockedReason)}</span>` : ''}${r.log.lastVerdict ? ` <span class="muted">verifier ${esc(r.log.lastVerdict)}${r.log.findings != null ? `, ${r.log.findings} findings` : ''}</span>` : ''}</td><td>${r.log.attempts || 1}</td><td>${link(prUrl(r), r.log.pr ? `#${r.log.pr}` : '—')}</td><td class="mono" style="font-size:12px">${agentTime(r)}</td><td class="muted">${r.log.tokens ? Math.round(r.log.tokens / 1000) + 'k' : '—'}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">No events yet.</td></tr>'}</tbody></table></div></section>
    </main>

    <aside class="side" style="max-width:360px">
      <div class="card ${count('awaiting-human') + count('blocked') ? 'warn' : ''}"><h2 class="plain">Your queue</h2><div class="queue">${rows.filter(r => r.state === 'awaiting-human').map(r => `<div class="amber"><span style="font-size:12px;color:var(--amber);font-weight:600">human review${r.log?.pr ? ` · PR #${r.log.pr}` : ''}</span><span>${mono(r.id)} ${esc(r.title)}</span>${r.log?.lastVerdict ? `<span class="muted" style="font-size:12px">verifier: ${esc(r.log.lastVerdict)}${r.log.findings != null ? ` · ${r.log.findings} findings` : ''}</span>` : ''}<span>${link(prUrl(r), 'Open PR →')}</span></div>`).join('')}${rows.filter(r => r.state === 'blocked').map(r => `<div class="red"><span style="font-size:12px;color:var(--red);font-weight:600">blocked · ${esc(r.id)}</span><span>${esc(r.log?.blockedReason || r.title)}</span><span class="muted" style="font-size:12px">Answer on the issue; the orchestrator picks it up on the next run.</span><span>${link(issueUrl(r), 'Open issue →')}</span></div>`).join('')}${count('awaiting-human') + count('blocked') ? '' : '<span class="muted">Nothing waiting for you.</span>'}</div></div>
      <div class="card"><h2>Guards fired</h2><ul class="plain" style="font-size:13px">${Object.keys(guardsFired).length ? Object.entries(guardsFired).map(([h, n]) => `<li style="display:flex;justify-content:space-between"><span>${esc(h)}</span><span class="mono muted">${n}</span></li>`).join('') : '<li class="muted">none recorded</li>'}</ul></div>
      <div class="card"><h2>Next release</h2>${releasePr ? `<p style="margin:0 0 6px">${link(releasePr.url, `Release PR #${releasePr.number}`)} · ${esc(releasePr.title)}</p>` : '<p class="muted" style="margin:0">No open Release PR.</p>'}${count('awaiting-human') ? `<p style="margin:8px 0 0;font-size:12px;color:var(--amber)">${count('awaiting-human')} PR${count('awaiting-human') > 1 ? 's' : ''} not yet reviewed — release-prepare would stop.</p>` : ''}</div>
      <div class="card"><h2>Sources</h2><ul class="plain mono muted" style="font-size:12px"><li>squad.config.json</li><li>${esc(ticketFiles.map(f => relative(root, f)).join(', ') || 'tickets.toml (missing)')}</li><li>.squad/status.json${status.updated_at ? ' · ' + esc(status.updated_at) : ''}</li><li>.squad/log.jsonl · ${events.length} events</li><li>gh: ${ghRepo ? `${ghIssues.length} issues · ${ghPrs.length} PRs` : 'unavailable'}</li></ul></div>
    </aside>
  </div>
</section>

<script>
(function(){
  var tabs=document.querySelectorAll('[role=tab]');
  function show(v){tabs.forEach(function(t){t.setAttribute('aria-selected',t.dataset.view===v)});document.querySelectorAll('.view').forEach(function(s){s.classList.toggle('active',s.id==='view-'+v)});try{localStorage.setItem('squad.view',v)}catch(e){}}
  tabs.forEach(function(t){t.addEventListener('click',function(){show(t.dataset.view)})});
  var saved=null;try{saved=localStorage.getItem('squad.view')}catch(e){}
  var initial=saved||document.querySelector('[role=tab][aria-selected=true]').dataset.view;show(initial);
})();
</script>
</body>
</html>
`

mkdirSync(outDir, {recursive: true})
writeFileSync(join(outDir, 'index.html'), html)
writeFileSync(join(outDir, 'data.json'), JSON.stringify({generatedAt: now.toISOString(), project, tickets: rows.map(({log, ...r}) => ({...r, agentMinutes: log ? log.devMin + log.verifyMin : null, attempts: log?.attempts || 0, pr: log?.pr || null})), status, counts: Object.fromEntries(Object.keys(stateMeta).map(s => [s, count(s)]))}, null, 2))
console.log(`dashboard: ${relative(root, join(outDir, 'index.html'))} · ${rows.length} tickets · ${events.length} events${ghRepo ? ' · gh ok' : ' · gh unavailable'}`)
