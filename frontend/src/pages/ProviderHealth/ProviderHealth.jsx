import { useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  buildAnonymousSummary,
  getProviderAccessLog,
  getProviderConsent,
  getProviderSharing,
  logProviderAccess,
  setProviderConsent,
  setProviderSharing,
} from "../../services/providerHealthService";
import "./ProviderHealth.css";

const metricLabels = {
  heartRate: "Heart rate",
  spo2: "SpO₂",
  temperature: "Body temperature",
  activity: "Activity",
  sleep: "Sleep",
  risk: "AI risk level",
  location: "Location",
  identity: "Identifiable profile",
};

function ProviderHealth() {
  const [consent, setConsent] = useState(getProviderConsent());
  const [sharing, setSharing] = useState(getProviderSharing());
  const [refresh, setRefresh] = useState(0);
  const summary = useMemo(() => buildAnonymousSummary(), [refresh]);
  const accessLog = useMemo(() => getProviderAccessLog(), [refresh]);

  function updateConsent(enabled) {
    setProviderConsent(enabled);
    setConsent(enabled);
    logProviderAccess(enabled ? "CONSENT_GRANTED" : "CONSENT_REVOKED", "Provider access preference changed");
    setRefresh((v) => v + 1);
  }

  function updateSharing(key) {
    const next = { ...sharing, [key]: !sharing[key] };
    setSharing(next);
    setProviderSharing(next);
    logProviderAccess("SHARING_UPDATED", `${metricLabels[key]} sharing ${next[key] ? "enabled" : "disabled"}`);
    setRefresh((v) => v + 1);
  }

  function openAggregateView() {
    logProviderAccess("AGGREGATE_VIEW", "Anonymous aggregate health summary viewed");
    setRefresh((v) => v + 1);
  }

  function openIdentifiableView() {
    if (!consent) return;
    logProviderAccess("IDENTIFIABLE_VIEW", "Consent-authorized provider summary viewed");
    setRefresh((v) => v + 1);
  }

  return (
    <DashboardLayout>
      <section className="provider-hero">
        <div>
          <span className="provider-label">PHASE 10 · PROVIDER & PUBLIC HEALTH</span>
          <h2>Privacy-first health data sharing</h2>
          <p>
            Providers can review anonymous population-level patterns by default. Identifiable health details stay locked until you explicitly grant access.
          </p>
        </div>
        <div className={`privacy-badge ${consent ? "enabled" : "locked"}`}>
          <span /> {consent ? "Provider access enabled" : "Provider access locked"}
        </div>
      </section>

      <section className="provider-grid">
        <article className="provider-card aggregate-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">DEFAULT VIEW</span>
              <h3>Anonymous health overview</h3>
            </div>
            <span className="shield">◇</span>
          </div>
          <p className="muted">No name, email, exact location, or personal profile is shown in this view.</p>
          <div className="stats-grid">
            <div><strong>{summary.sampleCount}</strong><span>Local readings</span></div>
            <div><strong>{summary.averageHeartRate ?? "—"}</strong><span>Avg. heart rate</span></div>
            <div><strong>{summary.averageSpO2 ?? "—"}</strong><span>Avg. SpO₂</span></div>
            <div><strong>{summary.highRiskAlerts}</strong><span>High-risk events</span></div>
          </div>
          <button className="secondary-button" onClick={openAggregateView}>Record aggregate view</button>
        </article>

        <article className="provider-card consent-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">EXPLICIT ACCESS</span>
              <h3>Provider access control</h3>
            </div>
          </div>
          <p className="muted">You control whether a provider may access identifiable information.</p>
          <label className="toggle-row main-toggle">
            <span><strong>Allow identifiable provider access</strong><small>Off by default</small></span>
            <input type="checkbox" checked={consent} onChange={(e) => updateConsent(e.target.checked)} />
            <i />
          </label>
          <button className="primary-button" disabled={!consent} onClick={openIdentifiableView}>Open authorized summary</button>
          {!consent && <div className="locked-note">🔒 Grant consent to unlock identifiable provider summaries.</div>}
        </article>
      </section>

      <section className="provider-card">
        <div className="section-title">
          <div><span className="eyebrow">GRANULAR CONTROL</span><h3>Choose what can be shared</h3></div>
          <span className="local-note">Stored locally</span>
        </div>
        <div className="sharing-grid">
          {Object.keys(metricLabels).map((key) => (
            <label className="toggle-row" key={key}>
              <span><strong>{metricLabels[key]}</strong><small>{key === "identity" ? "Name and profile details" : "Optional health signal"}</small></span>
              <input type="checkbox" checked={sharing[key]} onChange={() => updateSharing(key)} />
              <i />
            </label>
          ))}
        </div>
      </section>

      <section className="provider-card audit-card">
        <div className="section-title">
          <div><span className="eyebrow">TRANSPARENCY</span><h3>Access activity</h3></div>
          <span className="audit-count">{accessLog.length} events</span>
        </div>
        {accessLog.length === 0 ? (
          <p className="muted">No provider access has been recorded yet.</p>
        ) : (
          <div className="audit-list">
            {accessLog.slice(0, 8).map((item) => (
              <div className="audit-item" key={item.id}>
                <span className="audit-dot" />
                <div><strong>{item.type.replaceAll("_", " ")}</strong><span>{item.detail}</span></div>
                <time>{new Date(item.timestamp).toLocaleString()}</time>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="provider-disclaimer">
        <strong>Privacy boundary:</strong> This Phase 10 interface demonstrates consent, granular sharing, anonymous aggregation, and access logging. It does not establish a real clinical/public-health exchange or replace legal, regulatory, or healthcare-provider authorization requirements.
      </section>
    </DashboardLayout>
  );
}

export default ProviderHealth;
