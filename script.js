// ── CONFIG ───────────────────────────────────────────────────────────────────
// Sign up free at https://formspree.io, create two forms, paste the IDs below.
// Example: 'https://formspree.io/f/abcd1234'
// Until then, forms automatically fall back to WhatsApp (+233 55 054 8806).
const QUOTE_ENDPOINT      = 'https://formspree.io/f/YOUR_QUOTE_FORM_ID';
const NEWSLETTER_ENDPOINT = 'https://formspree.io/f/YOUR_NEWSLETTER_FORM_ID';
const WHATSAPP_NUMBER     = '233550548806';
const endpointConfigured  = (url) => !url.includes('YOUR_');
// ─────────────────────────────────────────────────────────────────────────────

// ── MODAL ────────────────────────────────────────────────────────────────────
function openModal() {
  document.getElementById('quoteModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('quoteModal').classList.remove('open');
  document.body.style.overflow = '';
}
function closeModalOutside(e) {
  if (e.target === document.getElementById('quoteModal')) closeModal();
}

// ── MOBILE NAV ───────────────────────────────────────────────────────────────
function toggleMobileNav() {
  document.getElementById('mobileNav').classList.toggle('open');
}

// ── FAQ ──────────────────────────────────────────────────────────────────────
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const icon   = btn.querySelector('.faq-icon i');
  const isOpen = answer.classList.contains('open');
  document.querySelectorAll('.faq-a.open').forEach(a => {
    a.classList.remove('open');
    a.previousElementSibling.querySelector('.faq-icon i').className = 'fa-solid fa-plus';
  });
  if (!isOpen) {
    answer.classList.add('open');
    icon.className = 'fa-solid fa-minus';
  }
}

// ── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg, type) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast' + (type === 'error' ? ' error' : '');
  // double rAF ensures the transition fires after class is set
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 4500);
}

// ── VALIDATION ───────────────────────────────────────────────────────────────
function validateField(input) {
  const errId = input.id + '-err';
  let existing = document.getElementById(errId);

  const setError = (msg) => {
    input.classList.add('invalid');
    if (!existing) {
      existing = document.createElement('span');
      existing.id = errId;
      existing.className = 'field-error';
      input.parentNode.appendChild(existing);
    }
    existing.textContent = msg;
    return false;
  };
  const clearError = () => {
    input.classList.remove('invalid');
    if (existing) existing.textContent = '';
    return true;
  };

  if (input.required && !input.value.trim()) return setError('This field is required.');
  if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value))
    return setError('Enter a valid email address.');
  return clearError();
}

function validateForm(form) {
  const fields = form.querySelectorAll('input, select, textarea');
  let valid = true;
  fields.forEach(f => { if (!validateField(f)) valid = false; });
  return valid;
}

// ── FORM SUBMISSION ───────────────────────────────────────────────────────────
async function submitForm(endpoint, form, btn, successMsg) {
  const originalLabel = btn.dataset.label || btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Sending…';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      form.reset();
      form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
      form.querySelectorAll('.field-error').forEach(el => el.textContent = '');
      showToast(successMsg);
      return true;
    }

    const json = await res.json().catch(() => ({}));
    showToast(json.error || 'Something went wrong. Please try again.', 'error');
    return false;
  } catch {
    showToast('Network error — please check your connection and try again.', 'error');
    return false;
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

// ── QUOTE FORM ────────────────────────────────────────────────────────────────
document.getElementById('quoteForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!validateForm(this)) return;
  const btn = this.querySelector('[type=submit]');

  // No Formspree configured yet → send the quote via WhatsApp instead (works today)
  if (!endpointConfigured(QUOTE_ENDPOINT)) {
    const d = new FormData(this);
    const msg =
      'Hello Simanss Blocks, I would like a quote.\n' +
      'Name: ' + d.get('firstName') + ' ' + d.get('lastName') + '\n' +
      'Phone: ' + d.get('phone') + '\n' +
      'Email: ' + d.get('email') + '\n' +
      'Block type: ' + d.get('blockType') + '\n' +
      (d.get('quantity') ? 'Quantity: ' + d.get('quantity') + ' blocks\n' : '') +
      (d.get('town') ? 'Delivery town: ' + d.get('town') + '\n' : '') +
      (d.get('message') ? 'Details: ' + d.get('message') : '');
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
    showToast('Opening WhatsApp with your quote request…');
    this.reset();
    setTimeout(closeModal, 1500);
    return;
  }

  const ok = await submitForm(QUOTE_ENDPOINT, this, btn, "Quote request sent! We'll get back to you within 24 hours.");
  if (ok) setTimeout(closeModal, 1800);
});

// Live validation: clear errors as the user fixes them
document.getElementById('quoteForm').querySelectorAll('input, select, textarea').forEach(field => {
  field.addEventListener('blur', () => validateField(field));
  field.addEventListener('input', () => { if (field.classList.contains('invalid')) validateField(field); });
});

// ── NEWSLETTER FORM ───────────────────────────────────────────────────────────
document.getElementById('newsletterForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const emailInput = this.querySelector('input[type=email]');
  if (!validateField(emailInput)) return;
  const btn = this.querySelector('button[type=submit]');

  // No Formspree configured yet → open a pre-filled email instead
  if (!endpointConfigured(NEWSLETTER_ENDPOINT)) {
    window.location.href = 'mailto:simanssblocks@gmail.com?subject=' +
      encodeURIComponent('Newsletter signup') + '&body=' +
      encodeURIComponent('Please add me to the Simanss Blocks updates list: ' + emailInput.value);
    showToast('Opening your email app to confirm your subscription…');
    this.reset();
    return;
  }

  await submitForm(NEWSLETTER_ENDPOINT, this, btn, "You're subscribed! Welcome to the Simanss community.");
});

// ── BLOCK CALCULATOR ──────────────────────────────────────────────────────────
function calcBlocks() {
  const area = parseFloat(document.getElementById('calc-area').value);
  const perSqm = parseInt(document.getElementById('calc-size').value, 10);
  const result = document.getElementById('calcResult');
  if (isNaN(area) || area <= 0) {
    showToast('Enter a valid wall area in square metres.', 'error');
    result.hidden = true;
    return;
  }
  const blocks = Math.ceil(area * perSqm);
  const total  = blocks * 8;
  document.getElementById('calcBlocksNum').textContent = blocks.toLocaleString();
  document.getElementById('calcTotal').textContent = 'GH₵' + total.toLocaleString();
  const sizeText = perSqm === 11 ? '5-inch' : '6-inch';
  document.getElementById('calcWhatsApp').href =
    'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(
      'Hello Simanss Blocks, I estimate I need about ' + blocks.toLocaleString() +
      ' ' + sizeText + ' blocks (~GH₵' + total.toLocaleString() + '). Please advise on availability and delivery.');
  result.hidden = false;
}

// ── SCROLL REVEAL ─────────────────────────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
