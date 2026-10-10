(function () {
  var API = 'https://ftwjthakbeuitorrlkzf.supabase.co/rest/v1/rpc/submit_member_application'
  var KEY = 'sb_publishable_DzVu1_EyoFnWQYfcPw0R4A_ZdNYOjno'
  var INTERESTS = ['Leadership', 'Public Speaking', 'Networking', 'Career Readiness', 'Simulations', 'Entrepreneurship', 'Healthcare', 'Business & Finance', 'Tech & Data', 'Media & Marketing', 'Education', 'Community Impact']
  var MAJORS = ['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communication & Media', 'Computer Science', 'Data Science', 'Economics', 'Education', 'English', 'Finance', 'Health Sciences', 'History', 'Management', 'Marketing', 'Mathematics', 'Nursing', 'Nutrition', 'Pharmacy', 'Philosophy', 'Political Science', 'Psychology', 'Public Health', 'Social Work', 'Sociology', 'Sport Management', 'Undeclared']
  var started = Date.now(), sending = false
  var form = document.getElementById('join-form'), err = document.getElementById('error'), btn = document.getElementById('submit')
  var EMAIL_OK = /^[a-z0-9._%+-]+@(my\.)?usj\.edu$/, NAME_BAD = /[0-9<>@\/\\:;{}=_*#$%^&|~"]/

  var chips = document.getElementById('chips')
  INTERESTS.forEach(function (name) {
    var l = document.createElement('label'); l.className = 'chip'
    var i = document.createElement('input'); i.type = 'checkbox'; i.name = 'interests'; i.value = name
    var s = document.createElement('span'); s.textContent = name
    l.appendChild(i); l.appendChild(s); chips.appendChild(l)
  })
  var dl = document.getElementById('majors')
  MAJORS.forEach(function (m) { var o = document.createElement('option'); o.value = m; dl.appendChild(o) })
  var gy = document.getElementById('grad-year'), y = new Date().getFullYear()
  for (var k = y; k <= y + 4; k++) { var o = document.createElement('option'); o.value = k; o.textContent = 'Class of ' + k; gy.appendChild(o) }

  var client = ''
  try { client = localStorage.getItem('usjlps-join-id') || ''; if (!client) { client = (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()); localStorage.setItem('usjlps-join-id', client) } } catch (e) {}

  var f = form.elements, hint = document.getElementById('email-hint'), pt = document.getElementById('prog-txt'), pb = document.getElementById('prog-bar'), mc = document.getElementById('msg-count')
  function clean(v) { return v.trim().replace(/\s+/g, ' ') }
  function progress() {
    var req = [!!clean(f.first_name.value), !!clean(f.last_name.value), EMAIL_OK.test(f.email.value.trim().toLowerCase()), f.eligible.checked]
    var extra = [!!f.major.value.trim(), !!f.grad_year.value, !!form.querySelector('input[name=interests]:checked')]
    var n = req.filter(Boolean).length * 2 + extra.filter(Boolean).length, pct = Math.round(n / 11 * 100)
    pt.textContent = pct + '%'; pb.style.width = pct + '%'
  }
  function emailHint() {
    var v = f.email.value.trim().toLowerCase()
    hint.className = 'hint'
    if (!v) { hint.textContent = 'Use your @my.usj.edu or @usj.edu address.'; return }
    if (EMAIL_OK.test(v)) { hint.className = 'hint ok'; hint.textContent = '✓ USJ email'; return }
    if (v.indexOf('@') > 0 && /@[^@]+\.[a-z]{2,}$/.test(v)) { hint.className = 'hint bad'; hint.textContent = 'Please use your USJ email, e.g. jsmith@my.usj.edu' }
    else hint.textContent = 'Use your @my.usj.edu or @usj.edu address.'
  }
  form.addEventListener('input', function (e) {
    if (e.target.removeAttribute) e.target.removeAttribute('aria-invalid')
    if (e.target.name === 'email') emailHint()
    if (e.target.name === 'message') mc.textContent = e.target.value.length
    progress()
  })
  form.addEventListener('change', progress)
  f.email.addEventListener('blur', function () { f.email.value = f.email.value.trim().toLowerCase(); emailHint() })

  function showError(msg, field) {
    err.textContent = msg; err.classList.remove('show'); void err.offsetWidth; err.classList.add('show')
    form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid') })
    if (field && f[field] && f[field].setAttribute) { f[field].setAttribute('aria-invalid', 'true'); try { f[field].focus({ preventScroll: true }) } catch (e) {} f[field].scrollIntoView({ block: 'center', behavior: 'smooth' }) }
    else err.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
  function busy(on) { sending = on; btn.disabled = on; btn.classList.toggle('busy', on); btn.querySelector('.lbl').textContent = on ? 'Sending…' : 'Send Application' }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault(); if (sending) return
    err.classList.remove('show')
    var first = clean(f.first_name.value), last = clean(f.last_name.value), email = f.email.value.trim().toLowerCase()
    if (!first) return showError('Please enter your first name.', 'first_name')
    if (!last) return showError('Please enter your last name.', 'last_name')
    if (NAME_BAD.test(first + last) || /https?|www\./i.test(first + ' ' + last) || !/\p{L}/u.test(first) || !/\p{L}/u.test(last)) return showError('Please enter a real first and last name (letters only).', 'first_name')
    if (!EMAIL_OK.test(email)) return showError('Please use your USJ email address (for example, jsmith@my.usj.edu).', 'email')
    if (!f.eligible.checked) return showError('Please confirm that you are a current USJ undergraduate student.', 'eligible')
    var interests = Array.prototype.slice.call(form.querySelectorAll('input[name=interests]:checked')).map(function (i) { return i.value })
    var body = {
      p_first_name: first, p_last_name: last, p_email: email,
      p_major: clean(f.major.value) || null, p_grad_year: f.grad_year.value ? parseInt(f.grad_year.value, 10) : null,
      p_interests: interests, p_heard_from: f.heard_from.value || null, p_message: f.message.value.trim() || null,
      p_client: client || null, p_website: f.website.value || null, p_elapsed_ms: Date.now() - started
    }
    busy(true)
    var ctl = window.AbortController ? new AbortController() : null, timer = setTimeout(function () { ctl && ctl.abort() }, 20000)
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: 'Bearer ' + KEY }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {} }).then(function (j) { return { ok: r.ok, j: j } }) })
      .then(function (res) {
        if (!res.ok) throw new Error((res.j && res.j.message) || 'Something went wrong. Please try again.')
        document.getElementById('done-name').textContent = first
        document.getElementById('done-email').textContent = email
        document.getElementById('form-view').hidden = true
        document.getElementById('done-view').hidden = false
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(function () { document.getElementById('done-title').focus({ preventScroll: true }) }, 400)
      })
      .catch(function (e) {
        var m = (e && e.message) || ''
        if ((e && e.name === 'AbortError') || /Failed to fetch|NetworkError|Load failed|network/i.test(m)) m = 'We could not reach the server. Check your internet connection and try again.'
        if (/function|schema|column|syntax|permission denied|aggregate/i.test(m)) m = 'Applications are temporarily unavailable. Please try again later or message us on Instagram @usjlps.'
        showError(m, /email/i.test(m) ? 'email' : /name/i.test(m) ? 'first_name' : /class year/i.test(m) ? 'grad_year' : null)
      })
      .then(function () { clearTimeout(timer); busy(false) })
  })
  emailHint(); progress()
})()
