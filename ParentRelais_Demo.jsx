import { useState } from "react";
import {
  Wifi, WifiOff, RefreshCw, Play, Pause, ChevronLeft, ChevronRight,
  BookOpen, Users, CheckCircle2, Circle, Clock, Smartphone, LayoutDashboard,
  MapPin, Plus, Minus, Accessibility, Globe, Volume2, GraduationCap
} from "lucide-react";

// ---- Palette (field-legible, institutional-but-warm; nods to UNICEF cyan, north-Cameroon ochre) ----
const C = {
  ink: "#16241F",
  paper: "#EDF1EF",
  surface: "#FFFFFF",
  primary: "#0C7C9A",
  primaryDark: "#08596E",
  ochre: "#E0961A",
  ochreSoft: "#FBEFD6",
  danger: "#C2410C",
  dangerSoft: "#FBE6DC",
  success: "#157A47",
  successSoft: "#DDF0E4",
  muted: "#6B7B77",
  line: "#DCE4E1",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
`;

const display = { fontFamily: "'Space Grotesk', sans-serif" };
const body = { fontFamily: "'Inter', sans-serif" };

// ---- Content (would come from the MINPROFF/UNICEF guide, co-produced) ----
const MODULES = [
  {
    id: 1,
    title: { fr: "La perception de l'enfance", en: "How we see childhood" },
    duration: "45 min",
    summary: {
      fr: "Comprendre l'enfant comme une personne à part entière, avec des besoins et des droits. Déconstruire l'idée que l'enfant se corrige par la punition.",
      en: "Understand the child as a full person with needs and rights. Move away from the idea that a child is corrected through punishment.",
    },
    key: {
      fr: ["Chaque enfant a des droits", "La violence éducative laisse des traces", "Écouter avant de corriger"],
      en: ["Every child has rights", "Harsh discipline leaves marks", "Listen before correcting"],
    },
  },
  {
    id: 2,
    title: { fr: "Développement de l'enfant", en: "Child development" },
    duration: "50 min",
    summary: {
      fr: "Les grandes étapes du développement de 0 à 6 ans et les pratiques parentales qui les soutiennent au quotidien.",
      en: "Key development stages from 0 to 6 years and the everyday parenting practices that support them.",
    },
    key: {
      fr: ["Les 1000 premiers jours comptent", "Jouer, c'est apprendre", "Parler à l'enfant nourrit son cerveau"],
      en: ["The first 1000 days matter", "Play is learning", "Talking to a child feeds the brain"],
    },
  },
];

const VILLAGES = ["Maroua", "Mokolo", "Kousséri", "Mora"];

const QUIZ = [
  {
    q: { fr: "Que faire quand un enfant fait une bêtise ?", en: "What to do when a child misbehaves?" },
    options: {
      fr: ["Le frapper pour qu'il retienne", "Comprendre et expliquer calmement", "L'ignorer complètement"],
      en: ["Hit him so he remembers", "Understand and explain calmly", "Ignore him completely"],
    },
    correct: 1,
  },
  {
    q: { fr: "Les 1000 premiers jours de l'enfant sont…", en: "A child's first 1000 days are…" },
    options: {
      fr: ["Sans importance", "Décisifs pour son cerveau", "Réservés à la mère seule"],
      en: ["Not important", "Decisive for the brain", "For the mother only"],
    },
    correct: 1,
  },
];

export default function ParentRelais() {
  const [view, setView] = useState("app"); // 'app' | 'dashboard'
  const [online, setOnline] = useState(false);
  const [lang, setLang] = useState("fr");
  const [sessions, setSessions] = useState([]); // {id, village, total, femmes, handicap, score, synced}
  const [syncing, setSyncing] = useState(false);

  const pending = sessions.filter((s) => !s.synced);
  const synced = sessions.filter((s) => s.synced);
  const totalFamilies = synced.reduce((n, s) => n + s.total, 0);

  const addSession = (s) => setSessions((prev) => [...prev, { ...s, id: Date.now(), synced: false }]);

  const doSync = () => {
    if (!online || pending.length === 0) return;
    setSyncing(true);
    setTimeout(() => {
      setSessions((prev) => prev.map((s) => ({ ...s, synced: true })));
      setSyncing(false);
    }, 1100);
  };

  return (
    <div style={{ ...body, background: C.paper, color: C.ink }} className="min-h-screen w-full">
      <style>{FONTS}</style>

      {/* Top switch between the two "doors" of the same system */}
      <div className="w-full flex items-center justify-center px-4 pt-5 pb-3">
        <div
          className="inline-flex p-1 rounded-full"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Tab active={view === "app"} onClick={() => setView("app")} icon={<Smartphone size={16} />} label="App facilitateur" />
          <Tab active={view === "dashboard"} onClick={() => setView("dashboard")} icon={<LayoutDashboard size={16} />} label="Tableau de bord UNICEF" />
        </div>
      </div>

      {view === "app" ? (
        <FacilitatorApp
          online={online} setOnline={setOnline}
          lang={lang} setLang={setLang}
          pending={pending} syncing={syncing} doSync={doSync}
          addSession={addSession}
        />
      ) : (
        <Dashboard synced={synced} totalFamilies={totalFamilies} pending={pending} />
      )}

      <p style={{ color: C.muted }} className="text-center text-xs pb-8 pt-2 px-6">
        Démo — données en mémoire. Astuce : passez l'app <b>hors-ligne</b>, animez une séance, puis
        repassez <b>en ligne</b> et synchronisez pour la voir apparaître sur le tableau de bord.
      </p>
    </div>
  );
}

function Tab({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition"
      style={{
        ...display,
        background: active ? C.primary : "transparent",
        color: active ? "#fff" : C.muted,
      }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ============================ FACILITATOR APP (phone) ============================
function FacilitatorApp({ online, setOnline, lang, setLang, pending, syncing, doSync, addSession }) {
  const [screen, setScreen] = useState("home"); // home | module | session
  const [activeModule, setActiveModule] = useState(MODULES[0]);

  return (
    <div className="flex justify-center px-4">
      <div
        className="w-full overflow-hidden"
        style={{
          maxWidth: 390,
          background: C.surface,
          borderRadius: 30,
          border: `1px solid ${C.line}`,
          boxShadow: "0 24px 50px -24px rgba(8,89,110,0.35)",
        }}
      >
        {/* Connectivity banner — the unmissable status (signature) */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: online ? C.successSoft : C.dangerSoft }}
        >
          <div className="flex items-center gap-2" style={{ color: online ? C.success : C.danger }}>
            {online ? <Wifi size={18} /> : <WifiOff size={18} />}
            <span className="text-sm font-semibold" style={display}>
              {online ? "En ligne" : "Hors-ligne"}
            </span>
            {pending.length > 0 && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: C.ochre, color: "#fff" }}
              >
                {pending.length} à synchroniser
              </span>
            )}
          </div>
          <button
            onClick={() => setOnline((o) => !o)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ border: `1px solid ${online ? C.success : C.danger}`, color: online ? C.success : C.danger }}
          >
            {online ? "Simuler ↴ hors-ligne" : "Simuler ↴ en ligne"}
          </button>
        </div>

        {/* Sync bar appears when online with pending work */}
        {online && pending.length > 0 && (
          <button
            onClick={doSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold"
            style={{ background: C.primary, color: "#fff", ...display }}
          >
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Synchronisation…" : `Synchroniser ${pending.length} séance(s)`}
          </button>
        )}

        <div className="p-5" style={{ minHeight: 460 }}>
          {screen === "home" && (
            <Home lang={lang} setLang={setLang} onOpen={(m) => { setActiveModule(m); setScreen("module"); }} />
          )}
          {screen === "module" && (
            <ModuleView module={activeModule} lang={lang} setLang={setLang}
              onBack={() => setScreen("home")} onAnimate={() => setScreen("session")} />
          )}
          {screen === "session" && (
            <SessionFlow module={activeModule} lang={lang}
              onBack={() => setScreen("module")}
              onDone={(payload) => { addSession(payload); setScreen("home"); }} />
          )}
        </div>
      </div>
    </div>
  );
}

function LangPills({ lang, setLang }) {
  const langs = [
    { id: "fr", label: "FR", ok: true },
    { id: "en", label: "EN", ok: true },
    { id: "ff", label: "Fulfulde", ok: false },
  ];
  return (
    <div className="flex items-center gap-1.5">
      {langs.map((l) => (
        <button
          key={l.id}
          onClick={() => l.ok && setLang(l.id)}
          disabled={!l.ok}
          className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
          style={{
            background: lang === l.id ? C.primary : "transparent",
            color: lang === l.id ? "#fff" : l.ok ? C.primary : C.muted,
            border: `1px solid ${l.ok ? C.primary : C.line}`,
            opacity: l.ok ? 1 : 0.6,
          }}
          title={l.ok ? "" : "Contenu à venir — case prête, en attente de traduction"}
        >
          {l.label}{!l.ok && <Clock size={11} />}
        </button>
      ))}
    </div>
  );
}

function Home({ lang, setLang, onOpen }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-xs font-semibold" style={{ color: C.ochre, ...display, letterSpacing: 1 }}>
            PARENTRELAIS
          </p>
          <h1 className="text-xl font-bold" style={display}>Bonjour, Aïcha</h1>
        </div>
        <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold"
          style={{ background: C.ochreSoft, color: C.ochre, ...display }}>AB</div>
      </div>

      <div className="flex items-center justify-between mt-4 mb-2">
        <p className="text-sm font-semibold" style={{ color: C.muted }}>
          <BookOpen size={14} className="inline mr-1" /> Modules de formation
        </p>
        <LangPills lang={lang} setLang={setLang} />
      </div>

      <div className="flex flex-col gap-3">
        {MODULES.map((m) => (
          <button key={m.id} onClick={() => onOpen(m)}
            className="text-left p-4 rounded-2xl transition active:scale-[0.99]"
            style={{ background: C.paper, border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                style={{ background: C.primary, color: "#fff", ...display }}>Module {m.id}</span>
              <span className="text-xs flex items-center gap-1" style={{ color: C.muted }}>
                <Clock size={12} />{m.duration}
              </span>
            </div>
            <h3 className="font-bold mt-2" style={display}>{m.title[lang] || m.title.fr}</h3>
            <p className="text-sm mt-1" style={{ color: C.muted }}>{m.summary[lang] || m.summary.fr}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ModuleView({ module, lang, setLang, onBack, onAnimate }) {
  const [playing, setPlaying] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const t = (o) => o[lang] || o.fr;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold mb-3" style={{ color: C.primary }}>
        <ChevronLeft size={16} /> Retour
      </button>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: C.primary, color: "#fff", ...display }}>
          Module {module.id}
        </span>
        <LangPills lang={lang} setLang={setLang} />
      </div>
      <h2 className="text-xl font-bold mt-2" style={display}>{t(module.title)}</h2>
      <p className="text-sm mt-1" style={{ color: C.muted }}>{t(module.summary)}</p>

      {/* Audio — the key to local languages & low literacy */}
      <div className="mt-4 p-3 rounded-2xl flex items-center gap-3" style={{ background: C.ochreSoft }}>
        <button onClick={() => setPlaying((p) => !p)}
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: C.ochre, color: "#fff" }}>
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <div className="flex-1">
          <p className="text-sm font-semibold flex items-center gap-1" style={display}>
            <Volume2 size={14} /> Écouter le module ({lang.toUpperCase()})
          </p>
          <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: "#fff" }}>
            <div className="h-full rounded-full transition-all" style={{ width: playing ? "45%" : "0%", background: C.ochre }} />
          </div>
        </div>
      </div>

      {/* Video example placeholder */}
      <div className="mt-3 rounded-2xl flex items-center justify-center"
        style={{ height: 90, background: C.ink, color: "#fff" }}>
        <Play size={22} /> <span className="ml-2 text-sm" style={display}>Vidéo d'exemple (sous-titrée)</span>
      </div>

      {/* Guide d'animation */}
      <button onClick={() => setGuideOpen((g) => !g)}
        className="w-full mt-3 p-3 rounded-2xl flex items-center justify-between"
        style={{ background: C.paper, border: `1px solid ${C.line}` }}>
        <span className="text-sm font-semibold" style={display}>Guide d'animation</span>
        <ChevronRight size={16} style={{ transform: guideOpen ? "rotate(90deg)" : "none", transition: "0.2s" }} />
      </button>
      {guideOpen && (
        <ul className="mt-2 flex flex-col gap-2">
          {module.key[lang]?.map((k, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 size={16} style={{ color: C.success, marginTop: 2 }} />
              <span>{k}</span>
            </li>
          ))}
        </ul>
      )}

      <button onClick={onAnimate}
        className="w-full mt-5 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
        style={{ background: C.primary, color: "#fff", ...display }}>
        <Users size={18} /> Animer une séance
      </button>
    </div>
  );
}

function SessionFlow({ module, lang, onBack, onDone }) {
  const [step, setStep] = useState(0); // 0 attendance, 1 quiz, 2 recap
  const [total, setTotal] = useState(12);
  const [femmes, setFemmes] = useState(8);
  const [handicap, setHandicap] = useState(1);
  const [village, setVillage] = useState(VILLAGES[0]);
  const [answers, setAnswers] = useState([null, null]);

  const score = answers.reduce((n, a, i) => n + (a === QUIZ[i].correct ? 1 : 0), 0);

  const Stepper = ({ label, icon, value, set, max = 60 }) => (
    <div className="flex items-center justify-between p-3 rounded-2xl" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
      <span className="text-sm font-semibold flex items-center gap-2" style={display}>{icon}{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => set(Math.max(0, value - 1))} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "#fff", border: `1px solid ${C.line}` }}><Minus size={16} /></button>
        <span className="text-lg font-bold w-8 text-center" style={display}>{value}</span>
        <button onClick={() => set(Math.min(max, value + 1))} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: C.primary, color: "#fff" }}><Plus size={16} /></button>
      </div>
    </div>
  );

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold mb-3" style={{ color: C.primary }}>
        <ChevronLeft size={16} /> {module.title[lang] || module.title.fr}
      </button>

      {/* progress dots */}
      <div className="flex gap-1.5 mb-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i <= step ? C.primary : C.line }} />
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-bold" style={display}>Qui est présent aujourd'hui ?</h3>
          <div className="p-3 rounded-2xl" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
            <label className="text-sm font-semibold flex items-center gap-2" style={display}>
              <MapPin size={15} /> Village
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {VILLAGES.map((v) => (
                <button key={v} onClick={() => setVillage(v)}
                  className="text-sm px-3 py-1.5 rounded-full font-semibold"
                  style={{ background: village === v ? C.primary : "#fff", color: village === v ? "#fff" : C.ink, border: `1px solid ${C.line}` }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <Stepper label="Parents présents" icon={<Users size={16} />} value={total} set={setTotal} />
          <Stepper label="Dont femmes" icon={<Circle size={16} />} value={femmes} set={setFemmes} max={total} />
          <Stepper label="En situation de handicap" icon={<Accessibility size={16} />} value={handicap} set={setHandicap} max={total} />
          <button onClick={() => setStep(1)} className="mt-1 py-3.5 rounded-2xl font-bold" style={{ background: C.primary, color: "#fff", ...display }}>
            Continuer
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h3 className="font-bold flex items-center gap-2" style={display}><GraduationCap size={18} /> Petit quiz de fin</h3>
          {QUIZ.map((item, qi) => (
            <div key={qi}>
              <p className="text-sm font-semibold mb-2">{item.q[lang] || item.q.fr}</p>
              <div className="flex flex-col gap-2">
                {(item.options[lang] || item.options.fr).map((opt, oi) => (
                  <button key={oi} onClick={() => setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))}
                    className="text-left text-sm px-3 py-2.5 rounded-xl flex items-center gap-2"
                    style={{
                      background: answers[qi] === oi ? C.primary : C.paper,
                      color: answers[qi] === oi ? "#fff" : C.ink,
                      border: `1px solid ${C.line}`,
                    }}>
                    {answers[qi] === oi ? <CheckCircle2 size={16} /> : <Circle size={16} />}{opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setStep(2)} disabled={answers.includes(null)}
            className="py-3.5 rounded-2xl font-bold"
            style={{ background: answers.includes(null) ? C.line : C.primary, color: "#fff", ...display }}>
            Terminer la séance
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3 items-center text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mt-2" style={{ background: C.successSoft }}>
            <CheckCircle2 size={32} style={{ color: C.success }} />
          </div>
          <h3 className="font-bold text-lg" style={display}>Séance enregistrée</h3>
          <p className="text-sm" style={{ color: C.muted }}>
            {village} · {total} parents · {handicap} en situation de handicap · quiz {score}/{QUIZ.length}
          </p>
          <div className="w-full p-3 rounded-2xl text-sm" style={{ background: C.ochreSoft, color: C.ochre }}>
            Enregistré sur l'appareil. La séance sera envoyée dès qu'une connexion sera disponible.
          </div>
          <button onClick={() => onDone({ village, total, femmes, handicap, score })}
            className="w-full py-3.5 rounded-2xl font-bold" style={{ background: C.primary, color: "#fff", ...display }}>
            Revenir à l'accueil
          </button>
        </div>
      )}
    </div>
  );
}

// ============================ DASHBOARD (UNICEF / MINPROFF) ============================
function Dashboard({ synced, totalFamilies, pending }) {
  const byVillage = synced.reduce((acc, s) => {
    acc[s.village] = (acc[s.village] || 0) + s.total;
    return acc;
  }, {});
  const maxV = Math.max(1, ...Object.values(byVillage));
  const handicapTotal = synced.reduce((n, s) => n + s.handicap, 0);

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="mb-4">
        <p className="text-xs font-semibold" style={{ color: C.ochre, ...display, letterSpacing: 1 }}>PILOTAGE NATIONAL</p>
        <h1 className="text-2xl font-bold" style={display}>Couverture du programme</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Familles touchées" value={totalFamilies} icon={<Users size={18} />} color={C.primary} />
        <Stat label="Séances animées" value={synced.length} icon={<BookOpen size={18} />} color={C.success} />
        <Stat label="Dont en situation de handicap" value={handicapTotal} icon={<Accessibility size={18} />} color={C.ochre} />
      </div>

      {pending.length > 0 && (
        <div className="mt-3 p-3 rounded-2xl text-sm flex items-center gap-2" style={{ background: C.dangerSoft, color: C.danger }}>
          <WifiOff size={16} /> {pending.length} séance(s) encore sur le terrain, pas encore synchronisée(s).
          Passez l'app en ligne et synchronisez pour les voir ici.
        </div>
      )}

      <div className="mt-5 p-4 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <h3 className="font-bold mb-3 flex items-center gap-2" style={display}><MapPin size={16} /> Familles touchées par localité</h3>
        {Object.keys(byVillage).length === 0 ? (
          <p className="text-sm" style={{ color: C.muted }}>
            Aucune donnée pour l'instant. Depuis l'app facilitateur, animez une séance puis synchronisez.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {Object.entries(byVillage).map(([v, n]) => (
              <div key={v} className="flex items-center gap-3">
                <span className="text-sm font-semibold w-20" style={display}>{v}</span>
                <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: C.paper }}>
                  <div className="h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${(n / maxV) * 100}%`, background: C.primary }}>
                    <span className="text-xs font-bold text-white">{n}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content management — the "empty cases" ready to fill */}
      <div className="mt-4 p-4 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        <h3 className="font-bold mb-3 flex items-center gap-2" style={display}><Globe size={16} /> Contenus & langues</h3>
        <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${C.line}` }}>
          <div className="grid grid-cols-5 text-xs font-semibold" style={{ background: C.paper, ...display }}>
            <div className="p-2 col-span-1">Module</div>
            <div className="p-2 text-center">FR</div>
            <div className="p-2 text-center">EN</div>
            <div className="p-2 text-center">Fulfulde</div>
            <div className="p-2 text-center">Langue des signes</div>
          </div>
          {MODULES.map((m) => (
            <div key={m.id} className="grid grid-cols-5 text-sm items-center" style={{ borderTop: `1px solid ${C.line}` }}>
              <div className="p-2 font-medium">M{m.id}</div>
              <Cell ok /><Cell ok /><Cell /><Cell />
            </div>
          ))}
        </div>
        <p className="text-xs mt-2" style={{ color: C.muted }}>
          ✅ prêt · <Clock size={11} className="inline" /> case prête, en attente de contenu. Ajouter une langue = déposer un fichier, sans retoucher l'application.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, color }) {
  return (
    <div className="p-3 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2" style={{ background: color + "22", color }}>{icon}</div>
      <div className="text-2xl font-bold" style={display}>{value}</div>
      <div className="text-xs" style={{ color: C.muted }}>{label}</div>
    </div>
  );
}

function Cell({ ok }) {
  return (
    <div className="p-2 flex justify-center">
      {ok ? <CheckCircle2 size={16} style={{ color: C.success }} /> : <Clock size={15} style={{ color: C.ochre }} />}
    </div>
  );
}
