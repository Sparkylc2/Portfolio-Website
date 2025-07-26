<template>
  <h3>About the Coursework</h3>
  <p>
    This project involved the development of a MATLAB-based computational solver
    to analyze airflow around NACA 4-series airfoils using a numerical technique
    known as a Panel Code. Panel Codes simulate incompressible, inviscid, and
    irrotational flow fields by discretizing an airfoil's surface into multiple
    smaller segments, or "panels."
  </p>
  <p>
    The solver first constructs the airfoil geometry by applying parametric
    equations to define its camber and thickness based on the specific NACA
    airfoil designation. The surface is then discretized using a chebychev
    distribution, which improves accuracy around the leading and trailing edges.
    Each panel is modeled mathematically as a doublet element that influences
    the surrounding airflow.
  </p>
  <p>
    The program then sets up and solves a system of linear equations derived
    from boundary conditions, specifically enforcing zero normal velocity at
    each panel's midpoint (non-permeability condition). After solving for panel
    strengths, the solver computes the airflow velocities around the airfoil,
    and estimates the lift coefficint using the wake panel's doublet strength.
  </p>
</template>

<script setup></script>
