use wasm_bindgen::prelude::*;
use js_sys::Array;
use nalgebra::{DMatrix, DVector, Vector2, Matrix2};

#[derive(Clone, Copy, Debug, PartialEq)]
struct Vec2 {
    x: f64,
    y: f64
}

impl Vec2 {
    fn new(x: f64, y: f64) -> Self {
        Vec2 { x, y }
    }

    fn length(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

    fn normalize(&self) -> Self {
        let len = self.length();
        if len == 0.0 {
            Vec2::new(0.0, 0.0)
        } else {
            Vec2::new(self.x / len, self.y / len)
        }
    }
    
    fn dot(&self, other: &Self) -> f64 {
        self.x * other.x + self.y * other.y
    }

    fn cross(&self, other: &Self) -> f64 {
        self.x * other.y - self.y * other.x
    }

    fn add(&self, other: &Self) -> Self {
        Vec2::new(self.x + other.x, self.y + other.y)
    }

    fn subtract(&self, other: &Self) -> Self {
        Vec2::new(self.x - other.x, self.y - other.y)
    }

    fn multiply(&self, scalar: f64) -> Self {
        Vec2::new(self.x * scalar, self.y * scalar)
    }

    fn rotate(&self, angle: f64) -> Self {
        let cos_angle = angle.cos();
        let sin_angle = angle.sin();
        Vec2::new(
            self.x * cos_angle - self.y * sin_angle,
            self.x * sin_angle + self.y * cos_angle,
        )
    }
    
    fn perpendicular(&self) -> Self {
        Vec2::new(-self.y, self.x)
    }
}

#[derive(Clone)]
struct RigidBody {
    position: Vec2,
    velocity: Vec2,
    angle: f64,
    angular_velocity: f64,
    mass: f64,
    inertia: f64,
    half_width: f64,
    half_height: f64,
}

impl RigidBody {
    fn new(position: Vec2, half_width: f64, half_height: f64, mass: f64) -> Self {
        let inertia = mass * (4.0 * half_width * half_width + 4.0 * half_height * half_height) / 12.0;
        
        Self {
            position,
            velocity: Vec2::new(0.0, 0.0),
            angle: 0.0,
            angular_velocity: 0.0,
            mass,
            inertia,
            half_width,
            half_height,
        }
    }

    fn get_corners(&self) -> [Vec2; 4] {
        let corners_local = [
            Vec2::new(-self.half_width, -self.half_height),
            Vec2::new(self.half_width, -self.half_height),
            Vec2::new(self.half_width, self.half_height),
            Vec2::new(-self.half_width, self.half_height),
        ];
        
        let mut corners_world = [Vec2::new(0.0, 0.0); 4];
        for i in 0..4 {
            corners_world[i] = corners_local[i].rotate(self.angle).add(&self.position);
        }
        
        corners_world
    }
    
    fn get_axes(&self) -> [Vec2; 2] {
        [
            Vec2::new(self.angle.cos(), self.angle.sin()),
            Vec2::new(-self.angle.sin(), self.angle.cos()),
        ]
    }
    
    fn project_onto_axis(&self, axis: &Vec2) -> (f64, f64) {
        let corners = self.get_corners();
        let mut min = corners[0].dot(axis);
        let mut max = min;
        
        for i in 1..4 {
            let projection = corners[i].dot(axis);
            min = min.min(projection);
            max = max.max(projection);
        }
        
        (min, max)
    }
    
    fn contains_point(&self, point: &Vec2) -> bool {
        let local = point.subtract(&self.position).rotate(-self.angle);
        
        local.x.abs() <= self.half_width && local.y.abs() <= self.half_height
    }
    
    fn world_to_local(&self, point: &Vec2) -> Vec2 {
        point.subtract(&self.position).rotate(-self.angle)
    }
    
    fn local_to_world(&self, point: &Vec2) -> Vec2 {
        point.rotate(self.angle).add(&self.position)
    }
}

#[derive(Clone)]
enum Anchor {
    Fixed(Vec2),
    BodyIndex(usize),
    BodyPoint { body: usize, local_point: Vec2 },
}

#[derive(Clone)]
struct DistanceConstraint {
    anchor_a: Anchor,
    anchor_b: Anchor,
    rest_length: f64,
    stiffness: f64,
}

struct CollisionContact {
    body_a: usize,
    body_b: usize,
    contact_point: Vec2,
    normal: Vec2,
    penetration: f64,
}

struct SATResult {
    colliding: bool,
    normal: Vec2,
    penetration: f64,
}

#[wasm_bindgen]
pub struct ConstraintPhysicsEngine {
    bodies: Vec<RigidBody>,
    distance_constraints: Vec<DistanceConstraint>,
    gravity: Vec2,
    iterations: usize,
    mouse_constraint_index: Option<usize>,
}

#[wasm_bindgen]
impl ConstraintPhysicsEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            bodies: Vec::new(),
            distance_constraints: Vec::new(),
            gravity: Vec2::new(0.0, 9.81),
            iterations: 5,
            mouse_constraint_index: None,
        }
    }

    pub fn add_body(&mut self, x: f64, y: f64, half_width: f64, half_height: f64, mass: f64) -> usize {
        self.bodies.push(RigidBody::new(
            Vec2::new(x, y),
            half_width,
            half_height,
            mass
        ));
        self.bodies.len() - 1
    }

    pub fn add_distance_constraint(&mut self, body_a: usize, body_b: usize, rest_length: f64, stiffness: f64) {
        self.distance_constraints.push(DistanceConstraint {
            anchor_a: Anchor::BodyIndex(body_a),
            anchor_b: Anchor::BodyIndex(body_b),
            rest_length,
            stiffness,
        });
    }

    pub fn add_fixed_distance_constraint(&mut self, fixed_x: f64, fixed_y: f64, body: usize, rest_length: f64, stiffness: f64) {
        self.distance_constraints.push(DistanceConstraint {
            anchor_a: Anchor::Fixed(Vec2::new(fixed_x, fixed_y)),
            anchor_b: Anchor::BodyIndex(body),
            rest_length,
            stiffness,
        });
    }
    
    pub fn start_mouse_drag(&mut self, world_x: f64, world_y: f64) -> i32 {
        let mouse_pos = Vec2::new(world_x, world_y);
        
        for (i, body) in self.bodies.iter().enumerate() {
            if body.contains_point(&mouse_pos) {
                let local_point = body.world_to_local(&mouse_pos);
                
                let constraint = DistanceConstraint {
                    anchor_a: Anchor::BodyPoint { body: i, local_point },
                    anchor_b: Anchor::Fixed(mouse_pos),
                    rest_length: 0.0,
                    stiffness: 0.5,
                };
                
                self.distance_constraints.push(constraint);
                self.mouse_constraint_index = Some(self.distance_constraints.len() - 1);
                
                return i as i32;
            }
        }
        
        -1
    }
    
    pub fn update_mouse_position(&mut self, world_x: f64, world_y: f64) {
        if let Some(idx) = self.mouse_constraint_index {
            if let Some(constraint) = self.distance_constraints.get_mut(idx) {
                constraint.anchor_b = Anchor::Fixed(Vec2::new(world_x, world_y));
            }
        }
    }
    
    pub fn end_mouse_drag(&mut self) {
        if let Some(idx) = self.mouse_constraint_index {
            self.distance_constraints.remove(idx);
            self.mouse_constraint_index = None;
        }
    }

    fn detect_collisions(&self) -> Vec<CollisionContact> {
        let mut contacts = Vec::new();
        
        for i in 0..self.bodies.len() {
            for j in (i + 1)..self.bodies.len() {
                if let Some(contact) = self.check_collision_sat(i, j) {
                    contacts.push(contact);
                }
            }
        }
        
        contacts
    }

    fn check_collision_sat(&self, idx_a: usize, idx_b: usize) -> Option<CollisionContact> {
        let body_a = &self.bodies[idx_a];
        let body_b = &self.bodies[idx_b];
        
        let mut min_penetration = f64::MAX;
        let mut collision_normal = Vec2::new(0.0, 0.0);
        
        let axes_a = body_a.get_axes();
        for axis in &axes_a {
            let (min_a, max_a) = body_a.project_onto_axis(axis);
            let (min_b, max_b) = body_b.project_onto_axis(axis);
            
            if max_a < min_b || max_b < min_a {
                return None; 
            }
            
            let penetration = (max_a.min(max_b) - min_a.max(min_b)).abs();
            if penetration < min_penetration {
                min_penetration = penetration;
                collision_normal = *axis;
            }
        }
        
        let axes_b = body_b.get_axes();
        for axis in &axes_b {
            let (min_a, max_a) = body_a.project_onto_axis(axis);
            let (min_b, max_b) = body_b.project_onto_axis(axis);
            
            if max_a < min_b || max_b < min_a {
                return None; 
            }
            
            let penetration = (max_a.min(max_b) - min_a.max(min_b)).abs();
            if penetration < min_penetration {
                min_penetration = penetration;
                collision_normal = *axis;
            }
        }
        
        let center_diff = body_b.position.subtract(&body_a.position);
        if collision_normal.dot(&center_diff) < 0.0 {
            collision_normal = collision_normal.multiply(-1.0);
        }
        
        let contact_point = self.find_contact_point(body_a, body_b, &collision_normal);
        
        Some(CollisionContact {
            body_a: idx_a,
            body_b: idx_b,
            contact_point,
            normal: collision_normal,
            penetration: min_penetration,
        })
    }
    
    fn find_contact_point(&self, body_a: &RigidBody, body_b: &RigidBody, normal: &Vec2) -> Vec2 {
        let corners_a = body_a.get_corners();
        let corners_b = body_b.get_corners();
        
        let mut deepest_point = corners_a[0];
        let mut max_depth = -f64::MAX;
        
        for corner in &corners_a {
            let depth = corner.subtract(&body_b.position).dot(&normal.multiply(-1.0));
            if depth > max_depth {
                max_depth = depth;
                deepest_point = *corner;
            }
        }
        
        for corner in &corners_b {
            let depth = corner.subtract(&body_a.position).dot(normal);
            if depth > max_depth {
                max_depth = depth;
                deepest_point = *corner;
            }
        }
        
        deepest_point
    }

    fn solve_constraints(&mut self, dt: f64) {
        for _ in 0..self.iterations {
            let constraints = self.distance_constraints.clone();
            for constraint in &constraints {
                self.solve_distance_constraint(constraint, dt);
            }
            
            let contacts = self.detect_collisions();
            for contact in &contacts {
                self.solve_collision_constraint(contact, dt);
            }
        }
    }

    fn solve_distance_constraint(&mut self, constraint: &DistanceConstraint, dt: f64) {
        let (pos_a, mass_a, inertia_a, idx_a, r_a) = match &constraint.anchor_a {
            Anchor::Fixed(p) => (*p, f64::INFINITY, f64::INFINITY, None, Vec2::new(0.0, 0.0)),
            Anchor::BodyIndex(i) => {
                let body = &self.bodies[*i];
                (body.position, body.mass, body.inertia, Some(*i), Vec2::new(0.0, 0.0))
            },
            Anchor::BodyPoint { body, local_point } => {
                let b = &self.bodies[*body];
                let world_point = b.local_to_world(local_point);
                let r = world_point.subtract(&b.position);
                (world_point, b.mass, b.inertia, Some(*body), r)
            }
        };
        
        let (pos_b, mass_b, inertia_b, idx_b, r_b) = match &constraint.anchor_b {
            Anchor::Fixed(p) => (*p, f64::INFINITY, f64::INFINITY, None, Vec2::new(0.0, 0.0)),
            Anchor::BodyIndex(i) => {
                let body = &self.bodies[*i];
                (body.position, body.mass, body.inertia, Some(*i), Vec2::new(0.0, 0.0))
            },
            Anchor::BodyPoint { body, local_point } => {
                let b = &self.bodies[*body];
                let world_point = b.local_to_world(local_point);
                let r = world_point.subtract(&b.position);
                (world_point, b.mass, b.inertia, Some(*body), r)
            }
        };
        
        let delta = pos_b.subtract(&pos_a);
        let current_length = delta.length();
        
        if current_length == 0.0 {
            return;
        }
        
        let direction = delta.normalize();
        let constraint_error = current_length - constraint.rest_length;
        
        let r_a_cross_n = r_a.cross(&direction);
        let r_b_cross_n = r_b.cross(&direction);
        
        let effective_mass = if mass_a.is_finite() && mass_b.is_finite() {
            1.0 / mass_a + 1.0 / mass_b + 
            r_a_cross_n * r_a_cross_n / inertia_a +
            r_b_cross_n * r_b_cross_n / inertia_b
        } else if mass_a.is_finite() {
            1.0 / mass_a + r_a_cross_n * r_a_cross_n / inertia_a
        } else if mass_b.is_finite() {
            1.0 / mass_b + r_b_cross_n * r_b_cross_n / inertia_b
        } else {
            return; 
        };
        
        let impulse_magnitude = -constraint_error * constraint.stiffness / effective_mass;
        let impulse = direction.multiply(impulse_magnitude);
        
        if let Some(i) = idx_a {
            if mass_a.is_finite() {
                let body = &mut self.bodies[i];
                body.velocity = body.velocity.subtract(&impulse.multiply(1.0 / mass_a));
                body.angular_velocity -= r_a.cross(&impulse) / inertia_a;
            }
        }
        
        if let Some(i) = idx_b {
            if mass_b.is_finite() {
                let body = &mut self.bodies[i];
                body.velocity = body.velocity.add(&impulse.multiply(1.0 / mass_b));
                body.angular_velocity += r_b.cross(&impulse) / inertia_b;
            }
        }
    }

    fn solve_collision_constraint(&mut self, contact: &CollisionContact, dt: f64) {
        let body_a = &self.bodies[contact.body_a];
        let body_b = &self.bodies[contact.body_b];
        
        let ra = contact.contact_point.subtract(&body_a.position);
        let rb = contact.contact_point.subtract(&body_b.position);
        
        let va = body_a.velocity.add(&Vec2::new(-ra.y * body_a.angular_velocity, ra.x * body_a.angular_velocity));
        let vb = body_b.velocity.add(&Vec2::new(-rb.y * body_b.angular_velocity, rb.x * body_b.angular_velocity));
        
        let relative_velocity = vb.subtract(&va);
        let velocity_along_normal = relative_velocity.dot(&contact.normal);
        
        if velocity_along_normal > 0.0 {
            return;
        }
        
        let e = 0.8; 
        let ra_cross_n = ra.cross(&contact.normal);
        let rb_cross_n = rb.cross(&contact.normal);
        
        let inv_mass_sum = 1.0 / body_a.mass + 1.0 / body_b.mass +
            ra_cross_n * ra_cross_n / body_a.inertia +
            rb_cross_n * rb_cross_n / body_b.inertia;
        
        let j = -(1.0 + e) * velocity_along_normal / inv_mass_sum;
        let impulse = contact.normal.multiply(j);
        
        let body_a = &mut self.bodies[contact.body_a];
        body_a.velocity = body_a.velocity.subtract(&impulse.multiply(1.0 / body_a.mass));
        body_a.angular_velocity -= ra.cross(&impulse) / body_a.inertia;
        
        let body_b = &mut self.bodies[contact.body_b];
        body_b.velocity = body_b.velocity.add(&impulse.multiply(1.0 / body_b.mass));
        body_b.angular_velocity += rb.cross(&impulse) / body_b.inertia;
        
        let correction_percent = 0.2;
        let slop = 0.01;
        let correction_magnitude = (contact.penetration - slop).max(0.0) * correction_percent;
        let correction = contact.normal.multiply(correction_magnitude / inv_mass_sum);
        
        let body_a = &mut self.bodies[contact.body_a];
        body_a.position = body_a.position.subtract(&correction.multiply(1.0 / body_a.mass));
        
        let body_b = &mut self.bodies[contact.body_b];
        body_b.position = body_b.position.add(&correction.multiply(1.0 / body_b.mass));
    }

    pub fn add_damping(&mut self) {
        let damping_factor = 0.99;
        for body in &mut self.bodies {
            body.velocity = body.velocity.multiply(damping_factor);
            body.angular_velocity *= damping_factor;
        }
    }

    pub fn update(&mut self, dt: f64) {
        let dt_seconds = dt / 1000.0; 
        
        for body in &mut self.bodies {
            body.velocity.y += self.gravity.y * dt_seconds;
            body.position = body.position.add(&body.velocity.multiply(dt_seconds));
            body.angle += body.angular_velocity * dt_seconds;
        }

        self.add_damping();
        self.solve_constraints(dt_seconds);
    }

    pub fn body_position(&self, index: usize) -> Array {
        let body = &self.bodies[index];
        let arr = Array::new();
        arr.push(&JsValue::from_f64(body.position.x));
        arr.push(&JsValue::from_f64(body.position.y));
        arr
    }

    pub fn body_angle(&self, index: usize) -> f64 {
        self.bodies[index].angle
    }

    pub fn body_velocity(&self, index: usize) -> Array {
        let body = &self.bodies[index];
        let arr = Array::new();
        arr.push(&JsValue::from_f64(body.velocity.x));
        arr.push(&JsValue::from_f64(body.velocity.y));
        arr
    }

    pub fn body_angular_velocity(&self, index: usize) -> f64 {
        self.bodies[index].angular_velocity
    }

    pub fn set_gravity(&mut self, x: f64, y: f64) {
        self.gravity = Vec2::new(x, y);
    }

    pub fn set_iterations(&mut self, iterations: usize) {
        self.iterations = iterations;
    }
    pub fn get_body_count(&self) -> usize {
        self.bodies.len()
    }
}
