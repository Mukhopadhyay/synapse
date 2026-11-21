/**
 * Slipbox: a card-catalogue drawer of nine index cards, one note each, filed
 * alphabetically, so the notes a card leans on sit anywhere in the drawer.
 * The card under the pointer rises out of the file, and the cards it requires
 * rise after it, one hop at a time, each hop lower than the last: you see
 * what to read first without a single line drawn between them. The punches
 * on a card's tab count how many notes it requires; a foundation has none.
 * At rest one card stands a little proud with the bright edge: start here.
 * The slider is the delay per hop, in ms.
 *
 * The pattern: discrete items, a stagger by hop count, and a hit test on
 * static bands along the resting top edges, so a rising card cannot flip
 * the choice (rule 01).
 *
 * In Synapse the cards are data: `NOTES` is [slug, the cards it requires] in
 * filing order, at most nine, and `START` is the card that stands proud.
 * Everything else is the figure as Hairline's checks passed it.
 */
export function createSlipbox(HL, NOTES, START) {
  const {
    Cam, clamp, facing, fillet, fit, hull, open, poly, proj, rad, ringAt, rrect, run, seg,
    tdone, tset, tval, tween, disposer, mk, place, pointer, reflect, register,
  } = HL;

  const N = NOTES.length, W = 84, H = 48, G = 12, TW = 22, TH = 7, TABS = [6, 31, 56], TK = 1.4;
  const LEAN = -12, LIFT = 34, PROUD = 9, FALL = [1, 0.68, 0.46, 0.3], REACH = 3;
  const X0 = -5, X1 = W + 5, Y0 = -9, Y1 = (N - 1) * G + 9, WH = 18, WR = 6, WT = 2.4;

  const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());

  /** The drawer, which never moves: `far` is painted before the cards, `near` after them; each entry is [d, class]. */
  function drawer(P, front, outer, inner) {
    const far = [
      [poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), "sil"],
      [poly(ringAt(P, inner, WH)), "nf"],
      [open(ringAt(P, run(inner, (q) => !front(q)), 2.5)), "nf lo"],
    ];
    const iF = LR(ringAt(P, run(inner, front), WH)), oT = LR(ringAt(P, run(outer, front), WH)), oB = LR(ringAt(P, run(outer, front), 0));
    // on the front: a pull, and above it the frame a catalogue drawer keeps its label in, left empty
    const hx = (X0 + X1) / 2, onFront = (ring) => ring.map((q) => P(q.u, Y1, q.v));
    const near = [
      [poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), "fo"],
      [open(oT), "nf lo"],
      [open(iF), "nf"],
      [open([oT[0], ...oB, oT[oT.length - 1]]), "nf sil"],
      [poly(onFront(rrect(hx - 15, 10.5, hx + 15, 15.5, 1.2, 4))), "nf"],
      [poly(onFront(rrect(hx - 13.6, 11.6, hx + 13.6, 14.4, 0.6, 4))), "nf lo"],
      [poly(onFront(rrect(hx - 9, 3.2, hx + 9, 8, 2.4, 5))), "nf"],
      [poly(onFront(rrect(hx - 7.4, 4.4, hx + 7.4, 6.8, 1.2, 5))), "nf lo"],
    ];
    return { far, near };
  }

  /** Card i's outline, upright in its own plane, with its tab at one of three places. */
  function outline(i) {
    const t0 = TABS[i % 3];
    const shape = fillet(
      [[0, 0], [W, 0], [W, H], [t0 + TW, H], [t0 + TW, H + TH], [t0, H + TH], [t0, H], [0, H]],
      [1, 1, 3.2, 1.8, 2.4, 2.4, 1.8, 3.2],
    );
    return { t0, shape };
  }

  /** Card i at the file's lean, lifted by `lift`: its paths, and where its eight punches sit. */
  function pose(P, i, t0, shape, lift) {
    const yb = i * G, s = Math.sin(rad(LEAN)), c = Math.cos(rad(LEAN));
    const w = (u, v) => P(u, yb + v * s, v * c + lift);
    const wb = (u, v) => P(u, yb + v * s - TK * c, v * c + TK * s + lift);
    const punch = [];
    for (let k = 0; k < 8; k++) punch.push(w(t0 + TW / 2 + ((k % 4) - 1.5) * 3.6, H + TH / 2 + (0.5 - Math.floor(k / 4)) * 2.8));
    return {
      back: poly(shape.map((p) => wb(p[0], p[1]))),
      face: poly(shape.map((p) => w(p[0], p[1]))),
      head: seg(w(6, H - 10), w(W - 6, H - 10)),
      rules: [H - 17, H - 24, H - 31].map((v) => seg(w(6, v), w(W - 6, v))).join(""),
      punch,
    };
  }

  /** Hops from card a back through what it requires, clamped at REACH; -1 for cards it does not reach. */
  function hops(a) {
    const d = new Array(N).fill(-1);
    if (a < 0) return d;
    d[a] = 0;
    const q = [a];
    while (q.length) { const i = q.shift(); if (d[i] < REACH) for (const j of NOTES[i][1]) if (d[j] < 0) { d[j] = d[i] + 1; q.push(j); } }
    return d;
  }

  function mount({ stage, svg, read }, value) {
    const bag = disposer();
    let step = value;

    // fitted to the drawer with the back card at full lift, so no pose leaves the frame
    const C = Cam(45, 0.5, 1.58);
    const tip = (H + TH) * Math.cos(rad(LEAN)), back = (H + TH) * Math.sin(rad(LEAN));
    fit(C, [[X0, Y0, 0], [X1, Y1, -8], [X1, Y0, 0], [X0, Y1, 0], [X0, Y0 + back, tip + LIFT], [X1, Y0 + back, tip + LIFT]], 200, 166);
    const P = proj(C), front = facing(C);
    const outer = rrect(X0, Y0, X1, Y1, WR, 6), inner = rrect(X0 + WT, Y0 + WT, X1 - WT, Y1 - WT, WR - WT, 6);
    const paths = drawer(P, front, outer, inner);

    const g = mk("g", {}, svg);
    reflect(svg, g, P, front, outer, 0, 14);
    for (const [d, cls] of paths.far) mk("path", { d, class: cls }, g);

    const cards = NOTES.map(([slug, req], i) => {
      const { t0, shape } = outline(i);
      const grp = mk("g", {}, g);
      const backEl = mk("path", { class: "lo" }, grp), face = mk("path", { class: "sil" }, grp);
      const head = mk("path", { class: "nf" }, grp), rules = mk("path", { class: "nf lo" }, grp);
      // one punch for every note this card requires; the rest of the grid stays dim
      const punch = [];
      for (let k = 0; k < 8; k++) punch.push(mk("circle", { r: 1.05, class: "dot " + (k < req.length ? "m" : "off") }, grp));
      return { slug, t0, shape, backEl, face, head, rules, punch, z: tween(i === START ? PROUD : 0), last: NaN };
    });

    for (const [d, cls] of paths.near) mk("path", { d, class: cls }, g);

    // hit bands: oblique strips along the RESTING top edges. They never move, and nothing draws them.
    const top = (i) => P(W / 2, i * G + H * Math.sin(rad(LEAN)), H * Math.cos(rad(LEAN)));
    const c0 = top(0), c1 = top(1), dv = [c1[0] - c0[0], c1[1] - c0[1]];
    const px0 = P(0, 0, 0), px1 = P(1, 0, 0), ex = [px1[0] - px0[0], px1[1] - px0[1]];
    const HALF = W / 2 + 6, det = dv[0] * ex[1] - dv[1] * ex[0];

    /** The card whose band holds the point; -1 outside. */
    function hit([x, y]) {
      const qx = x - c0[0], qy = y - c0[1];
      const s = (qx * ex[1] - qy * ex[0]) / det, r = (dv[0] * qy - dv[1] * qx) / det;
      if (Math.abs(r) > HALF || s < -0.5 || s > N + 1) return -1;
      return clamp(Math.round(s), 0, N - 1);
    }

    function draw(i, lift) {
      const cd = cards[i];
      if (lift === cd.last) return;
      cd.last = lift;
      const q = pose(P, i, cd.t0, cd.shape, lift);
      cd.backEl.setAttribute("d", q.back);
      cd.face.setAttribute("d", q.face);
      cd.head.setAttribute("d", q.head);
      cd.rules.setAttribute("d", q.rules);
      cd.punch.forEach((el, k) => place(el, q.punch[k]));
    }

    const B = register(stage, (_dt, now) => {
      let moving = false;
      cards.forEach((cd, i) => { draw(i, tval(cd.z, now)); if (!tdone(cd.z, now)) moving = true; });
      return moving;
    });
    bag.add(B.unregister);

    /** Lights card a: the bright edge and its punches. */
    function light(a) {
      cards.forEach((cd, i) => {
        cd.face.classList.toggle("hi", i === a); cd.head.classList.toggle("hi", i === a);
        cd.punch.forEach((el, k) => { el.classList.toggle("m", k < NOTES[i][1].length && i !== a); });
      });
    }

    let act = -1, depth = hops(-1);
    /** Pulls card a and what it requires, hop by hop (-1 files them all back, the start card proud again). */
    function setActive(a) {
      if (a === act) return;
      const now = performance.now(), next = hops(a), was = depth;
      act = a; depth = next;
      cards.forEach((cd, i) => {
        const d = next[i];
        const to = a < 0 ? (i === START ? PROUD : 0) : d < 0 ? 0 : LIFT * FALL[d];
        tset(cd.z, to, now, (d >= 0 ? d : Math.max(was[i], 0)) * step);
      });
      light(a < 0 ? START : a);
      const n = next.filter((d) => d > 0).length;
      read.textContent = a < 0 ? "rest" : NOTES[a][0] + (n ? " ← " + n : " · base");
      B.wake();
    }

    light(START);
    read.textContent = "rest";
    bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
    bag.add(() => svg.replaceChildren());

    return {
      set: (v) => { step = v; },
      destroy: bag.dispose,
    };
  }

  return {
    name: "slipbox",
    means: "A drawer of index cards: the card under the pointer rises, and the cards it requires rise after it, hop by hop.",
    rules: [1, 2, 3, 5, 10],
    range: [40, 110, 200],
    tour: [[151, 181], [258, 127], [218, 147], null],
    mount,
  };
}
