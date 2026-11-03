(function () {
    'use strict';

    const body = document.body;
    const lamp = document.getElementById('lamp');
    const canvas = document.getElementById('dustCanvas');
    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const isOn = () => body.dataset.on === 'true';

    // ---------- Lamp ----------

    function syncLamp() {
        lamp.setAttribute('aria-pressed', String(isOn()));
        if (reducedMotion.matches) drawStill();
    }

    function toggle() {
        body.dataset.on = isOn() ? 'false' : 'true';
        body.classList.add('has-toggled');
        try { sessionStorage.setItem('lamp', isOn() ? 'on' : 'off'); } catch (e) {}
        try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
        syncLamp();
    }

    // ---------- Pull cord ----------

    const cordHit = document.getElementById('cordHit');
    const lampSvg = lamp.querySelector('svg');
    const SVG_WIDTH = 320;   // viewBox width, to convert screen px to SVG units
    const PULL_MAX = 46;     // the cord never stretches past this
    const PULL_TRIGGER = 24; // pulled this far, the switch clicks

    let pull = 0;
    let pullVel = 0;
    let springId = 0;
    let drag = null;

    function setPull(v) {
        pull = v;
        lampSvg.style.setProperty('--pull', v.toFixed(2));
    }

    // Damped spring back to rest. A non-zero v0 gives the cord a kick (taps, keyboard).
    function release(v0) {
        cancelAnimationFrame(springId);
        pullVel = v0;
        if (reducedMotion.matches) {
            setPull(0);
            pullVel = 0;
            return;
        }

        let prev = performance.now();
        const step = (now) => {
            const dt = Math.min((now - prev) / 1000, 1 / 30);
            prev = now;
            pullVel += (-220 * pull - 11 * pullVel) * dt;
            setPull(pull + pullVel * dt);

            if (Math.abs(pull) < 0.05 && Math.abs(pullVel) < 0.5) {
                setPull(0);
                return;
            }
            springId = requestAnimationFrame(step);
        };
        springId = requestAnimationFrame(step);
    }

    cordHit.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        cancelAnimationFrame(springId);
        cordHit.setPointerCapture(e.pointerId);

        drag = {
            id: e.pointerId,
            y0: e.clientY,
            scale: lampSvg.getBoundingClientRect().width / SVG_WIDTH,
            from: pull,
            moved: 0,
            fired: false,
        };
        body.classList.add('is-dragging');
    });

    cordHit.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) return;

        const dy = e.clientY - drag.y0;
        drag.moved = Math.max(drag.moved, Math.abs(dy));

        // Rubber band: follows the pointer closely at first, then resists. Little give upwards.
        const raw = drag.from + dy / drag.scale;
        setPull(raw <= 0 ? raw * 0.2 : PULL_MAX * Math.tanh(raw / PULL_MAX));

        if (!drag.fired && pull >= PULL_TRIGGER) {
            drag.fired = true;
            toggle();
        }
    });

    function endDrag(e) {
        if (!drag || e.pointerId !== drag.id) return;
        const wasTap = e.type === 'pointerup' && !drag.fired && drag.moved < 5;
        drag = null;
        body.classList.remove('is-dragging');

        if (wasTap) toggle();
        release(wasTap ? 400 : 0);
    }

    cordHit.addEventListener('pointerup', endDrag);
    cordHit.addEventListener('pointercancel', endDrag);

    // Pointer events still fire after this, but the page will not scroll under the finger.
    cordHit.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

    // Keyboard and assistive tech activate the button with detail 0. Real clicks
    // (detail > 0) are handled by the cord above, so clicking the lamp body does nothing.
    lamp.addEventListener('click', (e) => {
        if (e.detail !== 0) return;
        toggle();
        release(400);
    });

    // One small nudge while the lamp is still off, so people notice the cord moves.
    setTimeout(() => {
        if (!isOn() && !drag && !body.classList.contains('has-toggled') && !reducedMotion.matches) release(220);
    }, 1400);

    // ---------- Password reveal ----------

    const reveal = document.getElementById('reveal');
    const password = document.getElementById('password');

    reveal.addEventListener('click', () => {
        const show = password.type === 'password';
        password.type = show ? 'text' : 'password';
        reveal.setAttribute('aria-pressed', String(show));
        reveal.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });

    // ---------- Light cone geometry (page coordinates) ----------

    // Same points as the polygon in the SVG, in the shade's local space.
    const coneLocal = [[-46, 40], [46, 40], [130, 290], [-130, 290]];
    let cone = [];

    function measure() {
        const hit = document.getElementById('coneHit');
        const m = hit.getScreenCTM();
        if (!m) return;

        cone = coneLocal.map(([x, y]) => ({
            x: m.a * x + m.c * y + m.e,
            y: m.b * x + m.d * y + m.f,
        }));

        const rim = document.getElementById('rimGlow').getBoundingClientRect();
        const root = document.documentElement.style;
        root.setProperty('--lx', (rim.left + rim.width / 2) + 'px');
        root.setProperty('--ly', (rim.top + rim.height / 2) + 'px');
    }

    // The quad is convex, so one sign test per edge is enough.
    function inCone(x, y) {
        if (cone.length < 4) return false;
        let sign = 0;
        for (let i = 0; i < 4; i++) {
            const a = cone[i];
            const b = cone[(i + 1) % 4];
            const cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
            if (cross === 0) continue;
            if (sign === 0) sign = Math.sign(cross);
            else if (Math.sign(cross) !== sign) return false;
        }
        return true;
    }

    // ---------- Dust ----------

    const TAU = Math.PI * 2;
    let w = 0;
    let h = 0;
    let particles = [];
    let power = isOn() ? 1 : 0; // eased 0..1, follows the lamp
    let last = 0;
    let rafId = 0;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.round(Math.min(110, Math.max(45, (w * h) / 14000)));
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 0.5 + Math.random() * 1.4,
            vx: (Math.random() - 0.5) * 0.14,
            vy: -0.02 - Math.random() * 0.1,
            ph: Math.random() * TAU,
            tw: 0.6 + Math.random() * 1.4,
            depth: Math.random(),
        }));

        measure();
        if (reducedMotion.matches) drawStill();
    }

    function draw(t) {
        ctx.clearRect(0, 0, w, h);

        for (const p of particles) {
            const twinkle = 0.6 + 0.4 * Math.sin(t * 0.001 * p.tw + p.ph);
            const lit = inCone(p.x, p.y);
            const base = 0.1 + 0.2 * p.depth;
            const gain = 0.06 + power * (lit ? 2.6 : 0.5);
            const alpha = Math.min(0.9, base * twinkle * gain);
            if (alpha < 0.01) continue;

            ctx.fillStyle = 'rgba(255, 214, 140, ' + alpha + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, TAU);
            ctx.fill();

            if (lit && power > 0.2 && p.r > 1) {
                ctx.fillStyle = 'rgba(255, 190, 90, ' + alpha * 0.22 + ')';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * 3, 0, TAU);
                ctx.fill();
            }
        }
    }

    function drawStill() {
        power = isOn() ? 1 : 0;
        draw(0);
    }

    function frame(now) {
        const dt = Math.min(now - last, 64);
        last = now;

        power += ((isOn() ? 1 : 0) - power) * (1 - Math.exp(-dt / 260));

        const step = dt / 16.67;
        for (const p of particles) {
            p.x += p.vx * step * (0.5 + p.depth);
            p.y += p.vy * step * (0.5 + p.depth);
            if (p.x < -4) p.x = w + 4;
            else if (p.x > w + 4) p.x = -4;
            if (p.y < -4) p.y = h + 4;
        }

        draw(now);
        rafId = requestAnimationFrame(frame);
    }

    function start() {
        cancelAnimationFrame(rafId);
        if (reducedMotion.matches) {
            drawStill();
            return;
        }
        last = performance.now();
        rafId = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', measure, { passive: true });
    reducedMotion.addEventListener('change', start);

    resize();
    syncLamp();
    start();

    // Let the restored state paint first, then allow transitions.
    requestAnimationFrame(() => requestAnimationFrame(() => body.classList.remove('is-booting')));
})();
