import { useEffect, useMemo, useState } from "react";
import {
  IonApp, IonContent, IonPage, IonSpinner, IonToast
} from "@ionic/react";
import { api, User, Item, RequestItem, RequestStatus, ApiResponse } from "./services/api";

type Screen = "home" | "requests" | "profile" | "admin";
const statusOrder: RequestStatus[] = ["Pendente", "Em Análise", "Confirmado", "Concluído"];
const statusLabel: Record<RequestStatus, string> = {
  "Pendente": "Solicitado", "Em Análise": "Em análise", "Confirmado": "Confirmado",
  "Concluído": "Concluído", "Cancelado": "Cancelado"
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("fila_user"); return raw ? JSON.parse(raw) as User : null;
  });
  const [screen, setScreen] = useState<Screen>("home");
  const [items, setItems] = useState<Item[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [register, setRegister] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const notify = (message: string) => setToast(message);
  const loadItems = async () => {
    try { const r = await api.get<ApiResponse<Item[]>>("/items"); setItems(r.data.data); }
    catch { notify("Não foi possível carregar os serviços."); }
  };
  const loadRequests = async (current = user) => {
    if (!current) return;
    try {
      const endpoint = current.perfil === "gestor" ? "/actions" : `/actions/user/${current.id}`;
      const r = await api.get<ApiResponse<RequestItem[]>>(endpoint); setRequests(r.data.data);
    } catch { notify("Não foi possível carregar as solicitações."); }
  };

  useEffect(() => { void loadItems(); }, []);
  useEffect(() => { if (user && (screen === "requests" || screen === "admin")) void loadRequests(user); }, [user, screen]);

  const categories = useMemo(() => ["Todos", ...Array.from(new Set(items.map(i => i.categoria)))], [items]);
  const filtered = items.filter(i => i.status === "Ativo" &&
    (category === "Todos" || i.categoria === category) &&
    `${i.titulo} ${i.descricao}`.toLowerCase().includes(query.toLowerCase()));

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      if (register) {
        await api.post("/auth/register", { nome: name, email, senha: password });
        notify("Conta criada! Entre com seu e-mail e senha."); setRegister(false);
      } else {
        const r = await api.post<ApiResponse<{ token: string; user: User }>>("/auth/login", { email, senha: password });
        localStorage.setItem("fila_token", r.data.data.token);
        localStorage.setItem("fila_user", JSON.stringify(r.data.data.user));
        setUser(r.data.data.user); setScreen(r.data.data.user.perfil === "gestor" ? "admin" : "home");
      }
    } catch (err: any) { notify(err?.response?.data?.message || "Não foi possível autenticar."); }
    finally { setLoading(false); }
  }

  async function requestItem(item: Item) {
    try {
      await api.post("/actions", { item_id: item.id });
      notify("Solicitação enviada com sucesso!"); await loadRequests(); setScreen("requests");
    } catch (err: any) { notify(err?.response?.data?.message || "Erro ao solicitar serviço."); }
  }

  async function updateStatus(id: number, status: RequestStatus) {
    try { await api.patch(`/actions/${id}/status`, { status }); notify("Status atualizado."); await loadRequests(); }
    catch (err: any) { notify(err?.response?.data?.message || "Erro ao atualizar status."); }
  }

  function logout() {
    localStorage.removeItem("fila_token"); localStorage.removeItem("fila_user");
    setUser(null); setRequests([]); setScreen("home");
  }

  if (!user) return <IonApp><IonPage><IonContent className="auth-content">
    <div className="auth-layout">
      <section className="auth-intro">
        <div className="brand"><span className="brand-mark">F</span> fila</div>
        <div className="intro-copy"><span className="eyebrow">ATENDIMENTO SIMPLES</span>
          <h1>Seu atendimento,<br/>sem complicação.</h1>
          <p>Solicite serviços e acompanhe sua vez em tempo real.</p>
          <div className="intro-visual"><div className="people">●　●　●</div><span>Atendimento organizado, do início ao fim.</span></div>
        </div>
      </section>
      <form className="auth-card" onSubmit={handleAuth}>
        <div className="auth-tabs"><button type="button" className={!register ? "selected" : ""} onClick={() => setRegister(false)}>Entrar</button><button type="button" className={register ? "selected" : ""} onClick={() => setRegister(true)}>Criar conta</button></div>
        {register && <label>Nome<input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required/></label>}
        <label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" required/></label>
        <label>Senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" minLength={6} required/></label>
        <p className="helper">Acesso de gestor é criado pelo administrador do sistema.</p>
        <button className="primary full" disabled={loading}>{loading ? "Aguarde..." : register ? "Criar minha conta →" : "Acessar plataforma →"}</button>
        <p className="terms">Ao continuar, você aceita os Termos de Uso e a Política de Privacidade.</p>
      </form>
    </div>
    <IonToast isOpen={!!toast} message={toast} duration={2800} onDidDismiss={() => setToast("")}/>
  </IonContent></IonPage></IonApp>;

  const isGestor = user.perfil === "gestor";
  return <IonApp><IonPage><IonContent className="app-content">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">F</span> fila</div>
      <nav className="desktop-nav">
        {isGestor ? <button className={screen === "admin" ? "nav-active" : ""} onClick={() => setScreen("admin")}>Painel</button> :
          <><button className={screen === "home" ? "nav-active" : ""} onClick={() => setScreen("home")}>Início</button><button className={screen === "requests" ? "nav-active" : ""} onClick={() => setScreen("requests")}>Meus pedidos</button><button className={screen === "profile" ? "nav-active" : ""} onClick={() => setScreen("profile")}>Perfil</button></>}
      </nav>
      <button className="avatar" onClick={() => setScreen(isGestor ? "admin" : "profile")}>{user.nome.slice(0,1).toUpperCase()}</button>
    </header>

    <main className="main-shell">
      {screen === "home" && !isGestor && <>
        <div className="welcome"><div><span className="eyebrow">ÁREA DO CLIENTE</span><h1>Olá, {user.nome.split(" ")[0]}</h1><p>De qual serviço você precisa?</p></div><span className="profile-pill">● Cliente</span></div>
        <div className="toolbar"><input className="search" placeholder="⌕  Buscar serviços..." value={query} onChange={e => setQuery(e.target.value)}/><div className="filters">{categories.map(c => <button key={c} className={category === c ? "chip active" : "chip"} onClick={() => setCategory(c)}>{c}</button>)}</div></div>
        <div className="section-heading"><h2>Serviços para você</h2><span>{filtered.length} serviços</span></div>
        <div className="service-grid">{filtered.map(item => <article className="service-card" key={item.id}><div className="service-icon">◇</div><span className="category-tag">{item.categoria}</span><h3>{item.titulo}</h3><p>{item.descricao}</p><div className="meta-row"><span>◷ {item.categoria === "Consultoria" ? "30 min" : "15 min"}</span><span>⌁ Online</span></div><button className="primary full" onClick={() => void requestItem(item)}>{item.categoria === "Consultoria" ? "Agendar" : item.categoria === "Suporte" ? "Solicitar" : "Entrar na fila"} →</button></article>)}</div>
      </>}

      {screen === "requests" && !isGestor && <><div className="page-heading"><span className="eyebrow">SOLICITAÇÕES</span><h1>Acompanhe sua vez</h1><p>Veja o andamento dos seus atendimentos.</p></div>
        {requests.length === 0 ? <div className="empty-state"><h3>Você ainda não tem solicitações</h3><p>Escolha um serviço na página inicial para começar.</p><button className="primary" onClick={() => setScreen("home")}>Ver serviços</button></div> :
          <div className="request-list">{requests.map(r => <article className="request-card" key={r.id}><div className="request-top"><div><span className="eyebrow">SOLICITAÇÃO #{r.id}</span><h3>{r.item_titulo}</h3></div><StatusPill status={r.status}/></div><p className="muted">Enviada em {new Date(r.criado_em).toLocaleString("pt-BR")}</p>{r.status === "Cancelado" ? <p className="cancelled">Esta solicitação foi cancelada.</p> : <Stepper status={r.status}/>}</article>)}</div>}
      </>}

      {screen === "profile" && !isGestor && <div className="profile-card"><span className="avatar large">{user.nome.slice(0,1).toUpperCase()}</span><span className="eyebrow">MEU PERFIL</span><h1>{user.nome}</h1><p>{user.email}</p><span className="profile-pill">Cliente</span><button className="secondary full" onClick={logout}>Sair da conta</button></div>}

      {(screen === "admin" || isGestor) && isGestor && <><div className="welcome"><div><span className="eyebrow">GESTÃO</span><h1>Painel de solicitações</h1><p>Gerencie os atendimentos enviados pelos clientes.</p></div><span className="profile-pill">● Gestor</span></div>
        <div className="stats-grid"><Stat label="Total" value={requests.length}/><Stat label="Pendentes" value={requests.filter(r => r.status === "Pendente" || r.status === "Em Análise").length}/><Stat label="Confirmados" value={requests.filter(r => r.status === "Confirmado").length}/><Stat label="Concluídos" value={requests.filter(r => r.status === "Concluído").length}/></div>
        <div className="table-panel"><div className="section-heading"><h2>Todas as solicitações</h2><button className="secondary" onClick={() => void loadRequests()}>↻ Atualizar</button></div>
          {requests.length === 0 ? <div className="empty-state"><h3>Nenhuma solicitação ainda</h3><p>Quando um cliente solicitar um serviço, ele aparecerá aqui.</p></div> :
          <div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Serviço</th><th>Data</th><th>Status</th><th>Atualizar</th></tr></thead><tbody>{requests.map(r => <tr key={r.id}><td><strong>{r.usuario_nome}</strong><small>{r.usuario_email}</small></td><td>{r.item_titulo}</td><td>{new Date(r.criado_em).toLocaleDateString("pt-BR")}</td><td><StatusPill status={r.status}/></td><td><select value={r.status} onChange={e => void updateStatus(r.id, e.target.value as RequestStatus)}><option>Pendente</option><option>Em Análise</option><option>Confirmado</option><option>Concluído</option><option>Cancelado</option></select></td></tr>)}</tbody></table></div>}
        </div><button className="secondary logout-desktop" onClick={logout}>Sair da conta</button>
      </>}
    </main>

    {!isGestor && <nav className="bottom-nav"><button className={screen === "home" ? "bottom-active" : ""} onClick={() => setScreen("home")}>⌂<span>Início</span></button><button className={screen === "requests" ? "bottom-active" : ""} onClick={() => setScreen("requests")}>▤<span>Meus pedidos</span></button><button className={screen === "profile" ? "bottom-active" : ""} onClick={() => setScreen("profile")}>◉<span>Perfil</span></button></nav>}
    <IonToast isOpen={!!toast} message={toast} duration={2800} onDidDismiss={() => setToast("")}/>
  </IonContent></IonPage></IonApp>;
}

function StatusPill({ status }: { status: RequestStatus }) {
  return <span className={`status-pill ${status === "Concluído" || status === "Confirmado" ? "success" : status === "Cancelado" ? "danger" : "pending"}`}>{statusLabel[status]}</span>;
}
function Stepper({ status }: { status: RequestStatus }) {
  const current = statusOrder.indexOf(status);
  return <div className="stepper">{statusOrder.map((step, index) => <div className={`step ${index <= current ? "done" : ""}`} key={step}><span className="step-dot">{index < current ? "✓" : index + 1}</span><div><strong>{statusLabel[step]}</strong><small>{index === 0 ? "Solicitação recebida" : index === 1 ? "Aguardando análise" : index === 2 ? "Atendimento confirmado" : "Atendimento finalizado"}</small></div></div>)}</div>;
}
function Stat({ label, value }: { label: string; value: number }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>;
}
