(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const lerp = (a, b, n) => a + (b - a) * n;

  $("#year").textContent = new Date().getFullYear();
  if (reduce) root.classList.add("no-anim");

  /* ---------- Text prep: hero letters + split headings ---------- */
  const h1 = $("#hero-title");
  h1.setAttribute("aria-label", "Hi, I'm Samitinjay Tripathy");
  $$(".letters").forEach(el => {
    el.innerHTML = [...el.textContent].map(c => `<span class="ch" aria-hidden="true">${c}</span>`).join("");
  });

  $$(".section h2").forEach(h => {
    h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim());
    let i = 0;
    const wrap = node => {
      const w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
      const wi = document.createElement("span"); wi.className = "wi"; wi.style.setProperty("--i", i++);
      wi.appendChild(node); w.appendChild(wi); return w;
    };
    [...h.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(" ") : wrap(document.createTextNode(part)));
        });
        h.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== "BR") {
        const ph = document.createComment(""); h.replaceChild(ph, n); h.replaceChild(wrap(n), ph);
      }
    });
    h.classList.add("split");
  });

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    if (root.classList.contains("loading")) lenis.stop();
  }
  const scrollToHash = hash => {
    const t = hash === "#top" ? 0 : $(hash);
    if (t === null) return;
    if (lenis) lenis.scrollTo(t, { offset: t === 0 ? 0 : -80, duration: 1.4 });
    else (t === 0 ? window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }) : t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const h = a.getAttribute("href"); if (h.length < 2) return;
    e.preventDefault(); scrollToHash(h); history.replaceState(null, "", h === "#top" ? location.pathname : h);
  }));

  /* ---------- Nav ---------- */
  const nav = $(".nav"), burger = $("#burger"), links = $("#navLinks"), bar = $("#progress");
  const onScroll = () => {
    const y = window.scrollY, max = root.scrollHeight - innerHeight;
    nav.classList.toggle("scrolled", y > 30);
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  burger.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  $$("#navLinks a").forEach(a => a.addEventListener("click", () => {
    links.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Open menu");
  }));

  const navMap = new Map($$("#navLinks a").map(a => [a.getAttribute("href").slice(1), a]));
  const secObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    navMap.forEach(a => a.classList.remove("active"));
    const a = navMap.get(e.target.id); if (a && !a.classList.contains("nav-cta")) a.classList.add("active");
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach(s => secObs.observe(s));

  /* ---------- Scramble on nav hover ---------- */
  const glyphs = "!<>-_\\/[]{}—=+*^?#ABCDEFX01";
  $$("#navLinks a:not(.nav-cta)").forEach(a => {
    const txt = a.textContent; let raf;
    a.addEventListener("mouseenter", () => {
      if (reduce) return;
      let f = 0; cancelAnimationFrame(raf);
      const run = () => {
        a.textContent = [...txt].map((c, i) => (i < f / 2 ? c : glyphs[(Math.random() * glyphs.length) | 0])).join("");
        if (f++ < txt.length * 2) raf = requestAnimationFrame(run); else a.textContent = txt;
      };
      run();
    });
  });

  /* ---------- Reveals, split headings, counters (start after intro) ---------- */
  const startObservers = () => {
    const revObs = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); revObs.unobserve(e.target); }
    }), { threshold: 0.12 });
    $$(".reveal").forEach(el => {
      const sibs = $$(":scope > .reveal", el.parentElement);
      el.style.setProperty("--d", `${Math.min(sibs.indexOf(el), 6) * 0.08}s`);
      revObs.observe(el);
    });
    $$(".split").forEach(h => revObs.observe(h));

    const countObs = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || "";
      countObs.unobserve(el);
      if (reduce) { el.textContent = end + suf; return; }
      const t0 = performance.now(), dur = 1600;
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.6 });
    $$("[data-count]").forEach(el => countObs.observe(el));
  };

  /* ---------- Typewriter ---------- */
  const startTyping = () => {
    const roles = ["Web Developer", "UI/UX Designer", "IoT Builder", "SaaS Enthusiast", "Problem Solver"];
    const typed = $("#typed"); if (reduce || !typed) return;
    let r = 0, i = roles[0].length, del = true;
    const step = () => {
      const word = roles[r];
      if (del) { i--; if (i === 0) { del = false; r = (r + 1) % roles.length; } }
      else { i++; if (i === roles[r].length) { del = true; typed.textContent = roles[r]; return setTimeout(step, 1900); } }
      typed.textContent = (del ? word : roles[r]).slice(0, i);
      setTimeout(step, del ? 40 : 80);
    };
    setTimeout(step, 2400);
  };

  /* ---------- Intro / preloader ---------- */
  const beginIntro = () => {
    root.classList.add("intro-done");
    startObservers(); startTyping();
  };
  if (root.classList.contains("loading")) {
    const count = $("#plCount"), plBar = $("#plBar"), pre = $(".preloader");
    let loaded = document.readyState === "complete";
    addEventListener("load", () => (loaded = true));
    const t0 = performance.now(), min = 1100;
    const tick = t => {
      const raw = Math.min((t - t0) / min, 1), p = loaded ? raw : Math.min(raw, 0.9);
      const v = Math.round((1 - Math.pow(1 - p, 3)) * 100);
      count.textContent = String(v).padStart(3, "0"); plBar.style.width = v + "%";
      if (v < 100) return requestAnimationFrame(tick);
      try { sessionStorage.setItem("st-intro", "1"); } catch (e) {}
      setTimeout(() => {
        pre.classList.add("done");
        setTimeout(beginIntro, 350);
        setTimeout(() => { root.classList.remove("loading"); lenis && lenis.start(); }, 1050);
      }, 180);
    };
    requestAnimationFrame(tick);
  } else {
    requestAnimationFrame(beginIntro);
  }

  /* ---------- WebGL aurora background ---------- */
  const canvas = $("#gl");
  const mouse = { x: 0.7, y: 0.6, tx: 0.7, ty: 0.6 };
  const startGL = () => {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (gl) {
    const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const fs = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec2 m;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 R=mat2(.8,.6,-.6,.8);for(int i=0;i<5;i++){v+=a*n(p);p=R*p*2.02;a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r;float as=r.x/r.y;vec2 p=uv;p.x*=as;
  vec2 mm=m;mm.x*=as;float md=exp(-3.*length(p-mm));
  float tt=t*.05;
  vec2 q=vec2(fbm(p*1.5+tt),fbm(p*1.5+vec2(5.2,1.3)-tt));
  vec2 w=vec2(fbm(p*1.3+2.2*q+vec2(1.7,9.2)+md*.5+tt*.6),fbm(p*1.3+2.2*q+vec2(8.3,2.8)-tt*.4));
  float f=fbm(p*1.1+2.4*w);
  vec3 col=vec3(.027,.027,.047);
  col=mix(col,vec3(.36,.22,.85),smoothstep(.38,.9,f)*.8);
  col=mix(col,vec3(.07,.62,.78),smoothstep(.5,.95,w.x)*.5);
  col=mix(col,vec3(.70,.98,.22),clamp(smoothstep(.62,.95,f*w.y*1.7)*.32+md*.07,0.,1.));
  col*=mix(.32,1.,smoothstep(.05,.85,uv.x));
  col*=smoothstep(0.,.35,uv.y)*.85+.15;
  col+=(h(gl_FragCoord.xy+t)-.5)*.025;
  gl_FragColor=vec4(col,1.);
}`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    const prog = v && f && gl.createProgram();
    if (prog) {
      gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    }
    if (prog && gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const uR = gl.getUniformLocation(prog, "r"), uT = gl.getUniformLocation(prog, "t"), uM = gl.getUniformLocation(prog, "m");
      const scale = 0.5;
      const resize = () => {
        const w = Math.max(1, Math.floor(canvas.clientWidth * scale)), h = Math.max(1, Math.floor(canvas.clientHeight * scale));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      };
      let visible = true, raf = 0; const t0 = performance.now();
      const frame = now => {
        resize();
        mouse.x = lerp(mouse.x, mouse.tx, 0.04); mouse.y = lerp(mouse.y, mouse.ty, 0.04);
        gl.uniform2f(uR, canvas.width, canvas.height);
        gl.uniform1f(uT, (now - t0) / 1000);
        gl.uniform2f(uM, mouse.x, mouse.y);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
      };
      const kick = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
      new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); }).observe(canvas);
      document.addEventListener("visibilitychange", kick);
      root.classList.add("webgl");
      kick();
    }
  }
  };
  // Desktop only: phones keep the lightweight CSS glow (saves battery + main-thread time)
  if (!reduce && finePointer && innerWidth > 820) {
    const idle = window.requestIdleCallback || (cb => setTimeout(cb, 200));
    const go = () => idle(startGL, { timeout: 1500 });
    document.readyState === "complete" ? go() : addEventListener("load", go);
  }

  /* ---------- Lenis RAF ---------- */
  if (lenis) { const loop = t => { lenis.raf(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }

  if (reduce || !finePointer) return;

  /* ---------- Pointer-driven effects (desktop only) ---------- */
  root.classList.add("has-cursor");
  const dot = $(".cursor-dot"), ring = $(".cursor-ring"), ringLabel = $(".cursor-ring span"), glow = $(".cursor-glow");
  const photo = $(".photo-ring"), hero = $(".hero");
  let px = innerWidth / 2, py = innerHeight / 2, rx = px, ry = py, gx = px, gy = py;
  $(".photo-frame").dataset.cursor = "Hi! 👋";
  $$(".project").forEach(p => (p.dataset.cursor = "Explore"));

  addEventListener("pointermove", e => {
    px = e.clientX; py = e.clientY;
    const hr = hero.getBoundingClientRect();
    mouse.tx = (px - hr.left) / hr.width; mouse.ty = 1 - (py - hr.top) / hr.height;
  }, { passive: true });
  addEventListener("pointerdown", () => ring.classList.add("down"));
  addEventListener("pointerup", () => ring.classList.remove("down"));
  document.addEventListener("pointerover", e => {
    const lab = e.target.closest("[data-cursor]");
    const hov = e.target.closest("a, button, .chips li, .card");
    ring.classList.toggle("label", !!lab);
    ringLabel.textContent = lab ? lab.dataset.cursor : "";
    ring.classList.toggle("hover", !lab && !!hov);
  });
  document.addEventListener("pointerleave", () => { dot.style.opacity = ring.style.opacity = 0; });
  document.addEventListener("pointerenter", () => { dot.style.opacity = ring.style.opacity = 1; });

  (function loop() {
    rx = lerp(rx, px, 0.18); ry = lerp(ry, py, 0.18); gx = lerp(gx, px, 0.08); gy = lerp(gy, py, 0.08);
    dot.style.transform = `translate(${px}px, ${py}px)`;
    ring.style.transform = `translate(${rx}px, ${ry}px)${ring.classList.contains("down") ? " scale(.8)" : ""}`;
    glow.style.transform = `translate(${gx - 260}px, ${gy - 260}px)`;
    if (photo && window.scrollY < innerHeight) {
      const dx = px / innerWidth - 0.5, dy = py / innerHeight - 0.5;
      photo.style.transform = `perspective(900px) translate(${dx * -22}px, ${dy * -18}px) rotateX(${dy * 6}deg) rotateY(${dx * -6}deg)`;
    }
    requestAnimationFrame(loop);
  })();

  // Magnetic buttons
  $$(".btn, .logo, .burger, .nav-cta").forEach(el => {
    el.classList.add("magnetic");
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      el.style.transition = "transform .15s ease-out";
      el.style.transform = `translate(${x * 0.3}px, ${y * 0.4}px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transition = "transform .7s cubic-bezier(.2,1.6,.4,1)";
      el.style.transform = "";
    });
  });

  // Card spotlight + tilt
  $$(".card, .project").forEach(card => {
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty("--mx", `${x}px`); card.style.setProperty("--my", `${y}px`);
      if (card.classList.contains("tilt")) {
        const tx = ((y / r.height) - 0.5) * -7, ty = ((x / r.width) - 0.5) * 7;
        card.style.transform = `perspective(900px) rotateX(${tx}deg) rotateY(${ty}deg) translateY(-4px)`;
      }
    });
    card.addEventListener("pointerleave", () => { if (card.classList.contains("tilt")) card.style.transform = ""; });
  });
})();
