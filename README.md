# Portfolio — Jace Griffith

Source for my portfolio site. Agentic AI and automation engineer with an AI and agent
security background; active Secret clearance; U.S. Navy veteran.

**Live:** [cyber-griffith.github.io](https://cyber-griffith.github.io/)

---

## The idea

The site is a game. The first screen is a title screen, and under it is **the block**:
a pixel-art neon street at night that you skate along. Every building is a part of the
site.

| Place | Leads to |
| --- | --- |
| The Dock | Story mode |
| Agent Lab | Defend the agent (a mini-game) |
| Workshop | The loadout |
| Boss Arena | Three public projects, each with its weak spot |
| Trophy Hall | Certifications |
| The Stage, The Bowl, Arcade | Off the clock: music, sports, gaming |
| Player 2 | Contact |

Click the street to skate there, drag to look around, arrow keys to ride, Enter to go in.

## Defend the agent

Requests and attacks ride a track through three defenses to an AI agent. Run the cursor
over an attack to eat it, or switch a defense on. The odds on each defense are real
measurements from my public projects:
[Prompt Shield](https://github.com/cyber-griffith/prompt-shield) for the rules and the
judge, and the [red-team attack log](https://github.com/cyber-griffith/red-team-simulator)
for the guardrails.

## Things to find

Eight achievements, eight gems scattered down the page, an XP bar, and a cheat code.
The cursor is a pixel pointer with a bot that tags along; it can be switched off in the
achievements menu.

## Adding sports and genres

Everything in "Off the clock" comes from **`me.js`**. Add a line, save, commit and push:

```js
sports: [ "Basketball", "Hockey", "Lacrosse", ],
genres: [ { name: "Dubstep", feel: "bass" }, ],
```

`feel` sets how the equaliser moves: `heavy`, `bass`, `bounce`, `chill` or `wild`.

## Build

No build step, no framework, no dependencies, no image assets beyond the profile photo,
and no third-party requests.

```text
index.html      structure and content
styles.css      theme, layout, motion
me.js           the lists you can edit (sports, genres)
pix.js          hand-drawn pixel lettering and icons
world.js        the block: the street, its buildings and the skater
app.js          the game, loadout, achievements, XP, cursor, attack grid
field-data.js   1,824 attack outcomes, generated from the public attack log
fonts/          Bricolage Grotesque, Archivo, IBM Plex Mono
```

Run it locally with any static server:

```bash
python -m http.server 8000
```

## Quality floor

- Reads top to bottom with JavaScript disabled; the list under the street links to
  every part
- Responsive to 360px with no horizontal page scroll
- Keyboard focus on every control, arrow keys in the selector groups, a skip link
- `prefers-reduced-motion` respected: the street, game and equaliser hold still

## Contact

- [cybergriffith@gmail.com](mailto:cybergriffith@gmail.com)
- [LinkedIn](https://www.linkedin.com/in/jace-griffith-jg11/)
- [Credly](https://www.credly.com/users/joyelle-griffith)
