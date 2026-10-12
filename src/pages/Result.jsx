import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../AppContext'
import Text from '../components/Text'
import { calculateResult } from '../lib/scoring'
import styles from './Result.module.css'

export default function Result() {
  const { language, setUser } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const wrapperRef = useRef(null)

  const { totalScore, sectionScore, resultTxt, isEmail } = useMemo(() => {
    let data = null
    try {
      data = JSON.parse(searchParams.get('data'))
    } catch (e) {
      // fall through with no data -> score 0
    }
    return calculateResult(data)
  }, [searchParams])

  useEffect(() => {
    window.scrollTo(0, 0)
    const timer = setTimeout(() => wrapperRef.current?.scrollIntoView(), 1)
    return () => clearTimeout(timer)
  }, [])

  const onRetry = () => {
    setUser(null)
    navigate({ pathname: '/', search: 'lang=' + language }, { replace: true })
  }

  const rowClass = `${styles.sectionRow} ${styles.text2} ${styles.green}`

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <Text className={styles.title}>MSQ - MEDICAL SYMPTOM / TOXICITY QUESTIONNAIRE</Text>
      <div className={styles.formWrapper}>
        <div className={styles.formWrapperInner}>
          <Text className={styles.text}>Total Scores</Text>
          <br />
          <Text className={`${styles.score} ${styles.green}`}>{totalScore}</Text>
          <br />
          <Text className={styles.text}>Result</Text>
          <br />
          <Text className={`${styles.resultTxt} ${styles.green}`}>{resultTxt}</Text>
          <div>
            <div className={styles.sectionScoreWrapper}>
              <div className={rowClass}>
                <div className={styles.sectionRowText} />
                <div className={styles.sectionRowScore}>
                  <Text>Point</Text>
                </div>
              </div>
              {sectionScore.map((section, i) => (
                <div key={i} className={rowClass}>
                  <div className={styles.sectionRowText}>
                    <Text>{section.label}</Text>
                  </div>
                  <div className={styles.sectionRowScore}>
                    <Text>{section.score}</Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.formWrapperBottom}>
          <div className={styles.formWrapperBottomInner}>
            <div className={styles.formWrapperBottomBox}>
              <div>
                <Text className={styles.text}>Optimal</Text>
                <Text className={styles.text}>: 1 - 9</Text>
              </div>
              <div>
                <Text className={styles.text}>Mild Toxicity</Text>
                <Text className={styles.text}>: 10 - 49</Text>
              </div>
            </div>
            <div className={styles.formWrapperBottomBox}>
              <div>
                <Text className={styles.text}>Moderate Toxicity</Text>
                <Text className={styles.text}>: 50 - 99</Text>
              </div>
              <div>
                <Text className={styles.text}>Severe Toxicity</Text>
                <Text className={styles.text}>: over 100</Text>
              </div>
            </div>
          </div>
        </div>
      </div>
      <br />
      {isEmail ? null : (
        <div className={`${styles.button} ${styles.text} ${styles.bold}`} onClick={onRetry}>
          <Text>Retry</Text>
        </div>
      )}
    </div>
  )
}
