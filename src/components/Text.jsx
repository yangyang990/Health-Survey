import { useApp } from '../AppContext'
import { translate } from '../data/translations'

export default function Text({ children, className, style }) {
  const { language } = useApp()
  return (
    <span className={className} style={style}>
      {translate(children, language)}
    </span>
  )
}
