<template>
    <h2>About the Project</h2>
    <p>My first programming project, written over the course of a number of months after completing
        my AP Computer Science course in December of my senior year. Originally based on 
        <a href="https://youtube.com/playlist?list=PLSlpr6o9vURwq3oxVZSimY8iC-cdd3kIs&si=VaBjjD3BqjP_x--q" :style="{color: getSecondaryColor('red')}"> this youtube </a>
         playlist and <a href="http://www.chrishecker.com/Rigid_Body_Dynamics" :style="{color: getSecondaryColor('red')}">these papers</a> (from the youtube series), evolving into a fully-fledged engine with many more features.
      </p>
    <h3>Features</h3>
    <ul>
        <li>Real-time physics simulation</li>
        <li>Substep collision resolution with framerates of 100+ at the highest settings</li>
        <li>Spring (/Rod), and Motor constraints</li>
        <li>General convex polygon and circle collision detection and impulse based resolution</li>
        <li>A GUI built from scratch using Processing's PGraphics</li>
        <li>Game state serialization and deserialization</li>
        <li>Customizable object properties (mass, friction, restitution, width, height, etc.)</li>
        <li>Customizable object geometry (vertices) </li>
        <li>Pseudo soft-body physics</li>
    </ul>
    <h3> Building stuff in the engine</h3>
    <VideoViewer videoSrc="/videos/PhysicsEngineVideo1.mp4"/>
    <h3> Pseudo soft-body physics</h3>
    <VideoViewer videoSrc="/videos/PhysicsEngineVideo2.mp4"/>
    <h3> Train demo </h3>
    <VideoViewer videoSrc="/videos/PhysicsEngineVideo3.mp4"/>
</template>

<script setup>
import VideoViewer from './VideoViewer.vue';
import { getSecondaryColor } from '../composables/useGetColours'
</script>



<style scoped>
</style>
