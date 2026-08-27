import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Menu, X, ChevronDown, ArrowUp, Wind, Copy, Check, Sun, Moon, Sparkles } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

/* ============================================================
   TOKENS
   Warna: night #171633 · lavender #C9C2F0 · sage #8FAE87
          sand #F3ECDF · coral #E8A793 · ink #2E2A4A
   Tipografi: Fraunces (display) · Plus Jakarta Sans (body) · JetBrains Mono (label)
   Signature: "Kembang Napas" — bunga yang mekar-kuncup mengikuti ritme napas
   ============================================================ */

const SECTIONS = [
  { id: "beranda", label: "Beranda" },
  { id: "rasakan", label: "Kenali Rasanya" },
  { id: "kenapa", label: "Kenapa Bisa Begini" },
  { id: "batasan", label: "Batasan Emosional" },
  { id: "sembuh", label: "Cara Menenangkan" },
  { id: "islam", label: "Perspektif Islam" },
  { id: "jurnal", label: "Jurnal Perasaan" },
  { id: "penutup", label: "Penutup" },
];

const DEFAULT_THEME = ["dark", "light", "dark", "light", "dark", "light", "light", "dark"];

const PROMPTS = [
  "Apa yang lagi paling terasa berat hari ini?",
  "Perasaan siapa yang paling kamu pikirkan sekarang?",
  "Kalau boleh jujur, apa yang sebenarnya kamu butuhkan saat ini?",
  "Ada rasa bersalah yang mengganjal? Coba tuliskan di sini.",
];

const MOODS = [
  { v: 1, e: "😔", label: "Sangat berat" },
  { v: 2, e: "🙁", label: "Berat" },
  { v: 3, e: "😐", label: "Biasa" },
  { v: 4, e: "🙂", label: "Lumayan" },
  { v: 5, e: "😊", label: "Baik" },
];

const RESPONSE_RULES = [
  { keys: ["capek", "lelah", "cape", "pusing", "penat"], reply: "Wajar banget kalau capek — kamu sudah menampung banyak hal sekaligus. Gak apa-apa untuk berhenti dulu sejenak, sebelum lanjut memikirkan yang lain." },
  { keys: ["bersalah", "salah aku", "salahku", "nyalahin diri"], reply: "Rasa bersalah itu terasa nyata, tapi belum tentu itu benar-benar salahmu. Coba tanya lagi: ini memang tanggung jawabmu, atau cuma perasaan yang menempel?" },
  { keys: ["bingung", "gatau", "ga tau", "gak tau", "bimbang"], reply: "Gak apa-apa kalau belum tahu harus gimana. Kamu gak harus punya jawabannya sekarang. Cukup akui dulu bahwa kamu sedang bingung — itu sudah langkah yang jujur." },
  { keys: ["sedih", "kecewa", "nangis", "sakit hati"], reply: "Perasaan sedih itu boleh ada, gak perlu buru-buru diusir. Kamu boleh merasakannya dulu, pelan-pelan, tanpa harus langsung baik-baik saja." },
  { keys: ["marah", "kesal", "emosi", "jengkel"], reply: "Marah juga perasaan yang sah, bukan sesuatu yang harus ditahan terus. Coba beri jeda sebentar sebelum meresponsnya keluar." },
  { keys: ["takut", "khawatir", "cemas"], reply: "Kekhawatiran itu sering muncul saat kita peduli sama sesuatu. Tarik napas dulu — kamu gak perlu menyelesaikan semuanya di kepala malam ini juga." },
];
const DEFAULT_REPLY = "Terima kasih sudah menuliskannya. Apa pun yang kamu rasakan sekarang, itu valid — tidak perlu buru-buru diperbaiki atau dijelaskan ke siapa pun dulu.";
function pickReply(text) {
  const t = text.toLowerCase();
  const hit = RESPONSE_RULES.find((r) => r.keys.some((k) => t.includes(k)));
  return hit ? hit.reply : DEFAULT_REPLY;
}

const CLOSING_QUOTES = [
  "Merasakan banyak hal bukan kelemahan — itu tanda kamu peduli.",
  "Kamu boleh berhenti sejenak. Dunia tidak akan runtuh karena itu.",
  "Tidak semua beban harus kamu yang pikul sendirian.",
  "Setelah kesulitan, biasanya ada kemudahan yang menyusul.",
  "Pelan-pelan juga sampai, asal tidak berhenti merawat diri.",
  "Kepedulianmu berharga — jaga juga dirimu yang merasakannya.",
];

const ISLAM_POINTS = [
  { ref: "QS. Al-Baqarah 2:286", title: "Setiap orang punya batas kesanggupannya", body: "Allah tidak membebani seseorang melebihi kemampuannya — termasuk kemampuan menanggung perasaan orang lain." },
  { ref: "QS. Al-An'am 6:164", title: "Tidak ada yang memikul beban orang lain", body: "Setiap jiwa bertanggung jawab atas perbuatannya sendiri; perasaan dan pilihan orang lain bukan tanggunganmu." },
  { ref: "QS. Ar-Ra'd 13:28", title: "Hati menjadi tenang saat mengingat Allah", body: "Dzikir dan doa disebutkan sebagai cara hati menemukan ketenangan di tengah kegelisahan." },
  { ref: "HR. Bukhari", title: "Tubuhmu juga punya hak atasmu", body: "Dalam sebuah riwayat, sahabat Nabi diingatkan agar tidak memaksakan diri terus-menerus — istirahat dan menjaga diri termasuk hak yang harus dipenuhi." },
  { ref: "HR. Bukhari-Muslim", title: "Perumpamaan orang beriman seperti satu tubuh", body: "Saling merasakan dianjurkan, tapi setiap bagian tubuh tetap punya perannya sendiri — bukan mengambil alih peran yang lain." },
  { ref: "Sabar & tawakal", title: "Berusaha, lalu berserah", body: "Setelah membantu semampunya, hasil dan perasaan orang lain diserahkan kembali kepada Allah — tidak perlu ditanggung sendirian." },
];

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`reveal ${visible ? "reveal-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------- Kembang Napas (signature visual) ---------- */
function Bloom({ size = 190, tone = "lavender", phase, drift = true }) {
  const petalCount = 6;
  const scale = phase === "tarik" ? 1.16 : phase === "tahan" ? 1.16 : phase === "hembus" ? 0.82 : 1;
  return (
    <div
      className={`bloom ${drift ? "bloom-drift" : ""}`}
      style={{ width: size, height: size, transform: phase ? `scale(${scale})` : undefined, transition: phase ? "transform 3.4s ease-in-out" : undefined }}
    >
      <div className={`bloom-petals bloom-${tone} ${!phase ? "bloom-breathe" : ""}`}>
        {Array.from({ length: petalCount }).map((_, i) => (
          <div key={i} className="petal" style={{ transform: `translate(-50%,-100%) rotate(${i * (360 / petalCount)}deg)` }} />
        ))}
        <div className="bloom-center" />
      </div>
    </div>
  );
}

/* ---------- Partikel ambient ---------- */
function Particles() {
  const particles = useMemo(() => {
    const tones = ["p-lavender", "p-coral", "p-sage"];
    return Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 16 + Math.random() * 14,
      delay: Math.random() * -20,
      tone: tones[i % tones.length],
    }));
  }, []);
  return (
    <div className="particles-layer" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className={`particle ${p.tone}`}
          style={{ left: `${p.left}%`, width: p.size, height: p.size, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}
        />
      ))}
    </div>
  );
}

export default function RuangTenang() {
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [forcedTheme, setForcedTheme] = useState("auto"); // auto | dark | light
  const [fontScale, setFontScale] = useState(1);
  const [scrollPct, setScrollPct] = useState(0);
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);

  const enterApp = useCallback(() => {
    setLeaving(true);
    setTimeout(() => setEntered(true), 520);
  }, []);

  const scrollTo = useCallback((idx) => {
    sectionRefs.current[idx]?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number(entry.target.dataset.idx));
        });
      },
      { root: container, threshold: 0.55 }
    );
    sectionRefs.current.forEach((el) => el && io.observe(el));

    const onScroll = () => {
      const max = container.scrollHeight - container.clientHeight;
      setScrollPct(max > 0 ? (container.scrollTop / max) * 100 : 0);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      container.removeEventListener("scroll", onScroll);
    };
  }, []);

  const resolveTheme = (i) => (forcedTheme === "auto" ? DEFAULT_THEME[i] : forcedTheme);
  const cycleTheme = () => setForcedTheme((t) => (t === "auto" ? "dark" : t === "dark" ? "light" : "auto"));
  const themeIcon = forcedTheme === "dark" ? <Moon size={15} /> : forcedTheme === "light" ? <Sun size={15} /> : <Sparkles size={15} />;

  return (
    <div className="rt-root" style={{ "--scale": fontScale }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,450;0,9..144,600;1,9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .rt-root {
          --night:#171633; --night-2:#201f43; --lavender:#C9C2F0; --sage:#8FAE87; --sand:#F3ECDF; --coral:#E8A793; --ink:#2E2A4A;
          font-family:'Plus Jakarta Sans', sans-serif; color: var(--ink); width:100%; height:100dvh; position:relative; overflow:hidden;
        }
        .rt-scroll { height:100dvh; overflow-y:auto; overflow-x:hidden; scroll-snap-type:y mandatory; scrollbar-width:none; }
        .rt-scroll::-webkit-scrollbar { display:none; }
        .rt-section { min-height:100dvh; width:100%; scroll-snap-align:start; display:flex; flex-direction:column; justify-content:center; padding:5.5rem 1.35rem 3rem; position:relative; overflow:hidden; }
        .theme-dark { background: radial-gradient(120% 100% at 50% 0%, var(--night-2), var(--night) 70%); color: var(--sand); }
        .theme-light { background: linear-gradient(180deg, var(--sand), #ece2cf); color: var(--ink); }

        /* ---- beranda (hero) — dibedakan dari section gelap lain ---- */
        .rt-hero {
          background:
            radial-gradient(85% 55% at 50% 8%, rgba(201,194,240,0.20), transparent 62%),
            radial-gradient(70% 50% at 12% 96%, rgba(232,167,147,0.16), transparent 60%),
            radial-gradient(120% 100% at 50% 0%, var(--night-2), var(--night) 72%);
          color: var(--sand);
        }
        .rt-hero::after {
          content:""; position:absolute; inset:0; z-index:0; pointer-events:none;
          background-image: radial-gradient(rgba(243,236,223,0.09) 1px, transparent 1px);
          background-size: 26px 26px; mask-image: radial-gradient(70% 60% at 50% 35%, #000 20%, transparent 75%);
        }
        .hero-glow { position:absolute; top:2%; left:50%; transform:translateX(-50%); width:280px; height:280px; border-radius:50%; background: radial-gradient(circle, rgba(201,194,240,0.32), transparent 70%); filter:blur(2px); z-index:0; pointer-events:none; }
        .hero-divider { width:2.1rem; height:2px; margin:0.95rem auto 1.25rem; border-radius:999px; background:linear-gradient(90deg, var(--coral), var(--sage)); }
        .hero-accent { font-style:italic; color:var(--coral); }
        .hero-scale { transform: scale(0.94); transform-origin:top center; }

        .eyebrow { font-family:'JetBrains Mono', monospace; font-size:0.7rem; letter-spacing:0.16em; text-transform:uppercase; opacity:0.65; display:flex; align-items:center; gap:0.5rem; margin-bottom:0.9rem; }
        h1, h2, h3 { font-family:'Fraunces', serif; margin:0; line-height:1.08; }
        h1 { font-size: calc(var(--scale) * clamp(2.1rem, 9vw, 3.4rem)); font-weight:450; }
        h2 { font-size: calc(var(--scale) * clamp(1.6rem, 7vw, 2.4rem)); font-weight:450; }
        h3 { font-size: calc(var(--scale) * 1.08rem); }
        p { font-size: calc(var(--scale) * clamp(0.98rem, 4vw, 1.08rem)); line-height:1.65; }
        .lede { max-width:34rem; opacity:0.92; }

        .rt-topbar { position:fixed; top:6px; left:0; right:0; z-index:40; display:flex; align-items:center; justify-content:space-between; padding:1rem 1.2rem; pointer-events:none; }
        .rt-chapter-tag { font-family:'JetBrains Mono', monospace; font-size:0.72rem; letter-spacing:0.08em; padding:0.4rem 0.8rem; border-radius:999px; background:rgba(23,22,51,0.55); backdrop-filter:blur(8px); color:#fff; pointer-events:auto; }
        .rt-controls { display:flex; align-items:center; gap:0.4rem; pointer-events:auto; }
        .rt-icon-btn { background:rgba(23,22,51,0.55); backdrop-filter:blur(8px); border:none; color:#fff; width:2.2rem; height:2.2rem; border-radius:999px; display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono', monospace; font-size:0.78rem; font-weight:600; }

        .rt-progress { position:fixed; top:0; left:0; height:3px; z-index:60; background:linear-gradient(90deg, var(--coral), var(--sage)); transition:width .1s linear; }

        .rt-dots { position:fixed; right:0.85rem; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:0.55rem; z-index:35; }
        .rt-dot { width:7px; height:7px; border-radius:50%; background:rgba(255,255,255,0.35); transition:all .3s ease; border:none; padding:0; }
        .rt-dot.active { background: var(--coral); height:20px; border-radius:5px; }

        .rt-overlay { position:fixed; inset:0; z-index:50; background:rgba(20,18,45,0.92); backdrop-filter:blur(10px); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.4rem; animation:fadeIn .25s ease; }
        .rt-overlay button.chapter { background:none; border:none; color:var(--sand); font-family:'Fraunces', serif; font-size:1.4rem; padding:0.45rem 1rem; opacity:0.55; transition:opacity .2s; }
        .rt-overlay button.chapter.current { opacity:1; color:var(--coral); }
        .rt-overlay .close-btn { position:absolute; top:1.1rem; right:1.2rem; background:rgba(255,255,255,0.12); border:none; color:#fff; width:2.4rem; height:2.4rem; border-radius:999px; display:flex; align-items:center; justify-content:center; }
        @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }

        .reveal { opacity:0; transform:translateY(28px) rotateX(6deg); transform-origin:top center; transition:opacity .7s ease, transform .7s cubic-bezier(.2,.7,.3,1); will-change:transform, opacity; }
        .reveal-in { opacity:1; transform:translateY(0) rotateX(0); }

        /* ---- Kembang Napas ---- */
        .bloom { position:relative; margin:0 auto; }
        .bloom-drift { animation: driftRotate 40s linear infinite; }
        @keyframes driftRotate { 0%{transform:rotate(-2deg);} 50%{transform:rotate(2deg);} 100%{transform:rotate(-2deg);} }
        .bloom-petals { position:relative; width:100%; height:100%; }
        .bloom-breathe { animation: bloomBreathe 7s ease-in-out infinite; }
        @keyframes bloomBreathe { 0%,100%{ transform:scale(0.94);} 50%{ transform:scale(1.06);} }
        .petal { position:absolute; top:50%; left:50%; width:34%; height:56%; border-radius:50% 50% 50% 4%; transform-origin:50% 100%; opacity:0.92; }
        .bloom-lavender .petal { background: linear-gradient(160deg, #EFEBFC, var(--lavender) 55%, #9089cf); }
        .bloom-sage .petal { background: linear-gradient(160deg, #e4f1e0, var(--sage) 55%, #628660); }
        .bloom-coral .petal { background: linear-gradient(160deg, #fce4d9, var(--coral) 55%, #c17d68); }
        .bloom-center { position:absolute; top:50%; left:50%; width:16%; height:16%; transform:translate(-50%,-50%); border-radius:50%; background: radial-gradient(circle at 40% 35%, #fff8ec, #e8c988 70%, #c79a4f); box-shadow:0 0 24px 4px rgba(232,167,147,0.35); }

        /* ---- partikel ambient ---- */
        .particles-layer { position:fixed; inset:0; z-index:2; pointer-events:none; overflow:hidden; }
        .particle { position:absolute; bottom:-5%; border-radius:50%; animation-name:riseUp; animation-timing-function:linear; animation-iteration-count:infinite; }
        .p-lavender { background: var(--lavender); opacity:0.35; }
        .p-coral { background: var(--coral); opacity:0.3; }
        .p-sage { background: var(--sage); opacity:0.3; }
        @keyframes riseUp { 0%{ transform:translateY(0) translateX(0); opacity:0; } 10%{ opacity:0.4; } 90%{ opacity:0.25; } 100%{ transform:translateY(-110vh) translateX(12px); opacity:0; } }

        .rt-section > * { position:relative; z-index:3; }

        .tilt-list { display:flex; flex-direction:column; gap:1rem; max-width:30rem; margin:0 auto; width:100%; }
        .tilt-card { background:rgba(255,255,255,0.65); border:1px solid rgba(46,42,74,0.08); border-radius:1.1rem; padding:1.1rem 1.25rem; display:flex; gap:0.85rem; align-items:flex-start; box-shadow:0 14px 30px -18px rgba(46,42,74,0.35); color:var(--ink); }
        .tilt-card:nth-child(odd) { transform:rotate(-1.1deg); }
        .tilt-card:nth-child(even) { transform:rotate(1.1deg); }
        .tilt-emoji { font-size: calc(var(--scale) * 1.5rem); line-height:1; }

        .factor-grid { display:grid; grid-template-columns:1fr; gap:0.9rem; max-width:34rem; margin:0 auto; width:100%; }
        @media (min-width:640px) { .factor-grid { grid-template-columns:1fr 1fr; } }
        .factor-card { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:1.1rem; padding:1.15rem; backdrop-filter:blur(6px); }
        .factor-card .num { font-family:'JetBrains Mono', monospace; font-size:0.72rem; opacity:0.55; }
        .factor-card h3 { margin:0.35rem 0 0.4rem; color:var(--lavender); }
        .factor-card p { font-size: calc(var(--scale) * 0.92rem); opacity:0.85; margin:0; }

        .compare { display:flex; flex-direction:column; gap:0.8rem; max-width:30rem; margin:0 auto 1.6rem; width:100%; }
        @media (min-width:560px) { .compare { flex-direction:row; } }
        .compare-card { flex:1; border-radius:1.1rem; padding:1.1rem 1.2rem; color:var(--ink); }
        .compare-card.no { background:rgba(232,167,147,0.16); border:1px solid rgba(232,167,147,0.4); }
        .compare-card.yes { background:rgba(143,174,135,0.18); border:1px solid rgba(143,174,135,0.45); }
        .compare-card .tag { font-family:'JetBrains Mono', monospace; font-size:0.68rem; text-transform:uppercase; letter-spacing:.08em; opacity:0.65; }
        .compare-card h3 { font-size: calc(var(--scale) * 1.05rem); margin:0.3rem 0; }
        .compare-card p { font-size: calc(var(--scale) * 0.9rem); margin:0; opacity:0.85; }

        .practice-list { display:flex; flex-direction:column; gap:0.75rem; max-width:30rem; margin:0 auto; width:100%; }
        .practice-item { display:flex; gap:0.8rem; align-items:flex-start; }
        .practice-dot { width:8px; height:8px; border-radius:50%; background:var(--sage); margin-top:0.5rem; flex-shrink:0; }
        .practice-item p { margin:0; }

        .heal-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; max-width:30rem; margin:0 auto 1.6rem; width:100%; }
        .heal-card { background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.13); border-radius:1rem; padding:1rem; text-align:center; }
        .heal-card .e { font-size: calc(var(--scale) * 1.6rem); display:block; margin-bottom:0.4rem; }
        .heal-card p { font-size: calc(var(--scale) * 0.85rem); margin:0; opacity:0.85; }

        .breath-box { display:flex; flex-direction:column; align-items:center; gap:1rem; margin-top:0.5rem; }
        .breath-word { font-family:'Fraunces', serif; font-size: calc(var(--scale) * 1.3rem); font-style:italic; min-height:2rem; }
        .breath-btn { font-family:'Plus Jakarta Sans', sans-serif; font-weight:600; background:var(--coral); color:#241a17; border:none; padding:0.7rem 1.4rem; border-radius:999px; font-size: calc(var(--scale) * 0.95rem); }

        /* ---- perspektif islam ---- */
        .islam-pattern { position:absolute; inset:0; opacity:0.07; background-image: repeating-conic-gradient(from 0deg, var(--ink) 0deg 4deg, transparent 4deg 45deg); background-size:64px 64px; pointer-events:none; z-index:1; }
        .theme-dark .islam-pattern { opacity:0.1; background-image: repeating-conic-gradient(from 0deg, var(--sand) 0deg 4deg, transparent 4deg 45deg); }
        .islam-list { display:flex; flex-direction:column; gap:0.8rem; max-width:31rem; margin:0 auto; width:100%; }
        .islam-card { background:rgba(255,255,255,0.85); border:1px solid rgba(46,42,74,0.1); border-radius:1.1rem; padding:1.05rem 1.2rem; box-shadow:0 14px 30px -20px rgba(46,42,74,0.35); color:var(--ink); }
        .islam-card .ref { font-family:'JetBrains Mono', monospace; font-size:0.66rem; text-transform:uppercase; letter-spacing:.05em; color:var(--ink); opacity:0.6; }
        .islam-card h3 { font-size: calc(var(--scale) * 1.02rem); margin:0.3rem 0 0.35rem; color:var(--ink); }
        .islam-card p { font-size: calc(var(--scale) * 0.9rem); margin:0; color:var(--ink); opacity:0.85; }
        .islam-note { max-width:31rem; margin:1.1rem auto 0; font-size: calc(var(--scale) * 0.82rem); color:inherit; opacity:0.7; font-style:italic; }
        /* varian mode gelap: kartu terang diganti kaca gelap supaya tidak bentrok dengan latar */
        .theme-dark .islam-card { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.16); box-shadow:0 14px 30px -20px rgba(0,0,0,0.5); color:var(--sand); }
        .theme-dark .islam-card .ref { color:var(--lavender); opacity:0.8; }
        .theme-dark .islam-card h3 { color:var(--lavender); }
        .theme-dark .islam-card p { color:var(--sand); opacity:0.88; }
        .theme-dark .islam-note { color:var(--sand); opacity:0.75; }

        /* ---- jurnal ---- */
        .journal-wrap { max-width:30rem; margin:0 auto; width:100%; }
        .mood-row { display:flex; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap; }
        .mood-btn { font-size: calc(var(--scale) * 1.4rem); background:rgba(255,255,255,0.55); border:1px solid rgba(46,42,74,0.12); border-radius:0.7rem; width:2.6rem; height:2.6rem; display:flex; align-items:center; justify-content:center; }
        .mood-btn.selected { background:var(--coral); border-color:transparent; }
        .prompt-chips { display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem; }
        .prompt-chip { font-size: calc(var(--scale) * 0.82rem); text-align:left; background:rgba(255,255,255,0.65); border:1px solid rgba(46,42,74,0.12); border-radius:0.8rem; padding:0.55rem 0.85rem; color:var(--ink); line-height:1.35; }
        .prompt-chip.selected { background:var(--sage); color:#17321a; border-color:transparent; }
        .journal-textarea { width:100%; min-height:5.5rem; border-radius:1rem; padding:0.9rem 1rem; border:1px solid rgba(46,42,74,0.15); background:#fff; font-family:'Plus Jakarta Sans', sans-serif; font-size: calc(var(--scale) * 0.95rem); resize:vertical; color:var(--ink); }
        .journal-actions { display:flex; align-items:center; gap:0.6rem; margin-top:0.7rem; flex-wrap:wrap; }
        .journal-submit { display:inline-flex; align-items:center; gap:0.5rem; background:var(--ink); color:#fff; border:none; border-radius:999px; padding:0.65rem 1.2rem; font-size: calc(var(--scale) * 0.9rem); font-weight:600; }
        .journal-submit:disabled { opacity:0.4; }
        .journal-reply { margin-top:1.1rem; background:rgba(143,174,135,0.35); border:1px solid rgba(143,174,135,0.5); border-radius:1rem; padding:1rem 1.1rem; font-style:italic; font-family:'Fraunces', serif; font-size: calc(var(--scale) * 1.02rem); color:var(--ink); }
        .mood-chart-wrap { margin-top:1.6rem; background:rgba(255,255,255,0.7); border-radius:1rem; padding:0.8rem; border:1px solid rgba(46,42,74,0.08); color:var(--ink); }
        .mood-chart-title { font-family:'JetBrains Mono', monospace; font-size:0.68rem; text-transform:uppercase; letter-spacing:.06em; opacity:0.6; margin-bottom:0.4rem; color:var(--ink); }
        .mood-hint { font-size: calc(var(--scale) * 0.82rem); opacity:0.7; margin-top:1.2rem; }
        .journal-history { margin-top:1.8rem; display:flex; flex-direction:column; gap:0.7rem; }
        .journal-history-title { font-family:'JetBrains Mono', monospace; font-size:0.68rem; text-transform:uppercase; letter-spacing:.08em; opacity:0.7; display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; }
        .journal-entry { background:rgba(255,255,255,0.8); border-radius:0.9rem; padding:0.8rem 0.95rem; border:1px solid rgba(46,42,74,0.08); color:var(--ink); }
        .journal-entry .je-top { display:flex; justify-content:space-between; align-items:center; }
        .journal-entry .je-date { font-family:'JetBrains Mono', monospace; font-size:0.65rem; opacity:0.55; }
        .journal-entry .je-prompt { font-size: calc(var(--scale) * 0.78rem); opacity:0.65; margin:0.15rem 0 0.35rem; }
        .journal-entry .je-text { font-size: calc(var(--scale) * 0.92rem); margin:0 0 0.4rem; }
        .journal-entry .je-reply { font-size: calc(var(--scale) * 0.85rem); font-style:italic; opacity:0.8; margin:0; }
        .journal-clear, .journal-copy { background:none; border:none; opacity:0.55; display:inline-flex; align-items:center; gap:0.3rem; font-size:0.68rem; font-family:'JetBrains Mono', monospace; }
        .je-delete { background:rgba(46,42,74,0.08); border:none; color:var(--ink); opacity:0.55; width:1.4rem; height:1.4rem; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }
        .je-delete:hover { opacity:0.9; background:rgba(232,167,147,0.35); }
        .copy-fallback { width:100%; min-height:6rem; margin-top:0.6rem; border-radius:0.8rem; padding:0.7rem; font-size:0.78rem; border:1px dashed rgba(46,42,74,0.3); background:rgba(255,255,255,0.6); }

        .scroll-cue { position:absolute; bottom:1.8rem; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:0.3rem; opacity:0.6; animation:bob 2.4s ease-in-out infinite; }
        .scroll-cue span { font-family:'JetBrains Mono', monospace; letter-spacing:0.18em; }
        @keyframes bob { 0%,100%{ transform:translate(-50%,0);} 50%{ transform:translate(-50%,8px);} }

        .back-top { position:fixed; bottom:1.2rem; right:1rem; z-index:35; background:rgba(23,22,51,0.55); backdrop-filter:blur(8px); border:none; color:#fff; width:2.6rem; height:2.6rem; border-radius:999px; display:flex; align-items:center; justify-content:center; }

        .rt-watermark { position:fixed; bottom:1.2rem; left:1rem; z-index:35; background:rgba(23,22,51,0.55); backdrop-filter:blur(8px); color:#fff; font-family:'JetBrains Mono', monospace; font-size:0.62rem; letter-spacing:0.04em; padding:0.35rem 0.7rem; border-radius:999px; opacity:0.85; pointer-events:none; }

        /* ---- halaman pembuka ---- */
        .rt-welcome { position:fixed; inset:0; z-index:100; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:2.2rem 1.6rem; background: radial-gradient(120% 100% at 50% 0%, var(--night-2), var(--night) 70%); color: var(--sand); animation: fadeIn .6s ease; transition: opacity .5s ease, transform .5s ease; }
        .rt-welcome.leaving { opacity:0; transform: scale(1.03); pointer-events:none; }
        .rt-welcome .welcome-inner { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; max-width:26rem; }
        .rt-welcome .lede { margin: 1.1rem auto 1.9rem; }
        .rt-welcome-btn { font-family:'Plus Jakarta Sans', sans-serif; font-weight:600; background:var(--coral); color:#241a17; border:none; padding:0.85rem 2.1rem; border-radius:999px; font-size: calc(var(--scale) * 1rem); }

        .quote-btn { margin-top:0.9rem; background:none; border:1px solid rgba(255,255,255,0.35); color:var(--sand); border-radius:999px; padding:0.5rem 1.1rem; font-size: calc(var(--scale) * 0.82rem); }

        @media (prefers-reduced-motion: reduce) {
          .bloom-breathe, .bloom-drift, .scroll-cue, .particle { animation:none !important; }
          .reveal { transition:opacity .3s ease; transform:none !important; }
        }
      `}</style>

      {!entered && (
        <div className={`rt-welcome ${leaving ? "leaving" : ""}`}>
          <Particles />
          <div className="welcome-inner">
            <div style={{ marginBottom: "1.6rem" }}><Bloom size={170} tone="lavender" /></div>
            <div className="eyebrow" style={{ justifyContent: "center" }}>🌙 ruang tenang</div>
            <h1>Selamat datang di<br />Ruang Tenang</h1>
            <p className="lede">Tempat kecil untuk berhenti sejenak, mengenali perasaan yang kamu tanggung, dan belajar meletakkan beban yang bukan milikmu.</p>
            <button className="rt-welcome-btn" onClick={enterApp}>Mulai</button>
          </div>
        </div>
      )}

      <div className="rt-watermark">✦ Aril Ahmad P</div>

      <div className="rt-progress" style={{ width: `${scrollPct}%` }} />
      <Particles />

      <div className="rt-topbar">
        <span className="rt-chapter-tag">{String(active + 1).padStart(2, "0")} · {SECTIONS[active].label}</span>
        <div className="rt-controls">
          <button className="rt-icon-btn" onClick={() => setFontScale((s) => Math.max(0.85, +(s - 0.1).toFixed(2)))} aria-label="Perkecil huruf">A-</button>
          <button className="rt-icon-btn" onClick={() => setFontScale((s) => Math.min(1.3, +(s + 0.1).toFixed(2)))} aria-label="Perbesar huruf">A+</button>
          <button className="rt-icon-btn" onClick={cycleTheme} aria-label="Ganti tema">{themeIcon}</button>
          <button className="rt-icon-btn" onClick={() => setMenuOpen(true)} aria-label="Buka daftar bab"><Menu size={16} /></button>
        </div>
      </div>

      <div className="rt-dots">
        {SECTIONS.map((s, i) => (
          <button key={s.id} className={`rt-dot ${i === active ? "active" : ""}`} onClick={() => scrollTo(i)} aria-label={s.label} />
        ))}
      </div>

      {menuOpen && (
        <div className="rt-overlay">
          <button className="close-btn" onClick={() => setMenuOpen(false)} aria-label="Tutup menu"><X size={18} /></button>
          {SECTIONS.map((s, i) => (
            <button key={s.id} className={`chapter ${i === active ? "current" : ""}`} onClick={() => scrollTo(i)}>{s.label}</button>
          ))}
        </div>
      )}

      <button className="back-top" onClick={() => scrollTo(0)} aria-label="Kembali ke awal"><ArrowUp size={18} /></button>

      <div className="rt-scroll" ref={containerRef}>
        {/* 0. BERANDA */}
        <section
          className={`rt-section ${resolveTheme(0) === "dark" ? "rt-hero" : "theme-light"}`}
          ref={(el) => (sectionRefs.current[0] = el)}
          data-idx={0}
          style={{ alignItems: "center", textAlign: "center" }}
        >
          <div className="hero-scale">
            <div style={{ position: "relative", marginBottom: "1.6rem" }}>
              <div className="hero-glow" />
              <Bloom size={186} tone="lavender" />
            </div>
            <Reveal>
              <div className="eyebrow" style={{ justifyContent: "center" }}>🌙 ruang tenang</div>
              <div className="hero-divider" />
              <h1>Kalau perasaan<br />orang lain terasa<br /><span className="hero-accent">terlalu berat</span></h1>
            </Reveal>
            <Reveal delay={150}>
              <p className="lede" style={{ margin: "1.2rem auto 0", maxWidth: "26rem" }}>Ada orang yang gampang ikut merasakan apa yang dirasakan orang di sekitarnya — sampai capek sendiri. Ini bukan sesuatu yang salah. Yuk kenali lebih dulu.</p>
            </Reveal>
          </div>
          <div className="scroll-cue">
            <span style={{ fontSize: "0.68rem" }}>GULIR</span>
            <ChevronDown size={16} />
          </div>
        </section>

        {/* 1. KENALI RASANYA */}
        <section className={`rt-section theme-${resolveTheme(1)}`} ref={(el) => (sectionRefs.current[1] = el)} data-idx={1}>
          <Reveal>
            <div className="eyebrow">🫧 kenali rasanya</div>
            <h2>Tanda-tanda ketika kamu<br />ikut menanggung rasa orang lain</h2>
          </Reveal>
          <div className="tilt-list" style={{ marginTop: "1.8rem" }}>
            {[
              ["😮‍💨", "Ikut pusing memikirkan perasaan banyak orang sekaligus, padahal bukan masalahmu."],
              ["🧩", "Merasa harus jadi penengah atau memastikan semua orang baik-baik saja."],
              ["😔", "Muncul rasa bersalah yang tidak jelas asalnya, walau kamu tidak melakukan kesalahan."],
              ["🥱", "Pulang dengan energi yang habis, bukan karena kerja fisik, tapi karena \u201cmenyerap\u201d suasana hati orang lain."],
            ].map(([e, t], i) => (
              <Reveal key={i} delay={i * 90}>
                <div className="tilt-card"><span className="tilt-emoji">{e}</span><p style={{ margin: 0 }}>{t}</p></div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 2. KENAPA BISA BEGINI */}
        <section className={`rt-section theme-${resolveTheme(2)}`} ref={(el) => (sectionRefs.current[2] = el)} data-idx={2}>
          <Reveal>
            <div className="eyebrow">🌿 memahami akarnya</div>
            <h2>Kenapa perasaan ini<br />bisa muncul</h2>
          </Reveal>
          <div className="factor-grid" style={{ marginTop: "1.8rem" }}>
            {[
              ["Empati yang tinggi", "Peka terhadap suasana emosional sekitar, apalagi pada orang-orang terdekat."],
              ["Posisi sebagai penengah", "Sering jadi yang paling peka di keluarga atau lingkaran sosial, jadi otomatis memikirkan semua orang."],
              ["Rasa tanggung jawab berlebih", "Merasa harus meluruskan atau menenangkan semua pihak, padahal itu bukan tugasmu sepenuhnya."],
              ["Kelelahan mental", "Saat lelah, kepekaan terhadap emosi orang lain terasa jauh lebih berat."],
              ["Rasa bersalah yang tertanam", "Pola menyalahkan diri sendiri, walau situasinya sebenarnya bukan salahmu."],
            ].map(([t, d], i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="factor-card"><div className="num">{String(i + 1).padStart(2, "0")}</div><h3 style={{ color: "var(--lavender)" }}>{t}</h3><p>{d}</p></div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 3. BATASAN EMOSIONAL */}
        <section className={`rt-section theme-${resolveTheme(3)}`} ref={(el) => (sectionRefs.current[3] = el)} data-idx={3}>
          <Reveal>
            <div className="eyebrow">🪴 menata batas</div>
            <h2>Peduli, bukan berarti<br />menanggung semuanya</h2>
          </Reveal>
          <div className="compare" style={{ marginTop: "1.8rem" }}>
            <Reveal>
              <div className="compare-card no"><div className="tag">sering tertukar</div><h3>Menanggung tanggung jawab orang lain</h3><p>Merasa wajib memperbaiki atau menyelesaikan perasaan orang lain sampai selesai.</p></div>
            </Reveal>
            <Reveal delay={100}>
              <div className="compare-card yes"><div className="tag">yang lebih sehat</div><h3>Peduli tanpa memikul semuanya</h3><p>Hadir dan mendengarkan, tapi urusan masing-masing tetap kembali ke pemiliknya.</p></div>
            </Reveal>
          </div>
          <Reveal delay={150}><p style={{ maxWidth: "30rem", margin: "0 auto 1.1rem", fontWeight: 600 }}>Beberapa latihan kecil:</p></Reveal>
          <div className="practice-list">
            {[
              "Tanyakan ke diri sendiri: \u201cini memang salahku, atau cuma perasaan yang menempel?\u201d",
              "Beri jeda sebelum bereaksi — tarik napas dulu, baru merespons.",
              "Sisihkan waktu tanpa memikirkan urusan orang lain, walau hanya 15–30 menit sehari.",
            ].map((t, i) => (
              <Reveal key={i} delay={i * 80}><div className="practice-item"><span className="practice-dot" /><p>{t}</p></div></Reveal>
            ))}
          </div>
        </section>

        {/* 4. CARA MENENANGKAN */}
        <section className={`rt-section theme-${resolveTheme(4)}`} ref={(el) => (sectionRefs.current[4] = el)} data-idx={4}>
          <Reveal>
            <div className="eyebrow">💧 meredakan</div>
            <h2>Cara menenangkan<br />diri sendiri</h2>
          </Reveal>
          <div className="heal-grid" style={{ marginTop: "1.7rem" }}>
            {[
              ["📓", "Menulis apa yang dirasakan, biar tidak menumpuk di kepala."],
              ["💬", "Cerita jujur ke orang yang dipercaya."],
              ["🚶", "Bergerak — jalan kaki atau olahraga ringan untuk melepas energi yang menumpuk."],
              ["🤍", "Terbuka pada bantuan profesional kalau rasa ini sering dan berat, bukan karena \u201csakit\u201d, tapi karena butuh ruang belajar."],
            ].map(([e, t], i) => (
              <Reveal key={i} delay={i * 80}><div className="heal-card"><span className="e">{e}</span><p>{t}</p></div></Reveal>
            ))}
          </div>
          <Reveal delay={200}><BreathingGuide /></Reveal>
        </section>

        {/* 5. PERSPEKTIF ISLAM */}
        <section className={`rt-section theme-${resolveTheme(5)}`} ref={(el) => (sectionRefs.current[5] = el)} data-idx={5}>
          <div className="islam-pattern" />
          <Reveal>
            <div className="eyebrow">📿 perspektif islam</div>
            <h2>Renungan tentang<br />batas dan kepedulian</h2>
          </Reveal>
          <Reveal delay={100}><p className="lede" style={{ marginBottom: "1.3rem" }}>Beberapa hal yang bisa jadi bahan renungan, dilihat dari ajaran Islam.</p></Reveal>
          <div className="islam-list">
            {ISLAM_POINTS.map((pt, i) => (
              <Reveal key={i} delay={i * 70}>
                <div className="islam-card">
                  <div className="ref">{pt.ref}</div>
                  <h3>{pt.title}</h3>
                  <p>{pt.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={ISLAM_POINTS.length * 70}>
            <p className="islam-note">Ini renungan umum, bukan fatwa. Untuk pemahaman lebih dalam, baik didiskusikan lagi dengan ustadz/ustadzah atau guru mengaji terpercaya.</p>
          </Reveal>
        </section>

        {/* 6. JURNAL PERASAAN */}
        <section className={`rt-section theme-${resolveTheme(6)}`} ref={(el) => (sectionRefs.current[6] = el)} data-idx={6}>
          <Reveal>
            <div className="eyebrow">📓 jurnal perasaan</div>
            <h2>Sedang merasakan apa<br />sekarang?</h2>
          </Reveal>
          <Reveal delay={100}><p className="lede" style={{ marginBottom: "1.3rem" }}>Pilih mood dan satu pertanyaan, lalu tulis apa adanya. Tidak ada jawaban yang salah.</p></Reveal>
          <Journal />
        </section>

        {/* 7. PENUTUP */}
        <section className={`rt-section theme-${resolveTheme(7)}`} ref={(el) => (sectionRefs.current[7] = el)} data-idx={7} style={{ alignItems: "center", textAlign: "center" }}>
          <Bloom size={170} tone="sage" />
          <ClosingQuote />
          <Reveal delay={300}><button className="breath-btn" onClick={() => scrollTo(0)} style={{ marginTop: "0.5rem" }}>Mulai dari awal lagi</button></Reveal>
        </section>
      </div>
    </div>
  );
}

function ClosingQuote() {
  const [idx, setIdx] = useState(0);
  const next = () => {
    let n = idx;
    while (n === idx) n = Math.floor(Math.random() * CLOSING_QUOTES.length);
    setIdx(n);
  };
  return (
    <>
      <Reveal delay={100}><div className="eyebrow" style={{ justifyContent: "center", marginTop: "1.6rem" }}>🌾 penutup</div><h2>Perlahan saja.</h2></Reveal>
      <Reveal delay={200}><p className="lede" style={{ margin: "1rem auto 0" }}>{CLOSING_QUOTES[idx]}</p></Reveal>
      <Reveal delay={250}><button className="quote-btn" onClick={next}>Kutipan lain</button></Reveal>
    </>
  );
}

function BreathingGuide() {
  const [phase, setPhase] = useState(null);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const sequence = ["tarik", "tahan", "hembus"];
    let i = 0;
    setPhase(sequence[0]);
    const id = setInterval(() => { i = (i + 1) % sequence.length; setPhase(sequence[i]); }, 3500);
    return () => clearInterval(id);
  }, [running]);
  const label = phase === "tarik" ? "Tarik napas…" : phase === "tahan" ? "Tahan sebentar…" : phase === "hembus" ? "Hembuskan pelan…" : "Siap saat kamu perlu";
  return (
    <div className="breath-box">
      <Bloom size={110} tone="coral" phase={running ? phase : null} drift={false} />
      <div className="breath-word">{label}</div>
      <button className="breath-btn" onClick={() => setRunning((r) => !r)}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}><Wind size={16} /> {running ? "Cukup dulu" : "Coba latihan napas"}</span>
      </button>
    </div>
  );
}

function Journal() {
  const [selectedPrompt, setSelectedPrompt] = useState(PROMPTS[0]);
  const [mood, setMood] = useState(null);
  const [text, setText] = useState("");
  const [reply, setReply] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [copyState, setCopyState] = useState("idle"); // idle | copied | fallback

  useEffect(() => {
    try {
      const raw = localStorage.getItem("rt-jurnal-entries");
      if (raw) setEntries(JSON.parse(raw));
    } catch (e) {}
    setLoaded(true);
  }, []);

  const submit = () => {
    if (!text.trim()) return;
    const r = pickReply(text);
    const entry = {
      id: Date.now(),
      prompt: selectedPrompt,
      text: text.trim(),
      reply: r,
      mood,
      ts: new Date().toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    };
    const next = [entry, ...entries].slice(0, 30);
    setEntries(next);
    setReply(r);
    setText("");
    setMood(null);
    try { localStorage.setItem("rt-jurnal-entries", JSON.stringify(next)); } catch (e) {}
  };

  const clearAll = () => {
    setEntries([]);
    setReply(null);
    try { localStorage.setItem("rt-jurnal-entries", JSON.stringify([])); } catch (e) {}
  };

  const deleteEntry = (id) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    try { localStorage.setItem("rt-jurnal-entries", JSON.stringify(next)); } catch (e) {}
  };

  const copyAll = async () => {
    const compiled = entries
      .slice()
      .reverse()
      .map((e) => `${e.ts}\n${e.prompt}\n${e.text}\n— ${e.reply}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(compiled);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch (e) {
      setCopyState("fallback");
    }
  };

  const chartData = entries
    .filter((e) => e.mood)
    .slice(0, 10)
    .reverse()
    .map((e) => ({ tanggal: e.ts.split(",")[0] || e.ts, mood: e.mood }));

  return (
    <div className="journal-wrap">
      <div className="mood-row">
        {MOODS.map((m) => (
          <button key={m.v} className={`mood-btn ${mood === m.v ? "selected" : ""}`} onClick={() => setMood(m.v)} aria-label={m.label} title={m.label}>{m.e}</button>
        ))}
      </div>

      <div className="prompt-chips">
        {PROMPTS.map((p) => (
          <button key={p} className={`prompt-chip ${selectedPrompt === p ? "selected" : ""}`} onClick={() => setSelectedPrompt(p)}>{p}</button>
        ))}
      </div>

      <textarea className="journal-textarea" placeholder="Tulis apa yang kamu rasakan…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="journal-actions">
        <button className="journal-submit" onClick={submit} disabled={!text.trim()}>Simpan</button>
      </div>

      {reply && <div className="journal-reply">{reply}</div>}

      {chartData.length >= 2 ? (
        <div className="mood-chart-wrap">
          <div className="mood-chart-title">Tren mood terakhir</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} stroke="#2E2A4A" />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} stroke="#2E2A4A" width={20} />
              <Tooltip />
              <Line type="monotone" dataKey="mood" stroke="#8FAE87" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        loaded && <p className="mood-hint">Isi mood beberapa kali dulu untuk melihat grafik trennya.</p>
      )}

      {loaded && entries.length > 0 && (
        <div className="journal-history">
          <div className="journal-history-title">
            <span>Tulisan sebelumnya</span>
            <span style={{ display: "flex", gap: "0.7rem" }}>
              <button className="journal-copy" onClick={copyAll}>
                {copyState === "copied" ? <Check size={12} /> : <Copy size={12} />} {copyState === "copied" ? "tersalin" : "salin semua"}
              </button>
              <button className="journal-clear" onClick={clearAll}>hapus semua</button>
            </span>
          </div>
          {copyState === "fallback" && (
            <textarea
              className="copy-fallback"
              readOnly
              value={entries.slice().reverse().map((e) => `${e.ts}\n${e.prompt}\n${e.text}\n— ${e.reply}`).join("\n\n")}
              onFocus={(e) => e.target.select()}
            />
          )}
          {entries.map((e) => (
            <div className="journal-entry" key={e.id}>
              <div className="je-top">
                <span className="je-date">{e.ts}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {e.mood && <span>{MOODS.find((m) => m.v === e.mood)?.e}</span>}
                  <button className="je-delete" onClick={() => deleteEntry(e.id)} aria-label="Hapus catatan ini" title="Hapus catatan ini">
                    <X size={12} />
                  </button>
                </span>
              </div>
              <p className="je-prompt">{e.prompt}</p>
              <p className="je-text">{e.text}</p>
              <p className="je-reply">{e.reply}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
