import { createHash, timingSafeEqual } from "node:crypto";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Design system · Pass-Abot",
  robots: { index: false, follow: false, nocache: true },
};

const digest = (s: string) => createHash("sha256").update(s).digest();

function keyIsValid(given: string) {
  const expected =
    process.env.DESIGN_SYSTEM_KEY ??
    (process.env.NODE_ENV === "production" ? undefined : "dev");
  if (!expected) return false;
  return timingSafeEqual(digest(given), digest(expected));
}

const SECTIONS = [
  { id: "foundations", title: "Foundations" },
  { id: "fields", title: "Fields" },
  { id: "components", title: "Components" },
  { id: "primitives", title: "Primitives" },
  { id: "conventions", title: "Conventions" },
  { id: "sources", title: "Sources" },
  { id: "members", title: "Project members" },
  { id: "disclaimer", title: "Disclaimer" },
] as const;

const ROLE_COLORS = [
  { token: "primary", hex: "#3c87f7", use: "Primary button, links, selected chip, upcoming dot, date accent" },
  { token: "danger", hex: "#d64545", use: "Danger button, denied dot, “Request denied” notice rule" },
  { token: "success", hex: "#2e9e5b", use: "Active dot" },
  { token: "warning", hex: "#f5c400", use: "Pending dot" },
  { token: "muted", hex: "#9aa0a6", use: "Cancelled and expired dots" },
] as const;

const THEME_TOKENS = [
  { token: "text", light: "#000000", dark: "#ffffff", use: "Body copy, titles, outline button border" },
  { token: "background", light: "#ffffff", dark: "#000000", use: "Screens, header bar, sheets" },
  { token: "backgroundElement", light: "#F0F0F3", dark: "#212225", use: "Cards, menus, notice cards" },
  { token: "backgroundSelected", light: "#E0E1E6", dark: "#2E3135", use: "Dividers, header bottom border" },
  { token: "textSecondary", light: "#60646C", dark: "#B0B4BA", use: "Helper text, placeholders, field borders, icons" },
] as const;

const TYPE_SCALE = [
  { name: "title", spec: "48 / 52 · 600", role: "Screen name on login only", size: 48, lh: "52px", w: 600 },
  { name: "subtitle", spec: "32 / 44 · 600", role: "Empty-state headline", size: 32, lh: "44px", w: 600 },
  { name: "card name", spec: "24 / 32 · 600", role: "A person’s name on a card", size: 24, lh: "32px", w: 600 },
  { name: "card title", spec: "18 / 24 · 700", role: "Card header, always smallBold", size: 18, lh: "24px", w: 700 },
  { name: "default", spec: "16 / 24 · 500", role: "Body copy, field text", size: 16, lh: "24px", w: 500 },
  { name: "small", spec: "14 / 20 · 500", role: "Field labels, status text, helper text", size: 14, lh: "20px", w: 500 },
  { name: "smallBold", spec: "14 / 20 · 700", role: "Button text, row titles", size: 14, lh: "20px", w: 700 },
  { name: "code", spec: "12 · mono", role: "Gatepass code", size: 12, lh: "16px", w: 600 },
] as const;

const SPACING = [
  { name: "half", px: 2 },
  { name: "one", px: 4 },
  { name: "two", px: 8 },
  { name: "three", px: 16 },
  { name: "four", px: 24 },
  { name: "five", px: 32 },
  { name: "six", px: 64 },
] as const;

const RADII = [
  { px: "999", name: "pill", use: "Buttons, time chips" },
  { px: "24", name: "sheet", use: "Top corners of the new-request sheet" },
  { px: "12", name: "card", use: "Cards, notice cards, status dot is 12px round" },
  { px: "8", name: "field", use: "Text inputs, time field, date field" },
] as const;

const PHASES = [
  { phase: "pending", label: "Pending", dot: "#f5c400" },
  { phase: "upcoming", label: "Approved", dot: "#3c87f7" },
  { phase: "active", label: "Active", dot: "#2e9e5b" },
  { phase: "denied", label: "Denied", dot: "#d64545" },
  { phase: "cancelled", label: "Cancelled", dot: "#9aa0a6" },
  { phase: "expired", label: "Expired", dot: "#9aa0a6" },
] as const;

const ROLES = [
  { role: "Visitor", tabs: ["Home", "My Gatepass"], does: "Requests a pass, shows the code at the gate" },
  { role: "Tenant", tabs: ["Home", "Manage Gatepass"], does: "Approves or denies, sets the pass window" },
  { role: "Admin", tabs: ["Home", "Scan Gatepass"], does: "Validates a code, logs entry and exit" },
] as const;

const SOURCES = [
  {
    name: "AppButton",
    variants: "primary, outline, danger · disabled · loading",
    file: "src/components/app-button.tsx",
    usedIn: "Every card action, empty and error states, sheets",
  },
  {
    name: "StatusBadge",
    variants: "pending, upcoming, active, denied, cancelled, expired",
    file: "src/components/status-badge.tsx",
    usedIn: "Gatepass status card, request lists, request detail",
  },
  {
    name: "Card (home-cards)",
    variants: "My Profile, Gatepass Status, Incoming Requests, Upcoming Gatepass",
    file: "src/components/home-cards.tsx",
    usedIn: "Home screen for every role",
  },
  {
    name: "NoticeList",
    variants: "Request denied",
    file: "src/components/notice-list.tsx",
    usedIn: "My Gatepass",
  },
  {
    name: "TimeChips and TimeField",
    variants: "Native time picker (TimeField), chip row (TimeChips, not on a screen yet)",
    file: "src/components/time-field.tsx, time-chips.tsx",
    usedIn: "Tenant approval, custom pass window (From and To)",
  },
  {
    name: "NewRequestModal",
    variants: "Bottom sheet with six required fields",
    file: "src/components/new-request-modal.tsx",
    usedIn: "My Gatepass, Home “Request a gatepass”",
  },
  {
    name: "AppHeader",
    variants: "Menu, title, help",
    file: "src/components/app-header.tsx",
    usedIn: "Top of every tab",
  },
  {
    name: "Theme tokens",
    variants: "light, dark · Spacing · MaxContentWidth 800",
    file: "src/constants/theme.ts",
    usedIn: "Everything",
  },
] as const;

const MEMBERS = [
  { name: "James Angelo T. Inopia", roles: ["Project Manager", "Full-Stack Developer"] },
  { name: "Harvey Tyson Ablen", roles: ["Full-Stack Developer"] },
  { name: "Noah Gabriel K. Lonoy", roles: ["UI/UX"] },
] as const;


const CSS = `
.ds{
  --bg:#ffffff;--text:#000000;--el:#F0F0F3;--sel:#E0E1E6;--sec:#60646C;
  --blue:#3c87f7;--red:#d64545;--green:#2e9e5b;--yellow:#f5c400;--gray:#9aa0a6;
  --blue-text:#1f66d6;
  --font:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  background:var(--bg);color:var(--text);font-family:var(--font);
  font-size:16px;line-height:24px;font-weight:500;min-height:100vh;
  -webkit-font-smoothing:antialiased;
}
@media (prefers-color-scheme:dark){
  .ds{--bg:#000000;--text:#ffffff;--el:#212225;--sel:#2E3135;--sec:#B0B4BA;--blue-text:#6aa5ff}
}
.ds *,.ds *::before,.ds *::after{box-sizing:border-box}
.ds a{color:var(--blue-text);text-decoration:underline;text-underline-offset:3px}
.ds a:focus-visible,.ds button:focus-visible,.ds input:focus-visible,.ds label:focus-within{outline:2px solid var(--blue);outline-offset:2px}
.ds h1,.ds h2,.ds h3,.ds p,.ds ul,.ds ol,.ds dl,.ds dd,.ds figure{margin:0;padding:0}
.ds ul,.ds ol{list-style:none}
.ds code{font-family:var(--mono);font-size:13px;background:var(--el);border-radius:6px;padding:1px 6px}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}

/* header */
.ds-top{position:sticky;top:0;z-index:40;background:var(--bg);border-bottom:1px solid var(--sel)}
.ds-top-in{max-width:1120px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;gap:24px}
.ds-brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:18px;color:var(--text)!important;text-decoration:none!important}
.ds-brand-mark{width:28px;height:28px;border-radius:8px;background:var(--blue);display:grid;place-items:center}
.ds-nav{display:none;gap:4px;margin-left:auto}
.ds-nav a{color:var(--text);text-decoration:none;font-size:14px;font-weight:600;padding:8px 12px;border-radius:999px}
.ds-nav a:hover{background:var(--el)}
.ds-flag{margin-left:auto;font-size:13px;font-weight:700;color:var(--sec);border:1px solid var(--sel);border-radius:999px;padding:2px 10px}
@media(min-width:900px){.ds-nav{display:flex}.ds-flag{margin-left:0}}
.ds-current-bar{border-top:1px solid var(--sel);background:var(--el);font-size:14px;padding:8px 24px}
.ds-current-bar b{font-weight:700}
@media(min-width:1024px){.ds-current-bar{display:none}}

/* hero */
.ds-hero{max-width:1120px;margin:0 auto;padding:64px 24px 32px}
.ds-kicker{font-size:14px;font-weight:700;color:var(--sec);display:flex;align-items:center;gap:8px}
.ds-dot{width:12px;height:12px;border-radius:6px;background:var(--blue);display:inline-block;flex:none}
.ds-h1{font-size:clamp(40px,7vw,48px);line-height:1.08;font-weight:600;margin-top:12px;letter-spacing:-0.02em}
.ds-lede{margin-top:16px;max-width:62ch;color:var(--sec);font-size:18px;line-height:28px}
.ds-meta{margin-top:24px;display:flex;flex-wrap:wrap;gap:8px}
.ds-chip{font-size:13px;font-weight:700;border-radius:999px;padding:3px 12px;background:var(--el)}

/* layout */
.ds-wrap{max-width:1120px;margin:0 auto;padding:0 24px 96px;display:grid;gap:48px}
@media(min-width:1024px){.ds-wrap{grid-template-columns:200px minmax(0,1fr);gap:64px}}
.ds-aside{display:none}
@media(min-width:1024px){.ds-aside{display:block;position:sticky;top:88px;align-self:start}}
.ds-aside-label{font-size:13px;font-weight:700;color:var(--sec);margin-bottom:8px}
.ds-aside a{display:flex;align-items:center;gap:10px;color:var(--sec);text-decoration:none;font-size:14px;font-weight:600;padding:6px 0}
.ds-aside a::before{content:"";width:8px;height:8px;border-radius:4px;background:var(--sel);flex:none}
.ds-aside a:hover{color:var(--text)}
.ds-aside a[aria-current="true"]{color:var(--text)}
.ds-aside a[aria-current="true"]::before{background:var(--blue)}
.ds-main{display:grid;gap:72px;min-width:0}
.ds-sec{scroll-margin-top:96px;display:grid;gap:24px}
.ds-sec>h2{font-size:32px;line-height:40px;font-weight:600;letter-spacing:-0.01em}
.ds-sec>.ds-intro{max-width:68ch;color:var(--sec)}
.ds-sub{display:grid;gap:12px;min-width:0}
.ds-sub>h3{font-size:20px;line-height:28px;font-weight:700}
.ds-sub>p{max-width:68ch}
.ds-sub>p.ds-note{color:var(--sec);font-size:14px;line-height:20px}

/* surfaces */
.ds-card{background:var(--el);border-radius:12px;padding:16px;display:grid;gap:12px;min-width:0}
.ds-card-title{font-size:18px;line-height:24px;font-weight:700}
.ds-grid{display:grid;gap:16px}
@media(min-width:640px){.ds-grid.c2{grid-template-columns:repeat(2,minmax(0,1fr))}.ds-grid.c3{grid-template-columns:repeat(3,minmax(0,1fr))}}
.ds-sec-text{color:var(--sec)}
.ds-small{font-size:14px;line-height:20px}
.ds-bold{font-weight:700}

/* swatches */
.ds-sw{border-radius:12px;background:var(--el);overflow:hidden;display:grid}
.ds-sw-chip{height:64px}
.ds-sw-body{padding:12px 16px;display:grid;gap:2px}
.ds-sw-body b{font-size:14px;line-height:20px}
.ds-sw-body span{font-size:13px;line-height:18px;color:var(--sec)}
.ds-sw-body code{background:transparent;padding:0}

/* tables */
.ds-table{width:100%;overflow-x:auto;border:1px solid var(--sel);border-radius:12px}
.ds-table table{width:100%;border-collapse:collapse;font-size:14px;line-height:20px;min-width:520px}
.ds-table th{text-align:left;font-weight:700;color:var(--sec);padding:10px 16px;background:var(--el)}
.ds-table td{padding:10px 16px;border-top:1px solid var(--sel);vertical-align:top}
.ds-table td:first-child{font-weight:700;white-space:nowrap}
.ds-t-sample{display:flex;align-items:center;gap:8px}
.ds-t-sw{width:14px;height:14px;border-radius:4px;border:1px solid var(--sel);flex:none}

/* spacing + radius */
.ds-space{display:grid;gap:8px}
.ds-space-row{display:grid;grid-template-columns:72px 56px 1fr;align-items:center;gap:12px;font-size:14px}
.ds-space-bar{height:16px;background:var(--blue);border-radius:3px}
.ds-rad{display:grid;gap:12px}
@media(min-width:640px){.ds-rad{grid-template-columns:repeat(4,minmax(0,1fr))}}
.ds-rad-box{height:72px;background:var(--el);border:1px solid var(--sec)}

/* rules */
.ds-rules{display:grid;gap:10px;max-width:72ch}
.ds-rules li{display:grid;grid-template-columns:20px 1fr;gap:10px}
.ds-rules li::before{font-weight:800}
.ds-rules li[data-k="do"]::before{content:"✓";color:var(--green)}
.ds-rules li[data-k="dont"]::before{content:"✕";color:var(--red)}

/* fields (live) */
.ds-label{font-size:14px;line-height:20px;font-weight:500;display:block;margin-bottom:4px}
.ds-input{width:100%;font:inherit;font-size:16px;line-height:24px;color:var(--text);background:transparent;border:1px solid var(--sec);border-radius:8px;padding:16px}
.ds-input::placeholder{color:var(--sec)}
.ds-input:hover:not(:disabled){border-color:var(--text)}
.ds-input:focus-visible{outline:2px solid var(--blue);outline-offset:0;border-color:var(--blue)}
.ds-input:disabled{opacity:.5}
.ds-input[aria-invalid="true"]{border-color:var(--red)}
.ds-err{color:var(--red);font-size:14px;line-height:20px;margin-top:4px}
.ds-timefield{display:flex;align-items:center;gap:8px;width:100%;border:1px solid var(--sec);border-radius:8px;padding:16px;background:transparent;color:var(--text);font:inherit;text-align:left;cursor:pointer}
.ds-timefield span{flex:1}
.ds-chips{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px}
.ds-chips input{position:absolute;opacity:0;pointer-events:none}
.ds-chips label{flex:none;width:92px;min-height:40px;display:grid;place-items:center;border:1px solid var(--sec);border-radius:999px;font-size:14px;font-weight:500;cursor:pointer}
.ds-chips input:checked+label{background:var(--blue);border-color:var(--blue);color:#fff}
.ds-chips input:focus-visible+label{outline:2px solid var(--blue);outline-offset:2px}
.ds-chips label:active{opacity:.75}

/* buttons */
.ds-btn{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;border:1px solid var(--blue);background:var(--blue);color:#fff;font:inherit;font-size:14px;line-height:20px;font-weight:700;padding:8px 24px;cursor:pointer}
.ds-btn:active:not(:disabled){opacity:.75}
.ds-btn:disabled{opacity:.5;cursor:not-allowed}
.ds-btn.outline{background:transparent;border-color:var(--text);color:var(--text)}
.ds-btn.danger{background:transparent;border-color:var(--red);color:var(--red)}
.ds-spin{width:16px;height:16px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:ds-spin .8s linear infinite}
@keyframes ds-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.ds-spin{animation-duration:2.4s}}
.ds-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center}

/* components */
.ds-badge{display:inline-flex;align-items:center;gap:8px;font-size:14px;line-height:20px;font-weight:500}
.ds-badge i{width:12px;height:12px;border-radius:6px;display:inline-block}
.ds-notice{background:var(--el);border-radius:12px;border-left:4px solid var(--red);padding:16px;display:grid;gap:8px}
.ds-notice b{color:var(--red);font-size:14px;line-height:20px}
.ds-bar{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--sel);padding:10px 16px;background:var(--bg);border-radius:12px 12px 0 0;border:1px solid var(--sel)}
.ds-bar b{font-size:14px;font-weight:700}
.ds-sheet-wrap{background:rgba(0,0,0,.3);border-radius:12px;padding:24px 24px 0;display:flex;align-items:flex-end;min-height:260px}
.ds-sheet{background:var(--bg);width:100%;border-radius:24px 24px 0 0;padding:24px;display:grid;gap:12px}
.ds-state{border:1px dashed var(--sec);border-radius:12px;padding:24px;display:grid;gap:12px;justify-items:start;align-content:start;min-height:180px}
.ds-state h3{font-size:20px;line-height:28px;font-weight:700}

/* sources */
.ds-src{display:grid;gap:12px}
.ds-src-item{background:var(--el);border-radius:12px;padding:16px;display:grid;gap:10px}
.ds-src-item h3{font-size:18px;line-height:24px;font-weight:700}
.ds-src-item dl{display:grid;gap:8px}
@media(min-width:640px){.ds-src-item dl{grid-template-columns:110px 1fr;column-gap:16px}}
.ds-src-item dt{font-size:14px;line-height:20px;color:var(--sec);font-weight:700}
.ds-src-item dd{font-size:14px;line-height:20px}

/* members */
.ds-mem{background:var(--el);border-radius:12px;padding:16px;display:grid;gap:8px}
.ds-mem h3{font-size:18px;line-height:24px;font-weight:700}

/* footer */
.ds-foot{border-top:1px solid var(--sel);background:var(--el)}
.ds-foot-in{max-width:1120px;margin:0 auto;padding:48px 24px 32px;display:grid;gap:32px}
@media(min-width:768px){.ds-foot-in{grid-template-columns:2fr 1fr 1fr}}
.ds-foot h3{font-size:14px;font-weight:700;margin-bottom:8px}
.ds-foot li{font-size:14px;line-height:28px}
.ds-foot-base{grid-column:1/-1;border-top:1px solid var(--sel);padding-top:16px;display:grid;gap:4px;font-size:13px;color:var(--sec)}
`;

const SPY = `
(function(){
  var links=[].slice.call(document.querySelectorAll('[data-spy]'));
  var label=document.getElementById('ds-current');
  function set(id){
    links.forEach(function(l){
      if(l.getAttribute('href')==='#'+id){l.setAttribute('aria-current','true')}
      else{l.removeAttribute('aria-current')}
    });
    var s=document.getElementById(id);
    if(label&&s){label.textContent=s.getAttribute('data-title')}
  }
  var secs=[].slice.call(document.querySelectorAll('[data-section]'));
  if(!('IntersectionObserver' in window)||!secs.length){return}
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){set(e.target.id)}});
  },{rootMargin:'-15% 0px -75% 0px'});
  secs.forEach(function(s){io.observe(s)});
  set(secs[0].id);
})();
`;

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} data-section data-title={title} className="ds-sec">
      <h2>{title}</h2>
      {intro ? <p className="ds-intro">{intro}</p> : null}
      {children}
    </section>
  );
}

function Sub({
  title,
  lede,
  note,
  children,
}: {
  title: string;
  lede?: string;
  note?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="ds-sub">
      <h3>{title}</h3>
      {lede ? <p>{lede}</p> : null}
      {children}
      {note ? <p className="ds-note">{note}</p> : null}
    </div>
  );
}

function Rules({ items }: { items: { k: "do" | "dont"; t: React.ReactNode }[] }) {
  return (
    <ul className="ds-rules">
      {items.map((r, i) => (
        <li key={i} data-k={r.k}>
          <span>
            <span className="sr-only" style={{ position: "absolute", left: -9999 }}>
              {r.k === "do" ? "Do: " : "Don’t: "}
            </span>
            {r.t}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Badge({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="ds-badge">
      <i style={{ background: dot }} />
      {label}
    </span>
  );
}

function Clock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ color: "var(--sec)" }}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 17h.01" />
    </svg>
  );
}

export default async function DesignSystemPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!keyIsValid(key)) notFound();

  return (
    <div className="ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="ds-top">
        <div className="ds-top-in">
          <a className="ds-brand" href="#top">
            <span className="ds-brand-mark" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            Pass-Abot
          </a>
          <nav className="ds-nav" aria-label="Design system sections">
            {SECTIONS.slice(0, 5).map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.title}
              </a>
            ))}
          </nav>
          <span className="ds-flag">Internal</span>
        </div>
        <div className="ds-current-bar">
          Current section: <b id="ds-current">Foundations</b>
        </div>
      </header>

      <div className="ds-hero" id="top">
        <p className="ds-kicker">
          <span className="ds-dot" aria-hidden="true" />
          Know the product
        </p>
        <h1 className="ds-h1">Design system</h1>
        <p className="ds-lede">
          Behind the screens: the colour, type and component conventions the
          Pass-Abot visitor gate pass app already uses. Anything new should be
          assembled from what is on this page.
        </p>
        <div className="ds-meta">
          <span className="ds-chip">App 1.0.0</span>
          <span className="ds-chip">Sprint 3</span>
          <span className="ds-chip">Light and dark</span>
          <span className="ds-chip">Mobile first, 800px max content width</span>
        </div>
      </div>

      <div className="ds-wrap">
        <aside className="ds-aside" aria-label="On this page">
          <p className="ds-aside-label">Current section</p>
          <nav>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} data-spy>
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        <main className="ds-main">
          <Section
            id="foundations"
            title="Foundations"
            intro="Everything below is declared once in src/constants/theme.ts and src/components. Use the token, never the hex, and never a one-off number."
          >
            <Sub
              title="Brand and status colour"
              lede="One blue does every interactive job. The other four colours only ever say what state something is in."
              note="Colour is never the only signal. Each dot sits beside a text label, and the danger button is also labelled."
            >
              <div className="ds-grid c3">
                {ROLE_COLORS.map((c) => (
                  <div key={c.token} className="ds-sw">
                    <div className="ds-sw-chip" style={{ background: c.hex }} />
                    <div className="ds-sw-body">
                      <b>{c.token}</b>
                      <span>
                        <code>{c.hex}</code>
                      </span>
                      <span>{c.use}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Sub>

            <Sub
              title="Theme tokens"
              lede="Five neutrals, resolved per colour scheme through useTheme(). The app follows the phone’s light or dark setting."
            >
              <div className="ds-table">
                <table>
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Light</th>
                      <th>Dark</th>
                      <th>Used for</th>
                    </tr>
                  </thead>
                  <tbody>
                    {THEME_TOKENS.map((t) => (
                      <tr key={t.token}>
                        <td>{t.token}</td>
                        <td>
                          <span className="ds-t-sample">
                            <i className="ds-t-sw" style={{ background: t.light }} />
                            <code>{t.light}</code>
                          </span>
                        </td>
                        <td>
                          <span className="ds-t-sample">
                            <i className="ds-t-sw" style={{ background: t.dark }} />
                            <code>{t.dark}</code>
                          </span>
                        </td>
                        <td>{t.use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Sub>

            <Sub
              title="Typography"
              lede="The system font on every platform. Weights are 500 for reading and 700 for anything you press or scan. Headings use 600."
            >
              <div className="ds-table">
                <table>
                  <thead>
                    <tr>
                      <th>Style</th>
                      <th>Size / line · weight</th>
                      <th>Specimen</th>
                      <th>Used for</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TYPE_SCALE.map((t) => (
                      <tr key={t.name}>
                        <td>{t.name}</td>
                        <td>{t.spec}</td>
                        <td>
                          <span
                            style={{
                              fontSize: t.size,
                              lineHeight: t.lh,
                              fontWeight: t.w,
                              fontFamily: t.name === "code" ? "var(--mono)" : undefined,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {t.name === "code" ? "GP-4K7Q2M" : "Visit to Maria Santos"}
                          </span>
                        </td>
                        <td>{t.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Sub>

            <Sub
              title="Spacing"
              lede="Seven steps. Padding inside a card or field is three (16). Gaps between stacked things are three (16), or two (8) when the things belong together."
            >
              <div className="ds-space">
                {SPACING.map((s) => (
                  <div key={s.name} className="ds-space-row">
                    <b>{s.name}</b>
                    <span className="ds-sec-text">{s.px}px</span>
                    <div className="ds-space-bar" style={{ width: s.px * 3 }} />
                  </div>
                ))}
              </div>
            </Sub>

            <Sub
              title="Radius"
              lede="Radius encodes the kind of thing: pill for what you press, a mid radius for what you read, a small radius for what you type into. Do not add a new one."
            >
              <div className="ds-rad">
                {RADII.map((r) => (
                  <div key={r.name}>
                    <div
                      className="ds-rad-box"
                      style={{
                        borderRadius: r.name === "sheet" ? "24px 24px 0 0" : `${r.px}px`,
                      }}
                    />
                    <p className="ds-bold ds-small" style={{ marginTop: 8 }}>
                      {r.px}px · {r.name}
                    </p>
                    <p className="ds-small ds-sec-text">{r.use}</p>
                  </div>
                ))}
              </div>
            </Sub>

            <Sub
              title="Elevation and layers"
              lede="There are no shadows. Depth comes from fill: background, then backgroundElement for a card on it, then backgroundSelected for a divider or pressed state."
              note="The sheet and the header menu share one scrim, rgba(0, 0, 0, 0.3). The menu is a 12px backgroundElement panel, at least 220px wide, 16px from the left and 48px below the safe area."
            />
          </Section>

          <Section
            id="fields"
            title="Fields"
            intro="One control look, four controls. Every field is 1px textSecondary border, 8px radius and 16px padding, so a text box, a time field and a date field sit in a form without clashing."
          >
            <Sub
              title="The family"
              lede="Try them. Hover darkens the border, focus turns it blue, and the chips behave as a radio group."
            >
              <div className="ds-grid c2">
                <div className="ds-card">
                  <p className="ds-card-title">Text input</p>
                  <div>
                    <label className="ds-label" htmlFor="ds-f-email">Email</label>
                    <input id="ds-f-email" className="ds-input" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="ds-label" htmlFor="ds-f-contact">Contact number</label>
                    <input
                      id="ds-f-contact"
                      className="ds-input"
                      aria-invalid="true"
                      aria-describedby="ds-f-contact-err"
                      defaultValue="12 34"
                    />
                    <p id="ds-f-contact-err" className="ds-err">
                      Enter at least 7 digits, for example +63 912 345 6789.
                    </p>
                  </div>
                  <div>
                    <label className="ds-label" htmlFor="ds-f-dis">Unit or room (disabled)</label>
                    <input id="ds-f-dis" className="ds-input" disabled defaultValue="12B" />
                  </div>
                </div>

                <div className="ds-card">
                  <p className="ds-card-title">Time field</p>
                  <div>
                    <span className="ds-label">From</span>
                    <button type="button" className="ds-timefield" aria-label="From time, 9:00 AM">
                      <span>9:00 AM</span>
                      <Clock />
                    </button>
                  </div>
                  <div>
                    <span className="ds-label">To</span>
                    <button type="button" className="ds-timefield" aria-label="To time, 5:30 PM">
                      <span>5:30 PM</span>
                      <Clock />
                    </button>
                  </div>
                  <p className="ds-small ds-sec-text">
                    Opens the native spinner picker. On iOS a blue Done link closes it. Used for the tenant’s custom pass window.
                  </p>
                </div>
              </div>

              <div className="ds-card">
                <p className="ds-card-title">Time chips</p>
                <span className="ds-label" id="ds-chip-label">Starts</span>
                <div className="ds-chips" role="radiogroup" aria-labelledby="ds-chip-label">
                  {["8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM"].map((t, i) => (
                    <span key={t} style={{ display: "contents" }}>
                      <input type="radio" name="ds-chip" id={`ds-chip-${i}`} defaultChecked={i === 2} />
                      <label htmlFor={`ds-chip-${i}`}>{t}</label>
                    </span>
                  ))}
                </div>
                <p className="ds-small ds-sec-text">
                  30-minute steps, scrolls sideways. 92px wide, 40px tall, pill. Selected is a solid blue fill with white text. The component exists but no screen uses it yet.
                </p>
              </div>
            </Sub>

            <Sub
              title="Field anatomy"
              lede="Label above, field, then help or error below. The label is small (14/500) with 4px to the field. Placeholders use textSecondary and never carry the label."
            >
              <div className="ds-table">
                <table>
                  <thead>
                    <tr>
                      <th>Part</th>
                      <th>Spec</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Label</td><td>small, text colour, gap one (4) to the field</td></tr>
                    <tr><td>Border</td><td>1px textSecondary. Hover text colour. Focus blue. Invalid danger red.</td></tr>
                    <tr><td>Radius and padding</td><td>8px radius, 16px padding, 16px text</td></tr>
                    <tr><td>Disabled</td><td>50% opacity, not editable, no hover</td></tr>
                    <tr><td>Error</td><td>small danger-red line under the field that says what to change</td></tr>
                  </tbody>
                </table>
              </div>
            </Sub>

            <Sub
              title="Action buttons"
              lede="Three tiers. A card or sheet has one primary at most, and cancel or back is always outline."
            >
              <div className="ds-card">
                <div className="ds-row">
                  <button className="ds-btn" type="button">Request a gatepass</button>
                  <button className="ds-btn outline" type="button">View details</button>
                  <button className="ds-btn danger" type="button">Cancel pass</button>
                  <button className="ds-btn" type="button" disabled>Save</button>
                  <button className="ds-btn" type="button" disabled aria-busy="true">
                    <span className="ds-spin" aria-hidden="true" />
                    <span>Saving</span>
                  </button>
                </div>
                <p className="ds-small ds-sec-text">
                  Primary, outline, danger, disabled, loading. 44px minimum height, pill, 24px side padding,
                  14/700 text. Pressed is 75% opacity, disabled and loading are 50% and ignore taps.
                </p>
              </div>
              <Rules
                items={[
                  { k: "do", t: <>Use <b>primary</b> for the one thing the card is for: request, approve, save.</> },
                  { k: "do", t: <>Use <b>outline</b> for navigation and secondary actions: View details, Try again, Got it.</> },
                  { k: "do", t: <>Use <b>danger</b> only for actions that cancel or deny, and keep it outline-styled so it never outshouts primary.</> },
                  { k: "dont", t: <>Put two primary buttons in one card, or fill a danger button.</> },
                  { k: "dont", t: <>Use the stock React Native <code>Button</code>. It does not match. Login still does, see Conventions.</> },
                ]}
              />
            </Sub>

            <Sub
              title="Validation"
              lede="A form’s primary button stays disabled until every required field passes. Rules come from the code, not from guesses."
            >
              <div className="ds-table">
                <table>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Rule</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Email</td><td>Must contain “@”</td></tr>
                    <tr><td>Password</td><td>6 or more characters (not required on the reset form)</td></tr>
                    <tr><td>Contact number</td><td>Starts with “+” or a digit, then digits, spaces, brackets or dashes. At least 7 digits.</td></tr>
                    <tr><td>Host name, unit, purpose</td><td>Not empty after trimming</td></tr>
                    <tr><td>Visit date</td><td>Today up to 30 days ahead. A past date is rejected.</td></tr>
                    <tr><td>ID photo</td><td>Required. Take one with the camera or pick from the library.</td></tr>
                  </tbody>
                </table>
              </div>
            </Sub>

            <Sub title="Rules">
              <Rules
                items={[
                  { k: "do", t: <>Keep the same border, radius and padding on every control that takes input, including pickers.</> },
                  { k: "do", t: <>Give every field a visible label. Use an accessibility label too when the control is only an icon and a value.</> },
                  { k: "do", t: <>Say what to do in an error: “Enter at least 7 digits” beats “Invalid number”.</> },
                  { k: "dont", t: <>Show an error before the person has touched the field or tried to submit.</> },
                  { k: "dont", t: <>Use a placeholder as the label. It disappears when typing starts.</> },
                  { k: "dont", t: <>Invent a new field look for one screen. Add a variant to the shared component instead.</> },
                ]}
              />
            </Sub>
          </Section>

          <Section
            id="components"
            title="Components"
            intro="The foundation set. These compose the tokens above, so a screen built from them is consistent by construction."
          >
            <Sub
              title="Status badge"
              lede="A 12px dot and a small label. The dot says the phase, the label says it in words."
            >
              <div className="ds-card">
                <div className="ds-row" style={{ gap: 24 }}>
                  {PHASES.map((p) => (
                    <Badge key={p.phase} dot={p.dot} label={p.label} />
                  ))}
                </div>
                <p className="ds-small ds-sec-text">
                  The blue dot is the “upcoming” phase and reads “Approved”. Cancelled and expired share grey on purpose: both mean “nothing to do here”. Label text comes from describe() in gatepass-time.ts.
                </p>
              </div>
            </Sub>

            <Sub
              title="Card"
              lede="backgroundElement fill, 12px radius, 16px padding and 16px between children. The title is 18/24 bold and sits first."
            >
              <div className="ds-grid c2">
                <div className="ds-card">
                  <p className="ds-card-title">My Profile</p>
                  <div>
                    <p style={{ fontSize: 24, lineHeight: "32px", fontWeight: 600 }}>Maria Santos</p>
                    <p className="ds-sec-text">maria@example.com</p>
                    <p className="ds-sec-text">Unit / Room 12B</p>
                  </div>
                </div>
                <div className="ds-card">
                  <p className="ds-card-title">Gatepass Status</p>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <b className="ds-small" style={{ fontWeight: 700 }}>Visit to Maria Santos</b>
                    <Badge dot="#2e9e5b" label="Active" />
                  </div>
                  <p className="ds-sec-text">Active now · expires Oct 26, 11:59 PM</p>
                  <p className="ds-small ds-sec-text">Oct 26 · All day</p>
                  <div><button className="ds-btn outline" type="button">View details</button></div>
                </div>
              </div>
            </Sub>

            <Sub
              title="Notice"
              lede="A card with a 4px left rule in the status colour. Today it is only used for denied requests, and it always offers a way to dismiss."
            >
              <div className="ds-notice">
                <b>Request denied</b>
                <p>Maria Santos denied your request to visit on Mon, Oct 26. You can send a new request to someone else.</p>
                <div><button className="ds-btn outline" type="button">Got it</button></div>
              </div>
            </Sub>

            <Sub
              title="Header bar and role tabs"
              lede="A bar with a menu on the left, the screen title in the middle, and help on the right. Which tabs appear depends on the role."
            >
              <div>
                <div className="ds-bar">
                  <MenuIcon />
                  <b>Home</b>
                  <HelpIcon />
                </div>
              </div>
              <div className="ds-table">
                <table>
                  <thead>
                    <tr><th>Role</th><th>Tabs</th><th>Job</th></tr>
                  </thead>
                  <tbody>
                    {ROLES.map((r) => (
                      <tr key={r.role}>
                        <td>{r.role}</td>
                        <td>{r.tabs.join(", ")}</td>
                        <td>{r.does}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="ds-note ds-small ds-sec-text">
                Home is shared. Tab icons: home, ticket, list, qr-code. Bottom inset is 50 on iOS and 80 on Android so content clears the tab bar.
              </p>
            </Sub>

            <Sub
              title="Bottom sheet"
              lede="Forms that start from a card open as a sheet: 24px top corners, 24px padding, a 30% black scrim, and the keyboard pushes it up."
            >
              <div className="ds-sheet-wrap">
                <div className="ds-sheet">
                  <p style={{ fontSize: 24, lineHeight: "32px", fontWeight: 600 }}>New request</p>
                  <div>
                    <label className="ds-label" htmlFor="ds-sheet-host">Host name</label>
                    <input id="ds-sheet-host" className="ds-input" placeholder="Who are you visiting?" />
                  </div>
                  <div className="ds-row">
                    <button className="ds-btn" type="button" disabled>Send request</button>
                    <button className="ds-btn outline" type="button">Cancel</button>
                  </div>
                </div>
              </div>
            </Sub>

            <Sub
              title="Loading, empty and error"
              lede="Every list and card has all four states: loading, empty, error, content. They are the same height class and tone, so the layout does not jump."
            >
              <div className="ds-grid c3">
                <div className="ds-state">
                  <span className="ds-spin" aria-hidden="true" style={{ color: "var(--sec)", width: 28, height: 28 }} />
                  <p className="ds-sec-text">Loading requests</p>
                </div>
                <div className="ds-state">
                  <h3>There are no requests</h3>
                  <button className="ds-btn outline" type="button">Wanna add one?</button>
                </div>
                <div className="ds-state">
                  <p>No connection. Check your Wi-Fi and try again.</p>
                  <button className="ds-btn outline" type="button">Try again</button>
                </div>
              </div>
            </Sub>
          </Section>

          <Section
            id="primitives"
            title="Primitives"
            intro="The small wrappers under every component. They read the theme, so use them instead of raw React Native Text and View."
          >
            <div className="ds-table">
              <table>
                <thead>
                  <tr><th>Primitive</th><th>What it does</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>ThemedText</td>
                    <td>Text with a type (default, small, smallBold, subtitle, title, link, linkPrimary, code) and an optional themeColor</td>
                    <td>themeColor is one of the five theme tokens, never a hex</td>
                  </tr>
                  <tr>
                    <td>ThemedView</td>
                    <td>View with a background token. type=“backgroundElement” makes a card surface</td>
                    <td>Add radius and padding in the component, not here</td>
                  </tr>
                  <tr>
                    <td>useTheme()</td>
                    <td>Returns the light or dark token set for the current scheme</td>
                    <td>Call once per component</td>
                  </tr>
                  <tr>
                    <td>Spacing</td>
                    <td>half, one, two, three, four, five, six</td>
                    <td>Import it, don’t type 16</td>
                  </tr>
                  <tr>
                    <td>Ionicons</td>
                    <td>All icons, 20px in fields and 26px in the header</td>
                    <td>textSecondary in fields, text colour in the header</td>
                  </tr>
                  <tr>
                    <td>Status type</td>
                    <td>“loading” | “empty” | “error” | “content”</td>
                    <td>One per data hook, drives the four states</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section
            id="conventions"
            title="Conventions"
            intro="The rules that keep the app coherent, and the places that still need to catch up."
          >
            <Sub title="Colour">
              <Rules
                items={[
                  { k: "do", t: <>Use blue for anything interactive and the other four colours only for state.</> },
                  { k: "do", t: <>Pair a colour with a word. A dot alone is not a status.</> },
                  { k: "dont", t: <>Use danger red for decoration, or yellow for anything but pending.</> },
                  { k: "dont", t: <>Type a hex in a component. If the colour is missing, add a token.</> },
                ]}
              />
            </Sub>

            <Sub title="Writing">
              <Rules
                items={[
                  { k: "do", t: <>Write in sentence case and active voice. Buttons say what happens: “Request a gatepass”, “Send reminder”.</> },
                  { k: "do", t: <>Keep an action’s name the same everywhere. A button called “Cancel pass” leads to a confirmation that says “Pass cancelled”.</> },
                  { k: "do", t: <>Make errors specific and fixable, in the app’s voice: “We could not find a tenant with that name and unit. Check the details and try again.”</> },
                  { k: "dont", t: <>Apologise, blame the person, or write “Something went wrong” when the cause is known. problemFor() already maps the known causes.</> },
                ]}
              />
            </Sub>

            <Sub title="Layout and interaction">
              <Rules
                items={[
                  { k: "do", t: <>Cap content at 800px wide and centre it, so web and tablets don’t stretch cards.</> },
                  { k: "do", t: <>Make every tap target at least 44px tall, and give pressed feedback with opacity only.</> },
                  { k: "do", t: <>Build each list from the four states, and show a retry on error.</> },
                  { k: "dont", t: <>Add shadows, lift or scale a card on press, or animate list rows in.</> },
                ]}
              />
            </Sub>

            <Sub
              title="Privacy on screen"
              lede="Pass-Abot only keeps visitor details while a pass is active. The interface should follow the same rule."
            >
              <Rules
                items={[
                  { k: "do", t: <>Show the ID image and contact number only to the admin and only while the pass is valid.</> },
                  { k: "do", t: <>Show archived visits with the name, purpose, unit, host, authorizing admin and first and last times, and nothing more.</> },
                  { k: "dont", t: <>Cache or display an ID image after the pass expires.</> },
                ]}
              />
            </Sub>

            <Sub
              title="Known gaps"
              lede="These ship today. They are the convergence targets, not patterns to copy."
            >
              <div className="ds-table">
                <table>
                  <thead>
                    <tr><th>Where</th><th>Gap</th><th>Move to</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>login.tsx</td>
                      <td>Uses the stock <code>Button</code> and a raw border, so it looks different from the rest of the app</td>
                      <td>AppButton and the field spec above</td>
                    </tr>
                    <tr>
                      <td>Primary button</td>
                      <td>White 14/700 text on #3c87f7 is about 3.5:1, under the 4.5:1 target for small text</td>
                      <td>A darker primary for text and fills, or larger button text</td>
                    </tr>
                    <tr>
                      <td>Blue links on white</td>
                      <td>#3c87f7 as text has the same contrast problem. This page uses a darker blue for text links.</td>
                      <td>A separate link token</td>
                    </tr>
                    <tr>
                      <td>Scan Gatepass, placeholder screens</td>
                      <td>Rendered with page-placeholder, no design yet</td>
                      <td>Admin scan flow design in a later sprint</td>
                    </tr>
                    <tr>
                      <td>Time chips</td>
                      <td>Selected is a solid fill, while other selection states are an outline</td>
                      <td>Decide on one selected style and apply it to all</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Sub>
          </Section>

          <Section
            id="sources"
            title="Sources"
            intro="Where each part lives in the app code. Each one is listed with its variants, its file, and where it is used."
          >
            <div className="ds-src">
              {SOURCES.map((s) => (
                <article key={s.name} className="ds-src-item">
                  <h3>{s.name}</h3>
                  <dl>
                    <dt>Variants</dt>
                    <dd>{s.variants}</dd>
                    <dt>File</dt>
                    <dd><code>{s.file}</code></dd>
                    <dt>Used in</dt>
                    <dd>{s.usedIn}</dd>
                  </dl>
                </article>
              ))}
            </div>
            <Sub
              title="Design documentation"
              lede="The Figma file and the project timeline are linked from the project docs."
            >
              <ul className="ds-rules" style={{ gap: 6 }}>
                <li style={{ display: "block" }}>
                  <a href="https://www.figma.com/design/5AaSP8R0aBq6gnQbEmDZfz/Untitled?node-id=0-1&p=f&t=IOQmSWIRMIFyszM-0" rel="noreferrer noopener" target="_blank">Figma: Design</a>
                </li>
                <li style={{ display: "block" }}>
                  <a href="https://app.notion.com/p/visitor-gate-pass-3f0afb6c56fa80588ce6e929efadc1f2" rel="noreferrer noopener" target="_blank">Notion: Timeline and Kanban board</a>
                </li>
              </ul>
            </Sub>
          </Section>

          <Section id="members" title="Project members">
            <div className="ds-grid c3">
              {MEMBERS.map((m) => (
                <article key={m.name} className="ds-mem">
                  <h3>{m.name}</h3>
                  <p className="ds-small ds-sec-text">Roles</p>
                  <ul>
                    {m.roles.map((r) => (
                      <li key={r} className="ds-small">{r}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <p className="ds-sec-text ds-small" style={{ maxWidth: "68ch" }}>
              Sprint 3 product-owner remark: work on the UI/UX together with the design system, and finalize the user flow and data flow for each role.
            </p>
          </Section>

          <Section id="disclaimer" title="Disclaimer">
            <p style={{ maxWidth: "68ch" }}>
              This page is informational and internal. The app code is the authority, so check the component before relying on a value here. Values were read from the code and may be out of date after later changes.
            </p>
            <p className="ds-sec-text" style={{ maxWidth: "68ch" }}>
              Questions or corrections? Raise them with the UI/UX owner or in the next sprint review.
            </p>
          </Section>
        </main>
      </div>

      <footer className="ds-foot">
        <div className="ds-foot-in">
          <div>
            <h3>Pass-Abot</h3>
            <p className="ds-small ds-sec-text" style={{ maxWidth: "46ch" }}>
              A digital visitor gate pass for Solinea. Hosts approve a visitor, the visitor gets a code, and security scans it at the entrance. Details are deleted when the pass expires.
            </p>
          </div>
          <div>
            <h3>Reference</h3>
            <ul>
              <li><a href="#foundations">Foundations</a></li>
              <li><a href="#fields">Fields</a></li>
              <li><a href="#components">Components</a></li>
              <li><a href="#conventions">Conventions</a></li>
            </ul>
          </div>
          <div>
            <h3>Project</h3>
            <ul>
              <li><a href="https://www.figma.com/design/5AaSP8R0aBq6gnQbEmDZfz/Untitled?node-id=0-1&p=f&t=IOQmSWIRMIFyszM-0" rel="noreferrer noopener" target="_blank">Figma</a></li>
              <li><a href="https://app.notion.com/p/visitor-gate-pass-3f0afb6c56fa80588ce6e929efadc1f2" rel="noreferrer noopener" target="_blank">Notion timeline</a></li>
            </ul>
          </div>
          <div className="ds-foot-base">
            <span>Internal page. Not linked from the app and not indexed.</span>
            <span>Informational only. The app code is the authority.</span>
          </div>
        </div>
      </footer>

      <script dangerouslySetInnerHTML={{ __html: SPY }} />
    </div>
  );
}
