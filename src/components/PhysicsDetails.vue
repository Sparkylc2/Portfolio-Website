<template>
    <h2>About the Project</h2>
    <p>My first programming project, written over the course of a number of months after completing
        my AP Computer Science course in December of my senior year</p>
    <h3>Features</h3>
    <ul>
        <li>Real-time physics simulation</li>
        <li>Spring (/Rod), and Motor constraints</li>
        <li>General convex polygon and circle collision detection</li>
        <li>A GUI built from scratch using Processing's PGraphics</li>
        <li>Game state serialization and deserialization</li>
        <li>Customizable object properties (mass, friction, restitution, width, height, etc.)</li>
        <li>Customizable object geometry (vertices) </li>
        <li>Pseudo-soft-body physics</li>
    </ul>

    <VideoViewer videoSrc="/videos/PhysicsEngineVideo1.mp4"/>
</template>

<script setup>
import VideoViewer from './VideoViewer.vue';
</script>
