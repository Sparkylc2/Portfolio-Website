<template>
  <div class="hero-content">
    <div class="hero-inner">
      <div class="intro-section">
        <h1 class="hero-title">
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
import { ref } from "vue";

const currentYear = ref("2nd");

const interests = ref([
  "CFD",
  "Avionics",
  "Flight Dynamics",
  "Aerodynamics",
  "Control Systems",
  "Propulsion",
  "Structural Analysis",
]);
</script>

<style scoped>
.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: 2rem;
  box-sizing: border-box;
}

.hero-inner {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
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

.name {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  background: linear-gradient(135deg, #fff 0%, #ccc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
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
  margin: 0;
}

.interests-section h3 {
  font-size: clamp(1.2rem, 2.5vw, 1.5rem);
  margin-bottom: 1rem;
  color: #fff;
  text-align: center;
}

.interest-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
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

/* Mobile styles */
@media (max-width: 768px) {
  .hero-content {
    padding: 1rem;
    min-height: calc(100vh - 4rem);
  }

  .hero-inner {
    gap: 2rem;
  }

  .about-section {
    padding: 1.5rem;
  }

  .interest-tags {
    gap: 0.5rem;
  }

  .interest-tag {
    font-size: 0.85rem;
    padding: 0.4rem 0.8rem;
  }
}

/* Tablet styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .hero-content {
    padding: 2rem;
  }

  .hero-inner {
    max-width: 700px;
  }
}

/* Large desktop styles */
@media (min-width: 1920px) {
  .hero-inner {
    max-width: 800px;
    gap: 3rem;
  }

  .about-section {
    padding: 2.5rem;
  }

  .bio {
    font-size: 1.2rem;
    line-height: 1.7;
  }
}
</style>
