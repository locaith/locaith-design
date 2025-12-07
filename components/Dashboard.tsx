import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Design, User, DesignType } from '../types';

interface DashboardProps {
  user: User;
  onNewDesign: (type: DesignType, templateContent?: string) => void;
  onOpenDesign: (design: Design) => void;
  onLogout: () => void;
}

// --- EXTENSIVE TEMPLATE LIBRARY (5 per Category, 2 Pages Each) ---
const TEMPLATES: Record<string, { id: string, name: string, description: string, image: string, content: string }[]> = {
    'CV': [
        {
            id: 'cv-1', name: 'Modern Tech Lead', description: 'Dark sidebar, clean typography for developers.', image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',
            content: `<div class="print-page bg-white text-zinc-800 flex flex-row h-full">
                <div class="w-1/3 bg-slate-900 text-white p-8 flex flex-col gap-6">
                    <div class="w-32 h-32 rounded-full bg-slate-700 mx-auto overflow-hidden border-4 border-slate-600"><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" class="w-full h-full object-cover"></div>
                    <h1 class="text-3xl font-bold text-center">Alex Chen</h1>
                    <p class="text-center text-blue-400 font-medium">Senior Full Stack Engineer</p>
                    <div class="mt-8 space-y-4 text-sm">
                        <div><h3 class="font-bold text-slate-400 uppercase tracking-widest text-xs mb-1">Contact</h3><p>alex.chen@email.com</p><p>+1 (555) 123-4567</p></div>
                        <div><h3 class="font-bold text-slate-400 uppercase tracking-widest text-xs mb-1">Skills</h3><div class="flex flex-wrap gap-2"><span class="px-2 py-1 bg-slate-800 rounded">React</span><span class="px-2 py-1 bg-slate-800 rounded">Node.js</span><span class="px-2 py-1 bg-slate-800 rounded">AWS</span></div></div>
                    </div>
                </div>
                <div class="w-2/3 p-12">
                    <section class="mb-8"><h2 class="text-2xl font-bold text-slate-900 border-b-2 border-slate-100 pb-2 mb-4">Professional Profile</h2><p class="text-slate-600 leading-relaxed">Innovative tech lead with 10+ years of experience building scalable web applications. Expert in cloud architecture and agile methodologies.</p></section>
                    <section class="mb-8"><h2 class="text-2xl font-bold text-slate-900 border-b-2 border-slate-100 pb-2 mb-4">Experience</h2><div class="mb-6"><div class="flex justify-between mb-1"><h3 class="font-bold text-lg">Tech Solutions Inc.</h3><span class="text-slate-500 text-sm">2020 - Present</span></div><p class="text-blue-600 font-medium text-sm mb-2">Lead Architect</p><ul class="list-disc list-inside text-slate-600 space-y-1"><li>Led migration to microservices.</li><li>Reduced latency by 40%.</li></ul></div></section>
                </div>
            </div>`
        },
        {
            id: 'cv-2', name: 'Minimalist Swiss', description: 'Clean, grid-based, Helvetica style.', image: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=800&q=80',
            content: `<div class="print-page bg-white p-16"><h1 class="text-6xl font-bold tracking-tighter mb-2">SARAH<br>JENKINS.</h1><p class="text-xl text-zinc-500 mb-16">ART DIRECTOR</p><div class="grid grid-cols-4 gap-8"><div class="col-span-1 border-t-4 border-black pt-4"><h3 class="font-bold mb-4">CONTACT</h3><p>sarah@design.co</p><p>New York, NY</p></div><div class="col-span-3 border-t-4 border-zinc-200 pt-4"><h3 class="font-bold mb-4">EXPERIENCE</h3><div class="mb-8"><h4 class="text-2xl font-bold">Pentagram</h4><p class="text-zinc-500 mb-4">Senior Designer / 2019-2024</p><p>Leading brand identity projects for Fortune 500 clients.</p></div></div></div></div>`
        },
        {
            id: 'cv-3', name: 'Executive Elegance', description: 'Serif fonts, beige accents, for management.', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80',
            content: `<div class="print-page bg-[#FDFBF7] p-16 font-serif"><div class="text-center mb-12"><h1 class="text-5xl text-zinc-900 mb-2">James D. Sterling</h1><p class="text-zinc-500 italic">Chief Financial Officer</p></div><div class="grid grid-cols-3 gap-12"><div class="col-span-2 space-y-8"><section><h3 class="text-xl font-bold border-b border-zinc-300 pb-2 mb-4">Executive Summary</h3><p class="text-zinc-700 leading-relaxed">Strategic financial leader with a proven track record in M&A, capital allocation, and risk management.</p></section></div><div class="bg-white p-6 shadow-sm"><h3 class="font-bold mb-4">Core Competencies</h3><ul class="space-y-2 text-sm text-zinc-600"><li>Strategic Planning</li><li>Investor Relations</li></ul></div></div></div>`
        },
        {
            id: 'cv-4', name: 'Creative Portfolio', description: 'Colorful, visual-heavy for designers.', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80',
            content: `<div class="print-page bg-zinc-900 text-white p-0 overflow-hidden relative"><div class="absolute top-0 right-0 w-1/2 h-full bg-indigo-600 mix-blend-multiply opacity-50"></div><div class="relative z-10 p-16"><h1 class="text-8xl font-display mb-8">Hello.<br>I'm Mia.</h1><p class="text-2xl text-indigo-300 mb-16">UI/UX Designer & Researcher</p><div class="grid grid-cols-2 gap-8"><div class="bg-white/10 p-6 backdrop-blur rounded-xl"><h3>Google</h3><p class="text-sm opacity-70">2021-Present</p></div></div></div></div>`
        },
        {
            id: 'cv-5', name: 'Academic Standard', description: 'Text-heavy, detailed, traditional.', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
            content: `<div class="print-page bg-white p-12 font-serif text-sm"><header class="border-b-2 border-black pb-6 mb-6"><h1 class="text-3xl font-bold">Dr. Robert Langdon</h1><p>Professor of Symbology, Harvard University</p></header><section class="mb-6"><h2 class="font-bold uppercase tracking-widest text-xs mb-3">Education</h2><p><strong>Ph.D. Symbology</strong>, Harvard University, 1995</p></section></div>`
        }
    ],
    'SALEKIT': [
        {
            id: 'sk-1', name: 'SaaS Enterprise', description: 'Blue gradients, feature grids, pricing tables.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
            content: `<div class="print-page bg-white"><div class="bg-blue-900 h-96 p-16 text-white flex flex-col justify-center"><h1 class="text-6xl font-bold mb-4">CloudScale AI</h1><p class="text-xl text-blue-200">Enterprise Infrastructure for the Future</p></div><div class="p-16 -mt-20"><div class="grid grid-cols-3 gap-8"><div class="bg-white p-8 shadow-xl rounded-lg"><h3 class="text-blue-600 font-bold text-4xl mb-2">10x</h3><p class="font-bold">Faster Deployment</p></div><div class="bg-white p-8 shadow-xl rounded-lg"><h3 class="text-blue-600 font-bold text-4xl mb-2">99.9%</h3><p class="font-bold">Uptime SLA</p></div><div class="bg-white p-8 shadow-xl rounded-lg"><h3 class="text-blue-600 font-bold text-4xl mb-2">24/7</h3><p class="font-bold">Support</p></div></div></div></div>
            <div class="print-page bg-slate-50 p-16"><h2 class="text-4xl font-bold text-slate-900 mb-12">Pricing Plans</h2><div class="grid grid-cols-3 gap-8"><div class="bg-white p-8 rounded-xl border border-slate-200"><h3 class="font-bold text-xl mb-4">Starter</h3><p class="text-3xl font-bold mb-6">$49<span class="text-sm font-normal text-slate-500">/mo</span></p><ul class="space-y-3 text-slate-600"><li><i class="ph ph-check text-green-500"></i> 5 Users</li><li><i class="ph ph-check text-green-500"></i> Basic Analytics</li></ul></div><div class="bg-blue-600 text-white p-8 rounded-xl shadow-xl transform scale-105"><h3 class="font-bold text-xl mb-4">Pro</h3><p class="text-3xl font-bold mb-6">$99<span class="text-sm font-normal text-blue-200">/mo</span></p><ul class="space-y-3"><li><i class="ph ph-check text-white"></i> Unlimited Users</li><li><i class="ph ph-check text-white"></i> Advanced Security</li></ul></div></div></div>`
        },
        {
            id: 'sk-2', name: 'Real Estate Luxury', description: 'Full bleed photos, elegant typography.', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
            content: `<div class="print-page bg-zinc-900 text-white relative"><img src="https://images.unsplash.com/photo-1600596542815-6ad4c727dd2d?w=1600" class="absolute inset-0 w-full h-full object-cover opacity-50"><div class="relative z-10 p-16 h-full flex flex-col justify-end"><h1 class="font-serif text-7xl mb-4">The Azure</h1><p class="text-2xl font-light tracking-wide">Waterfront Living Reimagined.</p></div></div>
            <div class="print-page bg-white p-16 text-zinc-900"><h2 class="font-serif text-5xl mb-12 text-center">Floor Plans</h2><div class="grid grid-cols-2 gap-12"><div class="border border-zinc-200 p-8"><h3 class="text-2xl font-serif mb-2">The Penthouse</h3><p class="text-zinc-500 mb-6">4 Bed, 4.5 Bath • 4,500 Sq Ft</p><div class="h-48 bg-zinc-100 flex items-center justify-center">Floor Plan Image</div></div><div class="border border-zinc-200 p-8"><h3 class="text-2xl font-serif mb-2">The Residence</h3><p class="text-zinc-500 mb-6">3 Bed, 2.5 Bath • 2,200 Sq Ft</p><div class="h-48 bg-zinc-100 flex items-center justify-center">Floor Plan Image</div></div></div></div>`
        },
        {
            id: 'sk-3', name: 'Agency Creative', description: 'Bold colors, case study focus.', image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
            content: `<div class="print-page bg-[#FF3366] text-white p-16 flex items-center"><h1 class="text-9xl font-black leading-none">WE<br>MAKE<br>NOISE.</h1></div><div class="print-page bg-white p-16"><h2 class="text-6xl font-bold mb-12 text-black">Services</h2><div class="space-y-8"><div class="border-b-4 border-black pb-8"><h3 class="text-4xl font-bold mb-2">Branding</h3><p class="text-xl text-zinc-600">Identity, Strategy, Voice.</p></div><div class="border-b-4 border-black pb-8"><h3 class="text-4xl font-bold mb-2">Digital</h3><p class="text-xl text-zinc-600">Web, App, UX/UI.</p></div></div></div>`
        },
        {
            id: 'sk-4', name: 'Industrial Manufacturing', description: 'Heavy fonts, yellow/black, specs.', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
            content: `<div class="print-page bg-yellow-400 p-16 flex flex-col justify-between"><div class="w-24 h-24 bg-black"></div><h1 class="text-8xl font-bold text-black uppercase">Heavy<br>Metal<br>Corp.</h1></div><div class="print-page bg-white p-16"><h2 class="text-4xl font-bold uppercase mb-8">Technical Specs</h2><table class="w-full text-left border-collapse"><tr class="border-b-2 border-black"><th class="py-4 font-bold">Model</th><th class="py-4 font-bold">Capacity</th><th class="py-4 font-bold">Power</th></tr><tr class="border-b border-zinc-300"><td class="py-4">X-500</td><td class="py-4">50 Tons</td><td class="py-4">4000W</td></tr><tr class="border-b border-zinc-300"><td class="py-4">X-1000</td><td class="py-4">100 Tons</td><td class="py-4">8000W</td></tr></table></div>`
        },
        {
            id: 'sk-5', name: 'Wellness & Spa', description: 'Soft greens, organic shapes, pricing menu.', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
            content: `<div class="print-page bg-stone-100 p-16 flex items-center justify-center text-center"><div class="max-w-md"><h1 class="font-serif text-6xl text-stone-800 mb-6">Sanctuary</h1><p class="text-stone-500 text-lg">Holistic Wellness Center</p></div></div><div class="print-page bg-white p-16"><h2 class="font-serif text-4xl text-center mb-12 text-stone-800">Treatment Menu</h2><div class="space-y-6 max-w-2xl mx-auto"><div class="flex justify-between border-b border-stone-200 pb-4"><span class="font-serif text-xl">Swedish Massage</span><span class="text-stone-500">$120</span></div><div class="flex justify-between border-b border-stone-200 pb-4"><span class="font-serif text-xl">Deep Tissue</span><span class="text-stone-500">$140</span></div></div></div>`
        }
    ],
    'PITCH': [
        {
            id: 'pd-1', name: 'Silicon Valley Standard', description: 'Problem/Solution, Big Numbers, Minimal.', image: 'https://images.unsplash.com/photo-1559386484-97dfc0e15539?w=800&q=80',
            content: `<div class="print-page bg-white p-16 flex flex-col justify-center text-center"><h1 class="text-8xl font-bold tracking-tight mb-6">Uber for <span class="text-blue-600">X</span></h1><p class="text-2xl text-zinc-500">Democratizing access to services.</p></div>
            <div class="print-page bg-zinc-50 p-16 flex items-center"><div class="w-1/2 pr-12"><h2 class="text-5xl font-bold mb-6 text-red-500">The Problem</h2><p class="text-2xl text-zinc-700 leading-relaxed">Current solutions are slow, expensive, and opaque. Users are frustrated.</p></div><div class="w-1/2 bg-zinc-200 h-full rounded-2xl"></div></div>`
        },
        {
            id: 'pd-2', name: 'Fintech Trust', description: 'Navy blue, secure feel, data charts.', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
            content: `<div class="print-page bg-slate-900 text-white p-16 flex flex-col justify-end"><h1 class="text-7xl font-bold mb-4">Vault.</h1><p class="text-xl text-slate-400">Next Gen Banking Infrastructure</p></div><div class="print-page bg-white p-16"><h2 class="text-4xl font-bold text-slate-900 mb-12">Market Opportunity</h2><div class="flex gap-8"><div class="flex-1 bg-slate-50 p-8 rounded-2xl"><h3 class="text-6xl font-bold text-blue-600 mb-2">$50B</h3><p class="font-bold">Total Addressable Market</p></div><div class="flex-1 bg-slate-50 p-8 rounded-2xl"><h3 class="text-6xl font-bold text-blue-600 mb-2">15%</h3><p class="font-bold">YoY Growth</p></div></div></div>`
        },
        {
            id: 'pd-3', name: 'Consumer App', description: 'Vibrant, phone mockups, social proof.', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
            content: `<div class="print-page bg-gradient-to-r from-purple-500 to-pink-500 text-white p-16 flex items-center justify-center"><h1 class="text-9xl font-bold">VIBE</h1></div><div class="print-page bg-black text-white p-16"><h2 class="text-5xl font-bold mb-12 text-center">Traction</h2><div class="grid grid-cols-3 gap-8 text-center"><div class="p-8 border border-white/20 rounded-2xl"><div class="text-5xl font-bold text-pink-500 mb-2">1M+</div><div>Downloads</div></div><div class="p-8 border border-white/20 rounded-2xl"><div class="text-5xl font-bold text-purple-500 mb-2">4.9</div><div>App Store Rating</div></div><div class="p-8 border border-white/20 rounded-2xl"><div class="text-5xl font-bold text-blue-500 mb-2">500k</div><div>MAU</div></div></div></div>`
        },
        {
            id: 'pd-4', name: 'Web3 / Crypto', description: 'Dark mode, gradients, futuristic.', image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
            content: `<div class="print-page bg-[#050505] text-white p-16 flex flex-col justify-center relative overflow-hidden"><div class="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/20 blur-[100px] rounded-full"></div><h1 class="text-7xl font-bold font-mono relative z-10">DECENTRAL<br>PROTOCOL</h1></div><div class="print-page bg-[#050505] text-white p-16"><h2 class="text-4xl font-mono text-green-400 mb-8">> ROADMAP</h2><div class="space-y-6 border-l-2 border-green-500/30 pl-8"><div class="relative"><div class="absolute -left-[39px] top-1 w-5 h-5 bg-green-500 rounded-full"></div><h3 class="text-xl font-bold">Q1 2024</h3><p class="text-zinc-500">Mainnet Launch</p></div><div class="relative"><div class="absolute -left-[39px] top-1 w-5 h-5 bg-zinc-800 border border-green-500 rounded-full"></div><h3 class="text-xl font-bold">Q2 2024</h3><p class="text-zinc-500">Token Airdrop</p></div></div></div>`
        },
        {
            id: 'pd-5', name: 'HealthTech', description: 'Clean teal/white, human-centric.', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
            content: `<div class="print-page bg-teal-50 p-16 flex items-center"><div class="w-1/2"><h1 class="text-6xl font-bold text-teal-900 mb-6">MediCare+</h1><p class="text-xl text-teal-700">Accessible Healthcare for Everyone.</p></div></div><div class="print-page bg-white p-16"><h2 class="text-4xl font-bold text-teal-900 mb-12">The Solution</h2><div class="grid grid-cols-3 gap-8"><div class="p-6 bg-teal-50 rounded-xl"><i class="ph ph-heartbeat text-4xl text-teal-500 mb-4"></i><h3 class="font-bold mb-2">Remote Monitoring</h3><p class="text-sm text-zinc-600">Real-time vitals tracking.</p></div></div></div>`
        }
    ],
    'SLIDE': [
        {
            id: 'sl-1', name: 'Quarterly Review', description: 'Data-heavy, charts, corporate.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
            content: `<div class="print-page bg-slate-800 text-white p-16 flex flex-col justify-center"><h1 class="text-6xl font-bold mb-4">Q4 2024</h1><p class="text-2xl text-slate-300">Performance Review</p></div><div class="print-page bg-white p-16"><h2 class="text-3xl font-bold text-slate-800 mb-8">Key Metrics</h2><div class="grid grid-cols-4 gap-4"><div class="bg-slate-100 p-6 text-center"><div class="text-3xl font-bold text-slate-800">120%</div><div class="text-xs uppercase text-slate-500 mt-2">Revenue Target</div></div></div></div>`
        },
        {
            id: 'sl-2', name: 'Training Workshop', description: 'Bullet points, clear steps, instructional.', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
            content: `<div class="print-page bg-orange-500 text-white p-16"><h1 class="text-6xl font-bold">Leadership<br>Workshop</h1></div><div class="print-page bg-white p-16"><h2 class="text-4xl font-bold mb-8">Agenda</h2><ul class="space-y-4 text-2xl text-zinc-700"><li class="flex gap-4"><span class="font-bold text-orange-500">09:00</span> Introduction</li><li class="flex gap-4"><span class="font-bold text-orange-500">10:30</span> Breakout Session</li></ul></div>`
        },
        {
            id: 'sl-3', name: 'Marketing Strategy', description: 'Funnel diagrams, colorful sections.', image: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=800&q=80',
            content: `<div class="print-page bg-purple-600 text-white p-16"><h1 class="text-6xl font-bold">Go-To-Market</h1><p class="text-2xl opacity-80 mt-4">2025 Strategy</p></div><div class="print-page bg-white p-16 flex items-center justify-center"><div class="w-full max-w-2xl"><div class="bg-purple-100 p-4 text-center mb-2">Awareness</div><div class="bg-purple-300 p-4 text-center w-3/4 mx-auto mb-2">Consideration</div><div class="bg-purple-500 text-white p-4 text-center w-1/2 mx-auto">Conversion</div></div></div>`
        },
        {
            id: 'sl-4', name: 'Event Keynote', description: 'Big visuals, giant quotes.', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
            content: `<div class="print-page bg-black p-0 relative"><img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600" class="w-full h-full object-cover opacity-60"><div class="absolute inset-0 flex items-center justify-center p-24 text-center"><h1 class="text-6xl font-bold text-white leading-tight">"The future belongs to those who build it."</h1></div></div>`
        },
        {
            id: 'sl-5', name: 'Product Launch', description: 'Feature focus, device frames.', image: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800&q=80',
            content: `<div class="print-page bg-zinc-900 text-white p-16 flex items-center"><div class="w-1/2"><span class="text-green-400 font-bold uppercase tracking-widest">New Arrival</span><h1 class="text-7xl font-bold mt-4">Phone X</h1></div><div class="w-1/2 flex justify-center"><div class="w-64 h-96 border-4 border-zinc-700 rounded-[3rem] bg-black"></div></div></div>`
        }
    ],
    'BROCHURE': [
        {
            id: 'br-1', name: 'Travel Agency', description: 'Vibrant photos, grid layout, adventure.', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
            content: `<div class="print-page bg-blue-500 text-white p-0 relative"><img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800" class="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"><div class="relative z-10 p-16 h-full flex flex-col justify-between"><h1 class="text-8xl font-black">JAPAN</h1><p class="text-2xl">Discover the rising sun.</p></div></div><div class="print-page bg-white p-16"><h2 class="text-4xl font-bold mb-8">Itinerary</h2><div class="space-y-8"><div class="flex gap-6"><div class="font-bold text-blue-500 text-xl w-12">01</div><div><h3 class="font-bold text-lg">Tokyo</h3><p class="text-sm text-zinc-500">Shinjuku, Shibuya, Asakusa.</p></div></div></div></div>`
        },
        {
            id: 'br-2', name: 'University Prospectus', description: 'Friendly colors, icons, informative.', image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
            content: `<div class="print-page bg-red-800 text-white p-16"><div class="border-4 border-white h-full p-8 flex flex-col justify-center items-center text-center"><h1 class="font-serif text-5xl mb-4">Oxford<br>Academy</h1><p class="uppercase tracking-widest text-sm">Excellence since 1890</p></div></div><div class="print-page bg-zinc-50 p-16"><h2 class="text-3xl font-serif text-red-900 mb-8">Faculties</h2><div class="grid grid-cols-2 gap-8"><div class="bg-white p-6 shadow-sm border-l-4 border-red-800"><h3 class="font-bold mb-2">Science</h3><p class="text-sm text-zinc-600">Physics, Chemistry, Bio.</p></div></div></div>`
        },
        {
            id: 'br-3', name: 'Furniture Catalog', description: 'Minimal, big photos, price tags.', image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80',
            content: `<div class="print-page bg-[#E5E5E5] p-16 flex items-center justify-center"><h1 class="text-9xl font-serif text-zinc-800">NORDIC</h1></div><div class="print-page bg-white p-16"><div class="mb-12"><img src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800" class="w-full h-64 object-cover mb-4"><div class="flex justify-between items-baseline"><h3 class="text-xl font-bold">The Lounge Chair</h3><span class="text-lg">$499</span></div><p class="text-zinc-500">Oak wood, fabric upholstery.</p></div></div>`
        },
        {
            id: 'br-4', name: 'Automotive', description: 'Sleek, metallic, speed, dark mode.', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
            content: `<div class="print-page bg-black text-white p-0 relative"><img src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600" class="w-full h-full object-cover opacity-70"><div class="absolute bottom-16 left-16"><h1 class="text-7xl font-bold italic tracking-tighter">VELOCITY GT</h1></div></div><div class="print-page bg-zinc-900 text-white p-16"><div class="grid grid-cols-3 gap-8 text-center"><div class="border border-white/20 p-8"><div class="text-4xl font-bold text-red-500 mb-2">2.9s</div><div class="text-xs uppercase">0-60 mph</div></div><div class="border border-white/20 p-8"><div class="text-4xl font-bold text-red-500 mb-2">700</div><div class="text-xs uppercase">Horsepower</div></div></div></div>`
        },
        {
            id: 'br-5', name: 'Museum / Art Gallery', description: 'Avant-garde, typography focus.', image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80',
            content: `<div class="print-page bg-white p-16 flex flex-col justify-between"><h1 class="text-8xl font-black rotate-90 origin-top-left translate-x-24">MODERN</h1><div class="self-end text-right"><p class="text-2xl font-bold">SUMMER<br>EXHIBITION</p><p>June - Aug 2024</p></div></div><div class="print-page bg-black text-white p-16 grid grid-cols-2 gap-8"><div class="aspect-square bg-zinc-800"></div><div class="aspect-square bg-zinc-800"></div></div>`
        }
    ],
    'INVITATION': [
        {
            id: 'inv-1', name: 'Classic Wedding', description: 'Floral, script font, soft pinks.', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
            content: `<div class="print-page bg-[#fff0f5] p-12 text-center border-[16px] border-white shadow-inner flex flex-col justify-center"><h1 class="font-handwriting text-8xl text-rose-800 mb-4">Sarah & Michael</h1><p class="font-serif text-xl italic text-zinc-600">Request the honor of your presence</p></div><div class="print-page bg-white p-12 text-center flex flex-col justify-center"><h2 class="font-serif text-3xl font-bold mb-8">Details</h2><p class="mb-4"><strong>Ceremony</strong><br>St. Mary's Church</p><p><strong>Reception</strong><br>The Grand Hotel</p></div>`
        },
        {
            id: 'inv-2', name: 'Corporate Gala', description: 'Navy/Gold, geometric, formal.', image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
            content: `<div class="print-page bg-slate-900 text-amber-200 p-12 text-center border-4 border-amber-200/20 flex flex-col justify-center"><div class="text-sm uppercase tracking-[0.4em] mb-8">Annual Gala</div><h1 class="font-serif text-5xl mb-8">A Night of Excellence</h1><div class="w-16 h-[1px] bg-amber-200 mx-auto"></div></div><div class="print-page bg-white p-12 text-center"><h2 class="font-serif text-2xl text-slate-900 mb-6">Program</h2><ul class="text-sm space-y-4"><li><strong>18:00</strong> Cocktails</li><li><strong>19:30</strong> Dinner & Awards</li></ul></div>`
        },
        {
            id: 'inv-3', name: 'Birthday Party', description: 'Colorful, confetti, fun.', image: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=800&q=80',
            content: `<div class="print-page bg-yellow-300 p-12 text-center flex flex-col justify-center border-8 border-pink-500 border-dashed"><h1 class="text-8xl font-black text-pink-600 rotate-[-5deg]">PARTY!</h1><p class="text-2xl font-bold mt-4">Alex turns 5!</p></div><div class="print-page bg-white p-12 text-center"><h2 class="text-3xl font-bold mb-6">Join the Fun</h2><p class="text-xl">Pizza, Games & Cake</p></div>`
        },
        {
            id: 'inv-4', name: 'Baby Shower', description: 'Pastels, cute icons, soft.', image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80',
            content: `<div class="print-page bg-blue-50 p-12 text-center flex flex-col justify-center"><i class="ph ph-baby text-6xl text-blue-300 mb-6"></i><h1 class="font-handwriting text-6xl text-blue-800">It's a Boy!</h1></div><div class="print-page bg-white p-12 text-center"><p class="font-serif text-xl italic text-zinc-600">Please join us for a Baby Shower honoring</p><h2 class="font-bold text-2xl mt-2">Jennifer Smith</h2></div>`
        },
        {
            id: 'inv-5', name: 'Grand Opening', description: 'Red/White, bold, scissors.', image: 'https://images.unsplash.com/photo-1561489413-985b06da5bee?w=800&q=80',
            content: `<div class="print-page bg-red-600 text-white p-12 text-center flex flex-col justify-center"><h1 class="text-6xl font-black uppercase tracking-tighter">Grand<br>Opening</h1></div><div class="print-page bg-white p-12 text-center"><h2 class="text-3xl font-bold text-red-600 mb-6">You're Invited</h2><p class="text-zinc-600">Be the first to see our new flagship store.</p></div>`
        }
    ]
};

const COLLECTIONS = [
    { id: 'col-cv', title: 'Resumes & CVs', type: 'CV', image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=60', count: 5 },
    { id: 'col-br', title: 'Brochures', type: 'BROCHURE', image: 'https://images.unsplash.com/photo-1506097425191-7ad538b29cef?w=800&q=60', count: 5 },
    { id: 'col-salekit', title: 'Salekits', type: 'SALEKIT', image: 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=800&q=60', count: 5 },
    { id: 'col-pitch', title: 'Pitch Decks', type: 'PITCH', image: 'https://images.unsplash.com/photo-1559386484-97dfc0e15539?w=800&q=60', count: 5 },
    { id: 'col-slide', title: 'Presentations', type: 'SLIDE', image: 'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=800&q=60', count: 5 },
    { id: 'col-inv', title: 'Invitations', type: 'INVITATION', image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&q=60', count: 5 }
];

const getGradientForType = (type: string) => {
    switch (type) {
        case 'CV': return 'bg-gradient-to-br from-blue-600 to-cyan-500';
        case 'BROCHURE': return 'bg-gradient-to-br from-orange-500 to-amber-500';
        case 'SLIDE': return 'bg-gradient-to-br from-emerald-600 to-teal-500';
        case 'PITCH': return 'bg-gradient-to-br from-purple-600 to-pink-500';
        case 'SALEKIT': return 'bg-gradient-to-br from-indigo-600 to-blue-600';
        case 'INVITATION': return 'bg-gradient-to-br from-rose-500 to-pink-600';
        default: return 'bg-zinc-700';
    }
};

const getImageForType = (type: string) => {
    switch (type) {
    case 'CV': return 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=400';
    case 'BROCHURE': return 'https://images.unsplash.com/photo-1506097425191-7ad538b29cef?auto=format&fit=crop&q=80&w=400';
    case 'SALEKIT': return 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&q=80&w=400';
    case 'SLIDE': return 'https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?auto=format&fit=crop&q=80&w=400';
    case 'PITCH': return 'https://images.unsplash.com/photo-1559386484-97dfc0e15539?auto=format&fit=crop&q=80&w=400';
    case 'INVITATION': return 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=400';
    default: return '';
    }
}

// --- SUB-COMPONENTS MOVED OUTSIDE ---
const ProjectCard: React.FC<{ design: Design, onOpenDesign: (design: Design) => void }> = ({ design, onOpenDesign }) => {
    const isLandscape = design.type === 'SLIDE' || design.type === 'PITCH';
    const aspectRatio = isLandscape ? 'aspect-video' : 'aspect-[1/1.41]';
    
    return (
    <div 
        onClick={() => onOpenDesign(design)}
        className="group relative bg-surface border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all flex flex-col"
    >
            {/* Realistic Thumbnail Mockup */}
        <div className={`relative ${aspectRatio} bg-zinc-900 overflow-hidden`}>
                {/* Real Thumbnail from Design Data */}
                {design.thumbnail ? (
                    <div className="absolute inset-4 bg-white shadow-lg rounded-sm overflow-hidden group-hover:scale-105 transition-transform duration-500">
                        <img src={design.thumbnail} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                ) : (
                    /* Fallback Abstract Content based on Design Type */
                    <div className={`absolute inset-4 bg-white shadow-lg rounded-sm overflow-hidden opacity-90 group-hover:scale-105 transition-transform duration-500 flex flex-col`}>
                        <div className={`h-1/3 w-full ${getGradientForType(design.type)} opacity-80`}></div>
                        <div className="p-3 space-y-2">
                            <div className="w-3/4 h-2 bg-zinc-200 rounded-full"></div>
                            <div className="w-full h-1 bg-zinc-100 rounded-full"></div>
                            <div className="w-full h-1 bg-zinc-100 rounded-full"></div>
                            <div className="w-1/2 h-1 bg-zinc-100 rounded-full"></div>
                        </div>
                    </div>
                )}
                
                {/* Badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/80 text-white text-[8px] font-bold rounded uppercase tracking-wider backdrop-blur-md z-10">
                    {design.type}
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                    <button className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold transform translate-y-2 group-hover:translate-y-0 transition-all">
                        Open Editor
                    </button>
                </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-surface z-10">
            <h3 className="font-semibold text-white truncate text-sm mb-1">{design.title || 'Untitled Project'}</h3>
            <p className="text-xs text-secondary">{new Date(design.created_at).toLocaleDateString()}</p>
        </div>
    </div>
    );
}

const SidebarContent = ({ 
    user, 
    activeTab, 
    setActiveTab, 
    setSelectedCollection, 
    setIsMobileMenuOpen, 
    onLogout 
}: {
    user: User, 
    activeTab: string, 
    setActiveTab: (tab: 'dashboard' | 'projects' | 'inspiration') => void,
    setSelectedCollection: (col: string | null) => void,
    setIsMobileMenuOpen: (open: boolean) => void,
    onLogout: () => void
}) => (
    <>
    <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <i className="ph ph-magic-wand text-white text-xl"></i>
        </div>
        <span className="font-bold text-xl tracking-tight text-white">Locaith Design</span>
    </div>

    <nav className="space-y-2 flex-1">
        <button 
            onClick={() => { setActiveTab('dashboard'); setSelectedCollection(null); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white/5 text-white border-white/5 shadow-sm' : 'text-secondary border-transparent hover:text-white hover:bg-white/5'}`}
        >
            <i className={`ph ph-squares-four text-lg ${activeTab === 'dashboard' ? 'text-primary' : ''}`}></i>
            Dashboard
        </button>
            <button 
            onClick={() => { setActiveTab('projects'); setSelectedCollection(null); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border font-medium transition-all ${activeTab === 'projects' ? 'bg-white/5 text-white border-white/5 shadow-sm' : 'text-secondary border-transparent hover:text-white hover:bg-white/5'}`}
        >
            <i className={`ph ph-folder text-lg ${activeTab === 'projects' ? 'text-primary' : ''}`}></i>
            My Projects
        </button>
            <button 
            onClick={() => { setActiveTab('inspiration'); setSelectedCollection(null); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border font-medium transition-all ${activeTab === 'inspiration' ? 'bg-white/5 text-white border-white/5 shadow-sm' : 'text-secondary border-transparent hover:text-white hover:bg-white/5'}`}
        >
            <i className={`ph ph-sparkle text-lg ${activeTab === 'inspiration' ? 'text-primary' : ''}`}></i>
            Inspiration
        </button>
    </nav>

    <div className="pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 mb-4 p-2 rounded-lg bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-bold overflow-hidden border border-white/10">
                {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">Pro Plan</p>
                <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
            </div>
        </div>
            <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
            <i className="ph ph-sign-out"></i> Sign Out
        </button>
    </div>
    </>
);

export const Dashboard: React.FC<DashboardProps> = ({ user, onNewDesign, onOpenDesign, onLogout }) => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'inspiration'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Template Gallery State
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  useEffect(() => {
    fetchDesigns();
  }, [user.id]);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      
      if (user.id === 'guest') {
        const localDesigns = localStorage.getItem('guest_designs');
        if (localDesigns) {
          setDesigns(JSON.parse(localDesigns));
        }
      } else {
        const { data, error } = await supabase
          .from('designs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDesigns(data || []);
      }
    } catch (error) {
      console.error('Error fetching designs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white flex relative">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-white/5 p-6 flex-col hidden md:flex bg-surface/30 sticky top-0 h-screen">
          <SidebarContent 
              user={user} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              setSelectedCollection={setSelectedCollection} 
              setIsMobileMenuOpen={setIsMobileMenuOpen} 
              onLogout={onLogout} 
          />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
              <aside className="w-64 h-full bg-surface border-r border-white/10 p-6 flex flex-col relative z-10 animate-in slide-in-from-left duration-300">
                  <SidebarContent 
                      user={user} 
                      activeTab={activeTab} 
                      setActiveTab={setActiveTab} 
                      setSelectedCollection={setSelectedCollection} 
                      setIsMobileMenuOpen={setIsMobileMenuOpen} 
                      onLogout={onLogout} 
                  />
              </aside>
          </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative h-screen">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

        <header className="flex justify-between items-center mb-10 relative z-10">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 bg-white/5 rounded-lg text-white">
                    <i className="ph ph-list text-xl"></i>
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 tracking-tight">
                        {activeTab === 'dashboard' ? 'Create New Design' : activeTab === 'projects' ? 'My Library' : 'Inspiration'}
                    </h1>
                    <p className="text-secondary text-sm md:text-base hidden md:block">
                        {activeTab === 'dashboard' ? 'Choose a format to start generating with Locaith AI.' : activeTab === 'projects' ? 'Manage your saved designs and documents.' : 'Explore templates created by Locaith designers.'}
                    </p>
                </div>
            </div>
        </header>

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
            <>
                {/* Illustrative Action Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-16 relative z-10">
                    {[
                        { type: 'CV', label: 'Resume', desc: 'Stand out with pro CVs', color: 'bg-blue-600' },
                        { type: 'SALEKIT', label: 'Salekit', desc: 'Complete B2B Sales Docs', color: 'bg-indigo-600' },
                        { type: 'SLIDE', label: 'Presentation', desc: 'Slides that persuade', color: 'bg-emerald-600' },
                        { type: 'PITCH', label: 'Pitch Deck', desc: 'Raise capital faster', color: 'bg-purple-600' },
                        { type: 'BROCHURE', label: 'Brochure', desc: 'Marketing materials', color: 'bg-orange-600' },
                        { type: 'INVITATION', label: 'Invitation', desc: 'Events & Weddings', color: 'bg-rose-500' },
                    ].map((item) => (
                        <button
                            key={item.type}
                            onClick={() => onNewDesign(item.type as DesignType)}
                            className="relative h-48 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all duration-300 shadow-xl"
                        >
                            {/* Background Image */}
                            <img src={getImageForType(item.type)} alt={item.label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90"></div>
                            
                            {/* Content */}
                            <div className="absolute bottom-0 left-0 p-6 w-full text-left">
                                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-3 shadow-lg`}>
                                     <i className={`ph ${
                                         item.type === 'CV' ? 'ph-user-list' : 
                                         item.type === 'SALEKIT' ? 'ph-briefcase' : 
                                         item.type === 'SLIDE' ? 'ph-presentation' : 
                                         item.type === 'PITCH' ? 'ph-rocket' : 
                                         item.type === 'BROCHURE' ? 'ph-book-open' : 'ph-envelope-open'
                                     } text-xl text-white`}></i>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{item.label}</h3>
                                <p className="text-xs text-zinc-300">{item.desc}</p>
                            </div>
                            
                            {/* Hover Arrow */}
                            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                <i className="ph ph-arrow-right text-white"></i>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Recent Designs Section */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <i className="ph ph-clock-counter-clockwise text-primary"></i> Recent Projects
                    </h2>
                </div>
                
                {loading ? (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {[1,2,3].map(i => (
                             <div key={i} className="h-64 bg-surface rounded-2xl animate-pulse border border-white/5"></div>
                         ))}
                     </div>
                ) : designs.length === 0 ? (
                    <div className="text-center py-24 bg-surface/30 rounded-3xl border border-dashed border-white/10 relative z-10">
                        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="ph ph-pencil-slash text-4xl text-zinc-600"></i>
                        </div>
                        <h3 className="text-lg font-medium text-white">No designs yet</h3>
                        <p className="text-secondary text-sm mt-1">Select a template above to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 relative z-10">
                        {designs.map((design) => (
                            <ProjectCard key={design.id} design={design} onOpenDesign={onOpenDesign} />
                        ))}
                    </div>
                )}
            </>
        )}

        {/* MY PROJECTS VIEW */}
        {activeTab === 'projects' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 relative z-10">
                {designs.map((design) => (
                    <ProjectCard key={design.id} design={design} onOpenDesign={onOpenDesign} />
                ))}
            </div>
        )}

        {/* INSPIRATION VIEW - TEMPLATE GALLERY */}
        {activeTab === 'inspiration' && (
            <div className="relative z-10">
                {!selectedCollection ? (
                    // SHOW COLLECTIONS
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {COLLECTIONS.map((col) => (
                            <div 
                                key={col.id} 
                                onClick={() => setSelectedCollection(col.type)}
                                className="group bg-surface border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all cursor-pointer shadow-lg hover:shadow-2xl"
                            >
                                <div className="h-48 overflow-hidden relative">
                                    <img src={col.image} alt={col.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                         <span className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm font-bold text-white border border-white/20 group-hover:scale-105 transition-transform">
                                            View {col.count} Templates
                                         </span>
                                    </div>
                                </div>
                                <div className="p-5 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{col.title}</h3>
                                        <p className="text-xs text-zinc-500">Professional Templates</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                        <i className="ph ph-arrow-right"></i>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // SHOW TEMPLATES IN COLLECTION
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <button 
                            onClick={() => setSelectedCollection(null)}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
                        >
                            <i className="ph ph-arrow-left"></i> Back to Collections
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {TEMPLATES[selectedCollection as keyof typeof TEMPLATES]?.map((tpl) => (
                                <div key={tpl.id} className="bg-surface border border-white/5 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                                    <div className="h-48 overflow-hidden relative">
                                        <img src={tpl.image} alt={tpl.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white">
                                            PREMIUM
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="text-lg font-bold text-white mb-1">{tpl.name}</h3>
                                        <p className="text-xs text-zinc-400 mb-4 flex-1">{tpl.description}</p>
                                        <button 
                                            onClick={() => onNewDesign(selectedCollection as DesignType, tpl.content)}
                                            className="w-full py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <i className="ph ph-copy"></i> Use This Template
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

      </main>
    </div>
  );
};