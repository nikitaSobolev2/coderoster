import { api, HydrateClient } from "~/trpc/server";
import ClientPlanetSceneLoader from "~/features/home/components/3d/scenes/planet/ClientPlanetSceneLoader";
import Cursor from "~/features/home/components/common/Cursor";
import InteractiveButton from "~/features/home/components/ui/InteractiveButton";
import Header from "~/features/home/components/common/header/Header";
import styles from "./styles.module.scss";


export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });

  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <Cursor />
      <ClientPlanetSceneLoader />
      <Header />
      <main 
        className={styles.main} 
        style={{ position: 'relative', width: '100%', height: '100svh', overflow: 'hidden' }}
      >
        <section className={styles.main__hero}>
          <h1 className={styles.hero__title}>освой программирование быстрее</h1>
          <p className={styles.hero__description}>CodeRoster — увлекательный способ прокачать свои навыки программирования</p>
          <InteractiveButton className={styles.hero__button} href="/login">
            Начать сейчас
          </InteractiveButton>
        </section>
      </main>
    </HydrateClient>
  );
}
