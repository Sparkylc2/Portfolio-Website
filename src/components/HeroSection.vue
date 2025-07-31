<template>
  <div class="hero-content">
    <div class="intro-section">
      <h1 class="hero-title">
        <!-- <span class="greeting">Hello, I'm</span> -->
        <span class="name">Lukas Campbell</span>
      </h1>
      <p class="tagline">Aeronautical Engineering Student</p>
      <p class="subtitle">Imperial College London</p>
    </div>

    <div class="about-section">
      <p class="bio">
        Passionate about computational fluid dynamics, aircraft design, and
        building physics simulations. Currently in my {{ currentYear }} year,
        exploring the intersection of aerospace engineering and software
        development.
      </p>
    </div>

    <div class="interests-section">
      <h3>Research Interests</h3>
      <div class="interest-tags">
        <span class="interest-tag" v-for="interest in interests" :key="interest">
          {{ interest }}
        </span>
      </div>
    </div>

    <!-- <div class="stats-section"> -->
    <!--   <div class="stat-item" v-for="stat in stats" :key="stat.label"> -->
    <!--     <span class="stat-value">{{ stat.value }}</span> -->
    <!--     <span class="stat-label">{{ stat.label }}</span> -->
    <!--   </div> -->
    <!-- </div> -->
  </div>



</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import F22_Animation from "../animations/HeroAnimation.vue";
// import AirfoilFlowAnimation from './AirfoilFlowAnimation.vue'

const currentYear = ref("2nd");

const interests = ref([
  "CFD",
  "Aerodynamics",
  "Flight Dynamics",
  "Propulsion",
  "Structural Analysis",
  "Control Systems",
]);

const stats = ref([
  { label: "Projects", value: "3+" },
  { label: "Papers", value: "2" },
  { label: "Languages", value: "5+" },
]);
</script>

<style scoped>
.all-wrapper {
  display: flex;
  position: relative;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;

}

.hero-section {
  display: flex;
  position: relative;
  align-items: center;
  gap: 3rem;
  padding: 2rem;
  /* min-height: 100%; */
  position: relative;
  width: 100%;
  height: 100%;
  /* max-width: 1400px; */
}

.hero-section {
  flex-direction: row;
  justify-content: space-between;
  gap: 4rem;
}

.hero-content {
  flex: 1;
  /* max-width: 600px; */
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  /* max-width: 600px; */
  height: 100%;
  margin: 0 auto;
  z-index: 2;
}

.intro-section {
  text-align: center;
}

.hero-title {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.greeting {
  font-size: clamp(1.5rem, 3vw, 2rem);
  color: #999;
  font-weight: 400;
}

.name {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, #ccc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  font-size: clamp(1.2rem, 2.5vw, 1.5rem);
  color: rgb(140, 172, 204);
  margin: 0;
}

.subtitle {
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: #999;
  margin-top: 0.5rem;
}

.about-section {
  background: rgba(255, 255, 255, 0.03);
  padding: 2rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bio {
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  line-height: 1.6;
  color: #ccc;
}

.interests-section h3 {
  font-size: clamp(1.2rem, 2.5vw, 1.5rem);
  margin-bottom: 1rem;
  color: #fff;
}

.interest-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.interest-tag {
  padding: 0.5rem 1rem;
  background: rgba(140, 172, 204, 0.15);
  border: 1px solid rgba(140, 172, 204, 0.3);
  border-radius: 2rem;
  font-size: 0.9rem;
  color: rgb(191, 223, 255);
  transition: all 0.3s ease;
}

.interest-tag:hover {
  background: rgba(140, 172, 204, 0.25);
  transform: translateY(-2px);
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-value {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 0.9rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.animation-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  height: 500px;
  margin: 0 auto;
  opacity: 0.8;
  z-index: 1;
  border-radius: 1rem;
  overflow: hidden;
  background: rgba(36, 36, 36, 0.5);
}

.animation-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(140, 172, 204, 0.05);
  border: 2px dashed rgba(140, 172, 204, 0.2);
  color: rgba(140, 172, 204, 0.5);
}

@media (max-width: 768px) {
  .hero-section {
    padding: 1rem;
  }

  .stats-section {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    padding: 1rem;
  }

  .animation-container {
    height: 300px;
  }
}

@media (min-width: 1200px) {
  .hero-section {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 4rem;
  }

  .hero-content {
    flex: 1;
    max-width: 600px;
  }

  .animation-container {
    flex: 1;
    height: 600px;
    max-width: 600px;
  }
}
</style>
