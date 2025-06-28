<template>
  
    <h3>About the Project</h3>
    <p>
      The project for my summer term in Year 1 involved the design and manufacturing of a wind 
      turbine. The design was constrained to the use of purely deterministic analyses, with no 
      allowance for numerical simulation methods such as FEA and CFD. 
      Working in groups of 6, I was one of two members working on the aerodynamics and blade body. 
      I developed the core of the BEM application over the course of the first 2 weeks, and later 
      extended its other functionalities (such as the blade model generator).
    </p>
    <p>
      The primary objectives during design were three-fold; to develop a turbine that self starts 
      before 10m/s, to design it cheaply, and to design it with ease of manufacture in mind. The 
      results of the BEM guided our creation throughout, and as such great care was taking to 
      ensure accuracy, but also ease of use (hence the final workflow and code to easily work with 
      the other software used in the project).
    </p>
    <p>
      <strong>
        Ultimately our blade was the most powerful out of my cohort, producing a peak power output of 
        24.8 watts. 
      </strong>
    </p>
    <p>
      Our chord and twist distributions were based on the ideal distributions derived from BEM theory, 
      however some changes were made for manufacturing purposes (specifically scaling our twist 
      distribution to a max of 30 degrees). 
    </p>
    <h3>Turbine Info</h3>
    <ul>
      <li>Airfoil: <strong>SG6043</strong> (chosen for its high L/D<sub>max</sub>)</li>
      <li>Blade Radius: <strong>0.227&nbsp;m</strong></li>
      <li>Design tip-speed ratio (TSR): <strong>4</strong></li>
      <li>Chord Distribution: <img class="equation-svg" src="/svg/chord_distribution.svg" alt="c(θ) equation"/></li>
      <li>Twist Distribution: <img class="equation-svg" src="/svg/twist_distribution.svg" alt="θ(r) equation"/></li>
    </ul>

    <h3>Timelapse of a blades construction</h3>
    <VideoViewer videoSrc="/videos/wind_turbine_construction_timelapse.mp4"/>

    <h3>Video of the wind tunnel test</h3>
    <VideoViewer videoSrc="/videos/turbine_test_footage.mp4"/>

    <h3>The final turbine CAD model</h3>
    <div style="height:60vh; width: 50vw; margin: 0 auto;" class="model-viewer-wrapper">
      <ModelViewer src="/models/full_turbine_blade.stl" :background="bgCol"/>
    </div>
</template>

<script setup>
import ModelViewer from './ModelViewer.vue';
import VideoViewer from './VideoViewer.vue';

const bgCol = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim();

</script>
<style scoped>
.equation-svg {
  height: 1.8em;         
  vertical-align: middle;
  filter: brightness(0) invert(1);
}

.model-viewer-wrapper {
    background: var(--bg-color);
    mask-image: linear-gradient(to top, transparent 0%, black 35%, black 65%, transparent 100%),
                 linear-gradient(to left, transparent 0%, black 35%, black 65%, transparent 100%);
    mask-composite: intersect;
    -webkit-mask-image: linear-gradient(to top, transparent 0%, black 35%, black 65%, transparent 100%),
                        linear-gradient(to left, transparent 0%, black 35%, black 65%, transparent 100%);
    -webkit-mask-composite: source-in;
}
</style>





