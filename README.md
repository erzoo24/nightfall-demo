# Nightfall — Stargazing Planner Demo

An iPhone-style web app that tells you when and where to see the stars tonight.
Designed after Apple's Human Interface Guidelines: large titles, glass materials, sheets and a tab bar.
Installs on the home screen and works offline (Progressive Web App).

**Live demo:** https://erzoo24.github.io/nightfall-demo/ — open it on your phone and choose "Add to Home Screen".

- Tonight: sky score, best viewing window, darkness timeline, Moon phase and visible planets
- Week: seven nights at a glance
- Places: compare dark-sky spots

Sun, Moon and planet positions are calculated with [astronomy-engine](https://github.com/cosinekitty/astronomy).
The cloud forecast is simulated in this demo.

Built with React, TypeScript, Vite and Tailwind CSS, tested with Vitest.

```bash
npm install
npm test
npm run dev
```
