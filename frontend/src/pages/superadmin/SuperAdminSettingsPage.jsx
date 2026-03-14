import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { ChevronLeft, Save, Mail, CreditCard, Database } from 'lucide-react';

const SuperAdminSettingsPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    generalSettings: {
      platformName: 'Cricket Tournament Platform',
      platformDescription: 'A comprehensive platform for managing cricket tournaments',
      maintenanceMode: false,
      maxTournamentsPerOrganizer: 10,
      maxPlayersPerTeam: 15,
    },
    emailSettings: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUsername: 'noreply@cricket.com',
      enableEmailNotifications: true,
      emailFrom: 'Cricket Platform <noreply@cricket.com>',
    },
    paymentSettings: {
      paymentGateway: 'Stripe',
      currency: 'USD',
      enablePayments: true,
      transactionFee: 2.5,
    },
    backupSettings: {
      autoBackupEnabled: true,
      backupFrequency: 'daily',
      lastBackup: '2024-02-05 02:00:00',
      backupRetention: 30,
    },
  });

  const [saveStatus, setSaveStatus] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const handleSaveSettings = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    }, 1000);
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      }
    }));
  };

  const InputField = ({ label, value, onChange, type = 'text', disabled = false }) => (
    <div className="mb-4">
      <label className="text-gray-400 text-sm mb-2 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-4 py-2 bg-dark-input border border-gold/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold disabled:opacity-50"
      />
    </div>
  );

  const ToggleField = ({ label, value, onChange }) => (
    <div className="mb-4 flex items-center justify-between">
      <label className="text-gray-400 text-sm">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-block w-12 h-6 rounded-full transition ${value ? 'bg-gold' : 'bg-dark-input border border-gold/20'
          }`}
      >
        <motion.span
          layout
          className="absolute top-1 left-1 w-4 h-4 bg-dark-bg rounded-full"
          animate={{ x: value ? 16 : 0 }}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />

      <div className="py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <button
                onClick={() => navigate('/super-admin-dashboard')}
                className="p-3 bg-white/5 border border-white/10 hover:border-gold/50 rounded-xl transition-all group"
              >
                <ChevronLeft className="w-6 h-6 text-gold group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">Governance</h1>
                <p className="text-slate-400 font-medium tracking-wide">System Parameters • Global Configuration</p>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border border-gold/30 mb-8"
          >
            <div className="flex flex-wrap border-b border-gold/20">
              {[
                { id: 'general', label: 'General Settings', icon: '⚙️' },
                { id: 'email', label: 'Email Configuration', icon: '✉️' },
                { id: 'payment', label: 'Payment Settings', icon: '💳' },
                { id: 'backup', label: 'Backup & Restore', icon: '💾' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-semibold transition ${activeTab === tab.id
                      ? 'border-b-2 border-gold text-gold'
                      : 'text-gray-400 hover:text-gold'
                    }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-8">
              {/* General Settings */}
              {activeTab === 'general' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-xl font-bold text-white mb-6">General Platform Settings</h3>
                  <InputField
                    label="Platform Name"
                    value={settings.generalSettings.platformName}
                    onChange={(e) => handleInputChange('generalSettings', 'platformName', e.target.value)}
                  />
                  <div className="mb-4">
                    <label className="text-gray-400 text-sm mb-2 block">Platform Description</label>
                    <textarea
                      value={settings.generalSettings.platformDescription}
                      onChange={(e) => handleInputChange('generalSettings', 'platformDescription', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-input border border-gold/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold"
                      rows="4"
                    />
                  </div>
                  <InputField
                    label="Max Tournaments Per Organizer"
                    type="number"
                    value={settings.generalSettings.maxTournamentsPerOrganizer}
                    onChange={(e) => handleInputChange('generalSettings', 'maxTournamentsPerOrganizer', parseInt(e.target.value))}
                  />
                  <InputField
                    label="Max Players Per Team"
                    type="number"
                    value={settings.generalSettings.maxPlayersPerTeam}
                    onChange={(e) => handleInputChange('generalSettings', 'maxPlayersPerTeam', parseInt(e.target.value))}
                  />
                  <ToggleField
                    label="Maintenance Mode"
                    value={settings.generalSettings.maintenanceMode}
                    onChange={(value) => handleInputChange('generalSettings', 'maintenanceMode', value)}
                  />
                </motion.div>
              )}

              {/* Email Settings */}
              {activeTab === 'email' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Mail className="w-6 h-6 text-gold" />
                    Email Configuration
                  </h3>
                  <InputField
                    label="SMTP Host"
                    value={settings.emailSettings.smtpHost}
                    onChange={(e) => handleInputChange('emailSettings', 'smtpHost', e.target.value)}
                  />
                  <InputField
                    label="SMTP Port"
                    type="number"
                    value={settings.emailSettings.smtpPort}
                    onChange={(e) => handleInputChange('emailSettings', 'smtpPort', parseInt(e.target.value))}
                  />
                  <InputField
                    label="SMTP Username"
                    value={settings.emailSettings.smtpUsername}
                    onChange={(e) => handleInputChange('emailSettings', 'smtpUsername', e.target.value)}
                  />
                  <InputField
                    label="Email From"
                    value={settings.emailSettings.emailFrom}
                    onChange={(e) => handleInputChange('emailSettings', 'emailFrom', e.target.value)}
                  />
                  <ToggleField
                    label="Enable Email Notifications"
                    value={settings.emailSettings.enableEmailNotifications}
                    onChange={(value) => handleInputChange('emailSettings', 'enableEmailNotifications', value)}
                  />
                </motion.div>
              )}

              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-gold" />
                    Payment Configuration
                  </h3>
                  <InputField
                    label="Payment Gateway"
                    value={settings.paymentSettings.paymentGateway}
                    onChange={(e) => handleInputChange('paymentSettings', 'paymentGateway', e.target.value)}
                  />
                  <InputField
                    label="Currency"
                    value={settings.paymentSettings.currency}
                    onChange={(e) => handleInputChange('paymentSettings', 'currency', e.target.value)}
                  />
                  <InputField
                    label="Transaction Fee (%)"
                    type="number"
                    step="0.1"
                    value={settings.paymentSettings.transactionFee}
                    onChange={(e) => handleInputChange('paymentSettings', 'transactionFee', parseFloat(e.target.value))}
                  />
                  <ToggleField
                    label="Enable Payments"
                    value={settings.paymentSettings.enablePayments}
                    onChange={(value) => handleInputChange('paymentSettings', 'enablePayments', value)}
                  />
                </motion.div>
              )}

              {/* Backup Settings */}
              {activeTab === 'backup' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Database className="w-6 h-6 text-gold" />
                    Backup & Restore
                  </h3>
                  <ToggleField
                    label="Enable Auto Backup"
                    value={settings.backupSettings.autoBackupEnabled}
                    onChange={(value) => handleInputChange('backupSettings', 'autoBackupEnabled', value)}
                  />
                  <div className="mb-4">
                    <label className="text-gray-400 text-sm mb-2 block">Backup Frequency</label>
                    <select
                      value={settings.backupSettings.backupFrequency}
                      onChange={(e) => handleInputChange('backupSettings', 'backupFrequency', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-input border border-gold/20 rounded-lg text-white focus:outline-none focus:border-gold"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <InputField
                    label="Backup Retention (days)"
                    type="number"
                    value={settings.backupSettings.backupRetention}
                    onChange={(e) => handleInputChange('backupSettings', 'backupRetention', parseInt(e.target.value))}
                  />
                  <div className="mb-6 p-4 bg-gold/10 border border-gold/20 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">Last Backup</p>
                    <p className="text-white font-semibold">{settings.backupSettings.lastBackup}</p>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2 bg-gold/20 border border-gold/50 text-gold font-semibold rounded-lg hover:bg-gold/30 transition"
                    >
                      Create Backup Now
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2 bg-gold/20 border border-gold/50 text-gold font-semibold rounded-lg hover:bg-gold/30 transition"
                    >
                      View Backups
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 pt-6 border-t border-gold/20"
              >
                <div className="flex items-center justify-between">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveSettings}
                    className="px-8 py-3 bg-gold text-dark-bg font-bold rounded-lg hover:bg-gold/90 transition flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Settings
                  </motion.button>
                  {saveStatus && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`font-semibold ${saveStatus === 'saved' ? 'text-green-400' : 'text-gold'}`}
                    >
                      {saveStatus === 'saving' ? '✓ Saving...' : '✓ Settings saved!'}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettingsPage;
