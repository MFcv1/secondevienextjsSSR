/* Local visual prototype. No application state, analytics or network calls. */
'use strict';
const projects = [
  { title: 'La Commode Oubliée', tag: 'RÉNOVATION COMPLÈTE', desc: 'Sablage délicat et peinture Céladon.', before: 'avant', after: 'apres' },
  { title: 'La Console d’Époque', tag: 'SABLAGE & PATINE', desc: 'Sublimation du veinage naturel du chêne.', before: 'avantu', after: 'apresu' },
  { title: 'Le Bureau Vintage', tag: 'RÉPARATION & TRAITEMENT', desc: 'Consolidation et vernis mat imperméable.', before: 'avantx', after: 'apresx' },
];
const proposals = [...document.querySelectorAll('.proposal')];
const template = document.getElementById('module-template');
const modules = [];
let activeProject = 0;
let split = 50;
let selected = 'light';
let showAll = false;

function setSplit(value) {
  split = Math.max(0, Math.min(100, Number(value)));
  modules.forEach(module => {
    module.querySelector('.ba-stage').style.setProperty('--split', `${split}%`);
    const range = module.querySelector('.ba-range');
    range.value = split;
    range.setAttribute('aria-valuetext', `${split} % avant, ${100 - split} % après`);
  });
}

function setProject(index) {
  activeProject = (index + projects.length) % projects.length;
  const project = projects[activeProject];
  modules.forEach(module => {
    for (const side of ['before', 'after']) {
      const img = module.querySelector(`.ba-${side}`);
      img.src = `assets/${project[side]}-gallery.webp`;
      img.alt = `${project.title} ${side === 'before' ? 'avant' : 'après'} restauration`;
    }
    module.querySelector('.project-tag').textContent = project.tag;
    module.querySelector('.project-title').textContent = project.title;
    module.querySelector('.project-desc').textContent = project.desc;
    module.querySelector('.project-count').textContent = `0${activeProject + 1} / 03`;
    module.querySelectorAll('.segments i').forEach((segment, i) => segment.classList.toggle('active', i === activeProject));
  });
  setSplit(50);
}

proposals.forEach(proposal => {
  const mount = proposal.querySelector('.module-mount');
  mount.append(template.content.cloneNode(true));
  modules.push(mount);
  const range = mount.querySelector('.ba-range');
  range.addEventListener('input', event => setSplit(event.target.value));
  mount.querySelectorAll('[data-step]').forEach(button => {
    button.addEventListener('click', () => setProject(activeProject + Number(button.dataset.step)));
  });
});

const choices = [...document.querySelectorAll('[data-choice]')];
const compare = document.getElementById('compare');
function renderSelection() {
  proposals.forEach(proposal => { proposal.hidden = !showAll && proposal.dataset.theme !== selected; });
  choices.forEach(button => button.setAttribute('aria-pressed', String(!showAll && button.dataset.choice === selected)));
  compare.setAttribute('aria-pressed', String(showAll));
  compare.textContent = showAll ? 'Revenir à une proposition ↑' : 'Voir les trois ↓';
}
choices.forEach(button => button.addEventListener('click', () => {
  selected = button.dataset.choice;
  showAll = false;
  renderSelection();
}));
compare.addEventListener('click', () => { showAll = !showAll; renderSelection(); });
document.getElementById('original-colors').addEventListener('change', event => {
  document.body.classList.toggle('original-colors', event.target.checked);
});
document.getElementById('intensity').addEventListener('input', event => {
  document.documentElement.style.setProperty('--decor-opacity', Number(event.target.value) / 100);
  document.getElementById('intensity-value').value = `${event.target.value} %`;
});
