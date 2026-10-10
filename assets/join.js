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
;
// connection network: members of every major linking up (same motif as the society dial)
(function () {
  var cv = document.getElementById('net'); if (!cv) return
  var host = cv.parentElement, ctx = cv.getContext('2d'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  var LABELS = ['Nursing', 'Business', 'Psychology', 'Biology', 'Education', 'Computer Science', 'Social Work', 'Public Health', 'Chemistry', 'Communication', 'Accounting', 'Health Sciences']
  var W, H, dpr, nodes = [], pulses = [], boxes = [], fr = 0, mouse = { x: -9999, y: -9999 }, raf, vis = true, R = 165
  function init() {
    dpr = Math.min(2, devicePixelRatio || 1); W = host.clientWidth; H = host.clientHeight
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    var mob = W < 700, n = Math.min(130, Math.max(40, Math.round(W * H / (mob ? 11000 : 14000)))); nodes = []
    for (var i = 0; i < n; i++) {
      var lab = i < LABELS.length && (!mob || i < 6) ? LABELS[i] : null
      nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: lab ? 2.4 : Math.random() * 1.2 + .6, lab: lab, ph: Math.random() * 6.28 })
    }
    R = mob ? 120 : 165
  }
  function measure() {
    var hr = host.getBoundingClientRect(); boxes = []
    document.querySelectorAll('.intro h1, .intro .lead, .intro .eyebrow, .facts, .incl h5, .incl p, .incl i, .steps, .card').forEach(function (el) { var b = el.getBoundingClientRect(); if (b.width) boxes.push([b.left - hr.left - 14, b.top - hr.top - 10, b.right - hr.left + 14, b.bottom - hr.top + 10]) })
  }
  function covered(x, y) { for (var i = 0; i < boxes.length; i++) { var b = boxes[i]; if (x > b[0] && x < b[2] && y > b[1] && y < b[3]) return true } return false }
  function draw(t) {
    if (fr++ % 20 === 0) measure()
    ctx.clearRect(0, 0, W, H)
    var i, j, a, b, d
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i]
      if (!reduce) { a.x += a.vx; a.y += a.vy; if (a.x < -30) a.x = W + 30; if (a.x > W + 30) a.x = -30; if (a.y < -30) a.y = H + 30; if (a.y > H + 30) a.y = -30 }
      var mx = mouse.x - a.x, my = mouse.y - a.y, md = Math.hypot(mx, my); if (md < 220) { a.x += mx * .0018; a.y += my * .0018 }
    }
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i]
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j]; d = Math.hypot(a.x - b.x, a.y - b.y)
        if (d < R) {
          var k = 1 - d / R, hot = a.lab || b.lab
          ctx.strokeStyle = 'rgba(201,165,76,' + (k * (hot ? .55 : .34)) + ')'; ctx.lineWidth = hot ? .9 : .7
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
          if (!reduce && hot && k > .35 && Math.random() < .004 && pulses.length < 28) pulses.push({ a: a, b: b, p: 0 })
        }
      }
      var dm = Math.hypot(a.x - mouse.x, a.y - mouse.y)
      if (dm < 220) { ctx.strokeStyle = 'rgba(240,220,160,' + ((1 - dm / 220) * .6) + ')'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke() }
    }
    // light travelling along a connection
    for (i = pulses.length - 1; i >= 0; i--) {
      var q = pulses[i]; q.p += .012
      if (q.p >= 1 || Math.hypot(q.a.x - q.b.x, q.a.y - q.b.y) > R) { pulses.splice(i, 1); continue }
      var px = q.a.x + (q.b.x - q.a.x) * q.p, py = q.a.y + (q.b.y - q.a.y) * q.p
      var g = ctx.createRadialGradient(px, py, 0, px, py, 9); g.addColorStop(0, 'rgba(255,240,195,.95)'); g.addColorStop(1, 'rgba(201,165,76,0)')
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 9, 0, 6.283); ctx.fill()
    }
    ctx.textAlign = 'left'
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i]; var tw = a.lab ? .8 + .2 * Math.sin(t / 700 + a.ph) : .75
      if (a.lab) { var gg = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 16); gg.addColorStop(0, 'rgba(201,165,76,' + (.5 * tw) + ')'); gg.addColorStop(1, 'rgba(201,165,76,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(a.x, a.y, 16, 0, 6.283); ctx.fill() }
      ctx.fillStyle = 'rgba(240,222,168,' + tw + ')'; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill()
      if (a.lab && !covered(a.x, a.y) && !covered(a.x + 120, a.y)) { ctx.font = '500 10px Inter, sans-serif'; ctx.letterSpacing = '2.5px'; ctx.fillStyle = 'rgba(233,212,154,' + (.75 * tw) + ')'; ctx.fillText(a.lab.toUpperCase(), a.x + 9, a.y + 3.5); ctx.letterSpacing = '0px' }
    }
    if (!reduce && vis) raf = requestAnimationFrame(draw)
  }
  init(); requestAnimationFrame(function (t) { draw(t); cv.classList.add('on') })
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { init(); if (reduce) draw(0) }, 150) })
  addEventListener('mousemove', function (e) { var r = host.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top })
  document.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999 })
  if (window.ResizeObserver) new ResizeObserver(function () { if (Math.abs(host.clientHeight - H) > 40) init() }).observe(host)
  new IntersectionObserver(function (en) { vis = en[0].isIntersecting; cancelAnimationFrame(raf); if (vis && !reduce) raf = requestAnimationFrame(draw) }).observe(host)
})();
