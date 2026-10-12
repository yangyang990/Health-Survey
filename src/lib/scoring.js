export function resultLabelForScore(total) {
  if (total >= 100) return 'Severe Toxicity'
  if (total >= 50) return 'Moderate Toxicity'
  if (total >= 10) return 'Mild Toxicity'
  return 'Optimal'
}

// data: { userSelect: [{ resultLabel, option: [{ value }] }], isEmail? }
export function calculateResult(data) {
  let totalScore = 0
  const sectionScore = []
  const isEmail = data?.isEmail === true

  if (data?.userSelect) {
    for (const section of data.userSelect) {
      let score = 0
      for (const opt of section.option || []) {
        const value = Number(opt.value)
        if (value > 0) {
          totalScore += value
          score += value
        }
      }
      sectionScore.push({ label: section.resultLabel, score })
    }
  }

  return { totalScore, sectionScore, resultTxt: resultLabelForScore(totalScore), isEmail }
}
