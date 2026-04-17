import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Database, Home, Info } from 'lucide-react';

const Settings = () => {
    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem' }}>Settings</h1>
                <p style={{ color: 'var(--text-muted)' }}>Configure your shop details and application preferences.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="nav-link active" style={{ margin: 0 }}>
                        <Home size={20} /> Shop Profile
                    </div>
                    <div className="nav-link" style={{ margin: 0 }}>
                        <Bell size={20} /> Notifications
                    </div>
                    <div className="nav-link" style={{ margin: 0 }}>
                        <Shield size={20} /> Security
                    </div>
                    <div className="nav-link" style={{ margin: 0 }}>
                        <Database size={20} /> Backup & Sync
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Shop Profile</h3>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Shop Name</label>
                                <input type="text" defaultValue="Vinay's Kitchen" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Owner Name</label>
                                <input type="text" defaultValue="Vinay Vallepu" />
                            </div>
                        </div>
                        
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Address</label>
                            <textarea defaultValue="123 Tiffin Street, Food Hub, City" rows={3} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Currency Symbol</label>
                                <input type="text" defaultValue="₹" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Tax Percentage (%)</label>
                                <input type="number" defaultValue="0" />
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <Info size={20} color="var(--secondary)" style={{ marginTop: '2px' }} />
                            <div>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>Data Backup</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your data is stored locally in PostgreSQL (`vinay_db`). We recommend daily backups.</p>
                            </div>
                        </div>

                        <button className="btn-primary" type="button" style={{ alignSelf: 'flex-start' }}>
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
