<template>
  <h2>About the Project</h2>
  <p>
    My first programming project, written over the course of a number of months,
    after completing my AP Computer Science course in December of my senior
    year. Originally based on
    <a
      href="https://youtube.com/playlist?list=PLSlpr6o9vURwq3oxVZSimY8iC-cdd3kIs&si=VaBjjD3BqjP_x--q"
      :style="{ color: getSecondaryColor('red') }"
    >
      this youtube
    </a>
    playlist and
    <a
      href="http://www.chrishecker.com/Rigid_Body_Dynamics"
      :style="{ color: getSecondaryColor('red') }"
      >these papers</a
    >
    (from the youtube series), evolving into a fully-fledged engine with many
    more features.
  </p>
  <p>
    Managing a codebase that grew to nearly 11,000 lines greatly improved my
    understanding of software architecture and design patterns. It encouraged me
    to adopt modular programming practices, and latent performance issues gave
    me my first introduction to the concept of memory management and
    optimization (not the Java makes it easy), while also allowing me to explore
    and grow my own development style.
  </p>
  <p>
    User interaction and interface design was another key area of growth (albeit
    I was quite depleted for the latter and the code is a mess). Approaching
    user interaction was quite a complicated task, as I had to balance usability
    with ease of use for the unsuspecting user. This was also my first
    experience into systems where if statements are simply not enough, and I had
    to start shifting my thinking toward more event-driven/state-driven
    solutions.
  </p>
  <p>
    I also learned a plethora of new concepts regarding physics simulation.
    Building the engine taught me how real-time physics simulators balance
    accuracy, stability, and performance, and the challenges I faced throughout
    the project have reframed the approach I take to complex problems (with a
    severity only 2 months of largely invisible numerical errors can bring
    about). The pipeline I implemented includes Runge-Kutta 4 (RK4) integration,
    a broad-phase/narrow-phase collision system, and a sequential impulse solver
    with friction and restitution (the first of the three being my own touch,
    and the latter two being based on the series).
  </p>

  <p>
    I gained a profound appreciation for the complexities of simulating physical
    systems. Understanding how real-world physics translate into computer models
    gave me a new perspective on software development, and how broader fields
    such as virtual prototyping, game development, and robotic simulations
    function (at least on a very fundamental level). This experience sparked my
    curiosity about future possibilities in software-driven physical
    simulations.
  </p>

  <h3>Features</h3>
  <ul>
    <li>Real-time physics simulation</li>
    <li>
      Substep collision resolution with framerates of 100+ at the highest
      settings
    </li>
    <li>Spring (/Rod), and Motor constraints</li>
    <li>
      General convex polygon and circle collision detection and impulse based
      resolution
    </li>
    <li>A GUI built from scratch using Processing's PGraphics</li>
    <li>Game state serialization and deserialization</li>
    <li>
      Customizable object properties (mass, friction, restitution, width,
      height, etc.)
    </li>
    <li>Customizable object geometry (vertices)</li>
    <li>Pseudo soft-body physics</li>
  </ul>
  <h3>Building stuff in the engine</h3>
  <VideoViewer videoSrc="/videos/PhysicsEngineVideo1.mp4" />
  <h3>Pseudo soft-body physics</h3>
  <VideoViewer videoSrc="/videos/PhysicsEngineVideo2.mp4" />
  <h3>Train demo</h3>
  <VideoViewer videoSrc="/videos/PhysicsEngineVideo3.mp4" />
</template>

<script setup>
import VideoViewer from "./VideoViewer.vue";
import { getSecondaryColor } from "../composables/useGetColours";
</script>

<style scoped></style>
