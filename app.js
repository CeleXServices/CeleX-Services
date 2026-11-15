(() => {
const SHOW_DISCOUNT = false;
const ULTRA_DISCOUNT = true;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const LINE = 'https://line.me/ti/p/Cj_2SCkbNY', TG = 'https://t.me/C33trjiu';
const ORDER_ENDPOINT = ''; // Set this to the deployed Apps Script web app URL.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  const devToolsShortcut = (e.ctrlKey || e.metaKey) && (
    (e.shiftKey && ['i', 'j', 'c'].includes(key)) || key === 'u'
  );
  if (key === 'f12' || devToolsShortcut) {
    e.preventDefault();
    e.stopPropagation();
  }
}, true);

/* Rates. bol rows: [league, regRound, regHon, amtMinRounds, amtRound, amtHon, spRound, spHon]
   hourly rows: [league, regular, special]   band rows: [label, minH, maxH, regular, special?] */
const hourlyA = [['League of Adepts+',125,100],['League of Asgard',110,90],['League of Odin',100,80],['League of Masters and below',80,50]];
const S = [
 {id:'bol',n:'BoL (Battle For The Light)',t:'bol',d:'Priced per round plus per honorific.',g:[
  ['League of Asgard',15,5,6,13.5,3.5,12.5,3.5],
  ['League of Odin',13.5,5,6,12,3.5,11,3.5],
  ['League of Masters',12,5,6,11.5,3.5,10.5,3.5],
  ['League of Conquerors',9,4,4,8,3.5,7.5,2.5],
  ['League of Warriors and below',8,3,0,0,0,7,2.5]]},
 {id:'jot',n:'Jotunheim Attacking/Spying',t:'hr',d:'Priced per hour by league.',g:hourlyA},
 {id:'thr',n:'Holding the Throne',t:'band',d:'Priced per hour. Longer bookings get a lower hourly rate.',g:[['1-3h',1,3,200,180],['4-10h',4,10,170,150],['10h+',11,99,140,120]]},
 {id:'main',n:'Main Asgard Attacking/Spying',t:'hr',d:'Priced per hour by league.',g:hourlyA},
 {id:'mini',n:'Mini Asgard Attacking/Spying',t:'hr',d:'Priced per hour by league.',g:[['League of Adepts+',135,110],['League of Asgard',120,100],['League of Odin',110,85],['League of Masters and below',90,65]]},
 {id:'mt',n:'Mini Asgard Towers',t:'band',d:'Priced per hour. Longer bookings get a lower hourly rate.',g:[['1h',1,1,60],['2h',2,2,50],['3h',3,3,45],['4h',4,4,40]]},
 {id:'mat',n:'Main Asgard Towers',t:'band',d:'Priced per hour. Longer bookings get a lower hourly rate.',g:[['1-3h',1,3,80],['4-8h',4,8,75],['8h+',9,99,70]]},
 {id:'bot',n:'Personal Discord Bot',t:'bot',d:'Your own Discord bot that distributes medals to your clan members equally.',g:[]}
];
const f = n => (Math.round(n * 100) / 100).toString();
const unit = s => s.t === 'bol' ? 'round' : 'hour';
const ultraPrice = (regular, discounted) => ULTRA_DISCOUNT && SHOW_DISCOUNT && discounted < regular
  ? Math.round(discounted * 0.85 * 100) / 100
  : discounted;

/* cards */
const from = s => {
  if (s.t === 'bot') return 'Contact for pricing';
  const v = s.g.map(r => s.t === 'bol' ? (SHOW_DISCOUNT ? ultraPrice(r[1], r[6]) : r[3] ? Math.min(r[1], r[4]) : r[1]) : s.t === 'hr' ? (SHOW_DISCOUNT ? ultraPrice(r[1], r[2]) : r[1]) : (SHOW_DISCOUNT && r[4] ? ultraPrice(r[3], r[4]) : r[3]));
  return 'From ' + f(Math.min(...v)) + ' USD per ' + unit(s);
};
const cardPrice = s => {
  if (s.t === 'bot') return null;
  const candidates = s.g.map(r => {
    if (s.t === 'bol') return {price: SHOW_DISCOUNT ? ultraPrice(r[1], r[6]) : r[1], regular: r[1]};
    if (s.t === 'hr') return {price: SHOW_DISCOUNT ? ultraPrice(r[1], r[2]) : r[1], regular: r[1]};
    const discounted = SHOW_DISCOUNT && r[4] && r[4] < r[3];
    return {price: discounted ? ultraPrice(r[3], r[4]) : r[3], regular: r[3]};
  });
  const lowest = candidates.reduce((best, item) => item.price < best.price ? item : best);
  return {...lowest, discounted: lowest.price < lowest.regular};
};
S.forEach((s, i) => {
  const b = document.createElement('button');
  b.className = 'card rv'; b.type = 'button';
  const icon = s.id === 'bot'
    ? '<span class="service-icon" aria-hidden="true"><img src="assets/icons/discord.svg" alt="" width="24" height="24"></span>'
    : '';
  const pricing = cardPrice(s);
  if (pricing && pricing.discounted) b.classList.add('discounted');
  const priceMarkup = pricing && pricing.discounted
    ? `<span class="card-pricing discounted"><span class="card-price"><s>${f(pricing.regular)} USD</s><strong>${f(pricing.price)} USD</strong><small>per ${unit(s)}</small></span></span>`
    : `<span class="card-pricing"><span class="from">${from(s)}</span></span>`;
  const discountRibbon = pricing && pricing.discounted ? '<span class="discount-ribbon" aria-label="Discount">Discount</span>' : '';
  b.innerHTML = `${discountRibbon}<span class="card-top">${icon}<b>${s.n}</b></span>${priceMarkup}<span class="hint">View rates and contact <span aria-hidden="true">→</span></span>`;
  b.onclick = () => openWin(s);
  $(i < 7 ? '#grid-events' : '#grid-other').append(b);
});
/* service window */
const dlg = $('#win');
const links = `<a href="${LINE}" target="_blank" rel="noopener"><img src="assets/icons/line.svg" alt="" aria-hidden="true">LINE</a><a href="${TG}" target="_blank" rel="noopener"><img src="assets/icons/telegram.svg" alt="" aria-hidden="true">Telegram</a>`;
$('#contact-links').innerHTML = links;
let closing = false;
let orderTimeout;
window.addEventListener('message', e => {
  const frame = $('iframe[name="order-response"]', dlg);
  if (!frame || e.source !== frame.contentWindow || !e.data || e.data.type !== 'celex-order-result') return;
  const form = $('#order-form', dlg);
  if (!form) return;
  window.clearTimeout(orderTimeout);
  $('.order-submit', form).disabled = e.data.success !== true;
  $('.order-status', form).textContent = e.data.success === true
    ? 'Request received. We will contact you to confirm availability and the final price.'
    : 'We could not submit your request. Please try again or contact us directly.';
});
const closeWin = () => {
  if (!dlg.open || closing) return;
  if (reduce) { dlg.close(); return; }
  closing = true; dlg.classList.add('closing');
  setTimeout(() => { dlg.classList.remove('closing'); dlg.close(); closing = false; }, 300);
};
dlg.addEventListener('click', e => {
  const r = dlg.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeWin();
});
dlg.addEventListener('cancel', e => { e.preventDefault(); closeWin(); });

const cut = v => `<s class="cut">${v}</s>`;
const cell = (was, now, u) => { const t = `${f(now)} USD${u ? ' ' + u : ''}`; return was && was > now ? `<span class="stk">${cut(f(was) + ' USD')}<span>${t}</span></span>` : `<span>${t}</span>`; };

function openWin(s) {
  const st = {l: 0, q: 1};
  const cap = s.t === 'band' ? (s.g[s.g.length - 1][2] === 99 ? 24 : s.g[s.g.length - 1][2]) : s.t === 'hr' ? 24 : 99;
  const qty = s.t === 'bol' ? 'Rounds' : 'Hours', D = SHOW_DISCOUNT;
  const league = s.t === 'bol' || s.t === 'hr' ? `<div class="field"><span class="lbl">League</span><div class="seg">${s.g.map((r, i) => `<button type="button" aria-pressed="${i === 0}">${r[0]}</button>`).join('')}</div></div>` : '';
  let table = '';
  if (s.t === 'bol') table = `<tr><th>League</th><th>Per round</th><th>Per honorific</th><th>Amount discount</th></tr>` + s.g.map(r => `<tr><td>${r[0]}</td><td>${cell(D ? r[1] : 0, D ? ultraPrice(r[1], r[6]) : r[1], '')}</td><td>${cell(D ? r[2] : 0, D ? ultraPrice(r[2], r[7]) : r[2], '')}</td><td>${r[3] ? `<span class="tp"><span>${r[3]}+ rounds</span>${cell(r[1], ultraPrice(r[1], r[4]), '/ round')}${cell(r[2], ultraPrice(r[2], r[5]), '/ honorific')}</span>` : ''}</td></tr>`).join('');
  else if (s.t === 'hr') table = `<tr><th>League</th><th>Per hour</th></tr>` + s.g.map(r => `<tr><td>${r[0]}</td><td>${cell(D ? r[1] : 0, D ? ultraPrice(r[1], r[2]) : r[1], '')}</td></tr>`).join('');
  else table = `<tr><th>Duration</th><th>Per hour</th></tr>` + s.g.map(r => `<tr><td>${r[0]}</td><td>${cell(D && r[4] ? r[3] : 0, D && r[4] ? ultraPrice(r[3], r[4]) : r[3], '')}</td></tr>`).join('');
  const contact = `<span class="lbl">Want to book?</span><button class="request-open" type="button">Request availability</button><span class="sub contact-direct">Or contact us directly</span><div class="btns">${links}</div>`;
  dlg.innerHTML = `<div class="top"><div><h2 id="win-title">${s.n}</h2><p class="sub">${s.d}</p></div><button class="x" type="button">Close</button></div>` + (s.t === 'bot'
    ? `<div class="cols"><div class="sum one"><span class="price">Custom pricing</span><p class="sub">Message us to discuss your clan and get a price.</p>${contact}</div></div>`
    : `<div class="cols">
    <div class="ctl">
      ${league}
      <div class="field"><span class="lbl">${qty}</span><div class="step"><button type="button" aria-label="Decrease">-</button><input type="number" inputmode="numeric" min="1" max="${cap}" value="1" aria-label="${qty}"><button type="button" aria-label="Increase">+</button></div></div>
    </div>
    <aside class="sum"><span class="lbl">Estimated total</span><span class="was" id="was"></span><span class="price" id="tot"></span><p class="sub" id="det"></p><p class="sub" id="note"></p>${contact}</aside>
  </div>
  <details class="all"><summary>View full price list</summary><div class="dd"><div class="tw"><table>${table}</table></div></div></details>`);

  dlg.insertAdjacentHTML('beforeend', `
    <form class="order-form" id="order-form" action="${ORDER_ENDPOINT}" method="post" target="order-response" hidden>
      <h3>Request availability</h3>
      <p class="sub">Send an order request. Your booking is not confirmed until we check availability and confirm the final price.</p>
      <input type="hidden" name="service">
      <input type="hidden" name="selection">
      <input type="hidden" name="estimate">
      <label class="order-field">Your name<input name="customerName" autocomplete="name" maxlength="100" required></label>
      <div class="order-field"><label for="order-contact-method">Preferred contact method</label>
        <select id="order-contact-method" name="contactMethod" required>
          <option value="Telegram">Telegram</option><option value="LINE">LINE</option><option value="Email">Email</option>
        </select>
      </div>
      <label class="order-field" for="order-contact">Contact detail<input id="order-contact" name="contact" maxlength="200" required></label>
      <div class="order-schedule">
        <label class="order-field">Preferred date<input name="preferredDate" type="date"></label>
        <label class="order-field">Preferred time<input name="preferredTime" type="time"></label>
      </div>
      <label class="order-field">Timezone<input name="timezone" readonly></label>
      <label class="order-field">Additional details<textarea name="notes" rows="3" maxlength="1000"></textarea></label>
      <label class="order-field order-honeypot" aria-hidden="true">Leave this field empty<input name="website" tabindex="-1" autocomplete="off"></label>
      <label class="order-consent"><input name="requestOnly" type="checkbox" required> I understand this is a request only, not a confirmed booking.</label>
      <button class="order-submit" type="submit">Send request</button>
      <p class="order-status sub" role="status" aria-live="polite"></p>
      <iframe name="order-response" title="Order request response" hidden></iframe>
    </form>`);

  const calc = () => {
    let wr, rr, note = '';
    if (s.t === 'bol') {
      const r = s.g[st.l], am = r[3] && st.q >= r[3];
      wr = r[1]; rr = D ? ultraPrice(r[1], r[6]) : am ? r[4] : r[1];
      const wh = r[2], hh = D ? ultraPrice(r[2], r[7]) : am ? r[5] : r[2];
      note = `Honorifics are not included. Each one is ${hh < wh ? cut(f(wh) + ' USD') + ' ' : ''}${f(hh)} USD.` + (!D && r[3] && !am ? ` Order ${r[3]}+ rounds for ${cut(f(r[1]) + ' USD')} ${f(r[4])} USD per round.` : '');
    } else if (s.t === 'hr') { const r = s.g[st.l]; wr = r[1]; rr = D ? ultraPrice(r[1], r[2]) : r[1]; }
    else { const r = s.g.find(x => st.q >= x[1] && st.q <= x[2]) || s.g[s.g.length - 1]; wr = r[3]; rr = D && r[4] ? ultraPrice(r[3], r[4]) : r[3]; }
    const cr = rr < wr;
    return {was: cr ? st.q * wr : 0, now: st.q * rr, det: `${cr ? cut(f(wr) + ' USD') + ' ' : ''}${f(rr)} USD per ${unit(s)}`, note};
  };
  const paint = () => {
    if (s.t === 'bot') return; const c = calc();
    $('#was', dlg).innerHTML = c.was ? cut(f(c.was) + ' USD') : ''; $('#tot', dlg).textContent = f(c.now) + ' USD';
    $('#det', dlg).innerHTML = c.det; $('#note', dlg).innerHTML = c.note;
  };
  paint();
  $('.x', dlg).onclick = closeWin;
  const orderForm = $('#order-form', dlg);
  const orderStatus = $('.order-status', orderForm);
  const orderSubmit = $('.order-submit', orderForm);
  const orderButton = $('.request-open', dlg);
  const contactMethod = $('#order-contact-method', orderForm);
  const contactInput = $('#order-contact', orderForm);
  const updateContact = () => {
    contactInput.type = contactMethod.value === 'Email' ? 'email' : 'text';
    contactInput.autocomplete = contactMethod.value === 'Email' ? 'email' : 'off';
    contactInput.placeholder = contactMethod.value === 'Telegram' ? '@username' : contactMethod.value === 'LINE' ? 'LINE ID or contact detail' : 'you@example.com';
  };
  contactMethod.onchange = updateContact;
  updateContact();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const timezoneInput = $('[name="timezone"]', orderForm);
  const preferredDateInput = $('[name="preferredDate"]', orderForm);
  const preferredTimeInput = $('[name="preferredTime"]', orderForm);
  const updateTimezone = () => {
    const selectedDate = preferredDateInput.value && new Date(`${preferredDateInput.value}T${preferredTimeInput.value || '12:00'}`);
    const instant = selectedDate && !Number.isNaN(selectedDate.getTime()) ? selectedDate : new Date();
    const zoneName = new Intl.DateTimeFormat('en-US', {timeZone, timeZoneName: 'longOffset'})
      .formatToParts(instant).find(part => part.type === 'timeZoneName').value;
    const offset = zoneName === 'GMT' ? 'UTC+0' : zoneName.replace(/^GMT/, 'UTC').replace(/:00$/, '').replace(/([+-])0(\d)/, '$1$2');
    timezoneInput.value = `${timeZone} (${offset})`;
  };
  preferredDateInput.addEventListener('input', updateTimezone);
  preferredTimeInput.addEventListener('input', updateTimezone);
  updateTimezone();
  orderButton.onclick = () => {
    orderForm.hidden = false;
    orderForm.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
    $('[name="customerName"]', orderForm).focus({preventScroll: true});
  };
  orderForm.onsubmit = e => {
    if (!ORDER_ENDPOINT) {
      e.preventDefault();
      orderStatus.textContent = 'Online requests are not connected yet. Please contact us through LINE or Telegram for now.';
      return;
    }
    const quote = s.t === 'bot' ? 'Custom pricing; confirm with seller' : `${f(calc().now)} USD estimated; final price to be confirmed`;
    const selection = s.t === 'bot' ? 'Custom pricing' : [
      s.t === 'bol' || s.t === 'hr' ? `League: ${s.g[st.l][0]}` : '',
      `${qty}: ${st.q}`
    ].filter(Boolean).join('; ');
    $('[name="service"]', orderForm).value = s.n;
    $('[name="selection"]', orderForm).value = selection;
    $('[name="estimate"]', orderForm).value = quote;
    orderStatus.textContent = 'Sending your request...';
    orderSubmit.disabled = true;
    window.clearTimeout(orderTimeout);
    orderTimeout = window.setTimeout(() => {
      if (!orderSubmit.disabled) return;
      orderStatus.textContent = 'We could not confirm submission. Please contact us directly before sending another request.';
      orderSubmit.disabled = false;
    }, 30000);
  };
  const seg = $('.seg', dlg);
  if (seg) seg.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', seg).forEach(x => x.setAttribute('aria-pressed', x === b));
    st.l = $$('button', seg).indexOf(b); paint();
  };
  const inp = $('.step input', dlg);
  if (inp) {
    const set = v => { st.q = Math.min(cap, Math.max(1, Math.floor(+v) || 1)); paint(); };
    inp.oninput = () => { if (inp.value !== '') set(inp.value); };
    inp.onchange = () => { set(inp.value); inp.value = st.q; };
    $('.step', dlg).onclick = e => { const b = e.target.closest('button'); if (!b) return; set(st.q + (b === e.currentTarget.lastElementChild ? 1 : -1)); inp.value = st.q; };
  }
  /* smooth dropdown for the price list */
  const det = $('details.all', dlg);
  if (det) {
    const dd = $('.dd', det); let an;
    $('summary', det).onclick = e => {
      e.preventDefault(); if (an) an.cancel();
      const open = !det.hasAttribute('data-open');
      det.toggleAttribute('data-open', open);
      if (open) det.open = true;
      const from = open ? 0 : dd.offsetHeight, to = open ? dd.scrollHeight : 0;
      an = dd.animate([{height: from + 'px', opacity: open ? 0 : 1}, {height: to + 'px', opacity: open ? 1 : 0}], {duration: reduce ? 0 : 450, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both'});
      const a2 = an; a2.onfinish = () => { if (!open) det.open = false; a2.cancel(); if (an === a2) an = null; };
    };
  }
  dlg.classList.remove('closing'); dlg.showModal(); dlg.scrollTop = 0;
}

/* payments */
const RECOMMENDED = ['Revolut']; /* names of payment methods that get the Recommended label */
const pay = (n, f2) => { const rec = RECOMMENDED.includes(n); return `<div class="rv${rec ? ' rec' : ''}">${rec ? '<em class="badge">Recommended</em>' : ''}<img src="assets/icons/${f2}.svg" alt="" width="40" height="40"><span>${n}</span></div>`; };
$('#pay-e').innerHTML = pay('PayPal', 'paypal') + pay('Revolut', 'revolut');
$('#pay-c').innerHTML = [['Bitcoin','btc'],['USDT','usdt'],['Solana','sol'],['Litecoin','ltc'],['Monero','xmr'],['Ethereum','eth'],['Tron','trx']].map(a => pay(...a)).join('');

/* scroll reveal: every box fades in on its own as it enters the viewport, staggered within a batch */
const io = new IntersectionObserver(es => {
  es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left).forEach((e, i) => {
    const el = e.target, d = Math.min(i, 5) * 90; io.unobserve(el);
    el.style.transitionDelay = d + 'ms';
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => { el.classList.remove('rv', 'in'); el.style.transitionDelay = ''; }, 1400 + d);
  });
}, {threshold: .2, rootMargin: '0px 0px -10% 0px'});
$$('.rv').forEach(el => io.observe(el));

/* nav with droplet indicator */
const track = $('.track'), as = $$('.track a'), b1 = $('.b1'), b2 = $('.b2');
let lock = 0, cur = null;
const place = a => {
  if (a === cur) return; cur = a;
  const l = a.offsetLeft, w = a.offsetWidth;
  [b1, b2].forEach(b => { b.style.left = l + 'px'; b.style.width = w + 'px'; });
  as.forEach(x => x.classList.toggle('on', x === a));
  track.scrollTo({left: l - (track.clientWidth - w) / 2, behavior: reduce ? 'auto' : 'smooth'});
};
as.forEach(a => a.addEventListener('click', () => { place(a); lock = Date.now() + 900; }));
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting && Date.now() > lock) place(as.find(a => a.hash === '#' + e.target.id));
}), {rootMargin: '-45% 0px -50% 0px'});
$$('main section').forEach(s => spy.observe(s));
b1.style.transition = b2.style.transition = 'none';
place(as[0]); requestAnimationFrame(() => requestAnimationFrame(() => { b1.style.transition = b2.style.transition = ''; }));
addEventListener('resize', () => { const a = cur; cur = null; b1.style.transition = b2.style.transition = 'none'; place(a); requestAnimationFrame(() => { b1.style.transition = b2.style.transition = ''; }); });

/* quiet background: slow drifting points with faint links */
const cv = $('#bg'), cx = cv.getContext('2d'); let W, H, P = [];
const size = () => {
  const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
  cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0);
  const n = Math.round(Math.min(70, W * H / 22000));
  P = Array.from({length: n}, () => ({x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .12, vy: (Math.random() - .5) * .12}));
};
const draw = () => {
  cx.clearRect(0, 0, W, H);
  for (const p of P) {
    p.x = (p.x + p.vx + W) % W; p.y = (p.y + p.vy + H) % H;
    cx.fillStyle = 'rgba(255,255,255,.28)'; cx.fillRect(p.x, p.y, 1.5, 1.5);
  }
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, d = Math.hypot(dx, dy);
    if (d < 150) { cx.strokeStyle = `rgba(255,255,255,${.07 * (1 - d / 150)})`; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(P[i].x, P[i].y); cx.lineTo(P[j].x, P[j].y); cx.stroke(); }
  }
  if (!reduce && !document.hidden) requestAnimationFrame(draw);
};
size(); draw();
addEventListener('resize', () => { size(); if (reduce) draw(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduce) requestAnimationFrame(draw); });
})();
