// 5C Dashboard v1.40.20 · 2026-08-07 · Five Crafts s.r.o.
'use strict';

// ════════════════════════════════════════════════════════════════
// FIVE CRAFTS DASHBOARD — owner cards with BD flow + companies
// ════════════════════════════════════════════════════════════════

// Five Crafts logo SVG (inline, brand colours from brandbook)
const FC_LOGO_SVG = `<svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="38" cy="30" r="18" fill="#2CE6C7"/>
  <circle cx="65" cy="42" r="13" fill="#002F6C"/>
  <circle cx="30" cy="62" r="14" fill="#002F6C"/>
  <circle cx="60" cy="68" r="10" fill="#2CE6C7" opacity=".85"/>
  <circle cx="44" cy="48" r="8" fill="#002F6C" opacity=".7"/>
</svg>`;

function renderOwners() {
  const today = new Date().toISOString().slice(0,10);
  const openTasks = (DATA_TASKS||[]).filter(t => t.status === 'Open').length;
  const overdue   = (DATA_TASKS||[]).filter(t => t.status === 'Open' && t.dueDate && t.dueDate < today).length;

  // Build collapsed owner cards
  const ownerCards = DATA_OWNERS.map(o => {
    const name  = o.displayName || ((o.firstName||'')+' '+(o.lastName||'')).trim();
    const rows  = DATA_PIPE.filter(r => r.owner === name).sort((a,b)=>{
      const pd=(OPO[a.prio||'Medium']??2)-(OPO[b.prio||'Medium']??2);
      if(pd!==0)return pd;
      const sd=(OSO[a.s]??9)-(OSO[b.s]??9);
      if(sd!==0)return sd;
      return(a.c||'').localeCompare(b.c||'');
    });
    const myComp = DATA_COMPANIES.filter(c => c.owner===name).sort((a,b)=>
      (OPO[a.prio||'Medium']??2)-(OPO[b.prio||'Medium']??2) || (a.name||'').localeCompare(b.name||''));
    const hrCands  = (DATA_HR||[]).filter(r=>r.owner===name||r.responsible===name);
    const poolCands= (DATA_POOL||[]).filter(r=>r.owner===name||r.responsible===name);

    if (!rows.length && !myComp.length && !hrCands.length && !poolCands.length) return '';

    const col     = OC[name] || '#64748b';
    const ini     = name.split(' ').map(w=>w[0]).join('');
    const sq      = name.replace(/'/g,'__SQ__');
    const tasks   = DATA_TASKS.filter(t=>t.responsible===name&&t.status==='Open').length;
    const ovd     = DATA_TASKS.filter(t=>t.responsible===name&&t.status==='Open'&&t.dueDate&&t.dueDate<today).length;
    const ownerId = 'dow_' + name.replace(/[^a-z0-9]/gi,'_');

    // Photo
    const photoUrl = OWNER_PHOTOS[o.email] || OWNER_PHOTOS[name];
    const safeKey  = (o.email||name).replace(/[^a-z0-9]/gi,'_');
    const iniSpan  = `<span style="width:40px;height:40px;border-radius:50%;background:${col};display:${photoUrl?'none':'flex'};align-items:center;justify-content:center;font-size:.85rem;font-weight:700;color:#fff;flex-shrink:0;border:2px solid rgba(255,255,255,.2)">${ini}</span>`;
    const avatar   = photoUrl
      ? `<img id="oav-${safeKey}" src="${photoUrl}" style="width:40px;height:40px;border-radius:50%;flex-shrink:0;border:2px solid rgba(255,255,255,.2);object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">${iniSpan}`
      : `<img id="oav-${safeKey}" src="" style="width:40px;height:40px;border-radius:50%;flex-shrink:0;display:none">${iniSpan}`;

    // Flow bar (compact)
    const flowBar = FLOW_STEPS.map(({s,col,bg},i)=>{
      const n = rows.filter(r=>r.s===s).length;
      return `<div onclick="event.stopPropagation();UI.nf('${s}',null,'${sq}')"
        style="flex:1;text-align:center;padding:5px 2px;background:${n>0?bg:'#f8fafc'};cursor:pointer;border-right:${i<FLOW_STEPS.length-1?'1px solid var(--border)':'none'};opacity:${n===0?'0.35':'1'}">
        <div style="font-size:.95rem;font-weight:800;color:${n>0?col:'var(--slate2)'}">${n}</div>
        <div style="font-size:.55rem;color:var(--slate)">${s}</div>
      </div>`;
    }).join('');

    // Top 5 opps
    const oppList = rows.filter(r=>!['Done','Cancelled'].includes(r.s)).slice(0,5).map(r=>{
      const safeOppKey=(r.c+'|||'+r.p).replace(/'/g,'__SQ__');
      return `<div onclick="event.stopPropagation();openPipeDrawer('${safeOppKey}')"
        style="display:flex;align-items:center;gap:6px;padding:4px 6px;border-radius:6px;background:#f8fafc;border:1px solid var(--border);cursor:pointer;margin-bottom:2px"
        onmouseover="this.style.background='#f0f4ff'" onmouseout="this.style.background='#f8fafc'">
        ${companyLogoFromName(r.c,14)}
        <span style="font-size:.72rem;font-weight:500;color:var(--navy2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.c}${r.p?` · <span style="color:var(--slate);font-weight:400">${r.p}</span>`:''}</span>
        ${prioBadge(r.prio||'Medium')}
      </div>`;
    }).join('');
    const moreActive = rows.filter(r=>!['Done','Cancelled'].includes(r.s)).length;
    const moreBtn = moreActive > 5 ? `<div onclick="event.stopPropagation();UI.nf('',null,'${sq}')" style="font-size:.7rem;color:var(--blue);cursor:pointer;text-align:center;padding:3px 0">+ ${moreActive-5} more →</div>` : '';

    // Companies (compact)
    const coList = myComp.slice(0,4).map(c=>{
      const safeCoId=(c.id||c.name).replace(/'/g,'__SQ__');
      return `<div onclick="event.stopPropagation();openCompanyDrawer('${safeCoId}')"
        style="display:flex;align-items:center;gap:6px;padding:4px 6px;border-radius:6px;background:#f8fafc;border:1px solid var(--border);cursor:pointer;margin-bottom:2px"
        onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='#f8fafc'">
        ${companyLogo(c.website,c.name,14)}
        <span style="font-size:.72rem;font-weight:500;color:var(--navy2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.name}</span>
        ${prioBadge(c.prio||'Medium')}
      </div>`;
    }).join('') + (myComp.length>4?`<div style="font-size:.7rem;color:var(--blue);cursor:pointer;text-align:center;padding:3px 0" onclick="event.stopPropagation();UI.nav('companies',null)">+ ${myComp.length-4} more →</div>`:'');

    return `
    <div id="${ownerId}" style="background:var(--card);border:1px solid var(--border);border-radius:12px;margin-bottom:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.05)">
      <!-- Collapsed header — click to expand/collapse -->
      <div onclick="_dashToggleOwner('${ownerId}')"
        style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:linear-gradient(135deg,#0f2540 0%,#1a3a5c 100%);cursor:pointer;user-select:none">
        ${avatar}
        <div style="flex:1">
          <div style="font-weight:700;font-size:.9rem;color:#fff">${name}</div>
          <div style="font-size:.68rem;color:rgba(255,255,255,.5);margin-top:1px">${rows.length} opps · ${myComp.length} cos · ${tasks} tasks${ovd>0?` · <span style="color:#fca5a5">${ovd} overdue</span>`:''}</div>
        </div>
        <!-- Mini flow badges -->
        <div style="display:flex;gap:5px;align-items:center">
          ${FLOW_STEPS.filter(({s})=>rows.filter(r=>r.s===s).length>0).map(({s,col,bg})=>{
            const n=rows.filter(r=>r.s===s).length;
            return `<span style="padding:2px 7px;border-radius:10px;font-size:.65rem;font-weight:700;background:rgba(255,255,255,.12);color:#fff">${n} ${s}</span>`;
          }).join('')}
        </div>
        <span id="${ownerId}_caret" style="color:rgba(255,255,255,.5);font-size:.8rem;margin-left:4px">▾</span>
      </div>
      <!-- Expandable body — hidden by default -->
      <div id="${ownerId}_body" style="display:none">
        <!-- Flow bar -->
        <div style="display:flex;border-bottom:1px solid var(--border)">${flowBar}</div>
        <div style="padding:12px 16px;display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div>
            <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--navy2);margin-bottom:6px">⚡ Active Opportunities</div>
            ${oppList}${moreBtn}
          </div>
          <div>
            <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--navy2);margin-bottom:6px">🏢 Companies</div>
            ${myComp.length ? coList : '<div style="font-size:.72rem;color:var(--slate2)">None assigned</div>'}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  $('owners-out').innerHTML = `

  <!-- ══════════════════════════════════════════════════ -->
  <!-- FIVE CRAFTS BRANDED HEADER                         -->
  <!-- ══════════════════════════════════════════════════ -->
  <div style="background:linear-gradient(135deg,#002F6C 0%,#0f4fa8 60%,#0e7a70 100%);border-radius:16px;padding:24px 28px;margin-bottom:22px;position:relative;overflow:hidden">
    <!-- Subtle wave pattern overlay (brand element) -->
    <div style="position:absolute;inset:0;opacity:.07;background:repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(44,230,199,.5) 8px,rgba(44,230,199,.5) 9px)"></div>
    <div style="position:relative;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
      <!-- Logo + title -->
      <div style="display:flex;align-items:center;gap:14px">
        <div style="width:52px;height:52px;background:rgba(255,255,255,.12);border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.2)">
          ${FC_LOGO_SVG}
        </div>
        <div>
          <div style="font-family:'Unbounded',sans-serif;font-weight:600;font-size:1.1rem;color:#fff;letter-spacing:.3px">5C Dashboard</div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.6);margin-top:2px">Business Development Dashboard · ${new Date().getFullYear()}</div>
        </div>
      </div>
      <!-- Owner name links -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        ${DATA_OWNERS.map(o => {
          const name = o.displayName || ((o.firstName||'')+' '+(o.lastName||'')).trim();
          const col  = OC[name] || '#64748b';
          const ini  = name.split(' ').map(w=>w[0]).join('');
          const sq   = name.replace(/'/g,'__SQ__');
          const active = DATA_PIPE.filter(r=>r.owner===name&&!['Done','Cancelled'].includes(r.s)).length;
          if (!active) return '';
          const photoUrl = OWNER_PHOTOS[o.email] || OWNER_PHOTOS[name];
          return `<button onclick="dashExpandOwner('${name}')"
            style="display:flex;align-items:center;gap:7px;padding:6px 10px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:20px;cursor:pointer;font-family:var(--font)">
            ${photoUrl
              ? `<img src="${photoUrl}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1.5px solid rgba(255,255,255,.3)" onerror="this.style.display='none'">`
              : `<span style="width:26px;height:26px;border-radius:50%;background:${col};display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:800;color:#fff;flex-shrink:0">${ini}</span>`
            }
            <span style="font-size:.78rem;font-weight:600;color:#fff">${name.split(' ')[0]}</span>
            <span style="font-size:.7rem;color:rgba(255,255,255,.6);background:rgba(255,255,255,.1);padding:1px 6px;border-radius:10px">${active}</span>
          </button>`;
        }).join('')}
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════ -->
  <!-- PIPELINE STATS                                     -->
  <!-- ══════════════════════════════════════════════════ -->
  <div class="stats-row" style="margin-top:16px">
    <div class="stat-card s-green clickable" onclick="UI.nf('Running',null)"><div class="sc-icon">▶️</div><div class="sc-val">${cnt('Running')}</div><div class="sc-lbl">Running</div></div>
    <div class="stat-card s-purple clickable" onclick="UI.nf('Bidding',null)"><div class="sc-icon">📝</div><div class="sc-val">${cnt('Bidding')}</div><div class="sc-lbl">Bidding</div></div>
    <div class="stat-card s-blue clickable" onclick="UI.nf('Pipeline',null)"><div class="sc-icon">⚡</div><div class="sc-val">${cnt('Pipeline')}</div><div class="sc-lbl">Pipeline</div></div>
    <div class="stat-card s-amber clickable" onclick="UI.nf('Prospect',null)"><div class="sc-icon">🔭</div><div class="sc-val">${cnt('Prospect')}</div><div class="sc-lbl">Prospect</div></div>
    <div class="stat-card s-green clickable" onclick="UI.nav('contacts',null)"><div class="sc-icon">👤</div><div class="sc-val">${DATA_CONTACTS.length}</div><div class="sc-lbl">Contacts</div></div>
    <div class="stat-card s-blue clickable" onclick="UI.nav('companies',null)"><div class="sc-icon">🏦</div><div class="sc-val">${DATA_COMPANIES.length}</div><div class="sc-lbl">Companies</div></div>
    <div class="stat-card s-amber clickable" onclick="UI.nav('tasks',null)"><div class="sc-icon">✅</div><div class="sc-val">${openTasks}</div><div class="sc-lbl">Open Tasks</div><div class="sc-sub">${overdue} overdue</div></div>
  </div>


  <!-- OWNER CARDS (collapsed by default) -->
  <div class="sect" style="margin-top:8px">Owner Overview <small>click header to expand · click name above to expand &amp; scroll</small></div>
  ${ownerCards}`;
}

function toggleExpand(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  const hidden = el.style.display === 'none';
  el.style.display = hidden ? 'block' : 'none';
  const count = btn.textContent.match(/\d+/)?.[0] || '';
  btn.textContent = hidden ? '▲ Show less' : `+ ${count} more`;
}

function toggleExpandSection(bodyId, caretId) {
  const body  = document.getElementById(bodyId);
  const caret = document.getElementById(caretId);
  if (!body) return;
  const hidden = body.style.display === 'none';
  body.style.display  = hidden ? 'block' : 'none';
  if (caret) caret.textContent = hidden ? '▴' : '▾';
}
