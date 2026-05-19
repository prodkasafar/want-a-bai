import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, ShieldCheck, 
  Calendar, Star, ChevronDown, Award, Users 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "What is a WAB-ID, and why is it important?",
      a: "A WAB-ID is a unique tracking identifier (e.g. #WAB0000001) generated when a client and maid successfully finalize employment. Upon the maid's arrival at your household, you must verify this ID to ensure they are the correct verified helper registered under our system."
    },
    {
      q: "Is there a limit on how many offers a client can send?",
      a: "Yes. To prevent spam and encourage fair negotiations, each client-maid thread is limited to a maximum of 3 declined offers. If a maid declines your employment offer 3 times, the thread is automatically marked as CLOSED."
    },
    {
      q: "How does the pricing/salary negotiation work?",
      a: "Clients search for maids and see their expected salaries based on the services they offer. When initiating a discussion, contact details are shared so you can chat or call. Clients then submit an official request with the final agreed salary, joining date, and hours, which the maid approves or declines."
    },
    {
      q: "Are the domestic helpers verified?",
      a: "Yes. All registered helpers must submit official documents, permanent addresses, and emergency contacts. The administrator reviews profiles to ensure all listings are safe and professional."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen text-left">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 bg-gradient-warm px-4 sm:px-6 lg:px-8">
        {/* Floating circles/doodles */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-brand-teal/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-44 h-44 bg-brand-coral/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-coral/10 border border-brand-coral/20 text-brand-coral text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-brand-coral animate-spin-slow" />
              Verified & Trustworthy Domestic Help
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-brand-dark leading-tight">
              Find the perfect <span className="text-brand-coral">Bai</span> for your home, instantly.
            </h1>

            <p className="text-base sm:text-lg text-brand-dark/75 leading-relaxed max-w-lg">
              Want-A-Bai connects modern households with trusted, background-verified domestic workers, cooks, and babysitters. Safe, secure, and stress-free.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link 
                to={user ? "/discovery" : "/signup"}
                className="px-8 py-4 rounded-2xl bg-brand-coral hover:bg-brand-coral/95 text-white font-bold shadow-lg hover:shadow-brand-coral/20 transition-all hover:scale-102 text-center"
              >
                Find Help Now
              </Link>
              <Link 
                to="/login"
                className="px-8 py-4 rounded-2xl bg-white hover:bg-brand-gold/10 text-brand-dark font-bold border border-brand-dark/15 shadow-sm transition-all text-center"
              >
                Maid Registration
              </Link>
            </div>
          </motion.div>

          {/* SVG Doodle Illustration */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center relative"
          >
            <div className="w-full max-w-lg relative bg-white/40 backdrop-blur-md border-4 border-white p-6 rounded-3xl shadow-xl overflow-hidden aspect-video flex flex-col justify-center items-center">
              {/* Indian Doodle Style Maid Illustration using SVG */}
              <svg viewBox="0 0 400 240" className="w-full max-w-[340px] text-brand-coral" fill="currentColor">
                {/* Background Ring */}
                <circle cx="200" cy="120" r="100" fill="url(#circleGrad)" opacity="0.15" />
                <defs>
                  <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F48F68" />
                    <stop offset="100%" stopColor="#FFE394" />
                  </linearGradient>
                </defs>
                {/* Traditional rangoli floral decorations floating */}
                <path d="M200,5 A10,10 0 0,0 200,25 A10,10 0 0,0 200,5" opacity="0.4" fill="#FFE394"/>
                <path d="M50,180 A8,8 0 0,0 50,196 A8,8 0 0,0 50,180" opacity="0.4" fill="#8BDFDD"/>
                <path d="M350,70 A8,8 0 0,0 350,86 A8,8 0 0,0 350,70" opacity="0.4" fill="#8BDFDD"/>

                {/* Hand-Drawn Maid Character Vector */}
                <g fill="none" stroke="#2C2C2C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {/* Saree/clothing */}
                  <path d="M150,220 L150,180 C150,150 170,120 200,120 C230,120 250,150 250,180 L250,220 Z" fill="#F48F68" opacity="0.9" />
                  {/* Apron or sash */}
                  <path d="M175,135 L175,220" stroke="#FFE394" strokeWidth="4"/>
                  <path d="M225,135 L225,220" stroke="#FFE394" strokeWidth="4"/>
                  {/* Face */}
                  <circle cx="200" cy="85" r="28" fill="#FFF6DE" />
                  {/* Hair bun */}
                  <circle cx="200" cy="52" r="14" fill="#2C2C2C" />
                  {/* Bindi */}
                  <circle cx="200" cy="80" r="3" fill="#F48F68" />
                  {/* Smile */}
                  <path d="M192,93 Q200,100 208,93" />
                  {/* Eyes */}
                  <circle cx="189" cy="80" r="2" fill="#2C2C2C" />
                  <circle cx="211" cy="80" r="2" fill="#2C2C2C" />
                  {/* Hands greeting (Namaste gesture) */}
                  <path d="M170,145 Q200,120 200,108" />
                  <path d="M230,145 Q200,120 200,108" />
                  <path d="M196,108 L200,98 L204,108 Z" fill="#FFF6DE" />
                </g>
              </svg>
              <div className="absolute bottom-4 bg-white/90 px-4 py-1.5 rounded-full border border-brand-coral/20 shadow-sm text-xs font-semibold text-brand-coral">
                नमस्ते • Trust • Respect • Dignity
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-dark">
            Why Choose Want-A-Bai?
          </h2>
          <p className="text-brand-dark/75 mt-3">
            Designed to bridge the gap between clients and helpers with absolute transparency, security, and digital empowerment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-brand-coral/10 flex items-center justify-center text-brand-coral mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg mb-3">Verification Mandatory</h3>
            <p className="text-sm text-brand-dark/75 leading-relaxed">
              We require comprehensive profiles containing DOB, emergency contact info, and permanent addresses before maids can start negotiations.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-brand-teal/20 flex items-center justify-center text-brand-dark mb-6">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg mb-3">Controlled Bookings</h3>
            <p className="text-sm text-brand-dark/75 leading-relaxed">
              No endless rejections. Threads are locked after a maximum of 3 declines per maid to ensure serious negotiations and clear outcomes.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-brand-gold/30 flex items-center justify-center text-brand-dark mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg mb-3">Unique WAB-ID</h3>
            <p className="text-sm text-brand-dark/75 leading-relaxed">
              Successful bookings generate an official WAB-ID. Clients match this during arrival to verify identity and maintain safety.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Timeline */}
      <section className="py-20 bg-brand-light-gray px-4 sm:px-6 lg:px-8 border-y border-brand-gold/15">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display font-extrabold text-3xl text-brand-dark">
              How the Booking System Works
            </h2>
            <p className="text-brand-dark/75 mt-3">
              Five simple steps to establish a safe and transparent contract with your domestic helper.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
            {[
              { num: '1', title: 'Discover & Search', desc: 'Filter maids dynamically by services offered, availability status, and salary expectations.' },
              { num: '2', title: 'Open Thread', desc: 'Initialize talks. Contact details are instantly shared between client and helper.' },
              { num: '3', title: 'Raise Request', desc: 'Submit contract details like joining date, working hours, and final monthly salary.' },
              { num: '4', title: 'Maid Response', desc: 'The helper approves or declines. You get up to 3 tries per discussion thread.' },
              { num: '5', title: 'Verify WAB-ID', desc: 'An approved contract generates a unique WAB-ID. Match this on arrival!' }
            ].map((step, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-brand-gold/15 shadow-sm relative">
                <span className="absolute -top-4 left-6 w-9 h-9 rounded-full bg-brand-coral text-white font-bold flex items-center justify-center text-sm shadow-md">
                  {step.num}
                </span>
                <h3 className="font-display font-bold text-sm mt-3 mb-2">{step.title}</h3>
                <p className="text-[11px] text-brand-dark/70 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display font-extrabold text-3xl text-brand-dark">
            What Our Community Says
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-8 rounded-2xl relative">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" 
                alt="Client Reviewer" 
                className="w-12 h-12 rounded-full object-cover border-2 border-brand-coral"
              />
              <div>
                <h4 className="font-bold text-sm">Rakesh Mehra</h4>
                <p className="text-[10px] text-brand-dark/50">Client, Noida</p>
              </div>
              <div className="ml-auto flex text-brand-gold">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-brand-gold" />)}
              </div>
            </div>
            <p className="text-xs text-brand-dark/75 italic leading-relaxed">
              "Finding a cook was always a nightmare of endless phone calls. Want-A-Bai let me see Laxmi's profile, start talks, and set up a contract. The WAB-ID verification was peace of mind."
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl relative">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100" 
                alt="Maid Reviewer" 
                className="w-12 h-12 rounded-full object-cover border-2 border-brand-teal"
              />
              <div>
                <h4 className="font-bold text-sm">Priya Sharma</h4>
                <p className="text-[10px] text-brand-dark/50">Maid, Bengaluru</p>
              </div>
              <div className="ml-auto flex text-brand-gold">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-brand-gold" />)}
              </div>
            </div>
            <p className="text-xs text-brand-dark/75 italic leading-relaxed">
              "As a maid, this application protects my terms. The clients must raise a formal offer detailing hours and salary. I can easily approve or decline from my phone, and my details stay safe."
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-20 bg-brand-light-gray px-4 sm:px-6 lg:px-8 border-t border-brand-gold/15">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-extrabold text-3xl text-brand-dark text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white border border-brand-gold/15 rounded-xl overflow-hidden transition-all shadow-sm">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left font-semibold text-sm hover:bg-brand-cream/20"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${activeFaq === idx ? 'rotate-180 text-brand-coral' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-4 pt-1 text-xs text-brand-dark/70 leading-relaxed border-t border-brand-gold/5">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center bg-gradient-coral-gold border-t border-brand-gold/20 text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl">
            Ready to bring ease to your household?
          </h2>
          <p className="text-white/80 max-w-lg mx-auto text-sm">
            Join thousands of Indian families and helpers who negotiate and manage employment transparently.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link 
              to="/signup"
              className="px-8 py-3.5 rounded-2xl bg-brand-dark hover:bg-brand-dark/90 text-white font-bold shadow-md transition-all"
            >
              Sign Up Now
            </Link>
            <Link 
              to="/discovery"
              className="px-8 py-3.5 rounded-2xl bg-white hover:bg-brand-cream text-brand-dark font-bold shadow-sm transition-all"
            >
              Browse Helpers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
