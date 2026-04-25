import { HydrateClient } from '~/trpc/server'
import ClientPlanetSceneLoader from '~/features/home/components/3d/scenes/planet/ClientPlanetSceneLoader'
import Cursor from '~/features/home/components/common/Cursor'
import AppLoader from '~/features/home/components/common/AppLoader'
import Header from '~/features/home/components/common/header/Header'
import SearchSpotlight from '~/shared/components/ui/search/SearchSpotlight'
import NavMenu from '~/features/home/components/common/nav/NavMenu'
import NavMenuItem from '~/features/home/components/common/nav/NavMenuItem'
import ScrollHint from '~/features/home/components/common/ScrollHint'
import SectionScroller from '~/features/home/components/common/SectionScroller'
import HeroSection from '~/features/home/components/sections/HeroSection'
import BitterTruthSection from '~/features/home/components/sections/BitterTruthSection'
import WhatToDoSection from '~/features/home/components/sections/WhatToDoSection'
import HowToStartSection from '~/features/home/components/sections/HowToStartSection'
import FeaturesSection from '~/features/home/components/sections/FeaturesSection'
import FooterSection from '~/features/home/components/sections/FooterSection'
import {
  HERO_SECTION_ID,
  BITTER_TRUTH_SECTION_ID,
  WHAT_TO_DO_SECTION_ID,
  HOW_TO_START_SECTION_ID,
  FEATURES_SECTION_ID,
  FOOTER_SECTION_ID
} from '~/features/home/components/sections/section-ids'
import styles from './styles.module.scss'

const SECTIONS = [
  { id: HERO_SECTION_ID, label: 'О нас', nextLabel: 'Горькая правда' },
  { id: BITTER_TRUTH_SECTION_ID, label: 'Горькая правда', nextLabel: 'Решение' },
  { id: WHAT_TO_DO_SECTION_ID, label: 'Решение', nextLabel: 'Как начать' },
  { id: HOW_TO_START_SECTION_ID, label: 'Как начать', nextLabel: 'Платформа' },
  { id: FEATURES_SECTION_ID, label: 'Платформа', nextLabel: 'Контакты' },
  { id: FOOTER_SECTION_ID, label: 'Контакты' }
]

export default function Home() {
  return (
    <HydrateClient>
      <AppLoader />
      <Cursor />
      <SearchSpotlight />
      <ClientPlanetSceneLoader />
      <Header />
      <NavMenu>
        <NavMenuItem href={`#${HERO_SECTION_ID}`}>о нас</NavMenuItem>
        <NavMenuItem href={`#${BITTER_TRUTH_SECTION_ID}`}>горькая правда</NavMenuItem>
        <NavMenuItem href={`#${WHAT_TO_DO_SECTION_ID}`}>что же делать?</NavMenuItem>
        <NavMenuItem href={`#${HOW_TO_START_SECTION_ID}`}>как начать?</NavMenuItem>
        <NavMenuItem href={`#${FEATURES_SECTION_ID}`}>платформа</NavMenuItem>
        <NavMenuItem href={`#${FOOTER_SECTION_ID}`}>контакты</NavMenuItem>
      </NavMenu>
      <ScrollHint />
      <main className={styles.main}>
        <SectionScroller sections={SECTIONS}>
          <HeroSection />
          <BitterTruthSection />
          <WhatToDoSection />
          <HowToStartSection />
          <FeaturesSection />
          <FooterSection />
        </SectionScroller>
      </main>
    </HydrateClient>
  )
}
