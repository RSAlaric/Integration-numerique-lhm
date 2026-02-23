import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../i18n/LanguageContext';

// ════════════════════════════════════════════════════════════
//  STORAGE — localStorage uniquement, pas besoin du backend
// ════════════════════════════════════════════════════════════
const LS = {
  get: (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set: (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const KEY_MSGS  = 'lhm_v8_messages';
const KEY_ROOMS = 'lhm_v8_rooms';
const POLL_MS   = 1800;

// ════════════════════════════════════════════════════════════
//  DONNÉES PAR DÉFAUT
// ════════════════════════════════════════════════════════════
const DEFAULT_ROOMS = [
  { id:'g_general',     type:'group', icon:'💬', name:'Général',            desc:'Canal ouvert à tous' },
  { id:'g_direction',   type:'group', icon:'👔', name:'Direction',           desc:'Équipe de direction' },
  { id:'g_rh',          type:'group', icon:'👥', name:'Ressources Humaines', desc:'Personnel & absences' },
  { id:'g_stock',       type:'group', icon:'📦', name:'Stock & Logistique',  desc:'Gestion des stocks' },
  { id:'g_projets',     type:'group', icon:'🎯', name:'Projets',             desc:'Suivi des projets' },
  { id:'g_volontaires', type:'group', icon:'🤝', name:'Volontaires',         desc:'Coordination terrain' },
  { id:'g_priere',      type:'group', icon:'🙏', name:'Prière & Dévotion',   desc:'Partage spirituel' },
];
const ICONS_PICK = ['💬','🏢','📋','🎯','📦','🤝','🗣️','📢','⭐','✝️','🙏','📖','🌍','🎵','📸','🔔'];

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════
function avatarBg(name) {
  const palette = ['#0f2044','#c9a84c','#16a34a','#2563eb','#7c3aed','#dc2626','#0891b2','#d97706','#0d9488','#b45309'];
  let h = 0; for (const c of name||'') h = (h<<5)-h+c.charCodeAt(0);
  return palette[Math.abs(h) % palette.length];
}
function initials(name) {
  return (name||'?').split(' ').filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase();
}
function fmtHour(ts) {
  return new Date(ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}
function fmtDayLabel(ts) {
  const d = new Date(ts), now = new Date();
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  const yest = new Date(now); yest.setDate(now.getDate()-1);
  if (d.toDateString() === yest.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long'});
}

// ════════════════════════════════════════════════════════════
//  COMPOSANTS UI
// ════════════════════════════════════════════════════════════
function Avatar({ name, size=38, color }) {
  const bg = color || avatarBg(name);
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`linear-gradient(145deg, ${bg}, ${bg}cc)`,
      color:'white', display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:Math.round(size*0.37), fontWeight:700, userSelect:'none',
      boxShadow:`0 2px 8px ${bg}55`,
      border:'2.5px solid rgba(255,255,255,0.2)',
      fontFamily:'inherit',
    }}>
      {initials(name)}
    </div>
  );
}

function GroupAvatar({ icon, size=40 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:Math.round(size*0.28),
      flexShrink:0, background:'linear-gradient(145deg,#0f2044,#1e3f7a)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:Math.round(size*0.5), boxShadow:'0 3px 10px #0f204455',
    }}>
      {icon}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  PAGE MESSAGERIE
// ════════════════════════════════════════════════════════════
export default function MessengerPage() {
  const { user }  = useAuth();
  const { lang }  = useLang();
  const fr = lang !== 'en';

  // Identité de l'utilisateur courant
  const myId   = user?.id || user?.email || 'me';
  const myName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.email || 'Moi';
  const myRole = user?.role || '';

  // ── State principal ───────────────────────────────────────
  const [rooms,    setRooms]    = useState(() => {
    const saved = LS.get(KEY_ROOMS, []);
    // Merge: garder les salons custom, ajouter les défauts manquants
    const ids = new Set(saved.map(r=>r.id));
    return [...DEFAULT_ROOMS.filter(r=>!ids.has(r.id)), ...saved];
  });
  const [messages, setMessages] = useState(() => LS.get(KEY_MSGS, []));
  const [activeId, setActiveId] = useState(null);
  const [tab,      setTab]      = useState('groups'); // groups | private | team
  const [input,    setInput]    = useState('');
  const [search,   setSearch]   = useState('');

  // Nouveau groupe
  const [newGOpen, setNewGOpen] = useState(false);
  const [newGName, setNewGName] = useState('');
  const [newGIcon, setNewGIcon] = useState('💬');
  const [newGDesc, setNewGDesc] = useState('');

  // Références
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const tickRef   = useRef(null);

  // ── Synchronisation: rafraichir depuis LS toutes les 1.8s ─
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setMessages(LS.get(KEY_MSGS, []));
      setRooms(prev => {
        const saved = LS.get(KEY_ROOMS, []);
        const ids = new Set(saved.map(r=>r.id));
        return [...DEFAULT_ROOMS.filter(r=>!ids.has(r.id)), ...saved];
      });
    }, POLL_MS);
    return () => clearInterval(tickRef.current);
  }, []);

  // ── Scroll bas à chaque nouveau message ──────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages.length, activeId]);

  // ── Titre de la page ─────────────────────────────────────
  useEffect(() => {
    const el = document.getElementById('page-title');
    if (el) el.textContent = fr ? 'Messagerie' : 'Messaging';
  }, [lang]);

  // ── Room active ──────────────────────────────────────────
  const active = rooms.find(r => r.id === activeId) || null;

  // ── Messages du salon actif ──────────────────────────────
  const roomMsgs = useMemo(() =>
    messages.filter(m => m.roomId === activeId),
    [messages, activeId]
  );

  // ── Unread par salon ─────────────────────────────────────
  const unreadCount = (roomId) =>
    messages.filter(m => m.roomId===roomId && m.senderId!==myId && !(m.readBy||[]).includes(myId)).length;

  const lastMsg = (roomId) => {
    const all = messages.filter(m => m.roomId===roomId);
    return all[all.length-1] || null;
  };

  // ── Sauvegarder les messages + rooms dans LS ─────────────
  const saveMessages = (msgs) => { setMessages(msgs); LS.set(KEY_MSGS, msgs); };
  const saveRooms    = (rs)   => { setRooms(rs);    LS.set(KEY_ROOMS, rs.filter(r=>!DEFAULT_ROOMS.find(d=>d.id===r.id))); };

  // ── Marquer comme lus quand on ouvre un salon ────────────
  const openRoom = (room) => {
    setActiveId(room.id);
    // Marquer les messages non lus comme lus
    const updated = messages.map(m =>
      m.roomId===room.id && m.senderId!==myId && !(m.readBy||[]).includes(myId)
        ? { ...m, readBy:[...(m.readBy||[]), myId] }
        : m
    );
    saveMessages(updated);
  };

  // ── Envoyer un message ───────────────────────────────────
  const send = () => {
    const text = input.trim();
    if (!text || !activeId) return;
    const msg = {
      id:         `m${Date.now()}${Math.random().toString(36).slice(2,6)}`,
      roomId:     activeId,
      senderId:   myId,
      senderName: myName,
      senderRole: myRole,
      text,
      ts:         Date.now(),
      readBy:     [myId],
    };
    // Lire le LS le plus récent avant d'écrire (multi-onglets)
    const latest = LS.get(KEY_MSGS, []);
    saveMessages([...latest, msg]);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ── Créer un groupe ──────────────────────────────────────
  const createGroup = () => {
    const name = newGName.trim();
    if (!name) return;
    const room = {
      id:   `g_custom_${Date.now()}`,
      type: 'group',
      icon: newGIcon,
      name,
      desc: newGDesc.trim() || fr?'Groupe personnalisé':'Custom group',
    };
    const updated = [...rooms, room];
    saveRooms(updated.filter(r=>!DEFAULT_ROOMS.find(d=>d.id===r.id)));
    setRooms(updated);
    setNewGName(''); setNewGDesc(''); setNewGOpen(false);
    openRoom(room); setTab('groups');
  };

  // ── Ouvrir/créer une conversation privée ─────────────────
  const openPrivate = (targetId, targetName) => {
    const roomId = [myId, targetId].sort().join('__');
    let room = rooms.find(r=>r.id===roomId);
    if (!room) {
      room = { id:roomId, type:'private', name:targetName, partnerId:targetId };
      const updated = [...rooms, room];
      saveRooms(updated.filter(r=>!DEFAULT_ROOMS.find(d=>d.id===r.id)));
      setRooms(updated);
    }
    openRoom(room); setTab('private');
  };

  // ── Supprimer un message ─────────────────────────────────
  const deleteMsg = (msgId) => {
    if (!window.confirm(fr?'Supprimer ce message ?':'Delete this message?')) return;
    const latest = LS.get(KEY_MSGS, []);
    saveMessages(latest.filter(m=>m.id!==msgId));
  };

  // ── Membres de l'équipe (depuis LS des sessions précédentes + user courant)
  // On collecte les expéditeurs uniques de tous les messages
  const teamMembers = useMemo(() => {
    const map = {};
    messages.forEach(m => {
      if (m.senderId !== myId && !map[m.senderId]) {
        map[m.senderId] = { id:m.senderId, name:m.senderName, role:m.senderRole };
      }
    });
    return Object.values(map);
  }, [messages, myId]);

  // ── Données filtrées ─────────────────────────────────────
  const q = search.toLowerCase();
  const groups   = rooms.filter(r=>r.type==='group' && (!q||r.name.toLowerCase().includes(q)));
  const privates = rooms.filter(r=>r.type==='private' && (!q||r.name.toLowerCase().includes(q)));

  // Groupes de messages par date pour séparateurs
  const groupedMsgs = useMemo(() => {
    const result = [];
    let lastDay = null;
    roomMsgs.forEach((msg, i) => {
      const day = new Date(msg.ts).toDateString();
      const showDay  = day !== lastDay;
      const prev     = roomMsgs[i-1];
      const showName = !prev || prev.senderId !== msg.senderId || showDay;
      const isOwn    = msg.senderId === myId;
      const canDel   = isOwn || myRole==='super_admin';
      if (showDay) lastDay = day;
      result.push({ msg, showDay, showName, isOwn, canDel });
    });
    return result;
  }, [roomMsgs, myId, myRole]);

  // ── Total non lus ─────────────────────────────────────────
  const totalUnread = rooms.reduce((acc,r) => acc + unreadCount(r.id), 0);

  // ════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════
  return (
    <div style={{
      display:'flex', height:'calc(100vh - 90px)',
      borderRadius:16, overflow:'hidden',
      boxShadow:'0 8px 40px rgba(15,32,68,0.18)',
      border:'1px solid #e2e8f0',
      fontFamily:"'DM Sans', sans-serif",
    }}>

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <aside style={{
        width:300, minWidth:260, display:'flex', flexDirection:'column',
        background:'white', borderRight:'1px solid #f0f4f8',
      }}>

        {/* Header */}
        <div style={{
          background:'linear-gradient(145deg, #0a1a38, #0f2044, #1a3a6e)',
          padding:'18px 16px 14px',
        }}>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
            <Avatar name={myName} size={44} color='#c9a84c' />
            <div style={{flex:1, minWidth:0}}>
              <p style={{fontWeight:700, color:'white', fontSize:'0.92rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{myName}</p>
              <div style={{display:'flex', alignItems:'center', gap:5, marginTop:3}}>
                <div style={{width:7, height:7, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 6px #4ade8099'}} />
                <span style={{fontSize:'0.69rem', color:'rgba(255,255,255,0.6)'}}>
                  {fr?'En ligne':'Online'}
                  {totalUnread>0 && <span style={{marginLeft:6, background:'#dc2626', color:'white', borderRadius:10, padding:'0px 6px', fontSize:'0.65rem', fontWeight:700}}>{totalUnread}</span>}
                </span>
              </div>
            </div>
          </div>
          {/* Search */}
          <div style={{position:'relative'}}>
            <span style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.35)', fontSize:'0.85rem'}}>🔍</span>
            <input
              value={search} onChange={e=>setSearch(e.target.value)}
              placeholder={fr?'Rechercher un salon…':'Search a channel…'}
              style={{
                width:'100%', padding:'8px 10px 8px 30px',
                borderRadius:10, border:'1px solid rgba(255,255,255,0.15)',
                background:'rgba(255,255,255,0.1)', color:'white',
                fontSize:'0.8rem', outline:'none', boxSizing:'border-box',
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex', borderBottom:'1px solid #f0f4f8', background:'#fafbfc'}}>
          {[
            ['groups',  fr?'Groupes':'Groups',   '👥'],
            ['private', fr?'Privé':'Private',    '🔒'],
            ['team',    fr?'Équipe':'Team',       '🧑‍🤝‍🧑'],
          ].map(([k,l,ic])=>(
            <button key={k} onClick={()=>setTab(k)} style={{
              flex:1, padding:'10px 4px', border:'none', background:'none',
              cursor:'pointer', fontSize:'0.73rem', fontWeight:700,
              color:tab===k?'#0f2044':'#9ca3af',
              borderBottom:`2.5px solid ${tab===k?'#c9a84c':'transparent'}`,
              transition:'all 0.18s', display:'flex', alignItems:'center', justifyContent:'center', gap:3,
            }}>
              {ic} {l}
            </button>
          ))}
        </div>

        {/* Liste des rooms */}
        <div style={{flex:1, overflowY:'auto'}}>

          {/* ─ GROUPES ─ */}
          {tab==='groups' && (
            <>
              {/* Créer groupe */}
              <div style={{padding:'10px 12px', borderBottom:'1px solid #f5f7fa'}}>
                {!newGOpen ? (
                  <button onClick={()=>setNewGOpen(true)} style={{
                    width:'100%', padding:'8px 12px',
                    border:'2px dashed #d1d5db', borderRadius:10,
                    background:'none', cursor:'pointer',
                    fontSize:'0.78rem', color:'#9ca3af',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                    transition:'all 0.15s',
                  }}>
                    ＋ {fr?'Nouveau groupe':'New group'}
                  </button>
                ) : (
                  <div style={{background:'rgba(201,168,76,0.07)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:12, padding:'12px'}}>
                    <p style={{fontSize:'0.7rem', fontWeight:700, color:'#c9a84c', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10}}>
                      {fr?'Créer un groupe':'Create group'}
                    </p>
                    {/* Icônes */}
                    <div style={{display:'flex', flexWrap:'wrap', gap:3, marginBottom:8}}>
                      {ICONS_PICK.map(ic=>(
                        <button key={ic} onClick={()=>setNewGIcon(ic)} style={{
                          width:28, height:28, borderRadius:7,
                          border:`2px solid ${newGIcon===ic?'#c9a84c':'#e5e7eb'}`,
                          background:newGIcon===ic?'rgba(201,168,76,0.18)':'white',
                          cursor:'pointer', fontSize:'0.82rem', transition:'all 0.12s',
                        }}>{ic}</button>
                      ))}
                    </div>
                    <input value={newGName} onChange={e=>setNewGName(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&createGroup()}
                      placeholder={fr?'Nom du groupe…':'Group name…'}
                      style={{width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid #e5e7eb', fontSize:'0.8rem', marginBottom:6, outline:'none', boxSizing:'border-box'}} />
                    <input value={newGDesc} onChange={e=>setNewGDesc(e.target.value)}
                      placeholder={fr?'Description (optionnel)…':'Description (optional)…'}
                      style={{width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid #e5e7eb', fontSize:'0.8rem', marginBottom:8, outline:'none', boxSizing:'border-box'}} />
                    <div style={{display:'flex', gap:6}}>
                      <button onClick={createGroup} style={{flex:1, padding:'7px', background:'#0f2044', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.78rem'}}>
                        ✓ {fr?'Créer':'Create'}
                      </button>
                      <button onClick={()=>setNewGOpen(false)} style={{padding:'7px 12px', background:'none', border:'1px solid #e5e7eb', borderRadius:8, cursor:'pointer', fontSize:'0.78rem', color:'#6b7280'}}>
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {groups.map(room => {
                const last = lastMsg(room.id);
                const u    = unreadCount(room.id);
                const isA  = activeId===room.id;
                return (
                  <div key={room.id} onClick={()=>openRoom(room)} style={{
                    padding:'11px 14px', cursor:'pointer',
                    background:isA?'rgba(15,32,68,0.07)':'white',
                    borderBottom:'1px solid #f5f7fa',
                    display:'flex', gap:11, alignItems:'center',
                    transition:'background 0.12s',
                    borderLeft:isA?'3px solid #c9a84c':'3px solid transparent',
                  }}>
                    <GroupAvatar icon={room.icon} size={42} />
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <p style={{fontWeight:700, color:'#0f2044', fontSize:'0.85rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{room.name}</p>
                        {last && <span style={{fontSize:'0.61rem', color:'#9ca3af', flexShrink:0, marginLeft:4}}>{fmtHour(last.ts)}</span>}
                      </div>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:2}}>
                        <p style={{fontSize:'0.73rem', color:u>0?'#374151':'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, fontWeight:u>0?600:400}}>
                          {last
                            ? `${last.senderName?.split(' ')[0]}: ${last.text.slice(0,35)}${last.text.length>35?'…':''}`
                            : (fr?'Aucun message':'No messages')}
                        </p>
                        {u>0 && (
                          <span style={{background:'#dc2626', color:'white', borderRadius:20, fontSize:'0.61rem', fontWeight:700, padding:'1px 6px', flexShrink:0, marginLeft:5}}>
                            {u>9?'9+':u}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ─ PRIVÉ ─ */}
          {tab==='private' && (
            <>
              {privates.length === 0 && (
                <div style={{padding:'30px 20px', textAlign:'center'}}>
                  <div style={{fontSize:'2.5rem', marginBottom:10}}>🔒</div>
                  <p style={{fontSize:'0.82rem', color:'#9ca3af', lineHeight:1.6}}>
                    {fr?"Aucune conversation privée.\nAllez dans Équipe pour en démarrer une.":'No private conversations.\nGo to Team to start one.'}
                  </p>
                </div>
              )}
              {privates.map(room => {
                const last = lastMsg(room.id);
                const u    = unreadCount(room.id);
                const isA  = activeId===room.id;
                return (
                  <div key={room.id} onClick={()=>openRoom(room)} style={{
                    padding:'11px 14px', cursor:'pointer',
                    background:isA?'rgba(15,32,68,0.07)':'white',
                    borderBottom:'1px solid #f5f7fa',
                    display:'flex', gap:11, alignItems:'center',
                    borderLeft:isA?'3px solid #c9a84c':'3px solid transparent',
                  }}>
                    <Avatar name={room.name} size={42} />
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{display:'flex', justifyContent:'space-between'}}>
                        <p style={{fontWeight:700, color:'#0f2044', fontSize:'0.85rem'}}>{room.name}</p>
                        {last && <span style={{fontSize:'0.61rem', color:'#9ca3af'}}>{fmtHour(last.ts)}</span>}
                      </div>
                      <div style={{display:'flex', justifyContent:'space-between', marginTop:2}}>
                        <p style={{fontSize:'0.73rem', color:u>0?'#374151':'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, fontWeight:u>0?600:400}}>
                          {last ? last.text.slice(0,40) : (fr?'Commencer…':'Start chatting…')}
                        </p>
                        {u>0 && <span style={{background:'#dc2626', color:'white', borderRadius:20, fontSize:'0.61rem', fontWeight:700, padding:'1px 6px', flexShrink:0, marginLeft:5}}>{u}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ─ ÉQUIPE ─ */}
          {tab==='team' && (
            <div style={{padding:'12px'}}>
              <p style={{fontSize:'0.7rem', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10}}>
                {fr?"Membres actifs":"Active members"} ({teamMembers.length})
              </p>
              {teamMembers.length === 0 && (
                <div style={{padding:'20px 0', textAlign:'center'}}>
                  <div style={{fontSize:'2rem', marginBottom:8}}>👋</div>
                  <p style={{fontSize:'0.8rem', color:'#9ca3af', lineHeight:1.6}}>
                    {fr?"Les membres de l'équipe apparaîtront ici après avoir envoyé un message.":'Team members will appear here after sending a message.'}
                  </p>
                </div>
              )}
              {teamMembers.filter(m=>!q||m.name.toLowerCase().includes(q)).map(m=>(
                <div key={m.id} onClick={()=>openPrivate(m.id, m.name)} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 10px', borderRadius:11,
                  cursor:'pointer', marginBottom:5,
                  border:'1px solid #f0f4f8', background:'#fafbfc',
                  transition:'all 0.15s',
                }}>
                  <Avatar name={m.name} size={38} />
                  <div style={{flex:1}}>
                    <p style={{fontSize:'0.84rem', fontWeight:700, color:'#0f2044'}}>{m.name}</p>
                    <p style={{fontSize:'0.7rem', color:'#9ca3af'}}>{m.role}</p>
                  </div>
                  <span style={{fontSize:'0.78rem', background:'rgba(201,168,76,0.12)', color:'#c9a84c', padding:'4px 9px', borderRadius:8}}>💬</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ══════════════════ ZONE DE CHAT ══════════════════ */}
      {active ? (
        <div style={{flex:1, display:'flex', flexDirection:'column', background:'#f5f7fb', minWidth:0}}>

          {/* Header du chat */}
          <div style={{
            padding:'12px 20px', background:'white',
            borderBottom:'1px solid #f0f4f8',
            display:'flex', alignItems:'center', gap:12,
            boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
          }}>
            {active.type==='group'
              ? <GroupAvatar icon={active.icon} size={46} />
              : <Avatar name={active.name} size={46} />}
            <div style={{flex:1}}>
              <p style={{fontWeight:700, color:'#0f2044', fontSize:'0.97rem'}}>
                {active.type==='group' ? `# ${active.name}` : active.name}
              </p>
              <p style={{fontSize:'0.72rem', color:'#9ca3af', marginTop:1}}>
                {active.type==='group'
                  ? (active.desc || 'Groupe de discussion')
                  : (fr?'💬 Discussion privée':'💬 Private conversation')}
                {' · '}{roomMsgs.length} {fr?'message(s)':'message(s)'}
              </p>
            </div>
            {/* Indicateur temps réel */}
            <div style={{display:'flex', alignItems:'center', gap:6, background:'rgba(22,163,74,0.08)', border:'1px solid rgba(22,163,74,0.2)', borderRadius:20, padding:'4px 12px'}}>
              <div style={{width:7, height:7, borderRadius:'50%', background:'#16a34a', animation:'lhm-pulse 1.8s infinite'}} />
              <span style={{fontSize:'0.68rem', color:'#16a34a', fontWeight:700}}>{fr?'En direct':'Live'}</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column'}}>
            {groupedMsgs.length === 0 && (
              <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, opacity:0.6}}>
                <div style={{fontSize:'4rem'}}>{active.type==='group'?active.icon:'💬'}</div>
                <p style={{fontSize:'0.95rem', fontWeight:700, color:'#9ca3af'}}>{fr?"Aucun message pour l'instant":'No messages yet'}</p>
                <p style={{fontSize:'0.8rem', color:'#c4c4c4'}}>{fr?'Soyez le premier à écrire !':'Be the first to say something!'}</p>
              </div>
            )}

            {groupedMsgs.map(({ msg, showDay, showName, isOwn, canDel }, i) => (
              <React.Fragment key={msg.id}>

                {/* Séparateur de date */}
                {showDay && (
                  <div style={{display:'flex', alignItems:'center', gap:10, margin:'18px 0 12px'}}>
                    <div style={{flex:1, height:1, background:'#e5e7eb'}} />
                    <span style={{fontSize:'0.69rem', color:'#9ca3af', fontWeight:600, background:'#f5f7fb', padding:'2px 10px', borderRadius:20, border:'1px solid #e5e7eb'}}>
                      {fmtDayLabel(msg.ts)}
                    </span>
                    <div style={{flex:1, height:1, background:'#e5e7eb'}} />
                  </div>
                )}

                {/* Bulle de message */}
                <div style={{
                  display:'flex', flexDirection:isOwn?'row-reverse':'row',
                  gap:8, marginBottom:showName?12:3, alignItems:'flex-end',
                }}>
                  {/* Avatar (côté gauche seulement) */}
                  {!isOwn && (showName
                    ? <Avatar name={msg.senderName} size={30} />
                    : <div style={{width:30, flexShrink:0}} />
                  )}

                  <div style={{maxWidth:'68%', position:'relative'}}>
                    {/* Nom de l'expéditeur */}
                    {showName && !isOwn && (
                      <p style={{fontSize:'0.7rem', color:'#6b7280', marginBottom:3, paddingLeft:4, fontWeight:700}}>
                        {msg.senderName}
                        {msg.senderRole && <span style={{color:'#c9a84c', marginLeft:6, fontWeight:500, fontSize:'0.63rem'}}>{msg.senderRole}</span>}
                      </p>
                    )}

                    {/* Bulle */}
                    <div style={{
                      background:isOwn?'linear-gradient(145deg,#0f2044,#1a3a6e)':'white',
                      color:isOwn?'white':'#1f2937',
                      padding:'10px 14px',
                      borderRadius:isOwn?'18px 4px 18px 18px':'4px 18px 18px 18px',
                      boxShadow:'0 2px 10px rgba(0,0,0,0.08)',
                      border:isOwn?'none':'1px solid #e5e7eb',
                      fontSize:'0.88rem', lineHeight:1.58,
                      wordBreak:'break-word', whiteSpace:'pre-wrap',
                      position:'relative',
                    }}>
                      {msg.text}
                      {/* Bouton supprimer */}
                      {canDel && (
                        <button onClick={()=>deleteMsg(msg.id)} title="Supprimer" style={{
                          position:'absolute', top:-8, right:isOwn?'auto':-8, left:isOwn?-8:'auto',
                          width:20, height:20, borderRadius:'50%',
                          background:'#dc2626', color:'white', border:'none',
                          cursor:'pointer', fontSize:'0.55rem',
                          display:'none', alignItems:'center', justifyContent:'center',
                        }} className="del-btn">✕</button>
                      )}
                    </div>

                    {/* Heure */}
                    <p style={{fontSize:'0.62rem', color:'#9ca3af', marginTop:3, textAlign:isOwn?'right':'left', padding:isOwn?'0 4px 0 0':'0 0 0 4px'}}>
                      {fmtHour(msg.ts)}{isOwn&&<span style={{color:'#c9a84c', marginLeft:4}}>✓✓</span>}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Zone de saisie */}
          <div style={{padding:'12px 18px', background:'white', borderTop:'1px solid #f0f4f8'}}>
            <div style={{display:'flex', gap:10, alignItems:'flex-end'}}>
              <div style={{
                flex:1, background:'#f5f7fb', borderRadius:14,
                border:'1.5px solid #e2e8f0', padding:'10px 14px',
                display:'flex', alignItems:'flex-end',
                transition:'border-color 0.2s',
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={fr
                    ? `Message dans #${active.name}…  (Entrée = envoyer)`
                    : `Message in #${active.name}…  (Enter = send)`}
                  rows={1}
                  style={{
                    flex:1, border:'none', background:'none', outline:'none',
                    resize:'none', fontSize:'0.88rem', color:'#1f2937',
                    maxHeight:130, fontFamily:'inherit', lineHeight:1.55,
                  }}
                />
              </div>
              <button
                onClick={send}
                disabled={!input.trim()}
                style={{
                  width:46, height:46, borderRadius:13, flexShrink:0,
                  background:input.trim()?'linear-gradient(145deg,#0f2044,#1a3a6e)':'#e5e7eb',
                  border:'none', cursor:input.trim()?'pointer':'not-allowed',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'1.25rem', transition:'all 0.2s',
                  boxShadow:input.trim()?'0 4px 14px rgba(15,32,68,0.35)':'none',
                }}
              >📨</button>
            </div>
            <p style={{fontSize:'0.63rem', color:'#c4c4c4', marginTop:5}}>
              ⏱ {fr?`Synchronisation automatique toutes les ${POLL_MS/1000}s — fonctionne entre plusieurs onglets`:`Auto-sync every ${POLL_MS/1000}s — works across tabs`}
            </p>
          </div>
        </div>
      ) : (
        /* Écran d'accueil */
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:20, background:'#f5f7fb'}}>
          <div style={{fontSize:'4.5rem', filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.15))'}}>💬</div>
          <h2 style={{fontSize:'1.6rem', fontWeight:700, color:'#0f2044', fontFamily:"'DM Sans',sans-serif", textAlign:'center', maxWidth:400}}>
            {fr?'Messagerie LHM Madagascar':'LHM Madagascar Messaging'}
          </h2>
          <p style={{fontSize:'0.9rem', color:'#9ca3af', maxWidth:380, textAlign:'center', lineHeight:1.8}}>
            {fr?"Choisissez un groupe ou un membre de l'équipe pour démarrer une conversation.":'Choose a group or team member to start a conversation.'}
          </p>
          {/* Boutons raccourcis vers les groupes */}
          <div style={{display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginTop:4, maxWidth:500}}>
            {DEFAULT_ROOMS.map(g=>(
              <button key={g.id} onClick={()=>{openRoom(g);setTab('groups');}} style={{
                padding:'9px 14px', border:'1px solid #e5e7eb',
                borderRadius:11, background:'white', cursor:'pointer',
                fontSize:'0.82rem', color:'#0f2044', fontWeight:600,
                display:'flex', alignItems:'center', gap:7,
                boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                transition:'all 0.15s',
              }}>
                {g.icon} {g.name}
              </button>
            ))}
          </div>
          <div style={{marginTop:6, display:'flex', alignItems:'center', gap:8, padding:'8px 16px', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:12}}>
            <div style={{width:7, height:7, borderRadius:'50%', background:'#16a34a', animation:'lhm-pulse 1.8s infinite'}} />
            <span style={{fontSize:'0.78rem', color:'#c9a84c', fontWeight:600}}>
              {fr?'Messagerie en temps réel — aucune configuration requise':'Real-time messaging — no setup required'}
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes lhm-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        ::-webkit-scrollbar { width:5px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:99px }
        ::-webkit-scrollbar-thumb:hover { background:#9ca3af }
        div:hover .del-btn { display:flex !important }
      `}</style>
    </div>
  );
}
