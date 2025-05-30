#include <emscripten/bind.h>
#include <Eigen/Dense>
#include <cmath>
#include <iostream>


using namespace Eigen;
using namespace emscripten;


double matrix_rows(const MatrixXd& m) { return m.rows(); }
double matrix_cols(const MatrixXd& m) { return m.cols(); }
double matrix_coeff(const MatrixXd& m, int row, int col) { return m(row, col); }

double vector_coeff(const VectorXd& v, int idx) { return v(idx); }
double vector_size(const VectorXd& v) { return v.size(); }

bool point_in_polygon(double x, double y, const MatrixXd& polygon) {
    bool inside = false;
    int n = polygon.rows();
    
    for (int i = 0, j = n - 1; i < n; j = i++) {
        double xi = polygon(i, 0), yi = polygon(i, 1);
        double xj = polygon(j, 0), yj = polygon(j, 1);
        
        bool intersect = ((yi > y) != (yj > y)) && 
                         (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
    }
    
    return inside;
}

Matrix<bool, Dynamic, Dynamic> in_polygon(const MatrixXd& x, const MatrixXd& y, const MatrixXd& polygon) {
    Matrix<bool, Dynamic, Dynamic> result(x.rows(), x.cols());

    for (int i = 0; i < x.rows(); i++) {
        for (int j = 0; j < x.cols(); j++) {
            result(i, j) = point_in_polygon(x(i, j), y(i, j), polygon);
        }
    }
    
    return result;
}

MatrixXd diff(const MatrixXd& mat) {
    if (mat.rows() <= 1) return MatrixXd::Zero(0, mat.cols());
    MatrixXd res(mat.rows() - 1, mat.cols());
    res = mat.bottomRows(mat.rows() - 1) - mat.topRows(mat.rows() - 1);
    return res;
}

ArrayXd masked_select(const ArrayXd& data, const Array<bool, Dynamic, 1>& mask) {
    ArrayXd result(mask.count());
    Index idx = 0;
    for (Index i = 0; i < data.size(); ++i) {
        if (mask(i)) result(idx++) = data(i);
    }
    return result;
}

ArrayXd masked_blend(
    const Array<bool, Dynamic, 1>& mask,
    const ArrayXd& true_values,
    const ArrayXd& false_values
) {
    ArrayXd result(mask.size());
    int idx_true = 0, idx_false = 0;
    for (int i = 0; i < mask.size(); ++i) {
        result(i) = mask(i) ? true_values(idx_true++) : false_values(idx_false++);
    }
    return result;
}


MatrixXd cdoublet(const MatrixXd& p, const MatrixXd& p1, const MatrixXd& p2) {
    // get panel and point deltas
    MatrixXd d_p2_p1 = p2 - p1;
    MatrixXd d_p_p1 = p - p1;
    MatrixXd d_p_p2 = p - p2;

    // rotate into local frame 
    ArrayXd alpha = -(d_p2_p1.col(1).array()).binaryExpr(d_p2_p1.col(0).array(),
                                    [](double y, double x) { return std::atan2(y, x); });
    // precompute for reuse
    ArrayXd cos_alpha = alpha.cos();
    ArrayXd sin_alpha = alpha.sin();

    // get x projection in local frame
    ArrayXd d1 = d_p_p1.col(0).array() * cos_alpha - d_p_p1.col(1).array() * sin_alpha;
    ArrayXd d2 = d_p_p2.col(0).array() * cos_alpha - d_p_p2.col(1).array() * sin_alpha;
    
    // get vertical offset from panel in local frame
    ArrayXd dz = d_p_p1.col(0).array() * sin_alpha + d_p_p1.col(1).array() * cos_alpha;

    // check for singularity (on panel centerline)
    auto branch = dz.abs() < 1e-6;

    // precompute for reuse
    ArrayXd d1_sq = d1.square();
    ArrayXd d2_sq = d2.square();
    ArrayXd dz_sq = dz.square();
    ArrayXd denom_1 = d1_sq + dz_sq;
    ArrayXd denom_2 = d2_sq + dz_sq;

    // near-singular case: simplify doublet velocity field
    ArrayXd u1_b1 = ArrayXd::Zero(dz.size());
    ArrayXd v1_b1 = (d1 / d1_sq - d2 / d2_sq) / (2 * M_PI);

    // general case for doublet velocity field
    ArrayXd u1_b2 = -dz * (1.0 / denom_1 - 1.0 / denom_2) / (2 * M_PI);
    ArrayXd v1_b2 = (d1 / denom_1 - d2 / denom_2) / (2 * M_PI);

    // select based on dz
    ArrayXd u1 = branch.select(u1_b1, u1_b2);
    ArrayXd v1 = branch.select(v1_b1, v1_b2);

    // rotate velocities back to global frame
    ArrayXd u =  u1 * cos_alpha + v1 * sin_alpha;
    ArrayXd v = -u1 * sin_alpha + v1 * cos_alpha;

    // pack results into Nx2 matrix
    MatrixXd uv(p.rows(), 2);
    uv.col(0) = u.matrix();
    uv.col(1) = v.matrix();
    return uv;
}



MatrixXd panelgen(const std::string& naca_code, int n, double aoa) {
    if (naca_code.length() != 4) {
        throw std::runtime_error("The NACA code must be a 4-digit number");
    }

    if (n <= 0) {
        throw std::runtime_error("The number of panels must be a positive integer");
    }


    double m = (naca_code[0] - '0') * 1e-2; 
    double p = (naca_code[1] - '0') * 1e-1; 
    double t = std::stod(naca_code.substr(2, 2)) * 1e-2; 

    VectorXd x_coord(n + 1);
    for (int i = 0; i <= n; ++i) {
        x_coord(i) = 1.0 - 0.5 * (1.0 - cos(2.0 * M_PI * i / n));
    }

    VectorXd y_camber(n + 1);
    VectorXd y_thickness(n + 1);
    VectorXd dyc_dx(n + 1);
    
    for (int i = 0; i <= n; ++i) {
        double x = x_coord(i);
        
        if (x <= p) {
            y_camber(i) = m / (p * p) * (2 * p * x - x * x);
            dyc_dx(i) = 2 * m / (p * p) * (p - x);
        } else {
            y_camber(i) = m / ((1 - p) * (1 - p)) * ((1 - 2 * p) + 2 * p * x - x * x);
            dyc_dx(i) = 2 * m / ((1 - p) * (1 - p)) * (p - x);
        }
        
        y_thickness(i) = 5 * t * (0.2969 * sqrt(x) - 0.126 * x - 
                                  0.3516 * x * x + 0.2843 * x * x * x - 
                                  0.1015 * x * x * x * x);
    }
    
    VectorXd theta = dyc_dx.array().atan();
    
    int le_idx;
    x_coord.minCoeff(&le_idx);
    
    VectorXd x(n + 1), z(n + 1);
    
    for (int i = 0; i <= le_idx; ++i) {
        x(i) = x_coord(i) + y_thickness(i) * sin(theta(i));
        z(i) = y_camber(i) - y_thickness(i) * cos(theta(i));
    }
    
    for (int i = le_idx; i <= n; ++i) {
        x(i) = x_coord(i) - y_thickness(i) * sin(theta(i));
        z(i) = y_camber(i) + y_thickness(i) * cos(theta(i));
    }

    
    x(0) = x(n) = 0.5 * (x(0) + x(n));
    z(0) = z(n) = 0.5 * (z(0) + z(n));
    
    double wake_length = 1.0;
    double x_te = x(0);
    double z_te = z(0);
    double wake_x = x_te + wake_length * cos(-aoa);
    double wake_z = z_te + wake_length * sin(-aoa);
    
    MatrixXd result(n + 2, 2);
    result.col(0).head(n + 1) = x;
    result.col(1).head(n + 1) = z;
    result(n + 1, 0) = wake_x;
    result(n + 1, 1) = wake_z;
    

    return result;
}


VectorXd solve_system(
    const MatrixXd& panel_coord, 
    double u_fs, 
    int n, 
    double aoa) {

    MatrixXd d = diff(panel_coord);
    VectorXd beta = d.col(1).array().binaryExpr(d.col(0).array(),
                                    [](double y, double x) { return std::atan2(y, x); });


    
    VectorXd sin_beta = beta.array().sin();
    VectorXd cos_beta = beta.array().cos();
    
    MatrixXd panel_mid = panel_coord.topRows(n) + 0.5 * d.topRows(n);


    MatrixXd A = MatrixXd::Zero(n + 1, n + 1);
    VectorXd B = VectorXd::Zero(n + 1);

    A(n, 0) = 1;
    A(n, n - 1) = -1;
    A(n, n) = 1;
    
    for (int i = 0; i < n; ++i) {
        B(i) = -u_fs * std::sin(aoa - beta(i));
    }

    // B.head(n) = -u_fs * (aoa - beta.array()).sin();
    
    for (int i = 0; i < n; ++i) {
        MatrixXd midpoint = panel_mid.row(i).replicate(n + 1, 1);
        MatrixXd panel_start = panel_coord.topRows(n + 1);
        MatrixXd panel_end = panel_coord.bottomRows(n + 1);

        MatrixXd vel = cdoublet(midpoint, panel_start, panel_end);
        VectorXd u_comp = vel.col(0);
        VectorXd v_comp = vel.col(1);
        A.row(i).head(n + 1) = (v_comp.array() * cos_beta(i) - u_comp.array() * sin_beta(i)).matrix();
    }

    VectorXd mu = A.colPivHouseholderQr().solve(B);
    return mu;
}

struct VelocityField {
    MatrixXd u;
    MatrixXd v;
};

VelocityField calculate_velocity(
    const MatrixXd& mesh_x, 
    const MatrixXd& mesh_z, 
    const VectorXd& mu, 
    const MatrixXd& panel_coord,
    const double& u_fs,
    const double& aoa, 
    const int& n) {
    
    int rows = mesh_x.rows();
    int cols = mesh_x.cols();
    


    MatrixXd u = MatrixXd::Constant(rows, cols, u_fs * cos(aoa));
    MatrixXd v = MatrixXd::Constant(rows, cols, u_fs * sin(aoa));
    
    Matrix<bool, Dynamic, Dynamic> outside = !in_polygon(mesh_x, mesh_z, panel_coord.topRows(n)).array();
    
    std::vector<double> x_outside, z_outside;
    std::vector<std::pair<int, int>> indices;
    
    for (int i = 0; i < rows; ++i) {
        for (int j = 0; j < cols; ++j) {
            if (outside(i, j)) {
                x_outside.push_back(mesh_x(i, j));
                z_outside.push_back(mesh_z(i, j));
                indices.push_back({i, j});
            } else {
                u(i, j) = std::numeric_limits<double>::quiet_NaN();
                v(i, j) = std::numeric_limits<double>::quiet_NaN();
            }
        }
    }
    
    if (x_outside.empty()) return {u, v};
    
    int n_outside = x_outside.size();
    MatrixXd points(n_outside, 2);

    for (int i = 0; i < n_outside; ++i) {
        points(i, 0) = x_outside[i];
        points(i, 1) = z_outside[i];
    }
    
    for (int k = 0; k <= n; ++k) {
        MatrixXd p1 = panel_coord.row(k).replicate(n_outside, 1);
        MatrixXd p2 = panel_coord.row(k + 1).replicate(n_outside, 1);
        // MatrixXd p1(1, 2), p2(1, 2);
        // p1.row(0) = panel_coord.row(k);
        // p2.row(0) = panel_coord.row(k + 1);

        
        MatrixXd vel = cdoublet(points, p1, p2);
        
        for (int i = 0; i < n_outside; ++i) {
            auto [row, col] = indices[i];
            u(row, col) += mu(k) * vel(i, 0);
            v(row, col) += mu(k) * vel(i, 1);
        }
    }
    
    return {u, v};
}

struct MeshGrid {
    MatrixXd x;
    MatrixXd z;
};

MeshGrid create_mesh(double x_min, double x_max, double z_min, double z_max, int nx, int nz) {
    VectorXd x_vec = VectorXd::LinSpaced(nx, x_min, x_max);
    VectorXd z_vec = VectorXd::LinSpaced(nz, z_min, z_max);
    
    MatrixXd x(nz, nx);
    MatrixXd z(nz, nx);
    
    for (int i = 0; i < nz; ++i) {
        for (int j = 0; j < nx; ++j) {
            x(i, j) = x_vec(j);
            z(i, j) = z_vec(i);
        }
    }
    
    return {x, z};
}


MatrixXd calculate_streamline(
    const VelocityField& field,
    const MeshGrid& grid,
    double x0, double z0,
    double dt, int max_steps) {
    
    std::vector<Vector2d> points;
    Vector2d pos(x0, z0);
    
    auto interpolate_velocity = [&](double x, double z) -> Vector2d {
        double x_min = grid.x(0, 0);
        double x_max = grid.x(0, grid.x.cols() - 1);
        double z_min = grid.z(0, 0);
        double z_max = grid.z(grid.z.rows() - 1, 0);
        
        if (x < x_min || x > x_max || z < z_min || z > z_max) {
            return Vector2d(0, 0);
        }
        
        int nx = grid.x.cols();
        int nz = grid.z.rows();
        
        double dx = (x_max - x_min) / (nx - 1);
        double dz = (z_max - z_min) / (nz - 1);
        
        int i = std::min(std::max(0, (int)((z - z_min) / dz)), nz - 2);
        int j = std::min(std::max(0, (int)((x - x_min) / dx)), nx - 2);
        
        double fx = (x - grid.x(0, j)) / dx;
        double fz = (z - grid.z(i, 0)) / dz;
        
        if (std::isnan(field.u(i, j)) || std::isnan(field.u(i+1, j)) ||
            std::isnan(field.u(i, j+1)) || std::isnan(field.u(i+1, j+1))) {
            return Vector2d(0, 0);
        }
        
        double u = (1-fx)*(1-fz)*field.u(i,j) + fx*(1-fz)*field.u(i,j+1) +
                   (1-fx)*fz*field.u(i+1,j) + fx*fz*field.u(i+1,j+1);
        double v = (1-fx)*(1-fz)*field.v(i,j) + fx*(1-fz)*field.v(i,j+1) +
                   (1-fx)*fz*field.v(i+1,j) + fx*fz*field.v(i+1,j+1);
        
        return Vector2d(u, v);
    };
    
    for (int step = 0; step < max_steps; ++step) {
        Vector2d vel = interpolate_velocity(pos(0), pos(1));
        
        if (vel.norm() < 1e-6) break;
        
        Vector2d k1 = vel;
        Vector2d k2 = interpolate_velocity(pos(0) + 0.5*dt*k1(0), pos(1) + 0.5*dt*k1(1));
        Vector2d k3 = interpolate_velocity(pos(0) + 0.5*dt*k2(0), pos(1) + 0.5*dt*k2(1));
        Vector2d k4 = interpolate_velocity(pos(0) + dt*k3(0), pos(1) + dt*k3(1));
        
        pos += dt/6.0 * (k1 + 2*k2 + 2*k3 + k4);
        points.push_back(pos);
        
        if (pos(0) < grid.x(0, 0) || pos(0) > grid.x(0, grid.x.cols()-1) ||
            pos(1) < grid.z(0, 0) || pos(1) > grid.z(grid.z.rows()-1, 0)) {
            break;
        }
    }
    
    MatrixXd streamline(points.size(), 2);
    for (size_t i = 0; i < points.size(); ++i) {
        streamline.row(i) = points[i].transpose();
    }
    
    return streamline;
}

struct PanelAnalysis {
    MatrixXd airfoil_coords;
    VectorXd mu;
    double cl;
    VelocityField stream_field;
    MeshGrid stream_grid;
    std::vector<MatrixXd> streamlines;
    std::string err;
};

PanelAnalysis analyze_airfoil(
    const std::string& naca_code,
    double u_fs,
    double aoa_deg,
    int n_panels,
    int n_streamlines = 20) {
   
    try {
        double aoa = aoa_deg * M_PI / 180.0;
        
        MatrixXd airfoil_coords = panelgen(naca_code, n_panels, aoa);
        
        VectorXd mu = solve_system(airfoil_coords, u_fs, n_panels, aoa);
        
        double cl = -2.0 * mu(n_panels) / u_fs;
        double coeff = 2; 
        double domain[4] = {-0.2 * coeff, 1.2 * coeff, -0.7 * coeff, 0.7 * coeff};
        MeshGrid stream_grid = create_mesh(domain[0], domain[1], domain[2], domain[3], 200, 200);
        
        VelocityField stream_field = calculate_velocity(
            stream_grid.x, stream_grid.z, mu, airfoil_coords, u_fs, aoa, n_panels);
        
        std::vector<MatrixXd> streamlines;
        double dt = 0.0001;
        int max_steps = 2000;
        
        for (int i = 0; i < n_streamlines; ++i) {
            double z0 = domain[2] + (domain[3] - domain[2]) * (i + 0.5) / n_streamlines;
            double x0 = domain[0];
            
            MatrixXd streamline = calculate_streamline(stream_field, stream_grid, x0, z0, dt, max_steps);
            if (streamline.rows() > 1) {
                streamlines.push_back(streamline);
            }
        }

        return {
            airfoil_coords,
            mu,
            cl,
            stream_field,
            stream_grid,
            streamlines,
            ""
        };
    } catch (const std::exception& e) {
        return {MatrixXd(), VectorXd(), 0.0, VelocityField(), MeshGrid(), {}, e.what()};
    }
}



EMSCRIPTEN_BINDINGS(panel_code) {

    function("matrix_rows", &matrix_rows);
    function("matrix_cols", &matrix_cols);
    function("matrix_coeff", &matrix_coeff);

    function("vector_coeff", &vector_coeff);
    function("vector_size", &vector_size);

    class_<MatrixXd>("MatrixXd")
        .constructor<int, int>()
        .function("rows", &MatrixXd::rows)
        .function("cols", &MatrixXd::cols);
    
    class_<VectorXd>("VectorXd")
        .constructor<int>()
        .function("size", &VectorXd::size);
    
    value_object<MeshGrid>("MeshGrid")
        .field("x", &MeshGrid::x)
        .field("z", &MeshGrid::z);
    
    value_object<VelocityField>("VelocityField")
        .field("u", &VelocityField::u)
        .field("v", &VelocityField::v);
    
    value_object<PanelAnalysis>("PanelAnalysis")
        .field("airfoil_coords", &PanelAnalysis::airfoil_coords)
        .field("mu", &PanelAnalysis::mu)
        .field("cl", &PanelAnalysis::cl)
        .field("stream_field", &PanelAnalysis::stream_field)
        .field("stream_grid", &PanelAnalysis::stream_grid)
        .field("streamlines", &PanelAnalysis::streamlines);
    
    register_vector<MatrixXd>("VectorMatrixXd");
    
    function("panelgen", &panelgen);
    function("solve_system", &solve_system);
    function("calculate_velocity", &calculate_velocity);
    function("analyze_airfoil", &analyze_airfoil);
    function("create_mesh", &create_mesh);

}
