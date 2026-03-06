import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Activity, ShieldCheck, Cpu } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-center items-center p-6">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-medium mb-6">
            Smart City Initiative 2.0
          </span>
          <h1 className="text-6xl md:text-8xl font-bold font-display tracking-tight bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
            DELHI<br/>NEXUS
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
            Advanced urban intelligence dashboard for real-time traffic monitoring, pollution analytics, and AI-driven predictive governance.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/dashboard" className="group flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25">
            Launch Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-8 py-4 bg-secondary/50 text-foreground border border-white/10 rounded-xl font-medium hover:bg-secondary hover:border-white/20 transition-all">
            Read Documentation
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/5 mt-12"
        >
          <div className="text-left space-y-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-lg">Real-time Pulse</h3>
            <p className="text-sm text-muted-foreground">Millisecond-latency data ingestion from 500+ IoT sensors across the capital.</p>
          </div>
          <div className="text-left space-y-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold text-lg">AI Forecasting</h3>
            <p className="text-sm text-muted-foreground">Proprietary LSTM models predicting congestion and AQI shifts 24h in advance.</p>
          </div>
          <div className="text-left space-y-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-semibold text-lg">Auto-Governance</h3>
            <p className="text-sm text-muted-foreground">Automated alert dispatch and emergency routing protocols.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
