import { Fragment, useCallback, useEffect, useState } from 'react'
import { QUESTIONS, SELECTION } from '../data/questions'
import { adminApi } from '../lib/api'
import styles from './Admin.module.css'

const COLUMNS = [
  ['id', 'ID'],
  ['submitted_at', 'Submitted'],
  ['name', 'Name'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['age', 'Age'],
  ['language', 'Language'],
  ['total_score', 'Total'],
  ['result', 'Result'],
]

const formatCell = (key, value) => (key === 'submitted_at' ? new Date(value).toLocaleString() : value)

// Everything one person filled in: each section with its symptoms and the rating they chose
function ResponseDetail({ row }) {
  return (
    <div className={styles.detail}>
      <div className={styles.scale}>
        {SELECTION.map((label, i) => (
          <span key={i}>
            <b>{i}</b> = {label}
          </span>
        ))}
      </div>
      <div className={styles.sections}>
        {QUESTIONS.map((group, t) => (
          <div key={group.label} className={styles.section}>
            <div className={styles.sectionHeader}>
              <span>{group.resultLabel}</span>
              <span>{row.section_scores[t]}</span>
            </div>
            {group.question.map((symptom, a) => {
              const rating = row.answers[t]?.[a]
              return (
                <div key={symptom} className={`${styles.symptom} ${rating > 0 ? styles.rated : ''}`}>
                  <span>{symptom}</span>
                  <span className={styles.rating}>{rating}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Admin() {
  // 'loading' | 'disabled' | 'login' | 'ready'
  const [view, setView] = useState('loading')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [rows, setRows] = useState([])
  const [openId, setOpenId] = useState(null)

  const loadRows = useCallback(async () => {
    const res = await adminApi.submissions()
    if (!res.success) return setView('login')
    setRows(res.data)
    setView('ready')
  }, [])

  useEffect(() => {
    adminApi
      .session()
      .then((session) => {
        if (!session.enabled) setView('disabled')
        else if (session.authenticated) return loadRows()
        else setView('login')
      })
      .catch((e) => {
        setMessage(e.toString())
        setView('login')
      })
  }, [loadRows])

  const onLogin = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      const res = await adminApi.login(password)
      setPassword('')
      if (res.success) await loadRows()
      else setMessage(res.message || 'Sign in failed')
    } catch (err) {
      setMessage(err.toString())
    }
  }

  const onLogout = async () => {
    await adminApi.logout()
    setRows([])
    setView('login')
  }

  if (view === 'loading') return <div className={styles.wrapper}>Loading...</div>

  if (view === 'disabled') {
    return (
      <div className={styles.wrapper}>
        <span className={styles.title}>MSQ RESPONSES</span>
        <div className={styles.panel}>
          The admin page is switched off. Set <code>ADMIN_PASSWORD</code> (at least 10 characters) in the{' '}
          <code>.env</code> file and restart the server.
        </div>
      </div>
    )
  }

  if (view === 'login') {
    return (
      <div className={styles.wrapper}>
        <span className={styles.title}>MSQ RESPONSES</span>
        <form className={`${styles.panel} ${styles.login}`} onSubmit={onLogin}>
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            className="form-control"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {message ? <div className={styles.error}>{message}</div> : null}
          <button type="submit" className={styles.button}>
            Sign in
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <span className={styles.title}>MSQ RESPONSES</span>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {rows.length} response{rows.length === 1 ? '' : 's'}
        </span>
        <a className={styles.button} href={adminApi.exportUrl('xlsx')}>
          Download Excel
        </a>
        <a className={styles.button} href={adminApi.exportUrl('csv')}>
          Download CSV
        </a>
        <button type="button" className={styles.button} onClick={loadRows}>
          Refresh
        </button>
        <button type="button" className={styles.button} onClick={onLogout}>
          Sign out
        </button>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map(([key, label]) => (
                <th key={key}>{label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Fragment key={row.id}>
                <tr className={styles.row}>
                  {COLUMNS.map(([key]) => (
                    <td key={key}>{formatCell(key, row[key])}</td>
                  ))}
                  <td className={styles.actions}>
                    <button
                      type="button"
                      className={styles.smallButton}
                      onClick={() => setOpenId(openId === row.id ? null : row.id)}
                    >
                      {openId === row.id ? 'Hide' : 'View'}
                    </button>
                    <a className={styles.smallButton} href={adminApi.responseExportUrl(row.id)}>
                      Download
                    </a>
                  </td>
                </tr>
                {openId === row.id ? (
                  <tr>
                    <td colSpan={COLUMNS.length + 1} className={styles.detailCell}>
                      <ResponseDetail row={row} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className={styles.empty}>
                  No responses yet
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
