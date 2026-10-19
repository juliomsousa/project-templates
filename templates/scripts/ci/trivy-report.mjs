// Turns a Trivy JSON report into a Markdown table, a job summary and warning annotations.
// Never fails the build: vulnerabilities are reported, not blocking.
// Usage: node scripts/ci/trivy-report.mjs <trivy.json> <report.md>
import {appendFileSync, existsSync, readFileSync, writeFileSync} from 'node:fs'

export const REPORT_MARKER = '<!-- trivy-vulnerability-report -->'
const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM']
const MAX_ROWS = 30
// GitHub shows at most 10 warning annotations per step
const MAX_ANNOTATIONS = 10

const [inputPath = 'trivy-vulns.json', outputPath = 'trivy-report.md'] = process.argv.slice(2)

const report = existsSync(inputPath) ? JSON.parse(readFileSync(inputPath, 'utf8')) : {}

const findings = (report.Results ?? [])
  .flatMap(result =>
    (result.Vulnerabilities ?? []).map(vulnerability => ({...vulnerability, Target: result.Target}))
  )
  .filter(({Severity}) => SEVERITIES.includes(Severity))
  .sort((a, b) => SEVERITIES.indexOf(a.Severity) - SEVERITIES.indexOf(b.Severity))

const counts = Object.fromEntries(
  SEVERITIES.map(severity => [severity, findings.filter(({Severity}) => Severity === severity).length])
)

const escapeCell = value => String(value ?? '').replaceAll('|', '\\|')

const rows = findings
  .slice(0, MAX_ROWS)
  .map(
    finding =>
      `| ${finding.Severity} | \`${escapeCell(finding.PkgName)}\` | ${escapeCell(finding.InstalledVersion)} | ${escapeCell(finding.FixedVersion) || '—'} | [${finding.VulnerabilityID}](${finding.PrimaryURL ?? '#'}) |`
  )

const markdown = [
  REPORT_MARKER,
  '## 🛡️ Dependency vulnerabilities',
  '',
  findings.length === 0
    ? '✅ No CRITICAL, HIGH or MEDIUM vulnerabilities found.'
    : `**${counts.CRITICAL} critical · ${counts.HIGH} high · ${counts.MEDIUM} medium.** Report-only: this does not block the merge. Run the \`fix-vulnerabilities\` skill to address them.`,
  ...(findings.length === 0
    ? []
    : [
        '',
        '| Severity | Package | Installed | Fixed in | Advisory |',
        '|---|---|---|---|---|',
        ...rows,
        ...(findings.length > MAX_ROWS ? ['', `…and ${findings.length - MAX_ROWS} more. Run \`trivy fs --scanners vuln .\` locally for the full list.`] : [])
      ])
].join('\n')

writeFileSync(outputPath, `${markdown}\n`)

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`)

const urgent = findings.filter(({Severity}) => Severity !== 'MEDIUM')
if (urgent.length > 0) {
  console.log(`::warning title=Dependency vulnerabilities::${counts.CRITICAL} critical and ${counts.HIGH} high vulnerabilities (report-only)`)
  urgent
    .slice(0, MAX_ANNOTATIONS - 1)
    .forEach(finding =>
      console.log(
        `::warning file=${finding.Target},title=${finding.Severity} ${finding.VulnerabilityID}::${finding.PkgName}@${finding.InstalledVersion} → fixed in ${finding.FixedVersion || 'no fix yet'}`
      )
    )
}

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `total=${findings.length}\nurgent=${urgent.length}\n`)
}
