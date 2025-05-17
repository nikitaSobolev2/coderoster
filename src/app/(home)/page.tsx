import { api, HydrateClient } from "~/trpc/server";
import ClientPlanetSceneLoader from "~/features/home/components/3d/scenes/planet/ClientPlanetSceneLoader";
import styles from "./index.module.scss";
import Cursor from "~/features/home/components/common/Cursor";
import InteractiveButton from "~/features/home/components/ui/InteractiveButton";


export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });

  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <Cursor />
      <main 
        className={styles.main} 
        style={{ position: 'relative', width: '100%', height: '100svh', overflow: 'hidden' }}
      >
        {/* <ClientPlanetSceneLoader /> */}
        <InteractiveButton />
      </main>
    </HydrateClient>
  );
}
