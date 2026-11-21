import Graph from "graphology";

import { useFilterStore, type Filters } from "@/features/filters/filter-store";
import { useQueryMatches } from "@/features/filters/query-matches";
import { useGroupColors } from "@/features/settings/group-colors";
import { useSettingsStore } from "@/features/settings/settings-store";
import { subscribeTheme } from "@/features/theme/theme-store";
import {
  edgeDefinition,
  type EdgeKind,
  type GraphData,
  type GraphNode,
  type LineStyle,
  type RelationDefinition,
} from "@/lib/content/schema";
import { DURATION, fadeDuration, tween } from "@/lib/motion";
import { breadcrumb } from "@/lib/graph/note-view";
import { GHOST_MIN_RADIUS, HUB_LINKS, nodeRadius, prominence } from "@/lib/graph/node-size";
import { useMapStore } from "@/lib/store/map-store";

import { createLiveLayout } from "./live-layout";
import { mixColor, resolvePalette, scaleAlpha, type Palette, type RGBA } from "./palette";

export type NodeAttributes = {
  label: string;
  /** Radius in graph units before the node-size setting. */
  size: number;
  ghost: boolean;
  colorKey: string;
  /** Position in keyboard order: cluster order from _domain.yml, then title. */
  order: number;
  /** Links drawn on the map, mentions included: decides hubs and label contrast. */
  mapLinks: number;
  /** 0–1, fixed per note, so hub halos breathe out of step. */
  phase: number;
};

/** "tag" links a tag node to its notes when tags are drawn as nodes. */
export type MapEdgeKind = EdgeKind | "tag";

export type EdgeAttributes = { kind: MapEdgeKind };

/** Tag nodes are ids with this prefix; they exist only while "Tags as nodes" is on. */
export const TAG_PREFIX = "tag:";
export const isTagNode = (id: string) => id.startsWith(TAG_PREFIX);

const TAG_EDGE: RelationDefinition = { label: "Tagged", verb: "is tagged", directed: false, acyclic: false, line: "solid", width: 0.5 };
const mapEdgeDefinition = (kind: MapEdgeKind) => (kind === "tag" ? TAG_EDGE : edgeDefinition(kind));
const edgeOn = (edges: Filters["edges"], kind: MapEdgeKind) => kind === "tag" || edges[kind];

/** How a node should look right now, independent of the canvas drawing it. */
export type NodeStyle = {
  /** Filtered out (and fully faded): not drawn, not clickable. */
  hidden: boolean;
  x: number;
  y: number;
  /** Radius in graph units, including the selection ring. */
  size: number;
  ghost: boolean;
  selected: boolean;
  focused: boolean;
  /** Hovered or selected: the label sits on a pill. */
  pinned: boolean;
  fill: RGBA;
  /** Ghost outline. */
  stroke: RGBA;
  ring: RGBA;
  gap: RGBA;
  label: string | null;
  labelColor: RGBA;
  /** In the hovered or selected neighbourhood: shown whatever the zoom. */
  forceLabel: boolean;
  /** Typed relations; busier notes win label collisions. */
  links: number;
  /** Well-linked note: a breathing halo and a bolder label. */
  hub: boolean;
  /** 0–1 per note, offsets the halo's breathing. */
  phase: number;
  /** The note's own colour, for halos. */
  color: RGBA;
  /** How present the note is right now (hover fade × filters × intro), 0–1. */
  visibility: number;
  labelWeight: 500 | 600;
  zIndex: number;
};

export type EdgeHead = "none" | "filled" | "hollow";

export type EdgeStyle = {
  source: string;
  target: string;
  kind: MapEdgeKind;
  directed: boolean;
  hidden: boolean;
  color: RGBA;
  width: number;
  head: EdgeHead;
  line: LineStyle;
  zIndex: number;
};

type Focus = { center: string; nodes: Set<string> };

/** What the filters leave on the map: hidden notes and the edge kinds that are on. */
type Shown = { hiddenNodes: Set<string>; edges: Filters["edges"] };

/** A cluster as a region of the backdrop: where its notes sit and how far they spread (graph units). */
export type ClusterRegion = { x: number; y: number; radius: number; color: RGBA; opacity: number };

/** Selection grows a node by a 2px ring and a 3px gap. */
export const SELECTION_RING = 5;
const OPACITY_FADED = 0.15;
/** Rendered node radius (px) at which its label is fully visible, at the default text fade. */
const LABEL_FULL_RADIUS = 10;

/** A stable 0–1 value per id (FNV-1a), so phase offsets look random but never change between loads. */
function hashUnit(id: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 0x01000193);
  return (hash >>> 0) / 4294967296;
}

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function buildGraph(data: GraphData, domains: string[]) {
  const graph = new Graph<NodeAttributes, EdgeAttributes>({ multi: true, type: "mixed" });
  const domainOrder = new Map(domains.map((id, index) => [id, index]));
  const clusterOrder = new Map(
    data.domains.flatMap((domain) => domain.clusters.map((cluster, index) => [`${domain.id}/${cluster.id}`, index] as const)),
  );
  const clusterRank = (node: GraphNode) => clusterOrder.get(`${node.domain}/${node.cluster ?? ""}`) ?? Infinity;

  const nodes = data.nodes
    .filter((node) => domainOrder.has(node.domain))
    .sort(
      (a, b) =>
        domainOrder.get(a.domain)! - domainOrder.get(b.domain)! ||
        clusterRank(a) - clusterRank(b) ||
        Number(a.ghost) - Number(b.ghost) ||
        a.title.localeCompare(b.title),
    );

  const mapLinks = new Map<string, number>();
  for (const { source, target } of data.edges) {
    mapLinks.set(source, (mapLinks.get(source) ?? 0) + 1);
    mapLinks.set(target, (mapLinks.get(target) ?? 0) + 1);
  }
  nodes.forEach((node, order) => {
    const size = nodeRadius(node.relationCount);
    graph.addNode(node.id, {
      label: node.title,
      size: node.ghost ? Math.max(GHOST_MIN_RADIUS, size) : size,
      ghost: node.ghost,
      colorKey: `${node.domain}/${node.cluster ?? ""}`,
      order,
      mapLinks: mapLinks.get(node.id) ?? 0,
      phase: hashUnit(node.id),
    });
  });
  for (const { source, target, kind } of data.edges) {
    if (!graph.hasNode(source) || !graph.hasNode(target)) continue;
    if (edgeDefinition(kind).directed) graph.addDirectedEdge(source, target, { kind });
    else graph.addUndirectedEdge(source, target, { kind });
  }
  return graph;
}

export type ModelListener = {
  /** Colours, opacity or sizes changed; positions did not. */
  restyle: () => void;
};

/**
 * Everything about the map that isn't drawing: the domain's graph, the live layout, resolved token
 * colours, hover and selection fades, and the resulting look of every node and edge.
 */
export function createMapModel(data: GraphData, domains: string[]) {
  const graph = buildGraph(data, domains);
  const nodes = new Map(data.nodes.map((node) => [node.id, node]));
  const layout = createLiveLayout({
    nodes: graph.mapNodes((id, attributes) => {
      const node = nodes.get(id)!;
      return { id, x: node.x, y: node.y, radius: attributes.size, group: attributes.colorKey };
    }),
    links: graph
      .filterEdges((_edge, attributes) => attributes.kind !== "mentions")
      .map((edge) => ({ source: graph.source(edge), target: graph.target(edge) })),
  });
  const keyboardOrder = graph.nodes().sort((a, b) => graph.getNodeAttribute(a, "order") - graph.getNodeAttribute(b, "order"));

  /** Typed relations (plus mentions) per note, for the orphan filter. */
  const degree = (id: string, edges: Filters["edges"]) =>
    graph.reduceEdges(id, (count, _edge, attributes) => count + (attributes.kind !== "tag" && edges[attributes.kind] ? 1 : 0), 0);

  /** Each tag in this domain and its written notes, for "Tags as nodes". */
  const tagNotes = new Map<string, string[]>();
  graph.forEachNode((id) => {
    for (const tag of nodes.get(id)?.tags ?? []) tagNotes.set(tag, [...(tagNotes.get(tag) ?? []), id]);
  });

  /** Puts tag nodes on the map near their notes and lets the layout settle around them. */
  function addTagNodes() {
    if (graph.someNode(isTagNode)) return;
    const extra: Parameters<typeof layout.add>[0] = { nodes: [], links: [] };
    [...tagNotes].forEach(([tag, ids], index) => {
      const id = `${TAG_PREFIX}${tag}`;
      const size = nodeRadius(ids.length);
      graph.addNode(id, { label: `#${tag}`, size, ghost: false, colorKey: "tag", order: Infinity, mapLinks: ids.length, phase: hashUnit(id) });
      const points = ids.map((note) => layout.position(note)).filter((point) => !!point);
      const angle = index * 2.4;
      const x = points.reduce((sum, point) => sum + (point.x ?? 0), 0) / Math.max(1, points.length) + Math.cos(angle) * 20;
      const y = points.reduce((sum, point) => sum + (point.y ?? 0), 0) / Math.max(1, points.length) + Math.sin(angle) * 20;
      extra.nodes.push({ id, x, y, radius: size, group: id });
      for (const note of ids) {
        graph.addUndirectedEdge(id, note, { kind: "tag" });
        extra.links.push({ source: id, target: note });
      }
    });
    layout.add(extra);
  }

  function removeTagNodes() {
    const ids = graph.filterNodes(isTagNode);
    if (ids.length === 0) return;
    ids.forEach((id) => graph.dropNode(id));
    layout.remove(new Set(ids));
  }

  function computeShown(): Shown {
    const filters = useFilterStore.getState();
    const matches = useQueryMatches.getState().ids;
    const hiddenClusters = new Set(filters.hiddenClusters);
    const hiddenDomains = new Set(filters.hiddenDomains);
    const hiddenLevels = new Set<string>(filters.hiddenLevels);
    const hiddenNodes = new Set(
      graph.filterNodes((id, attributes) => {
        if (isTagNode(id)) return false;
        const node = nodes.get(id);
        if (hiddenClusters.has(attributes.colorKey) || (node && hiddenDomains.has(node.domain))) return true;
        if (attributes.ghost && !filters.ghosts) return true;
        if (node?.level && hiddenLevels.has(node.level)) return true;
        if (matches && !matches.has(id)) return true;
        return !filters.orphans && degree(id, filters.edges) === 0;
      }),
    );
    graph.forEachNode((id) => {
      if (!isTagNode(id)) return;
      const notes = tagNotes.get(id.slice(TAG_PREFIX.length)) ?? [];
      if (!filters.tags || notes.every((note) => hiddenNodes.has(note))) hiddenNodes.add(id);
    });
    return { hiddenNodes, edges: filters.edges };
  }

  let palette: Palette = resolvePalette(data.domains);
  let shown: { from: Shown; to: Shown; progress: number } = (() => {
    const initial = computeShown();
    return { from: initial, to: initial, progress: 1 };
  })();

  const nodePresence = (id: string) =>
    lerp(shown.from.hiddenNodes.has(id) ? 0 : 1, shown.to.hiddenNodes.has(id) ? 0 : 1, shown.progress);
  const edgePresence = (kind: MapEdgeKind, source: string, target: string) =>
    Math.min(lerp(edgeOn(shown.from.edges, kind) ? 1 : 0, edgeOn(shown.to.edges, kind) ? 1 : 0, shown.progress), nodePresence(source), nodePresence(target));
  const isHidden = (id: string) => shown.to.hiddenNodes.has(id);
  let intro = 0;
  let fieldLabelsOn = false;
  let requestRestyle = () => {};
  let fade: { from: Focus | null; to: Focus | null; progress: number } = { from: null, to: null, progress: 1 };

  function focusOf(center: string | null): Focus | null {
    if (!center || !graph.hasNode(center)) return null;
    const focusNodes = new Set([center]);
    graph.forEachEdge(center, (_edge, attributes, source, target) => {
      const other = source === center ? target : source;
      if (attributes.kind !== "mentions" && edgeOn(shown.to.edges, attributes.kind) && !isHidden(other)) focusNodes.add(other);
    });
    return { center, nodes: focusNodes };
  }

  const focusCenter = () => {
    const { hoveredId, draggingId, focusedId, selectedId } = useMapStore.getState();
    return draggingId ?? hoveredId ?? focusedId ?? selectedId;
  };

  const nodeFaded = (focus: Focus | null, id: string) => (focus && !focus.nodes.has(id) ? 1 : 0);
  const touchesCenter = (focus: Focus | null, source: string, target: string) =>
    focus ? (source === focus.center || target === focus.center ? 1 : 0) : 0;
  const edgeFaded = (focus: Focus | null, source: string, target: string) =>
    focus ? 1 - touchesCenter(focus, source, target) : 0;

  function nodeStyle(id: string): NodeStyle {
    const attributes = graph.getNodeAttributes(id);
    const position = layout.position(id);
    const { hoveredId, selectedId, focusedId, draggingId } = useMapStore.getState();
    const faded = lerp(nodeFaded(fade.from, id), nodeFaded(fade.to, id), fade.progress);
    const presence = nodePresence(id);
    const visibility = (1 - faded * (1 - OPACITY_FADED)) * intro * presence;
    const inFocus = fade.to?.nodes.has(id) ?? false;
    const selected = id === selectedId;
    const pinned = selected || id === hoveredId || id === draggingId || id === focusedId;
    const group = useGroupColors.getState().colors.get(id);
    const nodeColor = (group && palette.groupColors.get(group)) ?? palette.nodeColors.get(attributes.colorKey) ?? palette.mutedForeground;
    const hub = !attributes.ghost && !isTagNode(id) && attributes.mapLinks >= HUB_LINKS;
    const contrast = attributes.ghost ? 0 : prominence(attributes.mapLinks);

    return {
      hidden: presence === 0,
      x: position?.x ?? 0,
      y: position?.y ?? 0,
      size: layout.radius(id) + (selected ? SELECTION_RING : 0),
      ghost: attributes.ghost,
      selected,
      focused: id === focusedId,
      pinned,
      fill: attributes.ghost ? palette.background : mixColor(palette.background, nodeColor, visibility),
      stroke: scaleAlpha(palette.faint, 0.8 * visibility),
      ring: palette.signal,
      gap: palette.background,
      label: faded > 0.5 || presence < 0.5 ? null : attributes.label,
      labelColor: attributes.ghost ? palette.faint : mixColor(palette.mutedForeground, palette.foreground, contrast),
      forceLabel: inFocus && faded < 0.5,
      links: nodes.get(id)?.relationCount ?? 0,
      hub,
      phase: attributes.phase,
      color: nodeColor,
      visibility,
      labelWeight: hub ? 600 : 500,
      zIndex: pinned ? 3 : inFocus ? 2 : faded > 0.5 ? 0 : 1,
    };
  }

  function edgeStyle(id: string): EdgeStyle {
    const { kind } = graph.getEdgeAttributes(id);
    const [source, target] = graph.extremities(id);
    const definition = mapEdgeDefinition(kind);
    const { arrows, linkThickness } = useSettingsStore.getState().display;
    const focusTo = touchesCenter(fade.to, source, target);
    const focus = lerp(touchesCenter(fade.from, source, target), focusTo, fade.progress);
    const faded = lerp(edgeFaded(fade.from, source, target), edgeFaded(fade.to, source, target), fade.progress);
    const showHead = definition.directed && (arrows || focusTo === 1);
    const presence = edgePresence(kind, source, target);

    return {
      source,
      target,
      kind,
      directed: definition.directed,
      hidden: presence === 0,
      color: scaleAlpha(mixColor(palette.edgeRest, palette.edgeFocus, focus), (1 - faded * (1 - OPACITY_FADED)) * intro * presence),
      width: (definition.width + 0.5 * focus) * linkThickness,
      head: showHead ? (kind === "extends" ? "hollow" : "filled") : "none",
      line: definition.line,
      zIndex: focus > 0.5 ? 1 : 0,
    };
  }

  /** Map labels scale 11–16px with zoom. */
  function labelSize(ratio: number) {
    return Math.min(16, Math.max(11, 12 / Math.sqrt(ratio)));
  }

  /**
   * Text fade: a label is fully visible while its node renders at least 10px in radius and gone
   * at 5px, so zooming out fades small notes' labels first and big ones last. Each step of the
   * threshold setting halves (or doubles) those sizes.
   */
  function labelOpacity(ratio: number, size: number) {
    const { textFade } = useSettingsStore.getState().display;
    return clamp01(Math.log2(size / ratio / LABEL_FULL_RADIUS) + 1 + textFade);
  }

  /** Each field's name, centred above its notes (graph units); only on the all-fields map. */
  function fieldLabels(): { name: string; x: number; top: number; opacity: number }[] {
    if (!fieldLabelsOn) return [];
    return data.domains.flatMap((domain) => {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      graph.forEachNode((id) => {
        if (nodes.get(id)?.domain !== domain.id || isHidden(id)) return;
        const position = layout.position(id);
        const radius = layout.radius(id);
        minX = Math.min(minX, (position?.x ?? 0) - radius);
        maxX = Math.max(maxX, (position?.x ?? 0) + radius);
        minY = Math.min(minY, (position?.y ?? 0) - radius);
      });
      return Number.isFinite(minY) ? [{ name: domain.name, x: (minX + maxX) / 2, top: minY, opacity: intro }] : [];
    });
  }

  /** Each cluster's centre and spread among the notes on screen, for the backdrop's glows. */
  function clusterRegions(): ClusterRegion[] {
    const sums = new Map<string, { x: number; y: number; xx: number; yy: number; count: number }>();
    graph.forEachNode((id, attributes) => {
      if (isTagNode(id) || attributes.ghost || isHidden(id)) return;
      const position = layout.position(id);
      if (!position) return;
      const x = position.x ?? 0;
      const y = position.y ?? 0;
      const sum = sums.get(attributes.colorKey) ?? { x: 0, y: 0, xx: 0, yy: 0, count: 0 };
      sum.x += x;
      sum.y += y;
      sum.xx += x * x;
      sum.yy += y * y;
      sum.count += 1;
      sums.set(attributes.colorKey, sum);
    });
    const regions: ClusterRegion[] = [];
    for (const [key, { x, y, xx, yy, count }] of sums) {
      const color = palette.nodeColors.get(key);
      if (!color) continue;
      const cx = x / count;
      const cy = y / count;
      const spread = Math.sqrt(Math.max(0, xx / count - cx * cx + yy / count - cy * cy));
      regions.push({ x: cx, y: cy, radius: spread * 1.6 + 60, color, opacity: intro });
    }
    return regions;
  }

  /** Runs the intro fade and follows the store, settings and theme, telling the renderer what to redraw. */
  function start(listener: ModelListener) {
    requestRestyle = listener.restyle;
    intro = 0;
    fade = { from: null, to: focusOf(focusCenter()), progress: 1 };
    const cancelIntro = tween(fadeDuration(DURATION.intro), (progress) => {
      intro = progress;
      listener.restyle();
    });

    void document.fonts?.ready.then(() => listener.restyle());

    const unsubscribeTheme = subscribeTheme(() => {
      palette = resolvePalette(data.domains);
      listener.restyle();
    });
    const unsubscribeSettings = useSettingsStore.subscribe((state, previous) => {
      if (state.display !== previous.display) listener.restyle();
    });
    const stopLayout = layout.start(listener.restyle);

    let cancelShown = () => {};
    const refilter = () => {
      const wantTags = useFilterStore.getState().tags;
      const adding = wantTags && !graph.someNode(isTagNode);
      if (adding) addTagNodes();
      const next = computeShown();
      cancelShown();
      const from = shown.progress < 0.5 ? shown.from : shown.to;
      if (adding) graph.forEachNode((id) => isTagNode(id) && from.hiddenNodes.add(id));
      shown = { from, to: next, progress: 0 };
      const { hoveredId, focusedId, setHovered, setFocused } = useMapStore.getState();
      if (hoveredId && next.hiddenNodes.has(hoveredId)) setHovered(null);
      if (focusedId && next.hiddenNodes.has(focusedId)) setFocused(null);
      fade = { ...fade, to: focusOf(focusCenter()) };
      cancelShown = tween(fadeDuration(DURATION.instant), (progress) => {
        shown = { ...shown, progress };
        if (progress === 1 && !useFilterStore.getState().tags) removeTagNodes();
        listener.restyle();
      });
    };
    if (useFilterStore.getState().tags) refilter();
    const unsubscribeFilters = useFilterStore.subscribe(refilter);
    const unsubscribeMatches = useQueryMatches.subscribe(refilter);
    const unsubscribeGroups = useGroupColors.subscribe(() => listener.restyle());

    let cancelFade = () => {};
    const unsubscribeStore = useMapStore.subscribe((state, previous) => {
      const changed =
        state.hoveredId !== previous.hoveredId ||
        state.selectedId !== previous.selectedId ||
        state.focusedId !== previous.focusedId ||
        state.draggingId !== previous.draggingId;
      if (!changed) return;

      const next = focusOf(focusCenter());
      if (next?.center !== fade.to?.center) {
        cancelFade();
        fade = { from: fade.progress < 0.5 ? fade.from : fade.to, to: next, progress: 0 };
        cancelFade = tween(fadeDuration(DURATION.instant), (progress) => {
          fade = { ...fade, progress };
          listener.restyle();
        });
      }
      listener.restyle();
    });

    return () => {
      cancelIntro();
      cancelFade();
      cancelShown();
      unsubscribeFilters();
      unsubscribeMatches();
      unsubscribeGroups();
      unsubscribeTheme();
      unsubscribeSettings();
      stopLayout();
      unsubscribeStore();
    };
  }

  return {
    graph,
    layout,
    isHidden,
    /** Keyboard order without filtered-out notes. */
    keyboardOrder: () => keyboardOrder.filter((id) => !isHidden(id)),
    palette: () => palette,
    nodeStyle,
    edgeStyle,
    labelSize,
    labelOpacity,
    fieldLabels,
    clusterRegions,
    /** The note whose neighbourhood is in focus: dragged, else hovered, else keyboard-focused, else selected. */
    focusCenter: () => {
      const center = focusCenter();
      return center && graph.hasNode(center) && !isHidden(center) ? center : null;
    },
    /** Field names over the map: on for the all-fields view at `/graph`. */
    setFieldLabels(on: boolean) {
      if (on === fieldLabelsOn) return;
      fieldLabelsOn = on;
      requestRestyle();
    },
    start,
    node: (id: string): GraphNode | undefined => nodes.get(id),
    breadcrumb(id: string) {
      const node = nodes.get(id);
      return node ? breadcrumb(data, node) : "";
    },
  };
}

export type MapModel = ReturnType<typeof createMapModel>;
