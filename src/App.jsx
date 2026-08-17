import HeroQuestFog from './features/game/GameScreen'
import { I18nProvider } from './shared/i18n/I18nProvider.jsx'

export default function App() {
  return (
    <I18nProvider>
      <HeroQuestFog />
    </I18nProvider>
  )
}