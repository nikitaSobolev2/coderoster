import { HydrateClient } from '~/trpc/server'
import ClientPlanetSceneLoader from '~/features/home/components/3d/scenes/planet/ClientPlanetSceneLoader'
import Cursor from '~/features/home/components/common/Cursor'
import AppLoader from '~/features/home/components/common/AppLoader'
import Header from '~/features/home/components/common/header/Header'
import MobileHomeMenu from '~/features/home/components/common/MobileHomeMenu'
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
import { HOME_SECTIONS, getHomeNavText } from '~/features/home/config/home-sections'
import styles from './styles.module.scss'

export default function Home() {
  return (
    <HydrateClient>
      <AppLoader />
      <Cursor />
      <SearchSpotlight />
      <ClientPlanetSceneLoader />
      <Header />
      <MobileHomeMenu sections={HOME_SECTIONS} />
      <NavMenu>
        {HOME_SECTIONS.map(section => (
          <NavMenuItem key={section.id} href={`#${section.id}`}>
            {getHomeNavText(section.id)}
          </NavMenuItem>
        ))}
        <NavMenuItem href="/plans">тарифы</NavMenuItem>
      </NavMenu>
      <ScrollHint />
      <main className={styles.main}>
        <SectionScroller sections={HOME_SECTIONS}>
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
