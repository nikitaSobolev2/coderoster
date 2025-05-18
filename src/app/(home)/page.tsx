import { api, HydrateClient } from "~/trpc/server";
import ClientPlanetSceneLoader from "~/features/home/components/3d/scenes/planet/ClientPlanetSceneLoader";
import Cursor from "~/features/home/components/common/Cursor";
import InteractiveButton from "~/features/home/components/ui/InteractiveButton";
import Header from "~/features/home/components/common/header/Header";
import styles from "./styles.module.scss";
import SearchSpotlight from "~/shared/components/ui/search/SearchSpotlight";
import NavMenu from "~/features/home/components/common/nav/NavMenu";
import NavMenuItem from "~/features/home/components/common/nav/NavMenuItem";


export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });

  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <Cursor />
      <SearchSpotlight />
      <ClientPlanetSceneLoader />
      <Header />
      <NavMenu>
        <NavMenuItem href="#home">о нас</NavMenuItem>
        <NavMenuItem href="#big-true">горькая правда</NavMenuItem>
        <NavMenuItem href="#what-to-do-lol">что же делать?</NavMenuItem>
        <NavMenuItem href="#how-to-start-erm">как начать?</NavMenuItem>
        <NavMenuItem href="#contact-us">контакты</NavMenuItem>
      </NavMenu>
      <main 
        className={styles.main} 
      >
        <section id="home" className={styles.main__hero}>
          <h1 className={styles.hero__title}>освой программирование быстрее</h1>
          <p className={styles.hero__description}>CodeRoster — увлекательный способ прокачать свои навыки программирования</p>
          <InteractiveButton className={styles.hero__button} href="/login">
            Начать сейчас
          </InteractiveButton>
        </section>
        <section id="big-true" className={styles.main__bigTrue} style={{ marginTop: '100svh', height: '100svh' }}>
          <h2 className={styles.bigTrue__title}>горькая правда</h2>
          <p className={styles.bigTrue__description}>
            CodeRoster — это не просто курсы по программированию.
          </p>
        </section>
      </main>
    </HydrateClient>
  );
}
