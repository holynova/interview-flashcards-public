'use strict';
const questions = window.QUESTIONS;
const root = document.getElementById('app');
const storageKey = 'interview-practice-public-v1';
const validId = id => Number.isInteger(id) && questions.some(q => q.id === id);
const escapeHtml = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let stored = {};
try {
  const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
  if (value && typeof value === 'object' && !Array.isArray(value)) stored = value;
} catch {}
const requested = Number(new URLSearchParams(location.search).get('q'));
let current = validId(requested) ? requested : validId(stored.current) ? stored.current : 1;
let expanded = false, catalog = false, query = '';
const shapes = {
  prev: '<path d="m14 6-6 6 6 6"/>',
  next: '<path d="m10 6 6 6-6 6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${shapes[name]}</svg>`;
const list = items => `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
function announce(text) { document.getElementById('announcements').textContent = text; }
function savePosition() {
  try { localStorage.setItem(storageKey, JSON.stringify({current})); } catch {}
}
function reflectUrl() {
  const url = new URL(location.href);
  url.search = '';
  if (current !== 1) url.searchParams.set('q', current);
  history.replaceState(null, '', url);
}
function renderQuestion() {
  const q = questions.find(item => item.id === current);
  const position = questions.indexOf(q);
  root.innerHTML = `<main id="main" class="reader ${expanded ? 'is-open' : ''}">
    <header class="topbar"><span class="position" aria-label="第 ${position+1} 题，共 ${questions.length} 题">${String(position+1).padStart(2,'0')} <span>/ ${questions.length}</span></span><button class="catalog-toggle" data-action="catalog">${icon('list')}目录</button></header>
    <article class="question-area"><h1 id="question" tabindex="-1">${escapeHtml(q.question)}</h1>
      <div id="answer" ${expanded ? '' : 'hidden'}>${expanded ? `<section><h2>答题思路</h2>${list([`考察：${q.intent}`, ...q.guide])}</section><section class="reference"><h2>参考回答</h2>${list(q.answer)}</section>${q.followups.length ? `<details><summary>追问 · ${q.followups.length}</summary>${list(q.followups)}</details>` : ''}` : ''}</div>
    </article>
    <nav class="navigation" aria-label="题目导航"><button class="step" data-action="prev" aria-label="上一题" ${position===0?'disabled':''}>${icon('prev')}</button><button class="reveal" data-action="reveal" aria-expanded="${expanded}" aria-controls="answer">${expanded?'收起答案':'查看答案'}</button><button class="step" data-action="next" aria-label="下一题" ${position===questions.length-1?'disabled':''}>${icon('next')}</button></nav>
  </main>`;
  reflectUrl();
}
function renderCatalog() {
  root.innerHTML = `<main id="main" class="catalog"><header class="topbar"><h1 id="catalog-title" tabindex="-1">题目</h1><button class="close" data-action="back" aria-label="返回当前题目">${icon('close')}</button></header><input type="search" aria-label="搜索题目" placeholder="搜索" value="${escapeHtml(query)}"><div id="results"></div></main>`;
  renderResults();
}
function renderResults() {
  const term = query.trim().toLocaleLowerCase();
  const matches = questions.filter(q => (q.question + q.category + q.followups.join('')).toLocaleLowerCase().includes(term));
  document.getElementById('results').innerHTML = matches.length ? matches.map(q => `<button class="catalog-row" data-id="${q.id}" ${q.id===current?'aria-current="true"':''}><span class="row-number">${String(q.id).padStart(2,'0')}</span><span>${escapeHtml(q.question)}</span></button>`).join('') : '<div class="empty"><p>没有找到题目</p><button data-action="clear">清空搜索</button></div>';
}
function render() { catalog ? renderCatalog() : renderQuestion(); }
function goTo(id, focus=false) {
  if (!validId(id)) return;
  current=id; expanded=false; catalog=false;
  savePosition(); render(); window.scrollTo({top:0,behavior:'instant'});
  if (focus) document.getElementById('question').focus({preventScroll:true});
  announce(`第 ${id} 题`);
}
function toggleAnswer() {
  expanded=!expanded; renderQuestion();
  window.scrollTo({top:0,behavior:'instant'});
  document.querySelector('[data-action="reveal"]').focus({preventScroll:true});
  announce(expanded?'答案已展开':'答案已收起');
}
root.addEventListener('click', event => {
  const button=event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.id) { goTo(Number(button.dataset.id),true); return; }
  switch(button.dataset.action) {
    case 'prev': goTo(current-1,true); break;
    case 'next': goTo(current+1,true); break;
    case 'reveal': toggleAnswer(); break;
    case 'catalog': catalog=true; query=''; render(); window.scrollTo(0,0); document.getElementById('catalog-title').focus({preventScroll:true}); break;
    case 'back': catalog=false; render(); window.scrollTo(0,0); document.querySelector('[data-action="catalog"]').focus({preventScroll:true}); break;
    case 'clear': query=''; renderCatalog(); document.querySelector('input').focus(); break;
  }
});
root.addEventListener('input', event => {
  if (event.target.matches('input[type="search"]')) { query=event.target.value; renderResults(); }
});
document.addEventListener('keydown', event => {
  if (event.target.closest('input,textarea,select,[contenteditable="true"]') || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key==='Escape' && catalog) { event.preventDefault(); catalog=false; render(); document.querySelector('[data-action="catalog"]').focus(); }
  if (catalog || event.target.closest('summary')) return;
  if (event.key==='ArrowLeft') { event.preventDefault(); goTo(current-1,true); }
  if (event.key==='ArrowRight') { event.preventDefault(); goTo(current+1,true); }
});
render();
