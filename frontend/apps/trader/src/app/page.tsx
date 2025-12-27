"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowRight, BarChart2, Brain, Zap, Shield, Globe } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const lenis = new Lenis();

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        const ctx = gsap.context(() => {
            // Hero Animation
            const tl = gsap.timeline();
            tl.from(".hero-text", {
                y: 100,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: "power4.out",
            })
                .from(
                    ".hero-sub",
                    {
                        y: 50,
                        opacity: 0,
                        duration: 1,
                        ease: "power3.out",
                    },
                    "-=0.5"
                )
                .from(
                    ".hero-btn",
                    {
                        y: 20,
                        opacity: 0,
                        duration: 0.8,
                        ease: "power3.out",
                    },
                    "-=0.5"
                );

            // Features Animation
            gsap.utils.toArray(".feature-card").forEach((card: any, i) => {
                gsap.from(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%",
                        toggleActions: "play none none reverse",
                    },
                    y: 50,
                    opacity: 0,
                    duration: 0.8,
                    delay: i * 0.1,
                    ease: "power3.out",
                });
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-[#0c0d10] text-[#e8eaed] overflow-hidden selection:bg-[#6c8cff] selection:text-white"
        >
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-[#0c0d10]/50 border-b border-[#2d303a]/50">
                <div className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-[#6c8cff] to-[#3dd68c] bg-clip-text text-transparent">
                    FinSim
                </div>
                <div className="flex gap-4">
                    <Link
                        href="/sign-in"
                        className="px-4 py-2 text-sm font-medium text-[#e8eaed] hover:text-white transition-colors"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/sign-up"
                        className="px-4 py-2 text-sm font-medium bg-[#6c8cff] text-white rounded-full hover:bg-[#4a6bde] transition-all shadow-[0_0_15px_rgba(108,140,255,0.3)]"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(108,140,255,0.1)_0%,transparent_70%)] pointer-events-none" />

                <h1 className="hero-text text-6xl md:text-8xl font-bold text-center tracking-tight mb-6 max-w-5xl mx-auto leading-[1.1]">
                    Master the Markets <br />
                    <span className="text-[#6c8cff]">Without the Risk</span>
                </h1>

                <p className="hero-sub text-xl md:text-2xl text-[#8b8f9a] text-center max-w-2xl mx-auto mb-10 leading-relaxed">
                    Professional-grade paper trading platform with AI-powered
                    analysis, advanced backtesting, and real-time simulation.
                </p>

                <div className="hero-btn flex flex-col sm:flex-row gap-4">
                    <Link
                        href="/sign-up"
                        className="group relative px-8 py-4 bg-[#e8eaed] text-[#0c0d10] rounded-full font-semibold text-lg hover:bg-white transition-all flex items-center gap-2"
                    >
                        Start Trading Now
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        href="#features"
                        className="px-8 py-4 border border-[#2d303a] text-[#e8eaed] rounded-full font-semibold text-lg hover:bg-[#171921] transition-all"
                    >
                        Explore Features
                    </Link>
                </div>

                {/* Abstract UI Mockup/Graphic */}
                <div className="hero-btn mt-20 w-full max-w-6xl aspect-[16/9] bg-[#12131a] rounded-t-2xl border border-[#2d303a] border-b-0 shadow-2xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0c0d10]/80 z-10" />
                    <div className="p-4 grid grid-cols-12 gap-4 h-full opacity-50">
                        <div className="col-span-3 bg-[#1e2028] rounded-lg h-3/4 animate-pulse" />
                        <div className="col-span-9 bg-[#1e2028] rounded-lg h-full" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Engineered for{" "}
                            <span className="text-[#3dd68c]">Performance</span>
                        </h2>
                        <p className="text-xl text-[#8b8f9a] max-w-2xl">
                            Everything you need to test your strategies and
                            analyze the market with institutional-grade tools.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Brain className="w-8 h-8 text-[#6c8cff]" />}
                            title="AI Analysis"
                            description="Get deep insights into market trends and sentiment analysis powered by advanced LLMs."
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8 text-[#f5b03d]" />}
                            title="Lightning Fast"
                            description="Real-time data streaming and instant order execution simulation for realistic practice."
                        />
                        <FeatureCard
                            icon={
                                <BarChart2 className="w-8 h-8 text-[#3dd68c]" />
                            }
                            title="Advanced Backtesting"
                            description="Test your strategies against historical data with customizable parameters and detailed reports."
                        />
                        <FeatureCard
                            icon={<Shield className="w-8 h-8 text-[#f06c6c]" />}
                            title="Risk Free"
                            description="Experiment with complex derivatives and leverage without risking a single penny of real capital."
                        />
                        <FeatureCard
                            icon={<Globe className="w-8 h-8 text-[#6c8cff]" />}
                            title="Global Markets"
                            description="Access data from major exchanges worldwide including stocks, crypto, and forex."
                        />
                        <FeatureCard
                            icon={
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6c8cff] to-[#3dd68c]" />
                            }
                            title="Strategy Builder"
                            description="Visual strategy builder allows you to create complex algorithms without writing code."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[#6c8cff]/5 z-0" />
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
                        Ready to start your journey?
                    </h2>
                    <p className="text-xl text-[#8b8f9a] mb-12 max-w-2xl mx-auto">
                        Join thousands of traders who are refining their skills
                        with FinSim today.
                    </p>
                    <Link
                        href="/sign-up"
                        className="inline-flex items-center justify-center px-10 py-5 bg-[#6c8cff] text-white rounded-full font-bold text-xl hover:bg-[#4a6bde] transition-all shadow-[0_0_30px_rgba(108,140,255,0.4)] hover:scale-105"
                    >
                        Create Free Account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-[#2d303a] bg-[#0c0d10]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-xl font-bold text-[#e8eaed]">
                        FinSim
                    </div>
                    <div className="text-[#5c606c] text-sm">
                        © 2025 FinSim. All rights reserved.
                    </div>
                    <div className="flex gap-6">
                        <a
                            href="#"
                            className="text-[#8b8f9a] hover:text-[#6c8cff] transition-colors"
                        >
                            Twitter
                        </a>
                        <a
                            href="#"
                            className="text-[#8b8f9a] hover:text-[#6c8cff] transition-colors"
                        >
                            GitHub
                        </a>
                        <a
                            href="#"
                            className="text-[#8b8f9a] hover:text-[#6c8cff] transition-colors"
                        >
                            Discord
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="feature-card p-8 rounded-2xl bg-[#12131a] border border-[#2d303a] hover:border-[#6c8cff]/50 transition-colors group">
            <div className="mb-6 p-3 bg-[#1e2028] rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-3 text-[#e8eaed]">{title}</h3>
            <p className="text-[#8b8f9a] leading-relaxed">{description}</p>
        </div>
    );
}

