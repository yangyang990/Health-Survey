import { createRef, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import ReCAPTCHA from 'react-google-recaptcha'
import { useApp } from '../AppContext'
import Text from '../components/Text'
import { INTRO_TEXT, LANGUAGE_OPTIONS, QUESTIONS, SELECTION } from '../data/questions'
import { submitReport } from '../lib/api'
import styles from './Form.module.css'

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY

const languageSelectStyles = {
  menu: (base) => ({ ...base, padding: '0px', margin: '0px', textAlign: 'center', width: '100px' }),
}

const spacer = (height) => <div style={{ height: height + 'px' }} />

const emailValidate = (email) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)

function initialSelection() {
  return QUESTIONS.map((group) => ({
    question: group.label,
    resultLabel: group.resultLabel,
    option: group.question.map((q) => ({ option: q, value: -1 })),
  }))
}

// Returns the error for one contact field ('' / [] when valid)
function fieldError(field, value) {
  if (field === 'email') {
    const errors = []
    if (!value) errors.push('This field is required')
    if (!emailValidate(value)) errors.push('Invalid email address')
    return errors
  }
  if (field === 'age') return value === '' ? 'This field is required' : ''
  return value ? '' : 'This field is required'
}

function ErrorBubble({ data, onClick }) {
  if (!data) return null
  if (Array.isArray(data) && data.length <= 0) return null
  const lines = Array.isArray(data) ? data : [data]
  return (
    <div className={styles.errorBubble} onClick={onClick}>
      {lines.map((line, i) => (
        <div key={'mss' + i}>
          <Text style={{ fontSize: '0.8rem' }}>* </Text>
          <Text style={{ fontSize: '0.8rem' }}>{line}</Text>
        </div>
      ))}
    </div>
  )
}

export default function Form() {
  const { language, setLanguage, setConnecting, setUser, notifyError } = useApp()
  const navigate = useNavigate()

  const [values, setValues] = useState({ name: '', phone: '', age: '', email: '' })
  const [userSelect, setUserSelect] = useState(initialSelection)
  const [error, setError] = useState({})
  const recaptchaRef = useRef(null)

  const refs = useMemo(() => {
    const map = { name: createRef(), phone: createRef(), age: createRef(), email: createRef() }
    QUESTIONS.forEach((group, t) => group.question.forEach((_, a) => (map[t + '_' + a] = createRef())))
    return map
  }, [])

  const clearError = (key) => setError((prev) => ({ ...prev, [key]: '' }))

  const onFormValueChange = (field) => (e) => {
    const value = e.currentTarget.value
    setValues((prev) => ({ ...prev, [field]: value }))
    setError((prev) => ({ ...prev, [field]: fieldError(field, value) }))
  }

  const onRadioChangeValue = (e) => {
    const [group, question, value] = e.target.value.split('_')
    setUserSelect((prev) =>
      prev.map((section, t) =>
        t !== Number(group)
          ? section
          : {
              ...section,
              option: section.option.map((opt, a) => (a !== Number(question) ? opt : { ...opt, value: Number(value) })),
            },
      ),
    )
  }

  const onSubmit = async () => {
    const form = { ...values, userSelect, language }
    setUser({ ...values, userSelect })

    const nextError = { ...error }
    let firstError = ''
    for (const field of ['name', 'phone', 'age', 'email']) {
      const err = fieldError(field, values[field])
      nextError[field] = err
      if (err.length > 0 && !firstError) firstError = field
    }
    userSelect.forEach((section, t) =>
      section.option.forEach((opt, a) => {
        const key = t + '_' + a
        if (opt.value.toString() === '-1') {
          nextError[key] = 'Please select an option'
          if (!firstError) firstError = key
        } else {
          nextError[key] = ''
        }
      }),
    )
    setError(nextError)

    if (firstError) {
      refs[firstError].current?.scrollIntoView()
      return
    }

    const captcha = recaptchaRef.current ? recaptchaRef.current.getValue() : null
    setConnecting(true)
    try {
      const res = await submitReport({ form, captcha })
      if (res.success) {
        const search = new URLSearchParams({ lang: language, data: JSON.stringify(form) }).toString()
        navigate({ pathname: '/result', search }, { replace: true, state: form })
      } else {
        notifyError(res.message ? res.message : 'Connection Error')
      }
    } catch (e) {
      notifyError(e.toString())
    } finally {
      setConnecting(false)
    }
  }

  const renderQuestions = () =>
    QUESTIONS.map((group, t) => (
      <div
        key={'qsdd' + t}
        className={t === QUESTIONS.length - 1 ? styles.questionWrapperLast : styles.questionWrapper}
      >
        <Text className={`${styles.header} ${styles.bold}`}>{group.label}</Text>
        {spacer(1)}
        <Text className={styles.text}>Rate the Symptom</Text>
        <Text className={`${styles.text} ${styles.red}`}>*</Text>
        {spacer(10)}
        <div className={styles.questionTableWrapper}>
          <div className={styles.desktop}>
            <div className={styles.questionTableHeader}>
              <div className={styles.questionLabel} />
              {SELECTION.map((label, r) => (
                <div key={'sel' + r} className={styles.questionOpt}>
                  <Text className={styles.text}>{r + ' = '}</Text>
                  <Text className={styles.text}>{label}</Text>
                </div>
              ))}
            </div>
          </div>
          {group.question.map((question, a) => {
            const key = t + '_' + a
            return (
              <div key={'opp' + a} className={`${styles.questionRow} ${a % 2 !== 0 ? styles.questionEvenRow : ''}`}>
                <div className={styles.questionLabel} ref={refs[key]}>
                  <Text className={styles.text}>{question}</Text>
                  <ErrorBubble data={error[key]} onClick={() => clearError(key)} />
                </div>
                {SELECTION.map((label, r) => (
                  <div
                    key={'qselection' + r}
                    className={styles.questionOpt}
                    onChange={(e) => {
                      onRadioChangeValue(e)
                      clearError(key)
                    }}
                  >
                    <input className="form-check-input" name={'radio' + key} type="radio" value={key + '_' + r} />
                    <div className={styles.mobile} style={{ flex: 1, paddingLeft: '5px' }}>
                      <Text className={styles.text}>{r + ' = '}</Text>
                      <Text className={styles.text}>{label}</Text>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    ))

  const renderInput = (field, label, extraProps) => (
    <div className={styles.inputWrapper} ref={refs[field]}>
      <Text className={styles.text}>{label}</Text>
      <Text className={`${styles.text} ${styles.red}`}>*</Text>
      <input
        type="text"
        className="form-control"
        value={values[field]}
        onChange={onFormValueChange(field)}
        {...extraProps}
      />
      <ErrorBubble data={error[field]} onClick={() => clearError(field)} />
    </div>
  )

  return (
    <div className={styles.wrapper}>
      <div style={{ textAlign: 'right', paddingBottom: '10px' }}>
        <div style={{ width: '130px', display: 'inline-block' }}>
          <Select
            styles={languageSelectStyles}
            value={LANGUAGE_OPTIONS.find((o) => o.value === language) || null}
            options={LANGUAGE_OPTIONS}
            onChange={(option) => setLanguage(option.value)}
          />
        </div>
      </div>
      <Text className={styles.title}>MSQ - MEDICAL SYMPTOM / TOXICITY QUESTIONNAIRE</Text>
      <div className={styles.formWrapper}>
        {renderInput('name', 'Your Name')}
        {renderInput('phone', 'Contact Phone Number')}
        {renderInput('age', 'Age', {
          onKeyPress: (e) => {
            if (!/[0-9]/.test(e.key)) e.preventDefault()
          },
        })}
        {renderInput('email', 'Email Address')}
        {spacer(10)}
        <Text className={styles.text}>{INTRO_TEXT}</Text>
        {spacer(20)}
        <div className={`${styles.scaleBox} ${styles.center}`}>
          <Text className={styles.header}>POINT SCALE</Text>
          <div className={styles.scaleBoxContent}>
            {SELECTION.map((label, i) => (
              <div key={'qs12' + i} style={{ display: 'flex' }}>
                <Text className={styles.text}>{i + ' = '}</Text>
                <div style={{ width: '4px' }}> </div>
                <Text className={styles.text}>{label}</Text>
              </div>
            ))}
          </div>
        </div>
        {spacer(20)}
        {renderQuestions()}
        {RECAPTCHA_SITE_KEY ? <ReCAPTCHA sitekey={RECAPTCHA_SITE_KEY} ref={recaptchaRef} /> : null}
        {spacer(20)}
        <div className={`${styles.button} ${styles.text} ${styles.bold}`} onClick={onSubmit}>
          <Text>Submit Form</Text>
        </div>
      </div>
    </div>
  )
}
