// ── CONFIG ───────────────────────────────────────────────────────────────────
// Sign up free at https://formspree.io, create two forms, paste the IDs below.
// Example: 'https://formspree.io/f/abcd1234'
const QUOTE_ENDPOINT      = 'https://formspree.io/f/YOUR_QUOTE_FORM_ID';
const NEWSLETTER_ENDPOINT = 'https://formspree.io/f/YOUR_NEWSLETTER_FORM_ID';
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
  const ok  = await submitForm(QUOTE_ENDPOINT, this, btn, "Quote request sent! We'll get back to you within 24 hours.");
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
  await submitForm(NEWSLETTER_ENDPOINT, this, btn, "You're subscribed! Welcome to the Simanss community.");
});

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
