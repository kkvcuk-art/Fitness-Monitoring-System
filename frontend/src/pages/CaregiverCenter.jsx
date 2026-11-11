import { useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { buildEmergencySummary, getCaregiverContacts, getEmergencyAlerts, getSharingConsent, saveCaregiverContacts, setSharingConsent } from "../services/caregiverService";
import "./CaregiverCenter.css";

export default function CaregiverCenter() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState(getCaregiverContacts);
  const [alerts] = useState(getEmergencyAlerts);
  const [consent, setConsent] = useState(getSharingConsent);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("Caregiver");

  const summary = useMemo(() => buildEmergencySummary({ patientName: user?.name || user?.fullName || "User", riskLevel: "HIGH", reason: "Emergency assistance requested" }), [user]);

  function addContact(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const next = [...contacts, { id: `${Date.now()}`, name: name.trim(), phone: phone.trim(), relationship }];
    saveCaregiverContacts(next); setContacts(next); setName(""); setPhone("");
  }
  function removeContact(id) {
    const next = contacts.filter(c => c.id !== id); saveCaregiverContacts(next); setContacts(next);
  }
  function toggleConsent() {
    const next = !consent; setSharingConsent(next); setConsent(next);
  }

  return <DashboardLayout>
    <div className="caregiver-page">
      <header><div><p className="eyebrow">EMERGENCY & SHARING</p><h1>Caregiver Center</h1><p>Control who can receive emergency information and review locally stored alerts.</p></div><div className={`consent-pill ${consent ? "on" : "off"}`}>{consent ? "Sharing enabled" : "Sharing disabled"}</div></header>
      <section className="privacy-card">
        <div><h2>Privacy-controlled emergency sharing</h2><p>Health information is not shared with caregivers unless you enable sharing. SOS can still be used manually when you choose.</p></div>
        <button onClick={toggleConsent}>{consent ? "Disable sharing" : "Enable sharing"}</button>
      </section>
      <div className="caregiver-grid">
        <section className="panel"><h2>Emergency contacts</h2><form onSubmit={addContact} className="contact-form"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Contact name"/><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number"/><select value={relationship} onChange={e=>setRelationship(e.target.value)}><option>Caregiver</option><option>Family</option><option>Doctor</option><option>Emergency Contact</option></select><button type="submit">Add contact</button></form><div className="contact-list">{contacts.length === 0 ? <p className="muted">No caregiver contacts configured.</p> : contacts.map(c=><div className="contact-row" key={c.id}><div><strong>{c.name}</strong><span>{c.relationship} · {c.phone}</span></div><button onClick={()=>removeContact(c.id)}>Remove</button></div>)}</div></section>
        <section className="panel"><h2>Emergency alert preview</h2><p className="muted">This is the information that can be shared after an SOS when sharing is enabled.</p><pre>{summary}</pre><p className="privacy-note">📍 Location is shared only when the user permits location access and includes it in the SOS.</p></section>
      </div>
      <section className="panel"><div className="section-head"><div><h2>Local emergency history</h2><p className="muted">Stored on this device for review.</p></div><span>{alerts.length} alerts</span></div>{alerts.length === 0 ? <p className="muted">No emergency alerts recorded on this device.</p> : alerts.map(a=><div className="alert-row" key={a.id}><strong>{a.riskLevel || "ALERT"}</strong><span>{a.reason || "Emergency assistance"}</span><time>{new Date(a.createdAt).toLocaleString()}</time></div>)}</section>
    </div>
  </DashboardLayout>;
}
