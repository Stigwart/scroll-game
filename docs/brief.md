# Game Brief: Scroll Game (working title)

*Status: Draft v0.2 · Updated 3 November 2026 · Owner: Stuart*
*Source: design interview with Claude. Decisions below are Stuart's own; anything not yet decided is listed under [Open questions](#10-open-questions).*

---

## 1. One-line pitch

A one-thumb neon arcade game where you drag a target around the screen to keep a drifting ball balanced in its centre, surviving as long as you can while the world tries to knock it off. Every run earns progress towards new abilities and collectable balls.

## 2. Origin and intent

- Dreamed up by Stuart and his daughter.
- A reaction against mobile games that are overcomplicated, with too many interaction patterns. **The core interaction is one gesture: drag your thumb.**
- **Works fully offline.**
- Made for short sessions of one to five minutes, for example on a train, but with reasons to keep coming back.

## 3. Design pillars

| Pillar | What it means in practice |
|---|---|
| **One simple gesture** | Dragging is the whole game. Anything extra (power-up buttons, tilt mode) must stay optional and secondary. |
| **Relaxing, but a challenge** | Easy to start, hard to master. Losing should feel fair, never frustrating. |
| **Always building up** | Every run, however short, earns something. You get progress within a run and between runs. |
| **Visually striking** | Energetic arcade look: dark backgrounds, neon / cyberpunk colours, interesting shapes. |
| **Quick to pick up** | A meaningful run fits into 1–5 minutes. Leaving mid-run never loses your earnings. |

## 4. Genre and positioning

- **Genre:** arcade roguelite with incremental (permanent) upgrades. It is a hands-on game, **not an idle game**: nothing is earned while the app is closed.
- **Audience:** teens and adults; children are not the target audience. Casual players with a few spare minutes.
- **Market gap (from a brief scan, see §11):** some small, simple balance-the-ball games exist, such as *Follow the Line*, *Balancer* and tilt-based *Balance the Ball*. None of the ones found combine the balancing mechanic with roguelite meta-progression and a strong visual identity. A deeper market scan is recommended before investing heavily.

## 5. Core gameplay

### 5.1 The three layers

1. **The ball.** It starts in the top half of the screen. A gentle general **upward force** keeps it away from the player's thumb.
2. **The target.** A ring the player drags around with one finger. The aim is to keep the ball in its centre.
3. **The background.** A procedurally generated world that drifts in random directions underneath. It carries objects (walls, shapes) that move across the screen and **push the ball**, so the player has to steer around them.

### 5.2 Forces acting on the ball

| Force | Behaviour |
|---|---|
| **Away from target centre** | A small balanced "sweet spot" sits in the middle of the target. Outside it, the ball is pushed away from the centre, and the push gets stronger the further out it is. This is an unstable balance, like a ball on a hilltop. |
| **Towards screen middle** | A gentle pull back towards the middle of the screen. |
| **Upward bias** | Keeps the ball in the upper area, clear of the thumb. |
| **Random drift** | A random velocity that changes constantly. |
| **Obstacle pushes** | Background objects shove the ball on contact. |

> **Note:** the exact strength and balance of these forces is deliberately unfixed. They will be tuned in playtesting, so the prototype includes on-screen tuning sliders (see §8).

### 5.3 Health and failure

- The ball has **health**, which is linked to precision:
  - In the sweet spot, it loses **no health**.
  - Further from the target centre, it loses **health faster**.
  - Touching the **screen edge**, it loses health **much faster**.
- The run ends when health reaches zero.

### 5.4 Score

- **Score = time survived.**

### 5.5 Escalation within a run

As the run goes on:
- Destabilising forces get **stronger** and drift gets **faster**.
- Hazards appear **more often** and get **bigger**.
- Backgrounds **transition** through stages that feel increasingly intense and intimidating.
- No in-run pickups, for now.

### 5.6 Controls

- **Default:** drag the target with one thumb.
- **Optional setting: tilt mode.** Move the phone to move the target. This frees a thumb for power-up buttons.
- **Power-up buttons:** small buttons on the left edge of the screen, used with the other thumb. *(Accessibility note: offer a left-handed option that mirrors them to the right.)*

### 5.7 Leaving mid-run

- If a player has to stop mid-run, they **keep everything earned so far** in that run.
- The next time they open the game, a message confirms that the earnings from the interrupted run were banked.

## 6. Progression

### 6.1 Currency

- Time survived converts into **currency**, which is earned during the run and banked at the end or on exit.
- Currency is spent **between runs**.

### 6.2 Power-ups

- **Unlocked** permanently with currency, then **recharged during a run** (cooldown-based).
- Activated with the left-edge buttons.
- Initial ideas:
  - **Recentre:** teleport the ball back to the centre of the target.
  - **Bigger sweet spot:** temporarily enlarges the balanced zone.
  - **Jump:** hop the ball over an incoming obstacle.
  - Also mentioned: **reduce the destabilising force**.

### 6.3 Player level (XP)

- Playing earns **XP** over time, which raises your **player level**.
- Reaching levels unlocks new balls and other rewards.

### 6.4 Collectable balls (the main meta-progression)

- Unlocked through **achievements** in-game and by reaching **player levels**.
- Themes can be anything, from cute animal balls to Christmas baubles to unique objects.
- **Each ball should have a unique character.**
- **Decided: balls are cosmetic only.** No gameplay traits, so balance and leaderboards stay fair.
- Cosmetics include **ball designs** and **trails** (the visual streak behind the ball).
- A **collection screen** shows players what they have unlocked (and what is still locked) and lets them choose which ball and trail to use.

### 6.5 Other unlockables

- Backgrounds / visual themes.

## 7. Look and sound

- **Visual style:** energetic arcade with dark backgrounds, neon / cyberpunk palette, and interesting geometric shapes. Backgrounds evolve through the run.
- **Music:** fun, energetic, **royalty-free** arcade music. Candidate sources to evaluate (check each track's licence; some require on-screen credit):
  - Pixabay Music (free, no attribution required under the Pixabay licence)
  - Kevin MacLeod / incompetech (free under Creative Commons with attribution)
  - OpenGameArt.org (mixed licences per track)
  - Freesound.org (mainly sound effects; mixed licences)

## 8. Prototype (this week)

**Goal:** a playable HTML version for Stuart and his daughter to test whether the core balancing feels fun.

**Scope (confirmed by Stuart, 3 Nov 2026):**

| In the prototype | Later |
|---|---|
| Ball, target, drag control, the forces in §5.2 | Tilt control mode |
| Health that drains with distance and faster at the edge | Power-up buttons and recharge |
| Escalating difficulty and drifting background shapes that push the ball | XP, player levels, ball and trail unlocks, collection screen |
| Survival timer and best score saved on the device | Ball designs and trails (cosmetic) |
| On-screen sliders to tune the forces while playtesting | Currency and shop, leaderboards, ads / skins |
| Neon visual style (basic) | Music and sound (unless added to the prototype) |

## 9. Roadmap

| Phase | Contents |
|---|---|
| **1. HTML MVP** (this week) | Core loop prototype for playtesting and tuning. Built by Stuart using Claude. |
| **2. Full HTML game** | Currency, power-ups, XP / levels, ball collection, backgrounds, music. |
| **3. Rebuild in a game engine for iPhone** | Stuart has chosen a *quick HTML MVP, then rebuild in a game engine* approach. Engine to be chosen (e.g. Godot or Unity). |
| **4. Android** | Port from the engine build. |
| **5. Social** | Global and friends leaderboards. |
| **Later: monetisation** | No monetisation at launch. Future options: well-placed ads **between runs only**, and purchasable ball skins. |

## 10. Open questions

1. **Working title.** Stuart will name the game later.
2. **Force tuning.** Starting values for all forces, to be found in playtesting.
3. **Currency rate.** How time survived converts into currency, and how fast upgrades are affordable. Evidence from other games suggests every run should afford *something*.
4. **Achievement list.** Which achievements unlock which balls.
5. **Background stages.** How many stages, and what triggers each transition (time thresholds?).
6. **Game engine** for the iPhone rebuild.
7. **Tilt mode on web.** iPhone browsers ask the player for permission before a page can read tilt (motion sensors). Decide whether tilt is web-only, engine-only, or both.
8. **Music.** Pick tracks and confirm licences.

## 11. Decision log

| Date | Decision |
|---|---|
| 3 Nov 2026 | Prototype scope in §8 confirmed. Music is not in the prototype. |
| 3 Nov 2026 | Balls are cosmetic only; add ball designs, trails and a collection / configuration screen. |
| 3 Nov 2026 | Route: quick HTML MVP, then rebuild in a game engine. |
| 3 Nov 2026 | No monetisation at launch; not an idle game; audience is not children. |

## 12. Research references

- [Follow the Line](https://apps.microsoft.com/detail/9wzdncrfjfgx?hl=en-US): closest control match (drag to keep the ball centred); no meta-progression.
- [Balancer: Don't let it fall](https://apps.apple.com/us/app/-/id6744556396): one-finger swipe balancing; markets "smooth, intuitive one-finger controls".
- [Balance the Ball](https://f-droid.org/bo/packages/com.jeffliu.balancetheball/): tilt-based centring game.
- [Phone Balancer](https://mobile-arcade-23h.pages.dev/games/phone-balancer): tilt balancing; notes that overcorrecting is the main way players fail (relevant to "not frustrating").
- [Orbix](https://apps.apple.com/us/app/-/id6505120189): "keep the ball in the circle", but paddle-based.
- Upgrade pacing discussions ([itch.io](https://itch.io/post/15306814), [Steam](https://steamcommunity.com/app/3405340/discussions/0/598541076225274720/)): players want every run to feel rewarding; slow upgrades kill motivation.
