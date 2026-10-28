(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const single = body.dataset.mode === 'single';
  const pathKeys = ['inicio','federacion','digitalizacion','lai','kileaaa','futuro'];
  const currentRoute = () => single ? (decodeURIComponent(location.hash.replace(/^#\/?/, '').split('/')[0]) || 'inicio') : (body.dataset.page || 'inicio');
  let lang = 'es';
  try { lang = localStorage.getItem('ttmpr-language') === 'en' ? 'en' : 'es'; } catch (_) { /* storage optional */ }

  function applyLanguage(next) {
    lang = next === 'en' ? 'en' : 'es';
    root.lang = lang === 'es' ? 'es-PR' : 'en';
    document.querySelectorAll('.i18n').forEach(el => {
      const content = el.dataset[lang];
      if (content !== undefined) el.textContent = content;
    });
    document.querySelectorAll('[data-i18n-aria-es]').forEach(el => {
      el.setAttribute('aria-label', lang === 'es' ? el.dataset.i18nAriaEs : el.dataset.i18nAriaEn);
    });
    const toggle = document.getElementById('language');
    if (toggle) { toggle.textContent = lang === 'es' ? 'EN' : 'ES'; toggle.setAttribute('aria-label', lang === 'es' ? 'Switch to English' : 'Cambiar a español'); }
    const titleEl = document.querySelector('[data-page-heading]');
    const heading = titleEl ? [...titleEl.childNodes].map(n => n.textContent.trim()).filter(Boolean).join(' ') : '';
    document.title = heading ? `${heading} | TTMPR` : (lang === 'es' ? 'TTMPR | Más allá del juego' : 'TTMPR | Beyond the game');
    try { localStorage.setItem('ttmpr-language', lang); } catch (_) { /* local file private browsing */ }
  }

  const langButton = document.getElementById('language');
  if (langButton) langButton.addEventListener('click', () => applyLanguage(lang === 'es' ? 'en' : 'es'));
  const menu = document.getElementById('mobileMenu');
  const nav = document.getElementById('primaryNav');
  if (menu && nav) menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? '✕' : '☰';
  });
  if (nav) nav.addEventListener('click', event => { if (event.target.closest('a')) { nav.classList.remove('open'); menu?.setAttribute('aria-expanded','false'); if(menu) menu.textContent = '☰'; } });

  // Results filter in the LAI feature; delegation works after hash-route changes.
  document.addEventListener('click', event => {
    const filter = event.target.closest('[data-lai-filter]');
    if (!filter) return;
    const scope = filter.closest('#resultados-lai');
    if (!scope) return;
    const selected = filter.dataset.laiFilter;
    scope.querySelectorAll('[data-lai-filter]').forEach(btn => {
      const active = btn === filter;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    scope.querySelectorAll('[data-branch]').forEach(row => {row.hidden = selected !== 'all' && row.dataset.branch !== selected;});
  });

  // LAI statistics: branch filter and sortable player table (delegated; works after hash-route changes).
  function sortTable(th){
    const table = th.closest('table');
    const index = [...th.parentNode.children].indexOf(th);
    const dir = th.getAttribute('aria-sort') === 'descending' ? 'ascending' : 'descending';
    table.querySelectorAll('th[data-sort]').forEach(h => h.removeAttribute('aria-sort'));
    th.setAttribute('aria-sort', dir);
    const numeric = th.dataset.sort === 'num';
    const value = row => { const cell = row.cells[index]; const v = cell.dataset.v ?? cell.textContent.trim(); return numeric ? parseFloat(v) : v; };
    const body = table.tBodies[0];
    [...body.rows].sort((a, b) => {
      const x = value(a), y = value(b);
      const r = numeric ? x - y : String(x).localeCompare(String(y), 'es');
      return dir === 'ascending' ? r : -r;
    }).forEach(row => body.appendChild(row));
  }
  document.addEventListener('click', event => {
    const filter = event.target.closest('[data-stats-filter]');
    if (filter) {
      const scope = filter.closest('#estadisticas-lai');
      if (!scope) return;
      const selected = filter.dataset.statsFilter;
      scope.querySelectorAll('[data-stats-filter]').forEach(btn => {
        const active = btn === filter;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      scope.querySelectorAll('[data-branch]').forEach(el => { el.hidden = selected !== 'all' && el.dataset.branch !== selected; });
      return;
    }
    const th = event.target.closest('table[data-sortable] th[data-sort]');
    if (th) sortTable(th);
  });

  // LAI works as its own page: a sticky tab bar with one panel per section, each with its own link
  // (#estadisticas on the site, #/lai/estadisticas in the single-file preview).
  const siteHeader = document.getElementById('siteHeader');
  function headerHeight(){ return siteHeader ? siteHeader.offsetHeight : 0; }
  function syncHeaderVar(){ root.style.setProperty('--site-header-h', `${headerHeight()}px`); }
  window.addEventListener('resize', syncHeaderVar, {passive:true});
  function laiSubRoute(){
    const h = decodeURIComponent(location.hash || '');
    if (single) { const parts = h.replace(/^#\/?/, '').split('/'); return parts[0] === 'lai' ? (parts[1] || '') : ''; }
    return h.replace(/^#/, '');
  }
  function scrollToPanels(force = false){
    const tabsBar = document.getElementById('laiTabs');
    const panels = document.querySelector('.lai-panels');
    if (!tabsBar || !panels) return;
    const top = panels.getBoundingClientRect().top + window.scrollY - headerHeight() - tabsBar.offsetHeight;
    if (force || window.scrollY > top) window.scrollTo({top, behavior: force ? 'instant' : 'smooth'});
  }
  function activateTab(key, opts = {}){
    const tabsBar = document.getElementById('laiTabs');
    if (!tabsBar) return false;
    const panels = [...document.querySelectorAll('.lai-panel')];
    if (!panels.some(panel => panel.id === key)) return false;
    let current;
    tabsBar.querySelectorAll('[role="tab"]').forEach(tab => {
      const on = tab.dataset.tab === key;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on) current = tab;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== key; });
    const list = current?.parentElement;
    if (list && list.scrollWidth > list.clientWidth) list.scrollLeft = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2;
    if (opts.updateUrl) history.replaceState(null, '', single ? `#/lai/${key}` : `#${key}`);
    if (opts.focus) current?.focus();
    if (opts.scroll) scrollToPanels();
    onScroll();
    return true;
  }
  function initLaiTabs(){
    syncHeaderVar();
    if (!document.getElementById('laiTabs')) return;
    let key = laiSubRoute(), target = null;
    const el = key && document.getElementById(key);
    if (el && !el.classList.contains('lai-panel')) { target = el; key = el.closest('.lai-panel')?.id || ''; }
    const isPanel = key && document.getElementById(key)?.classList.contains('lai-panel');
    activateTab(isPanel ? key : 'resumen');
    if (target) requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
    else if (isPanel && key !== 'resumen') requestAnimationFrame(() => scrollToPanels(true));
  }
  document.addEventListener('click', event => {
    if (!document.getElementById('laiTabs')) return;
    const tab = event.target.closest('#laiTabs [role="tab"]');
    if (tab) { event.preventDefault(); activateTab(tab.dataset.tab, {updateUrl:true, scroll:true}); return; }
    const link = event.target.closest('a[href^="#"]:not([href^="#/"])');
    if (!link) return;
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    const target = id && document.getElementById(id);
    const panel = target && (target.classList.contains('lai-panel') ? target : target.closest('.lai-panel'));
    if (!panel) return;
    event.preventDefault();
    activateTab(panel.id, {updateUrl:true});
    if (target === panel) scrollToPanels();
    else requestAnimationFrame(() => target.scrollIntoView({behavior:'smooth', block:'start'}));
  });
  document.addEventListener('keydown', event => {
    const tab = event.target.closest?.('#laiTabs [role="tab"]');
    if (!tab || !['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
    const tabs = [...document.querySelectorAll('#laiTabs [role="tab"]')];
    const i = tabs.indexOf(tab);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    activateTab(tabs[next].dataset.tab, {updateUrl:true, focus:true});
  });

  const progress = document.getElementById('scrollProgress');
  function onScroll(){
    // «Conversemos» appears once the visitor leaves the hero and hides again when the footer
    // (which already lists the contact details) comes into view, so it never covers content.
    const footer = document.querySelector('.site-footer');
    const footerInView = footer && footer.getBoundingClientRect().top < window.innerHeight - 40;
    body.classList.toggle('show-float', window.scrollY > window.innerHeight * 0.55 && !footerInView);
    if (!progress) return;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${total > 0 ? Math.min(100, 100 * window.scrollY / total) : 0}%`;
  }
  window.addEventListener('scroll', onScroll, {passive:true});

  let observer;
  function initReveals(){
    if(observer) observer.disconnect();
    const elements = [...document.querySelectorAll('main .reveal')];
    if(!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      elements.forEach(el => el.classList.add('visible'));
      return;
    }
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}
    }),{threshold:.1,rootMargin:'0px 0px -25px 0px'});
    elements.forEach(el => observer.observe(el));
  }

  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerClose = document.getElementById('drawerClose');
  let drawerOpener;
  function closeDrawer(){
    if(!drawerOverlay) return;
    drawerOverlay.classList.remove('open');
    drawerOverlay.setAttribute('aria-hidden','true');
    body.style.overflow='';
    if(drawerOpener) drawerOpener.focus();
  }
  function openDrawer(btn){
    if(!drawerOverlay) return;
    drawerOpener = btn;
    const headline = btn.dataset.drawerTitleEs || 'TTMPR';
    const headlineEn = btn.dataset.drawerTitleEn || headline;
    const textEs = btn.dataset.drawerTextEs || 'Conoce las iniciativas de TTMPR.';
    const textEn = btn.dataset.drawerTextEn || textEs;
    const title = document.getElementById('drawerTitle');
    const description = document.getElementById('drawerDescription');
    title.dataset.es=headline; title.dataset.en=headlineEn;
    description.dataset.es=textEs; description.dataset.en=textEn;
    const link = document.getElementById('drawerLink');
    const href=btn.dataset.drawerHref;
    if(link){
      if(href){link.hidden=false;link.href=href;link.dataset.es=btn.dataset.drawerCtaEs||'Explorar sección';link.dataset.en=btn.dataset.drawerCtaEn||'Explore section';}
      else link.hidden=true;
    }
    applyLanguage(lang);
    drawerOverlay.classList.add('open');
    drawerOverlay.setAttribute('aria-hidden','false');
    body.style.overflow='hidden';
    drawerClose?.focus();
  }
  document.addEventListener('click', event => {
    const btn = event.target.closest('[data-drawer-title-es]');
    if(btn){event.preventDefault();openDrawer(btn);}
    else if(event.target === drawerOverlay || event.target.closest('#drawerClose')) closeDrawer();
  });
  document.addEventListener('keydown', event => {
    if(event.key === 'Escape') closeDrawer();
    if(event.key === 'Tab' && drawerOverlay?.classList.contains('open')) {
      const focusable = [...drawerOverlay.querySelectorAll('button:not([hidden]),a[href]:not([hidden])')].filter(x=>!x.hidden);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });

  // Single-file preview: images used several times are stored once in window.TTMPR_ASSETS.
  function hydrateAssets(scope){
    const assets = window.TTMPR_ASSETS;
    if (!assets) return;
    scope.querySelectorAll('img[data-asset]').forEach(img => { const v = assets[img.dataset.asset]; if (v) img.src = v; });
  }
  function markActive(key){
    document.querySelectorAll('[data-route-key]').forEach(link => {
      if(link.dataset.routeKey===key)link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
  }
  let renderedKey = null;
  function routeSingle(){
    const key=pathKeys.includes(currentRoute()) ? currentRoute() : 'inicio';
    if (key === renderedKey) {  // same page, only the sub-route changed (LAI tabs)
      initLaiTabs();
      if (!laiSubRoute()) window.scrollTo({top:0,behavior:'instant'});
      return;
    }
    renderedKey = key;
    const content = document.querySelector('main[data-route-content]');
    const template = document.getElementById(`route-${key}`);
    if(!content || !template)return;
    content.replaceChildren(template.content.cloneNode(true));
    hydrateAssets(content);
    body.dataset.page=key;
    markActive(key);
    applyLanguage(lang);
    initReveals();
    closeDrawer();
    window.scrollTo({top:0,behavior:'instant'});
    initLaiTabs();
    onScroll();
  }
  if(single){
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#/"]');
      if(link){ event.preventDefault(); const target=link.getAttribute('href'); if(location.hash!==target)location.hash=target; routeSingle(); }
    });
    // In-page anchors (#mision, #areas…) scroll natively; only #/route hashes swap the page.
    window.addEventListener('hashchange',() => { if(!location.hash || location.hash.startsWith('#/')) routeSingle(); });
    routeSingle();
  }
  else{ markActive(currentRoute());applyLanguage(lang);initReveals();initLaiTabs();onScroll(); window.addEventListener('hashchange', initLaiTabs); }
})();
