"use client";

import { useEffect, useRef } from "react";

// Deterministic PRNG so the graph layout doesn't reshuffle on every render.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type GraphNode = { x: number; y: number; r: number; depth: 0 | 1 | 2 };
type Edge = { a: number; b: number; kind: "primary" | "branch" | "citation" };

const PALETTES = {
  // Ink-grey lines on a warm paper ground; the amber gradient marks only the
  // root document and its chapters.
  light: {
    branchLine: "rgba(26,25,23,0.16)",
    citeLine: "rgba(26,25,23,0.09)",
    leaf: "rgba(26,25,23,0.34)",
    branch: "rgba(26,25,23,0.5)",
    mainFill: "#c8792e",
    mainGlow: "rgba(200,121,46,0.45)",
    gradFrom: "rgba(200,121,46,0.6)",
    gradTo: "rgba(168,74,61,0.28)",
  },
  // Off-white lines on a dark ink ground, brighter amber for the root.
  dark: {
    branchLine: "rgba(243,241,236,0.14)",
    citeLine: "rgba(243,241,236,0.07)",
    leaf: "rgba(243,241,236,0.42)",
    branch: "rgba(243,241,236,0.62)",
    mainFill: "#e8a33d",
    mainGlow: "rgba(232,163,61,0.55)",
    gradFrom: "rgba(232,163,61,0.65)",
    gradTo: "rgba(193,91,74,0.3)",
  },
};

/**
 * Generative backdrop: a document at the root, its chapters, and their
 * sections — a small, deliberate hierarchy (think a constitution's structure)
 * fanned out to one side, not a scatter of unrelated points. Used behind the
 * landing hero and the auth aside panel.
 */
export function CitationGraphBackdrop({
  variant = "light",
  scale = 1,
}: {
  variant?: "light" | "dark";
  /** Multiplies node size and line weight — use >1 to make the graph read larger in a big panel. */
  scale?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = canvas?.parentElement;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = PALETTES[variant];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = mulberry32(11);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let nodes: GraphNode[] = [];
    let edges: Edge[] = [];
    let raf = 0;

    function layout() {
      const rect = wrap!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // The tree fans out to one side only, anchored at the edge of a "safe"
      // zone so it never sits behind the panel's own text column — rightward
      // on wide panels, upward from the bottom on narrow stacked ones.
      const stacked = width < 760;
      const margin = 24;
      const xMin = stacked ? margin : width * 0.58;
      const xMax = width - margin;
      const yMin = margin;
      const yMax = height - margin;
      const clampX = (x: number) => Math.min(Math.max(x, xMin), xMax);
      const clampY = (y: number) => Math.min(Math.max(y, yMin), yMax);

      const originX = stacked ? width * 0.5 : xMin;
      const originY = stacked ? height * 0.94 : height * 0.5;
      const arcCenter = stacked ? -Math.PI / 2 : 0;
      const arcSpan = stacked ? Math.PI * 0.6 : Math.PI * 0.72;
      const maxRadius = stacked ? height * 0.6 : Math.max(xMax - originX, height * 0.5) * 1.05;

      nodes = [{ x: originX, y: originY, r: 8 * scale, depth: 0 }];
      edges = [];

      const branchCount = 6;
      for (let i = 0; i < branchCount; i++) {
        const t = i / (branchCount - 1);
        const angle = arcCenter - arcSpan / 2 + arcSpan * t + (rand() - 0.5) * 0.06;

        const radius = maxRadius * (0.42 + rand() * 0.14);
        const bx = clampX(originX + Math.cos(angle) * radius);
        const by = clampY(originY + Math.sin(angle) * radius);
        const bIdx = nodes.length;
        nodes.push({ x: bx, y: by, r: 4.4 * scale, depth: 1 });
        edges.push({ a: 0, b: bIdx, kind: "primary" });

        const leafCount = 1 + Math.floor(rand() * 3);
        const subSpan = (arcSpan / branchCount) * 0.85;
        for (let j = 0; j < leafCount; j++) {
          const leafAngle = angle + (rand() - 0.5) * subSpan;
          const leafRadius = radius + maxRadius * (0.26 + rand() * 0.2);
          const lx = clampX(originX + Math.cos(leafAngle) * leafRadius);
          const ly = clampY(originY + Math.sin(leafAngle) * leafRadius);
          const lIdx = nodes.length;
          nodes.push({ x: lx, y: ly, r: (2 + rand() * 1.6) * scale, depth: 2 });
          edges.push({ a: bIdx, b: lIdx, kind: "branch" });
        }
      }

      // A handful of quiet cross-links between leaves of different branches —
      // sections of the same document that cite one another — so the diagram
      // reads as a connected network, not a strict, sterile tree.
      const leaves = nodes.map((n, i) => ({ n, i })).filter((o) => o.n.depth === 2);
      const crossLinks = Math.min(4, Math.floor(leaves.length / 3));
      for (let i = 0; i < crossLinks; i++) {
        const a = leaves[Math.floor(rand() * leaves.length)];
        const b = leaves[Math.floor(rand() * leaves.length)];
        if (a && b && a.i !== b.i) edges.push({ a: a.i, b: b.i, kind: "citation" });
      }
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, width, height);
      const pulse = reduceMotion ? 1 : 0.72 + 0.28 * Math.sin(t / 900);

      const grad = ctx!.createLinearGradient(nodes[0].x, nodes[0].y, width, height);
      grad.addColorStop(0, colors.gradFrom);
      grad.addColorStop(1, colors.gradTo);

      for (const edge of edges) {
        const from = nodes[edge.a];
        const to = nodes[edge.b];
        ctx!.beginPath();
        ctx!.moveTo(from.x, from.y);
        ctx!.lineTo(to.x, to.y);
        if (edge.kind === "primary") {
          ctx!.strokeStyle = grad;
          ctx!.lineWidth = 1.4 * scale;
          ctx!.globalAlpha = 0.75;
        } else if (edge.kind === "branch") {
          ctx!.strokeStyle = colors.branchLine;
          ctx!.lineWidth = scale;
          ctx!.globalAlpha = 1;
        } else {
          ctx!.strokeStyle = colors.citeLine;
          ctx!.lineWidth = scale;
          ctx!.globalAlpha = 1;
        }
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;

      for (const n of nodes) {
        ctx!.beginPath();
        if (n.depth === 0) {
          ctx!.shadowColor = colors.mainGlow;
          ctx!.shadowBlur = 18 * pulse * scale;
          ctx!.fillStyle = colors.mainFill;
          ctx!.arc(n.x, n.y, n.r * (0.9 + 0.1 * pulse), 0, Math.PI * 2);
        } else {
          ctx!.shadowBlur = 0;
          ctx!.fillStyle = n.depth === 1 ? colors.branch : colors.leaf;
          ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        }
        ctx!.fill();
      }
    }

    function frame(t: number) {
      draw(t);
      if (!reduceMotion) raf = requestAnimationFrame(frame);
    }

    function handleResize() {
      layout();
      if (reduceMotion) draw(0);
    }

    layout();
    if (reduceMotion) {
      draw(0);
    } else {
      raf = requestAnimationFrame(frame);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [variant, scale]);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}
