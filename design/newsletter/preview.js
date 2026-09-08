'use strict';
const variations = [
  { id: 'champagne', name: 'Champagne équilibré', palette: 'Ovale large en haut · galet dressé en bas', badge: 'Au plus près de ton choix', caption: 'LES BELLES SURPRISES COMMENCENT ICI.', signature: 'Un peu de chance. Beaucoup de belles choses.', material: 'Champagne & équilibre', intention: 'Les proportions du croquis choisi, affinées : un ovale généreux en haut à gauche et un volume plus vertical en bas à droite. Les deux formes restent ancrées dans les coins.', character: 'Une matière champagne douce, un bord supérieur mat et un reflet discret sur une portion de l’ovale inférieur. La finition la plus proche des ovales asymétriques que tu préfères.' },
  { id: 'ivory', name: 'Ivoire aérien', palette: 'Ovale aplati en haut · galet élancé en bas', badge: '', caption: 'LES BELLES SURPRISES COMMENCENT ICI.', signature: 'Un peu de chance. Beaucoup de belles choses.', material: 'Ivoire & légèreté', intention: 'L’ovale supérieur s’étire horizontalement et le galet inférieur s’affine. Plus d’espace autour du module, avec des silhouettes toujours nettes.', character: 'Un champagne plus pâle, des nuances rapprochées et une ombre légèrement déportée. La version la plus légère des trois, sans contour fondu.' },
  { id: 'embrace', name: 'Relief enveloppant', palette: 'Galet rond en haut · ovale couché en bas', badge: '', caption: 'LES BELLES SURPRISES COMMENCENT ICI.', signature: 'Un peu de chance. Beaucoup de belles choses.', material: 'Galbe & profondeur', intention: 'Un galet plus rond accompagne le coin supérieur. En bas, l’ovale se couche pour prolonger le coin du module et son bord inférieur.', character: 'Une teinte sable champagne, des ombres un peu plus présentes et un reflet partiel sur l’ovale inférieur. La version la plus enveloppante, avec deux volumes seulement.' },
];
const container = document.getElementById('proposals');
const template = document.getElementById('newsletter-template');
const modules = [];
let selected = 'champagne';
let showAll = false;
let picked = null;

variations.forEach((variation, index) => {
  const article = document.createElement('article');
  article.className = 'proposal';
  article.dataset.theme = variation.id;
  article.setAttribute('aria-labelledby', `title-${variation.id}`);
  article.innerHTML = `<div class="proposal-note"><div><span class="number">0${index + 1}</span><h2 id="title-${variation.id}">${variation.name}</h2>${variation.badge ? `<span class="recommendation">${variation.badge}</span>` : ''}</div><p>${variation.palette}</p></div><section class="scene" aria-label="Aperçu ${variation.name}"><div class="decor" aria-hidden="true"><div class="oval oval-top"></div><div class="oval oval-bottom"></div></div><div class="scene-caption" aria-hidden="true"><span>${variation.caption}</span><span>SECONDE VIE — LES NOUVELLES DE L’ATELIER</span></div><div class="module-mount"></div><div class="scene-bottom" aria-hidden="true"><span>${variation.signature}</span><span class="material-note">${variation.material}</span></div></section><div class="design-note"><p><b>L’intention</b>${variation.intention}</p><p><b>Le caractère</b>${variation.character}</p></div>`;
  const mount = article.querySelector('.module-mount');
  mount.append(template.content.cloneNode(true));
  const form = mount.querySelector('form');
  const submit = form.querySelector('button');
  submit.setAttribute('aria-label', 'Tire une carte d’abord');
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (picked === null || !form.reportValidity()) return;
    const feedback = mount.querySelector('.form-feedback');
    feedback.textContent = 'Aperçu de confirmation : ton code apparaîtrait ici. Aucun e-mail n’a été envoyé et aucune inscription n’a été enregistrée.';
    feedback.hidden = false;
  });
  mount.querySelectorAll('[data-card]').forEach(card => card.addEventListener('click', () => {
    if (picked !== null) return;
    picked = Number(card.dataset.card);
    updateGame();
  }));
  mount.querySelector('.replay').addEventListener('click', () => {
    picked = null;
    updateGame();
    mount.querySelector('[data-card="1"]').focus();
  });
  modules.push(mount);
  container.append(article);
});

function updateGame() {
  modules.forEach(mount => {
    mount.querySelector('.cards').classList.toggle('has-pick', picked !== null);
    mount.querySelectorAll('[data-card]').forEach(card => {
      const isPicked = Number(card.dataset.card) === picked;
      card.classList.toggle('is-picked', isPicked);
      card.setAttribute('aria-pressed', String(isPicked));
      card.setAttribute('aria-disabled', String(picked !== null));
      card.setAttribute('aria-label', isPicked ? 'Carte choisie : aperçu d’une réduction de 10 pour cent' : `Choisir la carte ${Number(card.dataset.card) + 1}`);
    });
    mount.querySelector('.game-label').textContent = picked === null ? 'CHOISIS UNE CARTE' : 'UNE SURPRISE DE 10 % — DÉMONSTRATION';
    mount.querySelector('.replay').hidden = picked === null;
    mount.querySelector('.game-hint').hidden = picked !== null;
    const submit = mount.querySelector('.submit-button');
    submit.disabled = picked === null;
    submit.setAttribute('aria-label', picked === null ? 'Tire une carte d’abord' : 'Simuler la réception du code');
    mount.querySelector('[data-submit-label]').textContent = picked === null ? 'TIRE UNE CARTE D’ABORD' : 'RECEVOIR MON CODE';
    if (picked === null) {
      mount.querySelector('.form-feedback').hidden = true;
      mount.querySelector('form').reset();
    }
  });
}

const choices = [...document.querySelectorAll('[data-choice]')];
const compare = document.getElementById('compare');
function renderSelection() {
  container.querySelectorAll('.proposal').forEach(proposal => { proposal.hidden = !showAll && proposal.dataset.theme !== selected; });
  choices.forEach(button => button.setAttribute('aria-pressed', String(!showAll && button.dataset.choice === selected)));
  compare.setAttribute('aria-pressed', String(showAll));
  compare.textContent = showAll ? 'Revenir à une proposition ↑' : 'Voir les trois ↓';
}
choices.forEach(button => button.addEventListener('click', () => { selected = button.dataset.choice; showAll = false; renderSelection(); }));
compare.addEventListener('click', () => { showAll = !showAll; renderSelection(); });
document.getElementById('intensity').addEventListener('input', event => {
  document.documentElement.style.setProperty('--decor-opacity', Number(event.target.value) / 100);
  document.getElementById('intensity-value').value = `${event.target.value} %`;
});
renderSelection();
