import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Paperclip, ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const FloatingCard = ({ delay, className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: [0, -8, 0] }}
    transition={{
      opacity: { duration: 0.6, delay },
      y: { duration: 4 + delay, repeat: Infinity, ease: "easeInOut", delay },
    }}
    whileHover={{ scale: 1.03 }}
    className={`absolute bg-sidebar/80 backdrop-blur border border-white/10 rounded-2xl px-4 py-3 shadow-glow ${className}`}
  >
    {children}
  </motion.div>
);

// A compact, single-card version of the product preview for phones and
// tablets — the full floating-card scene only has room to breathe at the
// lg breakpoint, but the preview shouldn't disappear entirely below it.
const MobilePreviewCard = () => (
  <motion.div
    initial={{ opacity: 0, y: 24, scale: 0.97 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="lg:hidden bg-sidebar/80 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-glow max-w-sm mx-auto"
  >
    <div className="flex items-center gap-2 mb-3">
      <span className="w-2 h-2 rounded-full bg-online animate-breathe" />
      <p className="text-xs text-muted">Dev Team · 4 online</p>
    </div>
    <div className="space-y-2">
      <div className="bg-chat rounded-xl rounded-bl-sm px-3 py-2 text-sm max-w-[80%]">
        Just pushed the new designs 🎨
      </div>
      <div className="bg-ember text-bg rounded-xl rounded-br-sm px-3 py-2 text-sm max-w-[80%] ml-auto">
        Deploy looks good ✅
      </div>
      <div className="flex items-center gap-1 pl-1">
        <span className="w-1.5 h-1.5 rounded-full bg-ember" />
        <span className="w-1.5 h-1.5 rounded-full bg-ember/70" />
        <span className="w-1.5 h-1.5 rounded-full bg-ember/40" />
        <span className="text-xs text-muted ml-1.5">Priya is typing…</span>
      </div>
    </div>
  </motion.div>
);

const Landing = () => {
  return (
    <div className="min-h-screen bg-bg text-ink overflow-x-hidden">
      {/* ambient background — slow, subtle drift rather than a static blob */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, 24, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 left-1/3 w-[600px] h-[600px] bg-ember/10 rounded-full blur-[140px]"
        />
        <motion.div
          animate={{ x: [0, -32, 0], y: [0, -20, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-lavender/10 rounded-full blur-[140px]"
        />
      </div>

      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-5 sm:px-10 py-5 sm:py-6 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-ember flex items-center justify-center font-display font-bold text-bg">
            V
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">Velora</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="text-sm text-muted hover:text-ink transition-colors px-2">
            Log in
          </Link>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/register"
              className="text-sm bg-ember text-bg font-medium px-4 py-2 rounded-full hover:brightness-110 transition inline-block"
            >
              Get started
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      <header className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 pt-10 sm:pt-16 pb-20 sm:pb-32 grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
        <div>
          <motion.p variants={fadeUp} initial="hidden" animate="show" className="text-ember text-sm font-medium mb-4 tracking-wide uppercase">
            Real-time chat, reimagined
          </motion.p>
          <motion.h1
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="show"
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] sm:leading-[1.05] tracking-tight mb-6"
          >
            Conversations,<br />in real time.
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} initial="hidden" animate="show" className="text-muted text-base sm:text-lg mb-8 max-w-md">
            Connect, collaborate and communicate without the noise.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show" className="flex flex-wrap items-center gap-3 sm:gap-4">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/register"
                className="bg-ember text-bg font-medium px-6 py-3 rounded-full hover:brightness-110 transition flex items-center gap-2"
              >
                Get started <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/login" className="text-ink/80 hover:text-ink px-6 py-3 rounded-full border border-white/10 transition block">
                Log in
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <div>
          <div className="relative h-[420px] hidden lg:block">
            <FloatingCard delay={0} className="top-4 left-6 w-64">
              <p className="text-xs text-muted mb-1">Maya Chen</p>
              <p className="text-sm">Just pushed the new designs 🎨</p>
            </FloatingCard>
            <FloatingCard delay={0.6} className="top-40 right-2 w-60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-online animate-breathe" />
                <p className="text-xs text-muted">Dev Team · 4 online</p>
              </div>
              <p className="text-sm mt-1">Deploy looks good ✅</p>
            </FloatingCard>
            <FloatingCard delay={1.1} className="top-72 left-16 w-56">
              <p className="text-xs text-muted mb-1">Priya Nair is typing…</p>
              <div className="flex gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ember" />
                <span className="w-1.5 h-1.5 rounded-full bg-ember/70" />
                <span className="w-1.5 h-1.5 rounded-full bg-ember/40" />
              </div>
            </FloatingCard>
          </div>
          <MobilePreviewCard />
        </div>
      </header>

      <section className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 pb-20 sm:pb-28">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5 }}
          className="font-display text-2xl sm:text-3xl font-semibold mb-10 sm:mb-12 text-center"
        >
          Why Velora
        </motion.h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
          {[
            {
              icon: Zap,
              title: "Real-time, always",
              body: "Messages, typing, and presence sync instantly across every device — no refresh, no delay.",
            },
            {
              icon: Paperclip,
              title: "Share anything",
              body: "Drop in images, PDFs, and documents with clean previews and instant download.",
            },
            {
              icon: ShieldCheck,
              title: "Built on trust",
              body: "Passwords are hashed, sessions are signed, and every route is protected end to end.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              whileHover={{ y: -4 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-sidebar border border-white/5 rounded-2xl p-6 transition-shadow hover:shadow-glow"
            >
              <f.icon className="text-ember mb-4" size={24} />
              <h3 className="font-display font-medium text-lg mb-2">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 text-center pb-20 sm:pb-28"
      >
        <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-4">Ready to talk?</h2>
        <p className="text-muted mb-8">Create your account and start your first conversation in seconds.</p>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-block">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-ember text-bg font-medium px-6 py-3 rounded-full hover:brightness-110 transition"
          >
            Get started <ArrowRight size={16} />
          </Link>
        </motion.div>
      </motion.section>

      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-t border-white/5 py-8 text-center text-muted text-sm"
      >
        © {new Date().getFullYear()} Velora. Built for real conversations.
      </motion.footer>
    </div>
  );
};

export default Landing;
