'use strict';
const studies = [
  { id: 'ovals', title: 'Ovales asymétriques', text: 'Un galet large dans le coin supérieur gauche, un ovale plus haut dans le coin opposé. Des courbes pleines, une matière champagne et un bord éclairé.', shapes: '<ellipse cx="80" cy="55" rx="270" ry="200" transform="rotate(-18 80 55)"/><ellipse cx="1000" cy="655" rx="190" ry="260" transform="rotate(28 1000 655)"/>' },
  { id: 'corners', title: 'Coins galbés', text: 'Deux volumes coudés suivent les coins du module. Leur arrondi intérieur laisse une respiration autour du cadre ; le reflet souligne cette découpe.', shapes: '<path d="M-60-60H310Q375-60 375 4V20Q375 83 307 83H118Q48 83 48 155V308Q48 370-14 370H-60Z"/><path d="M1060 740H710Q648 740 648 683V669Q648 609 711 609H878Q953 609 953 532V398Q953 343 1010 343H1060Z"/>' },
  { id: 'pebbles', title: 'Galets étirés', text: 'Deux formes en goutte, allongées dans la diagonale des coins. Une extrémité généreuse, l’autre qui s’affine sous le module, avec une arête lumineuse bien dessinée.', shapes: '<path d="M-80-70H445C448 13 389 60 300 79C173 105 114 147 92 227C70 310-23 310-80 254Z"/><path d="M1080 750H580C578 677 638 635 733 615C876 585 928 533 941 448C952 369 1037 360 1080 411Z"/>' },
];
const grid = document.getElementById('studies');
const overview = document.getElementById('overview');
const template = document.getElementById('module');
studies.forEach((study, index) => {
  const article = document.createElement('article');
  article.className = 'study';
  article.dataset.study = study.id;
  article.innerHTML = `<div class="study-heading"><h2><span>0${index + 1}</span>${study.title}</h2><button class="enlarge" aria-expanded="false" aria-controls="scene-${study.id}">Agrandir ↗</button></div><div class="scene" id="scene-${study.id}" role="img" aria-label="${study.title} : ${study.text}"><svg class="background" viewBox="0 0 1000 680" aria-hidden="true"><defs><linearGradient id="base-${study.id}" x2=".8" y2="1"><stop stop-color="#f6f3ec"/><stop offset="1" stop-color="#eee7da"/></linearGradient><linearGradient id="matter-${study.id}" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="#f1e8d9"/><stop offset=".55" stop-color="#e1cfb3"/><stop offset="1" stop-color="#cdb28c"/></linearGradient><filter id="depth-${study.id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feDropShadow dx="10" dy="16" stdDeviation="12" flood-color="#826545" flood-opacity=".19"/><feDropShadow dx="1.5" dy="1.5" stdDeviation=".4" flood-color="#fffdf6" flood-opacity="1"/></filter></defs><rect width="1000" height="680" fill="url(#base-${study.id})"/><g fill="url(#matter-${study.id})" stroke="#fffcf0" stroke-width="1.4" filter="url(#depth-${study.id})">${study.shapes}</g></svg><span class="caption">LES BELLES SURPRISES COMMENCENT ICI.</span><span class="signature">Un peu de chance. Beaucoup de belles choses.</span></div><p class="description">${study.text}</p>`;
  article.querySelector('.scene').append(template.content.cloneNode(true));
  article.querySelector('.enlarge').addEventListener('click', () => {
    grid.classList.add('expanded');
    grid.querySelectorAll('.study').forEach(item => { item.hidden = item !== article; });
    article.querySelector('.enlarge').hidden = true;
    article.querySelector('.enlarge').setAttribute('aria-expanded', 'true');
    overview.hidden = false;
    overview.focus({ preventScroll: true });
  });
  grid.append(article);
});
overview.addEventListener('click', () => {
  const current = grid.querySelector('.study:not([hidden]) .enlarge');
  grid.classList.remove('expanded');
  grid.querySelectorAll('.study').forEach(item => {
    item.hidden = false;
    item.querySelector('.enlarge').hidden = false;
    item.querySelector('.enlarge').setAttribute('aria-expanded', 'false');
  });
  overview.hidden = true;
  current.focus({ preventScroll: true });
});
