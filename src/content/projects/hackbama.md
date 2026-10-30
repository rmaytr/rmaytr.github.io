---
title: HackBama_01
cardLine: A real-time Python controller that drives a simulated AWD electric race car around unseen autocross courses with no map, in about 10 ms per decision.
dates: Oct 17, 2026 · 12-hour hackathon at the University of Alabama
year: '2026'
role: Racing-line planner, physics-based prediction, ECO mode, visualizer, team coordination
team: HackUAB (Rodion, Saisi, Viraj)
result: 1st place in the EcoCAR track
category: [featured, systems]
order: 1
stack: [Python, NumPy, CARLA 0.9.16, Vehicle dynamics, Least-squares optimization, pytest, Git/GitHub, Base44, Claude Code, OpenAI Codex]
metrics:
  - { value: '36.8 s', label: 'lap vs 39.5 s baseline' }
  - { value: '0', label: 'cones hit' }
  - { value: '129', label: 'automated tests' }
links:
  - { label: Repository, href: 'https://github.com/rmaytr/HackUAB' }
  - { label: Demo video, href: 'https://youtu.be/a-963WiK0cQ' }
  - { label: Interactive visualizer, href: 'https://uab-track-sync.base44.app' }
cover: ../../assets/work/hackbama.png
figure: branches
---

## The problem

The University of Alabama EcoCAR Innovation Challenge, autonomous autocross: drive a simulated **all-wheel-drive electric vehicle** around a cone-marked course with **no map**. The car only sees the next **40 m**.

## Constraints

- Return steering, throttle and brake **20 times per second** within a hard **50 ms** budget, on 1 CPU core, no GPU, in a sandbox.
- Scored tracks were **unreleased**, so the controller had to generalize. Scored on two simulators (CARLA 3D physics and a vehicle-dynamics model), half each.

## What we built: a four-stage pipeline running every 50 ms

1. **Safe corridor:** turns the 40 m preview into a corridor shrunk for the car's width, reshaped around obstacle cones (picks the wider gap, with hysteresis).
2. **Racing-line planner:** a **minimum-curvature racing line** re-solved every step as a regularized least-squares problem in pure **NumPy**, warm-started for stability; a grip-based speed profile with forward/backward passes and a **visibility guard** for sharp corners just past the horizon.
3. **Physics-based prediction & plan verification:** a vectorized **dynamic bicycle model** of the AWD car (tyre saturation, load transfer, 40/60 drive split, steering lag, drag) simulates the next **1.5 s**, and slows the plan wherever predicted grip or rear-tyre slip would exceed limits.
4. **Tracking controller:** curvature feedforward plus pure-pursuit feedback with latency compensation, and an AWD per-axle traction model (traction control/ABS-like) with online slip adaptation.

**Safety layer:** per-stage fallbacks, timing and a compute-budget guard; a blocked-road safety stop.

Beyond the core controller: an **interactive web visualizer** that replays every simulated lap, walks through the four stages and compares the modes, and a sensor-fusion prototype (lidar, radar, camera → cone detections), built separately from the scored controller.

## Trade-offs

**PERFORMANCE vs ECO modes:** a built-in energy meter (energy balance within 5%) and a Pareto front of lap time vs energy. ECO uses about **30% less energy for about 10% more lap time, still with zero cones**.

## Results

| | Organizers' baseline | Our controller |
|---|---|---|
| Lap time, hardest practice course | 39.5 s | **36.8 s** |
| Cones hit, same course | 4 | **0** |
| Technical score, same course | 57.5 / 75 | **68.1 / 75** |
| Technical score, other public courses | 59.5–66.5 | **70.2–71.5** |

- **0 cone hits, 0 off-course, 0 missed gates, 0 controller errors** across all public courses and randomly generated unseen tracks, in both modes (22 validation laps).
- About **10 ms per decision** against a 50 ms budget. **129 automated tests**.

## My role

- Owned the **racing-line planner** and the **physics-based prediction and verification** model.
- Built **ECO mode**, the energy meter and Pareto analysis, and the **blocked-road safety fix**.
- Built the **interactive visualizer**.
- **Coordinated the team:** project plan, merges and integration testing, submission, pitch and demo video.
- (Viraj: tracking controller, integration, CARLA validation. Saisi: corridor/obstacle module, sensor-fusion prototype.)

## How we worked

Module ownership per teammate with data contracts and self-test gates before merging; every change validated on randomly generated tracks to avoid overfitting; several Claude Code and Codex agents in parallel git worktrees, each owning one module, with human review before merge.
