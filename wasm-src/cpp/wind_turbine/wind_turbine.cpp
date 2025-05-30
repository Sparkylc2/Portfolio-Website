#include <iostream>
#include <fstream>
#include <vector>
#include <cmath>
#include <algorithm>
#include <string>
#include <map>
#include <sstream>

#include <emscripten/emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
using namespace emscripten;

struct PolarPoint
{
    double alpha;
    double cl;
    double cd;
};

struct AirfoilPolar
{
    std::string name;
    std::vector<PolarPoint> data;
};

bool DEBUG_POLARS = false;

class ViternaExtrapolator
{
private:
    std::vector<double> alphas;
    std::vector<double> c_ls;
    std::vector<double> c_ds;
    double alpha_min_orig;
    double alpha_max_orig;
    double cr75;

    void build_tables(const AirfoilPolar &polar_in, int nalpha)
    {
        if (polar_in.data.empty())
            return;

        alpha_min_orig = polar_in.data.front().alpha;
        alpha_max_orig = polar_in.data.back().alpha;

        std::vector<double> a_orig, cl_orig, cd_orig;
        for (const auto &pt : polar_in.data)
        {
            a_orig.push_back(pt.alpha);
            cl_orig.push_back(pt.cl);
            cd_orig.push_back(pt.cd);
        }

        double AR = 1.0 / cr75;
        double cd_max = std::max(*std::max_element(cd_orig.begin(), cd_orig.end()),
                                 1.11 + 0.018 * AR);

        auto it_ps = std::max_element(cl_orig.begin(), cl_orig.end());
        int i_ps = std::distance(cl_orig.begin(), it_ps);
        double cl_ps = cl_orig[i_ps];
        double cd_ps = cd_orig[i_ps];
        double a_ps = a_orig[i_ps];

        int i_ns = 0;
        for (int i = 0; i < i_ps; ++i)
        {
            if (cl_orig[i] < cl_orig[i_ns])
                i_ns = i;
        }
        double cl_ns = cl_orig[i_ns];
        double cd_ns = cd_orig[i_ns];
        double a_ns = a_orig[i_ns];

        double a_ps_rad = a_ps * M_PI / 180.0;
        double a_ns_rad = a_ns * M_PI / 180.0;

        double B1pos = cd_max;
        double A1pos = 0.5 * B1pos;
        double A2pos = (cl_ps - cd_max * sin(a_ps_rad) * cos(a_ps_rad)) *
                       sin(a_ps_rad) / (cos(a_ps_rad) * cos(a_ps_rad));
        double B2pos = (cd_ps - cd_max * sin(a_ps_rad) * sin(a_ps_rad)) / cos(a_ps_rad);

        double B1neg = cd_max;
        double A1neg = 0.5 * B1neg;
        double A2neg = (cl_ns - cd_max * sin(a_ns_rad) * cos(a_ns_rad)) *
                       sin(a_ns_rad) / (cos(a_ns_rad) * cos(a_ns_rad));
        double B2neg = (cd_ns - cd_max * sin(a_ns_rad) * sin(a_ns_rad)) / cos(a_ns_rad);

        double da_pos = (180.0 - alpha_max_orig) / nalpha;
        double da_neg = (180.0 + alpha_min_orig) / nalpha;

        for (int i = nalpha - 1; i >= 0; --i)
        {
            double a = alpha_min_orig - (i + 1) * da_neg;
            double a_rad = a * M_PI / 180.0;
            double cl = A1neg * sin(2 * a_rad) + A2neg * cos(a_rad) * cos(a_rad) /
                                                     std::max(1e-6, sin(a_rad));
            double cd = cd_max * sin(a_rad) * sin(a_rad) + B2neg * cos(a_rad);

            alphas.push_back(a);
            c_ls.push_back(cl);
            c_ds.push_back(cd);
        }

        for (size_t i = 0; i < a_orig.size(); ++i)
        {
            alphas.push_back(a_orig[i]);
            c_ls.push_back(cl_orig[i]);
            c_ds.push_back(cd_orig[i]);
        }

        for (int i = 0; i < nalpha; ++i)
        {
            double a = alpha_max_orig + (i + 1) * da_pos;
            double a_rad = a * M_PI / 180.0;
            double cl = A1pos * sin(2 * a_rad) + A2pos * cos(a_rad) * cos(a_rad) /
                                                     std::max(1e-6, sin(a_rad));
            double cd = cd_max * sin(a_rad) * sin(a_rad) + B2pos * cos(a_rad);

            alphas.push_back(a);
            c_ls.push_back(cl);
            c_ds.push_back(cd);
        }
    }

public:
    ViternaExtrapolator(const AirfoilPolar &polar, double cr75_val, int n_alpha = 50)
        : cr75(cr75_val)
    {
        build_tables(polar, n_alpha);
    }

    std::pair<double, double> get_coefficients(double alpha_deg) const
    {
        alpha_deg = fmod(alpha_deg + 180.0, 360.0);
        if (alpha_deg < 0.0)
            alpha_deg += 360.0;
        alpha_deg -= 180.0;

        auto it = std::lower_bound(alphas.begin(), alphas.end(), alpha_deg);
        if (it == alphas.begin())
            return {c_ls.front(), c_ds.front()};
        if (it == alphas.end())
            return {c_ls.back(), c_ds.back()};

        size_t i = std::distance(alphas.begin(), it);
        double a0 = alphas[i - 1], a1 = alphas[i];
        double t = (alpha_deg - a0) / (a1 - a0);

        return {
            c_ls[i - 1] + (c_ls[i] - c_ls[i - 1]) * t,
            c_ds[i - 1] + (c_ds[i] - c_ds[i - 1]) * t};
    }

    bool is_in_original_range(double alpha_deg) const
    {
        return alpha_deg >= alpha_min_orig && alpha_deg <= alpha_max_orig;
    }
};

class BladeSection
{
public:
    double radial_position;
    double chord_length;
    double twist_angle;
    double differential_radius;

    double alpha;
    double cl;
    double cd;
    double cn;
    double ct;

    double a;
    double a_prime;

    double phi;
    double w;
    double local_tsr;
    double local_solidity;

    double differential_thrust;
    double differential_torque;

    AirfoilPolar *polar;
    ViternaExtrapolator *extrapolator;

    BladeSection(double r, double c, double twist, double dr, AirfoilPolar *p, double rotor_radius)
        : radial_position(r), chord_length(c), twist_angle(twist),
          differential_radius(dr), polar(p), a(1.0 / 3.0), a_prime(0.0)
    {

        double cr75 = chord_length / (rotor_radius * 0.75);
        if (polar && !polar->data.empty())
        {
            extrapolator = new ViternaExtrapolator(*polar, cr75);
        }
        else
        {
            extrapolator = nullptr;
        }
    }

    ~BladeSection()
    {
        delete extrapolator;
    }

    void update_cl_cd()
    {
        double alpha_deg = alpha * 180.0 / M_PI;

        if (DEBUG_POLARS)
        {
            std::cout << "Looking up alpha = " << alpha_deg << " degrees\n";
            std::cout << "extrapolator = " << (extrapolator ? "available" : "not available") << "\n";
        }

        if (extrapolator)
        {
            auto [cl_val, cd_val] = extrapolator->get_coefficients(alpha_deg);
            cl = cl_val;
            cd = cd_val;
            if (DEBUG_POLARS && !extrapolator->is_in_original_range(alpha_deg))
            {
                std::cout << "Using Viterna extrapolation\n";
            }
        }
        else
        {
            if (DEBUG_POLARS)
            {
                std::cout << "Using flat plate theory\n";
            }
            cl = 2.0 * M_PI * alpha;
            cd = 0.01 + 0.05 * alpha * alpha;
        }

        if (DEBUG_POLARS)
        {
            std::cout << "cl = " << cl << ", cd = " << cd << "\n";
        }
    }
};

class Rotor
{
public:
    double radius;
    double hub_radius;
    int num_blades;

    double wind_speed;
    double tsr;
    double angular_velocity;

    double density;

    std::vector<BladeSection> sections;

    double thrust;
    double torque;
    double power;
    double cp;

    Rotor() : density(1.225), thrust(0), torque(0), power(0), cp(0) {}

    void initialize(double r, double r_hub, int n_blades, double v_wind, double tip_sr)
    {
        radius = r;
        hub_radius = r_hub;
        num_blades = n_blades;
        wind_speed = v_wind;
        tsr = tip_sr;
        angular_velocity = tsr * wind_speed / radius;
        sections.clear();
    }

    void add_section(double r, double chord, double twist_deg, AirfoilPolar *polar)
    {
        double dr;
        if (sections.empty())
        {
            dr = r - hub_radius;
        }
        else
        {
            dr = r - sections.back().radial_position;
        }

        sections.emplace_back(r, chord, twist_deg * M_PI / 180.0, dr, polar, radius);

        auto &sec = sections.back();
        sec.local_solidity = num_blades * chord / (2.0 * M_PI * r);
        sec.local_tsr = angular_velocity * r / wind_speed;
    }

    void run_bem()
    {
        thrust = 0;
        torque = 0;

        for (auto &sec : sections)
        {
            solve_section(sec);

            sec.differential_thrust = 0.5 * density * sec.w * sec.w * sec.cn *
                                      sec.chord_length * sec.differential_radius;
            sec.differential_torque = 0.5 * density * sec.w * sec.w * sec.ct *
                                      sec.chord_length * sec.radial_position *
                                      sec.differential_radius;

            thrust += sec.differential_thrust;
            torque += sec.differential_torque;
        }

        thrust *= num_blades;
        torque *= num_blades;

        power = torque * angular_velocity;
        double p_wind = 0.5 * density * M_PI * radius * radius *
                        wind_speed * wind_speed * wind_speed;
        cp = power / p_wind;
    }

private:
    void solve_section(BladeSection &sec)
    {
        sec.phi = atan2(1.0 - sec.a, sec.local_tsr * (1.0 + sec.a_prime));

        const int max_iter = 100;
        const double tolerance = 1e-10;

        for (int i = 0; i < max_iter; ++i)
        {
            sec.alpha = sec.phi - sec.twist_angle;

            sec.update_cl_cd();

            double sin_phi = sin(sec.phi);
            double cos_phi = cos(sec.phi);
            sec.cn = sec.cl * cos_phi + sec.cd * sin_phi;
            sec.ct = sec.cl * sin_phi - sec.cd * cos_phi;

            double F = prandtl_correction(sec);

            sin_phi = std::max(std::abs(sin_phi), 1e-6) * (sin_phi < 0 ? -1 : 1);
            cos_phi = std::max(std::abs(cos_phi), 1e-6) * (cos_phi < 0 ? -1 : 1);

            double a_new = sec.local_solidity * sec.cn /
                           (4.0 * F * sin_phi * sin_phi + sec.local_solidity * sec.cn);
            double ap_new = sec.local_solidity * sec.ct /
                            (4.0 * F * sec.local_tsr * sin_phi * sin_phi) * (1.0 - a_new);

            if (std::abs(a_new - sec.a) < tolerance &&
                std::abs(ap_new - sec.a_prime) < tolerance)
            {
                break;
            }

            sec.a = a_new;
            sec.a_prime = ap_new;

            sec.phi = atan2(1.0 - sec.a, sec.local_tsr * (1.0 + sec.a_prime));
        }

        double sin_phi = sin(sec.phi);
        double cos_phi = cos(sec.phi);
        double w1 = wind_speed * (1.0 - sec.a) / sin_phi;
        double w2 = angular_velocity * sec.radial_position * (1.0 + sec.a_prime) / cos_phi;
        sec.w = 0.5 * (w1 + w2);
    }

    double prandtl_correction(const BladeSection &sec)
    {
        double sin_phi = std::abs(sin(sec.phi));

        if (sin_phi < 1e-6)
        {
            return 1.0;
        }

        double f_tip = 0.5 * num_blades * (radius - sec.radial_position) /
                       (sec.radial_position * sin_phi);
        double f_hub = 0.5 * num_blades * (sec.radial_position - hub_radius) /
                       (sec.radial_position * sin_phi);

        double F_tip = (2.0 / M_PI) * acos(exp(-f_tip));
        double F_hub = (2.0 / M_PI) * acos(exp(-f_hub));

        return std::max(1e-4, F_tip * F_hub);
    }
};

std::map<std::string, AirfoilPolar> g_polars;
Rotor g_rotor;

void loadPolarData()
{
    g_polars.clear();

    AirfoilPolar naca2412;
    naca2412.name = "NACA2412";
    naca2412.data = {
        {-8, -0.6524, 0.01185},
        {-7.5, -0.5881, 0.01111},
        {-7, -0.5238, 0.01044},
        {-6.5, -0.4661, 0.00986},
        {-6, -0.4123, 0.00936},
        {-5.5, -0.3589, 0.00893},
        {-5, -0.3054, 0.00847},
        {-4.5, -0.2514, 0.00808},
        {-4, -0.1969, 0.00774},
        {-3.5, -0.1424, 0.0074},
        {-3, -0.0877, 0.00711},
        {-2.5, -0.033, 0.00685},
        {-2, 0.0218, 0.0066},
        {-1.5, 0.0765, 0.00638},
        {-1, 0.1303, 0.0061},
        {-0.5, 0.1839, 0.00583},
        {0, 0.2372, 0.00566},
        {0.5, 0.29, 0.00554},
        {1, 0.3417, 0.0055},
        {1.5, 0.3926, 0.00558},
        {2, 0.4502, 0.00579},
        {2.5, 0.5177, 0.00606},
        {3, 0.5926, 0.00635},
        {3.5, 0.667, 0.00666},
        {4, 0.715, 0.00694},
        {4.5, 0.7626, 0.0073},
        {5, 0.8097, 0.00777},
        {5.5, 0.8561, 0.00835},
        {6, 0.9024, 0.00906},
        {6.5, 0.9485, 0.00987},
        {7, 0.9949, 0.01071},
        {7.5, 1.0414, 0.01154},
        {8, 1.0879, 0.01235}};
    g_polars["NACA2412"] = naca2412;

    AirfoilPolar naca0012;
    naca0012.name = "NACA0012";
    naca0012.data = {
        {-8, -0.91, 0.01217},
        {-7.5, -0.8683, 0.01157},
        {-7, -0.8268, 0.01099},
        {-6.5, -0.7638, 0.01038},
        {-6, -0.6943, 0.00977},
        {-5.5, -0.6264, 0.00914},
        {-5, -0.5562, 0.00848},
        {-4.5, -0.49, 0.00786},
        {-4, -0.4286, 0.0073},
        {-3.5, -0.3725, 0.00681},
        {-3, -0.3202, 0.0064},
        {-2.5, -0.2676, 0.00608},
        {-2, -0.2145, 0.00582},
        {-1.5, -0.1611, 0.00563},
        {-1, -0.1075, 0.0055},
        {-0.5, -0.0537, 0.00543},
        {0, 0, 0.00541},
        {0.5, 0.0537, 0.00543},
        {1, 0.1075, 0.0055},
        {1.5, 0.1611, 0.00563},
        {2, 0.2145, 0.00582},
        {2.5, 0.2676, 0.00608},
        {3, 0.3202, 0.0064},
        {3.5, 0.3726, 0.00681},
        {4, 0.4286, 0.0073},
        {4.5, 0.49, 0.00786},
        {5, 0.5563, 0.00848},
        {5.5, 0.6264, 0.00914},
        {6, 0.6943, 0.00977},
        {6.5, 0.7639, 0.01038},
        {7, 0.8267, 0.01099},
        {7.5, 0.8682, 0.01157},
        {8, 0.9099, 0.01217}};
    g_polars["NACA0012"] = naca0012;
}

void initializeRotor(double radius, double hub_radius, int num_blades,
                     double wind_speed, double tsr)
{
    g_rotor.initialize(radius, hub_radius, num_blades, wind_speed, tsr);
}

void addBladeSection(double r, double chord, double twist_deg, std::string airfoil)
{
    AirfoilPolar *polar = nullptr;
    auto it = g_polars.find(airfoil);
    if (it != g_polars.end())
    {
        polar = &it->second;
    }
    g_rotor.add_section(r, chord, twist_deg, polar);
}

void clearBladeSections()
{
    g_rotor.sections.clear();
}

val runBEM()
{
    try
    {
        loadPolarData();
        g_rotor.run_bem();

        val result = val::object();
        result.set("thrust", g_rotor.thrust);
        result.set("torque", g_rotor.torque);
        result.set("power", g_rotor.power);
        result.set("cp", g_rotor.cp);

        val sections = val::array();
        sections.set("length", g_rotor.sections.size());

        for (size_t i = 0; i < g_rotor.sections.size(); ++i)
        {
            const BladeSection &sec = g_rotor.sections[i];

            val jsSec = val::object();
            jsSec.set("r", sec.radial_position);
            jsSec.set("a", sec.a);
            jsSec.set("a_prime", sec.a_prime);
            jsSec.set("alpha", sec.alpha * 180.0 / M_PI);
            jsSec.set("cl", sec.cl);
            jsSec.set("cd", sec.cd);
            jsSec.set("thrust", sec.differential_thrust);
            jsSec.set("torque", sec.differential_torque);

            sections.set(i, jsSec);
        }
        result.set("sections", sections);

        return result;
    }
    catch (const std::exception &e)
    {
        std::cout << "Exception in runBEM: " << e.what() << std::endl;
        val error = val::object();
        error.set("error", e.what());
        return error;
    }
    catch (...)
    {
        std::cout << "Unknown exception in runBEM" << std::endl;
        val error = val::object();
        error.set("error", "Unknown error occurred");
        return error;
    }
}

void setDebugMode(bool debug)
{
    DEBUG_POLARS = debug;
}

EMSCRIPTEN_BINDINGS(bem_module)
{
    function("loadPolarData", &loadPolarData);
    function("initializeRotor", &initializeRotor);
    function("addBladeSection", &addBladeSection);
    function("clearBladeSections", &clearBladeSections);
    function("runBEM", &runBEM);
    function("setDebugMode", &setDebugMode);
}
