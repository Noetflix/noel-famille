import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { FIREBASE_CONFIG, MEMBERS, GIFS, CLOSE_DATE } from './config.js';

// ---------- Textes ----------

const TAGLINES = [
  'Le Père Noël prend des notes…',
  'Les rennes sont à l\'échauffement.',
  'Le lutin a taillé son plus beau crayon.',
  'Ici, on ne juge pas les chaussettes moches.',
];
const ADDED = [
  'Souhait ajouté ! Le lutin a tout noté.',
  'C\'est noté, le traîneau est prévenu 🛷',
  'Hop, dans la hotte !',
  'Le Père Noël prend des notes 📝',
];
const BOUGHT = [
  'Bien joué ! Motus et bouche cousue 🤫',
  'Coché ! Le lutin garde le secret.',
  'Un cadeau de plus dans la hotte 🎁',
];
const EMPTY_MINE = [
  'Rien pour l\'instant… le lutin s\'ennuie.',
  'Liste vide. Le Père Noël attend tes ordres.',
];

const PRIORITIES = {
  1: { label: 'Très envie', icon: 'flame' },
  2: { label: 'Envie', icon: 'star' },
  3: { label: 'Si possible', icon: 'clover' },
};

// ---------- Icônes ----------

const svg = (path, extra = '') =>
  `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" ${extra}>${path}</svg>`;

const ICONS = {
  flame: svg('<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-4 5-4 7-1-1-2-2-2-4-2 2-3 5-3 9 0 4 3 7 7 7z"/>'),
  star: svg('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
  clover: svg('<path d="M12 12c-3-4-7-3-6 0s5 2 6 0zm0 0c4-3 3-7 0-6s-2 5 0 6zm0 0c3 4 7 3 6 0s-5-2-6 0zm0 0c-4 3-3 7 0 6s2-5 0-6zm0 0l4 9"/>'),
  gift: svg('<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M2 9h20M12 9v12M12 9C9 3 5 5 8 9M12 9c3-6 7-4 4 0"/>'),
  logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>', 'stroke-width="2.6"'),
  link: svg('<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>'),
  edit: svg('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  trash: svg('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>'),
  check: svg('<path d="M20 6L9 17l-5-5"/>', 'stroke-width="2.6"'),
  back: svg('<path d="M15 18l-6-6 6-6"/>', 'stroke-width="2.4"'),
  lock: svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  snow: svg('<path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1L19.1 4.9"/>'),
  warn: svg('<path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'),
};

const GIFT_SVG = (cls = '') => `
  <svg class="gift ${cls}" viewBox="0 0 64 64" role="img" aria-label="Cadeau">
    <rect x="8" y="26" width="48" height="32" rx="4" fill="#D62839"/>
    <rect x="28" y="26" width="8" height="32" fill="#F2B134"/>
    <g class="gift__lid">
      <rect x="4" y="18" width="56" height="12" rx="3" fill="#B3202E"/>
      <rect x="28" y="18" width="8" height="12" fill="#F2B134"/>
      <path d="M32 18 C 22 4, 10 10, 20 18 Z" fill="#F2B134"/>
      <path d="M32 18 C 42 4, 54 10, 44 18 Z" fill="#F2B134"/>
    </g>
  </svg>`;

// ---------- Utilitaires ----------

const $ = (sel, root = document) => root.querySelector(sel);
const root = $('#root');
const sheetHost = $('#sheet');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;',
}[c]));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
const millis = (ts) => (ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0);
const priceFmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const centsFmt = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Firebase renvoie les e-mails en minuscules : on aligne la config dessus.
MEMBERS.forEach((m) => { m.email = m.email.trim().toLowerCase(); });

const memberById = (id) => MEMBERS.find((m) => m.id === id);
const memberByEmail = (email) => MEMBERS.find((m) => m.email.toLowerCase() === String(email).toLowerCase());
const admin = MEMBERS.find((m) => m.admin) || MEMBERS[0];

const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* navigation privée */ }
  },
};

function avatar(m, size = 'md', extra = '') {
  const letter = m.emoji || m.name.trim().charAt(0).toUpperCase();
  return `<span class="avatar avatar--${size} ${extra}" style="--c:${esc(m.color)};--ink-c:${esc(m.ink || '#FFFFFF')}" aria-hidden="true">${esc(letter)}</span>`;
}

function garland() {
  const colors = ['gold', 'red', 'cream'];
  const count = 9;
  let bulbs = '';
  for (let i = 0; i < count; i += 1) {
    bulbs += `<span class="bulb bulb--${colors[i % 3]}" style="left:${((i + 0.5) * 100) / count}%;top:${i % 2 ? 18 : 15}px;animation-delay:-${((i * 0.37) % 1.8).toFixed(2)}s"></span>`;
  }
  return `<div class="garland" aria-hidden="true"><svg viewBox="0 0 390 40" preserveAspectRatio="none"><path vector-effect="non-scaling-stroke" d="M-5 6 Q 40 28 85 10 T 175 10 T 265 10 T 355 10 T 400 12"/></svg>${bulbs}</div>`;
}

// GIF tiré au hasard, une fois par emplacement et par visite :
// sinon il changerait à chaque mise à jour des données.
const gifBySlot = new Map();
function gif(slot) {
  if (!GIFS.length) return '';
  if (!gifBySlot.has(slot)) gifBySlot.set(slot, pick(GIFS));
  return `<img class="gif" src="${esc(gifBySlot.get(slot))}" alt="GIF de Noël" loading="lazy" referrerpolicy="no-referrer">`;
}

function dodos() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((new Date(now.getFullYear(), 11, 25) - today) / 864e5);
  if (days > 1) return `Encore ${days} dodos avant Noël`;
  if (days === 1) return 'Plus qu\'un dodo avant Noël !';
  if (days === 0) return 'Joyeux Noël ! 🎄';
  return 'Noël est passé… vivement l\'an prochain';
}

function normalizeLink(raw) {
  const value = raw.trim();
  if (!value) return '';
  const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function confettiBurst(origin = { y: 0.8 }) {
  if (reduceMotion || typeof window.confetti !== 'function') return;
  window.confetti({
    particleCount: 90,
    spread: 75,
    origin,
    colors: ['#D62839', '#F2B134', '#2F7D4F', '#2B6F94', '#FFF7EC'],
    disableForReducedMotion: true,
  });
}

let toastTimer;
function toast(message, { error = false } = {}) {
  const el = $('#toast');
  el.className = `toast${error ? ' toast--error' : ''}`;
  el.innerHTML = `${error ? ICONS.warn : ICONS.check}<span>${esc(message)}</span>`;
  // Laisse le navigateur appliquer l'état caché avant d'animer.
  requestAnimationFrame(() => el.classList.add('is-visible'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), error ? 5000 : 3200);
}

// ---------- Neige ----------

function setupSnow() {
  const layer = $('#snow');
  let html = '';
  for (let i = 0; i < 32; i += 1) {
    const size = 3 + Math.random() * 5;
    html += `<span class="flake" style="left:${(Math.random() * 100).toFixed(1)}%;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;--drift:${(Math.random() * 40 - 20).toFixed(0)}px;animation-duration:${(8 + Math.random() * 8).toFixed(1)}s;animation-delay:-${(Math.random() * 16).toFixed(1)}s"></span>`;
  }
  layer.innerHTML = html;
  document.body.classList.toggle('no-snow', store.get('neige', 'on') === 'off');
}

function snowButton() {
  const off = document.body.classList.contains('no-snow');
  return `<button type="button" class="pill-btn" data-action="snow" aria-pressed="${off}">${ICONS.snow}${off ? 'Remettre la neige' : 'Couper la neige'}</button>`;
}

function toggleSnow(button) {
  const off = !document.body.classList.contains('no-snow');
  document.body.classList.toggle('no-snow', off);
  store.set('neige', off ? 'off' : 'on');
  button.outerHTML = snowButton();
}

// ---------- État ----------

const state = {
  me: null,
  wishes: [],
  loaded: false,
  bought: {}, // email du destinataire -> Map(idSouhait -> { buyer, at })
  unsubs: [],
  seenBefore: 0, // dernière visite de la liste ouverte, figée le temps de la consulter
  routeKey: '',
  intro: null, // animation d'ouverture du cadeau en cours
};

const others = () => MEMBERS.filter((m) => m.id !== state.me.id);
const seenKey = (person) => `vu:${state.me.id}:${person.id}`;

function wishesOf(member) {
  const owner = member.email.toLowerCase();
  return state.wishes
    .filter((w) => String(w.owner).toLowerCase() === owner)
    .sort((a, b) => (a.priority || 4) - (b.priority || 4) || millis(a.createdAt) - millis(b.createdAt));
}

// ---------- Firebase ----------

const configured = !String(FIREBASE_CONFIG.apiKey).startsWith('A_REMPLACER');
let auth;
let db;

function startData() {
  stopData();
  state.unsubs.push(onSnapshot(collection(db, 'wishes'), (snap) => {
    state.wishes = snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
    state.loaded = true;
    render();
  }, (err) => {
    console.error(err);
    toast('Impossible de lire les listes. Le lutin a glissé sur le verglas.', { error: true });
  }));

  for (const person of others()) {
    state.unsubs.push(onSnapshot(collection(db, 'gifts', person.email, 'bought'), (snap) => {
      state.bought[person.email] = new Map(snap.docs.map((d) => [d.id, d.data()]));
      render();
    }, (err) => console.error(err)));
  }
}

function stopData() {
  state.unsubs.forEach((unsub) => unsub());
  state.unsubs = [];
  state.wishes = [];
  state.bought = {};
  state.loaded = false;
}

// ---------- Connexion (F1) ----------

const PIN_LENGTH = 8; // date de naissance JJMMAAAA
const LOCK_MAX_FAILS = 5;
const LOCK_MINUTES = 5;

function lockRemaining() {
  const lock = store.get('pin-lock', { fails: 0, until: 0 });
  return Math.max(0, lock.until - Date.now());
}

function registerFail() {
  const lock = store.get('pin-lock', { fails: 0, until: 0 });
  lock.fails += 1;
  if (lock.fails >= LOCK_MAX_FAILS) {
    lock.fails = 0;
    lock.until = Date.now() + LOCK_MINUTES * 60e3;
  }
  store.set('pin-lock', lock);
}

function lockMessage(ms) {
  const minutes = Math.max(1, Math.ceil(ms / 60e3));
  return `Trop d'essais : le lutin fait une pause. Réessaie dans ${plural(minutes, 'minute')}.`;
}

function renderLogin() {
  document.body.classList.add('is-login');
  sheetHost.innerHTML = '';
  const selected = store.get('dernier-prenom', null);
  const pinBoxes = Array.from({ length: PIN_LENGTH }, (_, i) =>
    `<input id="pin-${i}" class="pin__box" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" aria-label="Chiffre ${i + 1} sur ${PIN_LENGTH}">`).join('');

  root.innerHTML = `
    <section class="login">
      ${garland()}
      <div class="login__hero">
        ${GIFT_SVG(reduceMotion ? '' : 'gift--wiggle')}
        <h1>Les souhaits de Noël<br>de la famille</h1>
        <p class="tagline">${esc(pick(TAGLINES))}</p>
      </div>
      <form class="login__card" id="login-form" novalidate>
        <p class="label-big" id="who-label">Qui es-tu ?</p>
        <div class="who" role="radiogroup" aria-labelledby="who-label">
          ${MEMBERS.map((m) => `
            <button type="button" class="who__btn" role="radio" aria-checked="${m.id === selected}" data-action="pick" data-id="${esc(m.id)}">
              ${avatar(m)}<span>${esc(m.name)}</span>
            </button>`).join('')}
        </div>
        <label class="label-big" for="pin-0">Ton code secret</label>
        <div class="pin" id="pin">${pinBoxes}</div>
        <p class="error" id="login-error" role="alert"></p>
        <button class="btn btn--primary btn--big" type="submit">${ICONS.gift}Ouvrir mon cadeau</button>
      </form>
      <div class="gif-slot">${gif('login')}</div>
      <p class="login__foot">Code oublié ? Demande à ${esc(admin.name)}, il a les clés du traîneau.</p>
      <div class="login__tools">${snowButton()}</div>
    </section>`;

  const remaining = lockRemaining();
  if (remaining) $('#login-error').textContent = lockMessage(remaining);
  setupPinInputs();
}

function pinInputs() {
  return [...root.querySelectorAll('.pin__box')];
}

function setupPinInputs() {
  const boxes = pinInputs();
  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      const digits = box.value.replace(/\D/g, '');
      if (digits.length > 1) {
        // Collage ou remplissage automatique : on répartit les chiffres.
        digits.slice(0, PIN_LENGTH - i).split('').forEach((d, k) => { boxes[i + k].value = d; });
      } else {
        box.value = digits;
      }
      boxes.forEach((b) => b.classList.toggle('is-filled', b.value !== ''));
      const next = boxes.find((b) => b.value === '');
      if (box.value && next) next.focus();
      if (!next) $('#login-form').requestSubmit();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        boxes[i - 1].value = '';
        boxes[i - 1].classList.remove('is-filled');
        boxes[i - 1].focus();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' && i > 0) {
        boxes[i - 1].focus();
      } else if (e.key === 'ArrowRight' && i < PIN_LENGTH - 1) {
        boxes[i + 1].focus();
      }
    });
    box.addEventListener('focus', () => box.select());
  });
}

function failLogin(message) {
  const error = $('#login-error');
  if (error) error.textContent = message;
  const pin = $('#pin');
  if (!pin) return;
  pinInputs().forEach((b) => { b.value = ''; b.classList.remove('is-filled'); });
  pin.classList.remove('shake');
  void pin.offsetWidth; // relance l'animation
  pin.classList.add('shake');
  pinInputs()[0].focus();
}

async function submitLogin(form) {
  const button = form.querySelector('[type="submit"]');
  if (button.disabled) return;
  const error = $('#login-error');
  const person = memberById(form.querySelector('[aria-checked="true"]')?.dataset.id);
  const pin = pinInputs().map((b) => b.value).join('');

  const remaining = lockRemaining();
  if (remaining) { failLogin(lockMessage(remaining)); return; }
  if (!person) { error.textContent = 'Dis-nous d\'abord qui tu es 👆'; return; }
  if (pin.length !== PIN_LENGTH) { error.textContent = `Le code fait ${PIN_LENGTH} chiffres.`; return; }

  error.textContent = '';
  button.disabled = true;
  let release;
  state.intro = new Promise((resolve) => { release = resolve; });
  try {
    await signInWithEmailAndPassword(auth, person.email, pin);
    store.set('pin-lock', { fails: 0, until: 0 });
    store.set('dernier-prenom', person.id);
    $('.gift')?.classList.add('gift--open');
    confettiBurst({ y: 0.25 });
    setTimeout(release, reduceMotion ? 0 : 650);
  } catch (err) {
    release();
    button.disabled = false;
    if (err.code === 'auth/too-many-requests') {
      store.set('pin-lock', { fails: 0, until: Date.now() + LOCK_MINUTES * 60e3 });
      failLogin(lockMessage(LOCK_MINUTES * 60e3));
    } else if (err.code === 'auth/network-request-failed') {
      error.textContent = 'Pas de réseau… le traîneau est en panne. Réessaie.';
    } else {
      registerFail();
      const locked = lockRemaining();
      failLogin(locked ? lockMessage(locked) : 'Code incorrect');
    }
  }
}

// ---------- Navigation ----------

function parseRoute() {
  const hash = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  if (hash.startsWith('personne/')) {
    const person = memberById(hash.slice('personne/'.length));
    if (person && person.id !== state.me.id) return { view: 'person', person };
  }
  if (hash === 'famille') return { view: 'family' };
  return { view: 'mine' };
}

function onRouteChange() {
  if (!state.me) return;
  const route = parseRoute();
  const key = route.view === 'person' ? `person:${route.person.id}` : route.view;
  if (key !== state.routeKey) {
    state.routeKey = key;
    if (route.view === 'person') {
      state.seenBefore = store.get(seenKey(route.person), 0);
      store.set(seenKey(route.person), Date.now());
    }
    window.scrollTo(0, 0);
  }
  render();
}

// ---------- Rendu de l'appli ----------

function render() {
  if (!state.me) return;
  document.body.classList.remove('is-login');
  const route = parseRoute();
  root.innerHTML = `<div class="shell">${route.view === 'person' ? personView(route.person) : tabsView(route.view)}</div>`;
}

function topBar(view) {
  const me = state.me;
  return `
    <header class="top">
      ${garland()}
      <div class="top__row">
        ${avatar(me, 'md', 'avatar--ring')}
        <div class="top__hello">
          <p class="top__title">Salut ${esc(me.name)} !</p>
          <p class="top__sub">${esc(dodos())}</p>
        </div>
        <button type="button" class="icon-btn" data-action="logout" aria-label="Se déconnecter" title="Se déconnecter">${ICONS.logout}</button>
      </div>
      <nav class="tabs" aria-label="Onglets">
        <a href="#mes-souhaits" ${view === 'mine' ? 'aria-current="page"' : ''}>Mes souhaits</a>
        <a href="#famille" ${view === 'family' ? 'aria-current="page"' : ''}>La famille</a>
      </nav>
    </header>`;
}

function tabsView(view) {
  const body = !state.loaded
    ? '<p class="empty">Le lutin déballe les listes…</p>'
    : view === 'family' ? familyView() : mineView();
  return `${topBar(view)}<main class="main">${body}</main>`;
}

function prioBadge(priority) {
  const p = PRIORITIES[priority];
  return p ? `<span class="prio prio--${priority}">${ICONS[p.icon]}${p.label}</span>` : '';
}

function priceTag(price) {
  if (typeof price !== 'number') return '';
  // 25 → « 25 », 25.5 → « 25,50 »
  return `~${(Number.isInteger(price) ? priceFmt : centsFmt).format(price)} €`;
}

function linkTag(link) {
  return link ? `<a class="wish__link" href="${esc(link)}" target="_blank" rel="noopener noreferrer nofollow">${ICONS.link}Voir le produit</a>` : '';
}

// F2 — Mes souhaits
function mineView() {
  const wishes = wishesOf(state.me);
  const list = wishes.length
    ? wishes.map((w) => `
      <article class="wish">
        <div class="wish__body">
          <div class="wish__top">
            ${prioBadge(w.priority)}
            ${w.price != null ? `<span class="wish__price">${priceTag(w.price)}</span>` : ''}
          </div>
          <h2 class="wish__title">${esc(w.title)}</h2>
          ${w.details ? `<p class="wish__details">${esc(w.details)}</p>` : ''}
          <div class="wish__actions">
            ${linkTag(w.link)}
            <span class="wish__tools">
              <button type="button" class="wish__tool" data-action="edit" data-id="${esc(w.id)}" aria-label="Modifier « ${esc(w.title)} »">${ICONS.edit}</button>
              <button type="button" class="wish__tool" data-action="delete" data-id="${esc(w.id)}" aria-label="Supprimer « ${esc(w.title)} »">${ICONS.trash}</button>
            </span>
          </div>
        </div>
      </article>`).join('')
    : `<div class="empty">${gif('mine')}<p>${esc(pick(EMPTY_MINE))}</p></div>`;

  return `
    <button type="button" class="add-btn" data-action="add">${ICONS.plus}Ajouter un souhait</button>
    ${list}`;
}

// F3 — La famille
function familyView() {
  const cards = others().map((person) => {
    const wishes = wishesOf(person);
    const seen = store.get(seenKey(person), 0);
    const fresh = wishes.filter((w) => millis(w.createdAt) > seen).length;
    return `
      <a class="person-card" href="#personne/${esc(person.id)}">
        ${fresh ? `<span class="badge-new">${fresh} nouveau${fresh > 1 ? 'x' : ''}</span>` : ''}
        ${avatar(person, 'lg')}
        <span class="person-card__name">${esc(person.name)}</span>
        ${wishes.length
          ? `<span class="person-card__count">${plural(wishes.length, 'souhait')}</span>`
          : '<span class="person-card__count person-card__count--empty">Rien… le lutin s\'ennuie</span>'}
      </a>`;
  }).join('');

  return `
    <h1 class="h1">Qui veux-tu gâter ?</h1>
    <div class="family">
      ${cards}
      <div class="gif-tile">${gif('family') || '<span aria-hidden="true">🎄</span>'}</div>
    </div>
    <div class="center">${snowButton()}</div>`;
}

// F3 — Liste d'une personne
function personView(person) {
  const wishes = wishesOf(person);
  const bought = state.bought[person.email] || new Map();
  const fresh = wishes.filter((w) => millis(w.createdAt) > state.seenBefore).length;
  const summary = wishes.length
    ? `${plural(wishes.length, 'souhait')}${fresh ? `, dont ${fresh} nouveau${fresh > 1 ? 'x' : ''}` : ''}`
    : 'Pas encore de souhait';

  const list = wishes.length
    ? wishes.map((w) => {
      const purchase = bought.get(w.id);
      const buyer = purchase && memberByEmail(purchase.buyer);
      const mine = purchase && buyer?.id === state.me.id;
      const isNew = millis(w.createdAt) > state.seenBefore;
      const meta = [w.details, priceTag(w.price)].filter(Boolean);
      return `
        <article class="wish${purchase ? ' wish--bought' : ''}">
          <div class="wish__body">
            ${purchase
              ? `<span class="badge-bought">${ICONS.check}Acheté par ${mine ? 'toi' : esc(buyer?.name || 'quelqu\'un')}</span>`
              : `<div class="wish__top">${prioBadge(w.priority)}${isNew ? '<span class="badge-new">Nouveau</span>' : ''}</div>`}
            <h2 class="wish__title">${esc(w.title)}</h2>
            ${purchase && !mine
              ? '<p class="wish__details">Inutile de l\'offrir en double.</p>'
              : `${meta.length ? `<p class="wish__details">${meta.map(esc).join(' · ')}</p>` : ''}${linkTag(w.link)}`}
          </div>
          <label class="buy">
            <input type="checkbox" data-buy="${esc(w.id)}" data-for="${esc(person.id)}"
              ${purchase ? 'checked' : ''} ${purchase && !mine ? 'disabled' : ''}>
            Acheté
          </label>
        </article>`;
    }).join('')
    : `<div class="empty">${gif(`person:${person.id}`)}<p>${esc(person.name)} n'a encore rien demandé. Le lutin s'ennuie.</p></div>`;

  return `
    <header class="top top--person" style="--c:${esc(person.color)};--ink-c:${esc(person.ink || '#FFFFFF')}">
      <div class="top__row">
        <a href="#famille" class="icon-btn" aria-label="Retour à la famille">${ICONS.back}</a>
        ${avatar(person, 'md', 'avatar--inverse')}
        <div class="top__hello">
          <h1 class="top__title">${esc(person.name)}</h1>
          <p class="top__sub">${esc(summary)}</p>
        </div>
        <button type="button" class="icon-btn" data-action="logout" aria-label="Se déconnecter" title="Se déconnecter">${ICONS.logout}</button>
      </div>
    </header>
    <main class="main">
      <p class="hush">${ICONS.lock}<span>Chut ! ${esc(person.name)} ne voit pas les coches « Acheté ».</span></p>
      ${state.loaded ? list : '<p class="empty">Le lutin déballe la liste…</p>'}
    </main>`;
}

// ---------- Ajout / modification (F2) ----------

function openSheet(wish = null) {
  const prio = wish?.priority ?? null;
  sheetHost.innerHTML = `
    <div class="sheet-backdrop" data-action="close-sheet"></div>
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <div class="sheet__grip" aria-hidden="true"></div>
      <div class="sheet__head">${GIFT_SVG()}<h2 id="sheet-title">${wish ? 'Modifier le souhait' : 'Nouveau souhait'}</h2></div>
      <p class="sheet__hint">Sois précis, le lutin n'est pas devin.</p>
      <form id="wish-form" novalidate data-id="${esc(wish?.id || '')}">
        <div class="field">
          <label for="f-title">Titre *</label>
          <input id="f-title" name="title" type="text" maxlength="120" required autocomplete="off" value="${esc(wish?.title)}">
        </div>
        <div class="field">
          <label for="f-details">Précisions</label>
          <textarea id="f-details" name="details" rows="2" maxlength="1000" placeholder="Couleur, taille, modèle…">${esc(wish?.details)}</textarea>
        </div>
        <div class="field">
          <label for="f-link">Lien vers le produit</label>
          <input id="f-link" name="link" type="url" inputmode="url" maxlength="1000" placeholder="https://…" autocomplete="off" value="${esc(wish?.link)}">
        </div>
        <div class="field field--price">
          <label for="f-price">Prix indicatif (€)</label>
          <input id="f-price" name="price" type="text" inputmode="decimal" maxlength="9" autocomplete="off" value="${wish?.price != null ? esc(String(wish.price).replace('.', ',')) : ''}">
        </div>
        <fieldset class="field">
          <legend>À quel point tu en as envie ?</legend>
          <div class="prio-pick">
            ${Object.entries(PRIORITIES).map(([value, p]) => `
              <button type="button" data-action="prio" data-prio="${value}" aria-pressed="${Number(value) === prio}">${ICONS[p.icon]}${p.label}</button>`).join('')}
          </div>
        </fieldset>
        <p class="error" id="wish-error" role="alert"></p>
        <div class="sheet__btns">
          <button type="button" class="btn btn--ghost" data-action="close-sheet">Annuler</button>
          <button type="submit" class="btn btn--primary">${wish ? 'Enregistrer' : 'Ajouter à ma liste'}</button>
        </div>
      </form>
    </section>`;
  document.addEventListener('keydown', escapeSheet);
  $('#f-title').focus();
}

function closeSheet() {
  sheetHost.innerHTML = '';
  document.removeEventListener('keydown', escapeSheet);
}

function escapeSheet(e) {
  if (e.key === 'Escape') closeSheet();
}

function submitWish(form) {
  const error = $('#wish-error');
  const title = form.title.value.trim();
  const details = form.details.value.trim();
  const link = normalizeLink(form.link.value);
  const rawPrice = form.price.value.trim().replace(/\s|€/g, '').replace(',', '.');
  const price = rawPrice === '' ? null : Number(rawPrice);
  const pressed = form.querySelector('[data-action="prio"][aria-pressed="true"]');
  const priority = pressed ? Number(pressed.dataset.prio) : null;

  if (!title) { error.textContent = 'Il manque le titre : le lutin ne lit pas encore dans les pensées.'; form.title.focus(); return; }
  if (link === null) { error.textContent = 'Ce lien ne ressemble pas à une adresse web.'; form.link.focus(); return; }
  if (price !== null && (!Number.isFinite(price) || price < 0 || price > 100000)) {
    error.textContent = 'Le prix doit être un nombre (ex. 25 ou 19,90).'; form.price.focus(); return;
  }

  const data = { title, details, link, price, priority, updatedAt: serverTimestamp() };
  const id = form.dataset.id;
  // On ferme tout de suite : Firestore met l'écran à jour en local, l'envoi se fait en arrière-plan.
  closeSheet();
  if (id) {
    updateDoc(doc(db, 'wishes', id), data).catch(writeFailed);
    toast('Modifié ! Le lutin a gommé et réécrit.');
  } else {
    addDoc(collection(db, 'wishes'), {
      ...data, owner: state.me.email.toLowerCase(), createdAt: serverTimestamp(),
    }).catch(writeFailed);
    confettiBurst();
    toast(pick(ADDED));
  }
}

function writeFailed(err) {
  console.error(err);
  toast('Oups, le lutin n\'a pas pu enregistrer. Réessaie.', { error: true });
}

function removeWish(id) {
  const wish = state.wishes.find((w) => w.id === id);
  if (!wish || !confirm(`Supprimer « ${wish.title} » de ta liste ?`)) return;
  deleteDoc(doc(db, 'wishes', id)).catch(writeFailed);
  toast('Supprimé. Le lutin range ça au grenier.');
}

// ---------- Coche « Acheté » (F3) ----------

function toggleBought(input) {
  const person = memberById(input.dataset.for);
  const ref = doc(db, 'gifts', person.email, 'bought', input.dataset.buy);
  if (input.checked) {
    setDoc(ref, { buyer: state.me.email.toLowerCase(), at: serverTimestamp() }).catch((err) => {
      console.error(err);
      toast('Quelqu\'un a été plus rapide, ou le réseau a calé.', { error: true });
      render();
    });
    confettiBurst({ y: 0.6 });
    toast(pick(BOUGHT));
  } else {
    deleteDoc(ref).catch((err) => { writeFailed(err); render(); });
    toast('Coche retirée.');
  }
}

// ---------- Évènements ----------

document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const { action, id } = target.dataset;
  switch (action) {
    case 'pick':
      target.parentElement.querySelectorAll('[role="radio"]').forEach((b) => b.setAttribute('aria-checked', String(b === target)));
      $('#login-error').textContent = '';
      (pinInputs().find((b) => !b.value) || pinInputs()[0]).focus();
      break;
    case 'snow': toggleSnow(target); break;
    case 'logout': logout(); break;
    case 'add': openSheet(); break;
    case 'edit': openSheet(state.wishes.find((w) => w.id === id)); break;
    case 'delete': removeWish(id); break;
    case 'close-sheet': closeSheet(); break;
    case 'prio': {
      const on = target.getAttribute('aria-pressed') !== 'true';
      target.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      target.setAttribute('aria-pressed', String(on));
      break;
    }
    default:
  }
});

document.addEventListener('submit', (e) => {
  e.preventDefault();
  if (e.target.id === 'login-form') submitLogin(e.target);
  if (e.target.id === 'wish-form') submitWish(e.target);
});

document.addEventListener('change', (e) => {
  if (e.target.matches('[data-buy]')) toggleBought(e.target);
});

window.addEventListener('hashchange', onRouteChange);

async function logout() {
  closeSheet();
  stopData();
  state.me = null;
  state.routeKey = '';
  history.replaceState(null, '', location.pathname);
  await signOut(auth);
}

// ---------- Démarrage ----------

function renderNotice(title, html) {
  document.body.classList.add('is-login');
  root.innerHTML = `<section class="notice">${GIFT_SVG()}<h1>${title}</h1>${html}</section>`;
}

function boot() {
  setupSnow();

  if (new Date() > new Date(`${CLOSE_DATE}T23:59:59`)) {
    renderNotice('La hotte est fermée', '<p>Les souhaits de cette année sont partis avec le traîneau. Rendez-vous l\'an prochain ! 🎄</p>');
    return;
  }
  if (!configured) {
    renderNotice('Presque prêt !', '<p>Il reste à coller la configuration Firebase dans <code>js/config.js</code>.</p><p>Tout est expliqué dans le README.</p>');
    return;
  }

  const app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      stopData();
      state.me = null;
      renderLogin();
      return;
    }
    const me = memberByEmail(user.email);
    if (!me) {
      // Compte inconnu de config.js : on refuse plutôt que d'afficher un site cassé.
      await signOut(auth);
      return;
    }
    if (state.intro) await state.intro;
    state.intro = null;
    state.me = me;
    state.routeKey = '';
    startData();
    onRouteChange();
  });
}

boot();
