<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>Sign In | {{ config('app.name', 'Laravel') }}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/login.css') }}">
</head>

<body data-on="false" class="is-booting">
    <script>
        // Restore the lamp before first paint so a failed login does not reset it.
        try { if (sessionStorage.getItem('lamp') === 'on') document.body.dataset.on = 'true'; } catch (e) {}
    </script>

    <div class="ambient-glow"></div>
    <canvas id="dustCanvas" aria-hidden="true"></canvas>

    <main class="stage">
        <section class="lamp-wrap">
            <button type="button" id="lamp" class="lamp" aria-pressed="false" aria-label="Toggle the lamp">
                <svg class="lamp-svg" viewBox="0 0 320 480" aria-hidden="true" focusable="false">
                    <defs>
                        <linearGradient id="coneFade" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="290">
                            <stop offset="0" stop-color="#ffd98f" stop-opacity=".62"/>
                            <stop offset=".55" stop-color="#f6a623" stop-opacity=".2"/>
                            <stop offset="1" stop-color="#f6a623" stop-opacity="0"/>
                        </linearGradient>
                        <linearGradient id="shadeFill" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stop-color="#34343d"/>
                            <stop offset="1" stop-color="#0e0e12"/>
                        </linearGradient>
                        <radialGradient id="bulbGlow">
                            <stop offset="0" stop-color="#fff1c9"/>
                            <stop offset=".35" stop-color="#ffc766" stop-opacity=".75"/>
                            <stop offset="1" stop-color="#f6a623" stop-opacity="0"/>
                        </radialGradient>
                        <radialGradient id="poolFill">
                            <stop offset="0" stop-color="#ffc766" stop-opacity=".55"/>
                            <stop offset="1" stop-color="#ffc766" stop-opacity="0"/>
                        </radialGradient>
                    </defs>

                    <!-- Light pool on the floor -->
                    <ellipse class="pool" cx="228" cy="440" rx="130" ry="20" fill="url(#poolFill)"/>

                    <!-- Base -->
                    <ellipse cx="120" cy="452" rx="88" ry="12" fill="rgba(0,0,0,.5)"/>
                    <ellipse cx="120" cy="440" rx="64" ry="13" fill="#131317"/>
                    <ellipse cx="120" cy="434" rx="64" ry="13" fill="#202027"/>

                    <!-- Arms -->
                    <g stroke-linecap="round" fill="none">
                        <line x1="120" y1="425" x2="84" y2="250" stroke="#17171c" stroke-width="10"/>
                        <line x1="118" y1="425" x2="82" y2="250" stroke="#2c2c34" stroke-width="3"/>
                        <line x1="84" y1="250" x2="146" y2="98" stroke="#17171c" stroke-width="10"/>
                        <line x1="82" y1="250" x2="144" y2="98" stroke="#2c2c34" stroke-width="3"/>
                    </g>
                    <circle cx="120" cy="425" r="10" fill="#c99a3b"/>
                    <circle cx="120" cy="425" r="4" fill="#6b4a0f"/>
                    <circle cx="84" cy="250" r="9" fill="#c99a3b"/>
                    <circle cx="84" cy="250" r="3.5" fill="#6b4a0f"/>

                    <!-- Shade, tilted. The light cone lives in the same group so it follows the tilt. -->
                    <g transform="translate(158 140) rotate(-14)">
                        <g id="coneHit">
                            <g class="cone">
                                <polygon points="-46,40 46,40 130,290 -130,290" fill="url(#coneFade)"/>
                                <polygon points="-22,40 22,40 52,290 -52,290" fill="url(#coneFade)" opacity=".7"/>
                            </g>
                        </g>

                        <path d="M -52 40 C -52 -28 -22 -50 0 -50 C 22 -50 52 -28 52 40 Z" fill="url(#shadeFill)"/>
                        <path d="M -44 30 C -44 -14 -26 -36 -8 -42" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="3" stroke-linecap="round"/>
                        <ellipse cx="0" cy="40" rx="52" ry="9" fill="#26262d"/>
                        <ellipse class="rim-lit" cx="0" cy="40" rx="45" ry="6.5" fill="#ffdc96"/>
                        <circle id="rimGlow" class="bulb-glow" cx="0" cy="44" r="30" fill="url(#bulbGlow)"/>
                    </g>
                    <circle cx="146" cy="98" r="8" fill="#c99a3b"/>
                    <circle cx="146" cy="98" r="3" fill="#6b4a0f"/>

                    <!-- Pull cord -->
                    <line class="cord-line" x1="130" y1="188" x2="130" y2="252" stroke="#c99a3b" stroke-width="2.5" stroke-linecap="round"/>
                    <circle class="cord-bead" cx="130" cy="259" r="8" fill="#e0ad45"/>
                </svg>
            </button>
            <p class="hint" id="hint">Pull the cord</p>
        </section>

        <section class="card" aria-labelledby="welcome-title">
            <h1 id="welcome-title">Welcome</h1>
            <p class="sub">Sign in to continue to your account</p>

            <div class="tabs">
                <span class="tab is-active" aria-current="page">Sign In</span>
                <a class="tab" href="{{ route('register') }}">Sign Up</a>
            </div>

            <form method="POST" action="{{ route('login') }}">
                @csrf

                <div class="field{{ $errors->has('email') ? ' has-error' : '' }}">
                    <label for="email">Email</label>
                    <div class="control">
                        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        <input id="email" type="email" name="email" value="{{ old('email') }}" autocomplete="username" required autofocus{{ $errors->has('email') ? ' aria-invalid=true aria-describedby=email-error' : '' }}>
                    </div>
                    @if ($errors->has('email'))
                        <p class="error" id="email-error" role="alert">{{ $errors->first('email') }}</p>
                    @endif
                </div>

                <div class="field{{ $errors->has('password') ? ' has-error' : '' }}">
                    <div class="label-row">
                        <label for="password">Password</label>
                        <a class="link" href="{{ route('password.request') }}">Forgot?</a>
                    </div>
                    <div class="control">
                        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <input id="password" type="password" name="password" autocomplete="current-password" required{{ $errors->has('password') ? ' aria-invalid=true aria-describedby=password-error' : '' }}>
                        <button type="button" class="reveal" id="reveal" aria-label="Show password" aria-pressed="false">
                            <svg class="eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            <svg class="eye-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><path d="m3 3 18 18"/></svg>
                        </button>
                    </div>
                    @if ($errors->has('password'))
                        <p class="error" id="password-error" role="alert">{{ $errors->first('password') }}</p>
                    @endif
                </div>

                <label class="check">
                    <input type="checkbox" name="remember" {{ old('remember') ? 'checked' : '' }}>
                    <span class="box" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg></span>
                    <span>Remember me</span>
                </label>

                <button type="submit" class="submit">
                    <span>Sign In</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
            </form>
        </section>
    </main>

    <script src="{{ asset('js/login.js') }}"></script>
</body>
</html>
