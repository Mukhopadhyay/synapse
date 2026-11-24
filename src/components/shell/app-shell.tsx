import { fieldStats } from "@/features/landing/field-stats";
import { MenuLegend } from "@/features/legend/menu-legend";
import { ListView } from "@/features/list/list-view";
import { MapCanvas } from "@/features/map/map-canvas";
import { UrlSync } from "@/features/navigation/url-sync";
import { SearchPalette } from "@/features/search/search-palette";
import { MenuSettings } from "@/features/settings/menu-settings";
import { Splash } from "@/features/splash/splash";
import { WelcomeCard } from "@/features/welcome/welcome-card";
import { loadGraph } from "@/lib/content/load-note";

import { MapLayer } from "./map-layer";
import { RestoreSaved } from "./restore-saved";
import { RouteContent } from "./route-content";
import { TopBar } from "./top-bar";

/**
 * One shell for every route: a full-bleed canvas with floating chrome inset over it.
 * The map and the note panel live here so they survive navigation between /, /<domain>/graph and
 * /<domain>/graph/<slug>; the route only decides which domain is drawn and what the panel shows.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const graph = await loadGraph();
  const summaries = graph.domains.map(({ id, name, color, description }) => ({ id, name, color, description }));
  const stats = fieldStats(graph);
  const fields = summaries.map((summary, index) => {
    const { written, stubs, unwritten } = stats[index];
    return { ...summary, written, stubs, unwritten };
  });

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <MapLayer>
        <MapCanvas />
      </MapLayer>
      <ListView />
      <WelcomeCard fields={fields} />
      <RouteContent>{children}</RouteContent>
      <TopBar domains={summaries} menu={
          <>
            <MenuLegend />
            <MenuSettings />
          </>
        } />
      <SearchPalette />
      <UrlSync />
      <RestoreSaved />
      <Splash />
    </div>
  );
}
