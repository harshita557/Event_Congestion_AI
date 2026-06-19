import { useState, useEffect } from "react";
import axios from "axios";

import MapView from "./components/MapView";

import {
  ShieldAlert,
  Users,
  Construction,
  Route,
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle,
  MapPin,
  LayoutDashboard,
  Map,
  History,
  Brain,
  Sun,
  Moon
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import "./index.css";

const RISK_LEVELS = ["HIGH", "MEDIUM", "LOW"];

// The one signature element this UI is built around: a real traffic
// signal, used as the risk readout instead of a generic colored box.
function SignalLens({ risk }) {
  return (
    <div className="signal-lens" role="img" aria-label={`Risk level: ${risk}`}>
      {RISK_LEVELS.map((level) => (
        <span
          key={level}
          className={`signal-dot ${level === "HIGH" ? "red" : level === "MEDIUM" ? "amber" : "green"} ${
            risk === level ? "lit" : ""
          }`}
        />
      ))}
    </div>
  );
}

function App() {
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(true); // Theme state

  useEffect(() => {
    loadHistory();
    loadAnalytics();
  }, []);

  function update(e) {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox"
        ? (checked ? 1 : 0)
        : (type === "number" ? Number(value) : value)
    });
  }

  async function predict() {
    try {
      const res = await axios.post("http://127.0.0.1:8000/predict", form);
      setResult(res.data);
      loadHistory();
      loadAnalytics();
    } catch (err) {
      alert("Prediction failed");
    }
  }

  async function loadHistory() {
    const res = await axios.get("http://127.0.0.1:8000/history");
    setHistory(res.data);
  }

  async function loadAnalytics() {
    const res = await axios.get("http://127.0.0.1:8000/analytics");
    setAnalytics(res.data);
  }

  const [form, setForm] = useState({
    event_type: "planned",
    event_cause: "public_event",
    zone: "Central Zone 1",
    requires_road_closure: 0,
    duration: 120,
    hour: 18
  });

  const chartData = result ? [
    { name: "Police", value: result.plan.police },
    { name: "Marshals", value: result.plan.marshals },
    { name: "Barricades", value: result.plan.barricades }
  ] : [
    { name: "Police", value: 0 },
    { name: "Marshals", value: 0 },
    { name: "Barricades", value: 0 }
  ];

  const filteredHistory = history.filter((event) => {
    const matchesSearch = event.event_cause
      ? event.event_cause.toLowerCase().includes(searchTerm.toLowerCase())
      : false;

    const matchesRisk = riskFilter === "ALL" ? true : event.risk === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className={`layout-wrapper ${isDarkMode ? "dark-theme" : "light-theme"}`}>
      <div className="layout">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <span className="signal-dot red lit" />
              <span className="signal-dot amber lit" />
              <span className="signal-dot green lit" />
            </span>
            <div className="brand-text">
              <span className="brand-name">Signal</span>
              <span className="brand-sub">Command Center</span>
            </div>
          </div>

          <div className="nav-label">Navigate</div>
          <div className={`menu ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}>
            <LayoutDashboard />
            Dashboard
          </div>
          <div className={`menu ${activeTab === "map" ? "active" : ""}`}
            onClick={() => setActiveTab("map")}
          >
            <Map />
            Traffic Map
          </div>
          <div className={`menu ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <History />
            History
          </div>
          <div className={`menu ${activeTab === "ai" ? "active" : ""}`}
            onClick={() => setActiveTab("ai")}
          >
            <Brain />
            AI Model
          </div>

          {/* THEME TOGGLE BUTTON */}
          <div className="menu theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)} style={{ marginTop: "auto" }}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </div>

          <div className="status-block" style={{ marginTop: "15px" }}>
            <div className="status-row">
              <span className="status-pulse" />
              <span>Model active</span>
            </div>
            <p className="status-detail">Connected to the prediction API and reading live event history.</p>
          </div>
        </div>

        {/* MAIN CONTAINER */}
        <div className="main">
          {/* TOPBAR */}
          <div className="topbar">
            <div>
              <h1>Event Congestion Command Center</h1>
              <p>Forecasts traffic risk and staffing for planned events and incidents</p>
            </div>
            <div className="live-status">
              <div className="live-dot" />
              Live data
            </div>
          </div>

          {/* STATS OVERVIEW (Shown on Dashboard only) */}
          {activeTab === "dashboard" && analytics && (
            <div className="stats">
              <div>
                <div className="stat-icon teal"><TrendingUp size={18} /></div>
                <h3>Total Events</h3>
                <h1>{analytics.total_events}</h1>
              </div>
              <div>
                <div className="stat-icon red"><AlertTriangle size={18} /></div>
                <h3>High Risk Events</h3>
                <h1 className="text-red">{analytics.high_risk}</h1>
              </div>
              <div>
                <div className="stat-icon amber"><MapPin size={18} /></div>
                <h3>Top Hotspot</h3>
                <h2 className="text-amber">{analytics.top_zone}</h2>
              </div>
            </div>
          )}

          {/* WORKSPACE GRID (Planner & HUD - Shown on Dashboard only) */}
          {activeTab === "dashboard" && (
            <div className="grid">
              {/* EVENT PLANNER FORM */}
              <div className="panel">
                <h2>Event Planner</h2>
                <div className="form-group">
                  <label className="input-label">Event Type</label>
                  <select name="event_type" value={form.event_type} onChange={update}>
                    <option value="planned">Planned event</option>
                    <option value="unplanned">Unplanned incident</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="input-label">Cause</label>
                  <select name="event_cause" value={form.event_cause} onChange={update}>
                    <option value="public_event">Public event</option>
                    <option value="procession">Procession</option>
                    <option value="protest">Protest</option>
                    <option value="accident">Accident</option>
                    <option value="construction">Construction</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="input-label">Zone</label>
                  <select name="zone" value={form.zone} onChange={update}>
                    <option value="Central Zone 1">Central Zone 1</option>
                    <option value="Central Zone 2">Central Zone 2</option>
                    <option value="North Zone 1">North Zone 1</option>
                    <option value="South Zone 1">South Zone 1</option>
                    <option value="East Zone 1">East Zone 1</option>
                    <option value="West Zone 1">West Zone 1</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="input-label">Duration (minutes)</label>
                  <input type="number" name="duration" value={form.duration} onChange={update} placeholder="Duration" />
                </div>

                <div className="form-group">
                  <label className="input-label">Hour of day (0–23)</label>
                  <input type="number" name="hour" value={form.hour} onChange={update} min="0" max="23" placeholder="Hour" />
                </div>

                <label className="checkbox-container">
                  <input type="checkbox" name="requires_road_closure" checked={form.requires_road_closure === 1} onChange={update} />
                  <span>Requires road closure</span>
                </label>

                <button onClick={predict}>Run Prediction</button>
              </div>

              {/* AI PREDICTION HUD */}
              <div className="panel flex-col-justify">
                <h2>Risk Prediction</h2>
                {result ? (
                  <>
                    <div className={"risk-readout " + result.risk.toLowerCase()}>
                      <SignalLens risk={result.risk} />
                      <h1>{result.risk} RISK</h1>
                      <p>Confidence — {result.confidence}%</p>
                    </div>

                    <div className="resources">
                      <div>
                        <Users size={16} />
                        <h3>Police</h3>
                        <h1>{result.plan.police}</h1>
                      </div>
                      <div>
                        <Users size={16} />
                        <h3>Marshals</h3>
                        <h1>{result.plan.marshals}</h1>
                      </div>
                      <div>
                        <Construction size={16} />
                        <h3>Barricades</h3>
                        <h1>{result.plan.barricades}</h1>
                      </div>
                    </div>

                    <div className="diversion">
                      <Route size={18} />
                      <span><strong>Suggested diversion:</strong> {result.plan.diversion}</span>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <ShieldAlert size={28} />
                    <p>No prediction yet</p>
                    <span>Fill in the event details and run a prediction to see risk level and staffing.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SIDE-BY-SIDE VISUALIZATION CONTAINER (Shown on Dashboard Only) */}
          {activeTab === "dashboard" && (
            <div className="bottom">
              <div className="panel">
                <h2>Traffic Heat Map</h2>
                <div className="map-wrapper">
                  <MapView history={history} />
                </div>
              </div>

              <div className="panel">
                <h2>Resource Forecast</h2>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#8c96ac" fontSize={11} tickLine={false} />
                      <YAxis stroke="#8c96ac" fontSize={11} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#0c111c' : '#ffffff', 
                          borderColor: isDarkMode ? '#232f47' : '#e2e8f0', 
                          color: isDarkMode ? '#eef2f8' : '#1a202c', 
                          borderRadius: '8px' 
                        }}
                      />
                      <Bar dataKey="value" fill="#4fd1c5" radius={[4, 4, 0, 0]} barSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* FULL HORIZONTAL STACK VIEW (Shown on Traffic Map Tab Only) */}
          {activeTab === "map" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="panel" style={{ width: "100%" }}>
                <h2>Traffic Heat Map</h2>
                <div className="map-wrapper">
                  <MapView history={history} />
                </div>
              </div>

              <div className="panel" style={{ width: "100%" }}>
                <h2>Resource Forecast</h2>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#8c96ac" fontSize={11} tickLine={false} />
                      <YAxis stroke="#8c96ac" fontSize={11} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#0c111c' : '#ffffff', 
                          borderColor: isDarkMode ? '#232f47' : '#e2e8f0', 
                          color: isDarkMode ? '#eef2f8' : '#1a202c', 
                          borderRadius: '8px' 
                        }}
                      />
                      <Bar dataKey="value" fill="#4fd1c5" radius={[4, 4, 0, 0]} barSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* HISTORY DATA TABLE CONTAINER (Shown on Dashboard or History Tab) */}
          {(activeTab === "dashboard" || activeTab === "history") && (
            <div className="panel">
              <div className="panel-header-row">
                <h2>Event History</h2>
                <div className="history-controls">
                  <input type="text" placeholder="Search by cause..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
                    <option value="ALL">All risk levels</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <p className="table-meta">
                {history.length} logged &nbsp;·&nbsp; {filteredHistory.length} matching filters
              </p>

              <div className="tablebox">
                <table>
                  <thead>
                    <tr>
                      <th>Cause</th>
                      <th>Zone</th>
                      <th style={{ textAlign: 'center' }}>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length > 0 ? (
                      filteredHistory.map((e, idx) => (
                        <tr key={e._id || idx}>
                          <td className="capitalize">{e.event_cause ? e.event_cause.replace('_', ' ') : 'Unknown'}</td>
                          <td>{e.zone}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${e.risk ? e.risk.toLowerCase() : 'low'}`}>
                              <span className="badge-dot" />
                              {e.risk || 'LOW'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#525d76', fontStyle: 'italic' }}>
                          No events match these filters yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI MODEL TELEMETRY META (Shown on Dashboard or AI Tab) */}
          {(activeTab === "dashboard" || activeTab === "ai") && (
            <div className="panel explanation-panel">
              <h2>Model Factors</h2>
              <div className="explanation-grid">
                <p><Activity size={16} /> Event type and cause are weighted by how often they've led to high-risk congestion.</p>
                <p><Clock size={16} /> Hour of day adjusts the score for rush-hour and off-peak traffic.</p>
                <p><Construction size={16} /> Road closures add directly to staffing and barricade recommendations.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;