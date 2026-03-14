import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import AuthForm from '../../components/AuthForm';
import { useAuth } from '../../hooks/useAuth';
import {
  Trophy,
  Users,
  Zap,
  BarChart3,
  Cpu,
  Lock,
  Zap as Lightning,
  TrendingUp,
  Shield,
  Globe,
  Radio,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Database,
  Activity,
  Layers,
  Sword,
  Target
} from 'lucide-react';

const HomePage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const showAuth = searchParams.get('auth') === 'login';

  const setShowAuth = (val) => {
    if (val) setSearchParams({ auth: 'login' });
    else setSearchParams({});
  };

  const features = [
    {
      icon: <Cpu className="w-8 h-8 text-gold" />,
      title: 'Classification Engine',
      description: 'AI-assisted classification with deterministic fallback scoring to assign player performance tiers based on evaluation metrics.',
    },
    {
      icon: <Radio className="w-8 h-8 text-gold" />,
      title: 'Live Auction Sync',
      description: 'Real-time bidding synchronization using WebSocket communication for instantaneous updates across all connected team interfaces.',
    },
    {
      icon: <Activity className="w-8 h-8 text-gold" />,
      title: 'Real-time Telemetry',
      description: 'Dynamic leaderboards and player stats update instantly across the platform as tournaments and trials progress.',
    },
    {
      icon: <Layers className="w-8 h-8 text-gold" />,
      title: 'Role-Based Dashboard',
      description: 'Integrated interfaces for 5 distinct roles, designed for structured tournament management and resource oversight.',
    },
    {
      icon: <Shield className="w-8 h-8 text-gold" />,
      title: 'Access Management',
      description: 'JWT-based authentication and granular role-based access control protecting system datasets and administrative actions.',
    },
    {
      icon: <Globe className="w-8 h-8 text-gold" />,
      title: 'Modular Architecture',
      description: 'Built with a modern MERN stack core and modular Flask-based services for future scalability and cloud compatibility.',
    },
  ];

  const highlights = [
    { title: 'AI Classification', value: 'ML-Ready', label: 'Feature-Driven Scoring', color: 'text-gold' },
    { title: 'Bidding Sync', value: 'Real-time', label: 'WebSocket Protocol', color: 'text-blue-400' },
    { title: 'Architecture', value: 'MERN', label: 'Modular Stack', color: 'text-green-400' }
  ];

  if (showAuth && !user) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <AuthForm isLogin={true} onSuccess={() => setShowAuth(false)} />
            <button
              onClick={() => setShowAuth(false)}
              className="mt-6 w-full text-slate-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
            >
              ← Back to Home
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg selection:bg-gold/30 selection:text-white">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-40 overflow-hidden border-b border-white/5">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gold/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gold text-xs font-black uppercase tracking-[0.2em] mb-8"
            >
              <Zap className="w-3.5 h-3.5 fill-gold" /> Academic Project: AI Cricket Auction System
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black text-white mb-10 tracking-tight leading-[1.1]"
            >
              The Science of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold bg-[length:200%_auto] animate-shimmer">Victory.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mb-16 leading-relaxed"
            >
              Integrated auction system merging AI-assisted performance classification with real-time WebSocket bidding. Manage tournaments, track evaluations, and conduct live auctions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-8 mb-24"
            >
              {!user ? (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-12 py-5 bg-gold text-[#030712] font-black rounded-2xl shadow-[0_10px_40px_-10px_rgba(212,175,55,0.5)] hover:bg-[#c9a02d] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center gap-3"
                >
                  Initiate System <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <a
                  href="/dashboard"
                  className="px-12 py-5 bg-gold text-[#030712] font-black rounded-2xl shadow-[0_10px_40px_-10px_rgba(212,175,55,0.5)] hover:bg-[#c9a02d] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center gap-3"
                >
                  Enter Dashboard <ArrowRight className="w-5 h-5" />
                </a>
              )}
              <a
                href="#tech-stack"
                className="px-12 py-5 bg-white text-slate-900 dark:bg-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 font-black rounded-2xl hover:bg-gold hover:text-[#030712] hover:border-gold transition-all uppercase tracking-widest text-xs flex items-center justify-center min-w-[220px] shadow-xl"
              >
                Protocol Overview
              </a>
            </motion.div>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full border-t border-white/5 pt-16">
              {highlights.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <p className={`text-4xl font-black ${h.color} mb-1 tracking-tighter`}>{h.value}</p>
                  <p className="text-white text-[10px] font-black uppercase tracking-[0.3em]">{h.title}</p>
                  <p className="text-slate-500 text-[10px] uppercase font-medium mt-1">{h.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-32 bg-dark-bg relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">System Capabilities</h2>
            <div className="w-20 h-1 bg-gold rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10, borderColor: 'rgba(212,175,55,0.3)' }}
                className="bg-slate-900/40 border border-white/5 p-10 rounded-[2.5rem] group transition-all"
              >
                <div className="mb-8 w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-gold transition-colors">{f.title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section id="tech-stack" className="py-32 bg-dark-bg relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-gold/5 blur-[120px] rounded-full" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Technology Stack</h2>
            <p className="text-slate-400 text-lg font-medium max-w-2xl mb-8">
              Built using a modern MERN architecture with integrated ML services
            </p>
            <div className="w-20 h-1 bg-gold rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: 'MongoDB', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg' },
              { name: 'Express.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg' },
              { name: 'React', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
              { name: 'Node.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
              { name: 'Flask', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg' },
              { name: 'Socket.io', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg' }
            ].map((tech, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -12, scale: 1.05 }}
                className="group p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center gap-6 transition-all hover:border-gold shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-gold/10 transition-colors" />

                <div className="w-20 h-20 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 relative z-10">
                  <img
                    src={tech.logo}
                    alt={tech.name}
                    className={`w-16 h-16 object-contain transition-all duration-500 ${tech.name === 'Express.js' || tech.name === 'Flask' || tech.name === 'Socket.io'
                      ? 'brightness-0 contrast-200 dark:invert dark:brightness-200'
                      : 'brightness-110 contrast-100'
                      }`}
                  />
                </div>
                <div className="text-center relative z-10">
                  <p className="text-slate-900 dark:text-white font-black text-xs tracking-[0.2em] uppercase transition-colors group-hover:text-gold">{tech.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Visualizer */}
      <section className="py-32 border-y border-white/5 bg-gradient-to-b from-dark-bg to-slate-950">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl font-black text-white mb-8 tracking-tighter">Multi-Role Infrastructure</h2>
              <p className="text-slate-400 text-lg mb-10 font-medium leading-relaxed">
                CricAura provides specialized tactical interfaces for every participant in the tournament lifecycle. From global oversight to live execution.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Shield, title: 'SUPER ADMIN', desc: 'System oversight • Monitoring • Governance' },
                  { icon: Sword, title: 'ORGANIZER', desc: 'Tournament creation • Scheduling • Auction control' },
                  { icon: Activity, title: 'ADMIN', desc: 'Trial management • Performance recording • Player evaluation' },
                  { icon: Target, title: 'TEAM OWNER', desc: 'Team management • Budget allocation • Live auction bidding' },
                  { icon: Users, title: 'PLAYER', desc: 'Registration • Tournament participation • Status tracking' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-5 p-5 rounded-2xl hover:bg-white/5 border border-transparent hover:border-gold/10 transition-all cursor-default group">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-gold/10 group-hover:text-gold transition-all">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-sm mb-1 tracking-wider uppercase">{item.title}</h4>
                      <p className="text-slate-500 text-xs font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gold/10 blur-[100px] rounded-full" />
              <motion.div
                whileHover={{ rotateY: -10, rotateX: 5 }}
                className="relative bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl transition-transform duration-500"
              >
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm tracking-tight">LIVE AUCTION ROOM</p>
                      <p className="text-[10px] text-green-400 font-black uppercase tracking-widest">Connected</p>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-slate-800 text-[10px] font-black text-slate-400">00:15 LEFT</div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-slate-500 text-[10px] font-black mb-1 uppercase tracking-widest">Current Bid</p>
                      <p className="text-5xl font-black text-white">₹2.4M</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 text-[10px] font-black mb-1 uppercase tracking-widest">Owner</p>
                      <p className="text-lg font-bold text-gold">MUMBAI KINGS</p>
                    </div>
                  </div>

                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '85%' }}
                      className="h-full bg-gold"
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-slate-500 text-[10px] font-black mb-1 uppercase">SQUAD</p>
                      <p className="text-white font-bold">14/15</p>
                    </div>
                    <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-slate-500 text-[10px] font-black mb-1 uppercase">PURSE</p>
                      <p className="text-white font-bold">₹18.5M</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 bg-dark-bg relative">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="card border border-gold/30 bg-gradient-to-b from-slate-900 to-dark-bg py-24 px-12 overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none grayscale">
              <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            </div>

            <h2 className="text-5xl md:text-6xl font-black text-white mb-8 tracking-tighter relative z-10 leading-tight">
              Ready to Access the <br />
              <span className="text-gold italic">Integrated Ecosystem?</span>
            </h2>
            <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium relative z-10">
              Join the centralized management platform featuring AI-assisted player evaluations and real-time auction synchronization.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
              {!user ? (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-12 py-5 bg-gold text-dark-bg font-black rounded-2xl hover:scale-105 transition-transform uppercase tracking-widest text-sm"
                >
                  Create New Account
                </button>
              ) : (
                <a
                  href="/dashboard"
                  className="px-12 py-5 bg-gold text-dark-bg font-black rounded-2xl hover:scale-105 transition-transform uppercase tracking-widest text-sm"
                >
                  Return to Dashboard
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/80 py-24 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-20 excerpt">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <Trophy className="w-10 h-10 text-gold" />
                <span className="text-3xl font-black text-white tracking-tighter italic">CricAura</span>
              </div>
              Standardized tournament management and auction architecture. Engineered for structured league operations and evaluative performance tracking.
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-gold/10 transition-colors cursor-pointer"><Globe className="w-5 h-5 text-slate-400" /></div>
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-gold/10 transition-colors cursor-pointer"><Radio className="w-5 h-5 text-slate-400" /></div>
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-gold/10 transition-colors cursor-pointer"><Database className="w-5 h-5 text-slate-400" /></div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8">Navigation</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-500 hover:text-gold text-sm font-bold transition-all">Deployment Doc</a></li>
                <li><a href="#" className="text-slate-500 hover:text-gold text-sm font-bold transition-all">ML Governance</a></li>
                <li><a href="#" className="text-slate-500 hover:text-gold text-sm font-bold transition-all">Audit Logs</a></li>
                <li><a href="#" className="text-slate-500 hover:text-gold text-sm font-bold transition-all">API Gateway</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-8">Security</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-500 hover:text-gold text-sm font-bold transition-all">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-500 hover:text-gold text-sm font-bold transition-all">SLA Protocol</a></li>
                <li><a href="#" className="text-slate-500 hover:text-gold text-sm font-bold transition-all">Legal Charter</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-12 text-center text-slate-600">
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">
              © 2026 CricAura Infrastructure • Intelligence-Driven Sport System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
