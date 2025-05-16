import { api, HydrateClient } from "~/trpc/server";
import ClientPlanetSceneLoader from "~/features/home/assets/3d/scenes/planet/ClientPlanetSceneLoader";
import styles from "./index.module.scss";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });

  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <main 
        className={styles.main} 
        style={{ position: 'relative', width: '100%', height: '100svh', overflow: 'hidden' }}
      >
        <ClientPlanetSceneLoader />
      </main>
    </HydrateClient>
  );
}
