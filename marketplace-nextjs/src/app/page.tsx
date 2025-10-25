'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  useEffect(() => {
    // Mouse parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      const layers = document.querySelectorAll('.parallax-layer');
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      layers.forEach((layer) => {
        const element = layer as HTMLElement;
        const speed = parseFloat(element.getAttribute('data-speed') || '0');
        const x = (e.clientX - centerX) * speed;
        const y = (e.clientY - centerY) * speed;

        element.style.transform = `translate(${x}px, ${y}px)`;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {/* Parallax Background */}
      <div className="parallax-bg">
        <div
          className="parallax-layer parallax-layer-1"
          data-speed="0.15"
        ></div>
        <div className="parallax-layer parallax-layer-2" data-speed="0.3"></div>
        <div className="parallax-layer parallax-layer-3" data-speed="0.5"></div>
        <div className="parallax-layer parallax-layer-4" data-speed="0.2"></div>
      </div>

      {/* Navigation */}
      <nav>
        <div className="container-eclipse">
          <div className="logo">🌒 Eclipse</div>
          <div className="nav-links">
            <Link href="https://github.com/oceans404/eclipse" target="_blank">
              Github Repo
            </Link>
            <Link href="/products" className="btn-nav">
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container-eclipse">
          <div className="hero-content">
            <div className="hero-label">Private Data Marketplace</div>
            <h1>
              Verify quality without revealing content.
              <br />
              Buy with confidence.
            </h1>
            <p className="hero-subtitle">
              Ask an AI anything about the content to make an informed decision.
              Creators protect their work—it stays private until someone pays.
            </p>
            <div className="hero-buttons">
              <Link href="/products" className="btn-primary">
                Explore Marketplace
              </Link>
              <Link
                href="https://github.com/oceans404/eclipse"
                target="_blank"
                className="btn-secondary"
              >
                View on GitHub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="container-eclipse">
          <div className="how-it-works-header">
            <div className="section-label">How It Works</div>
            <h2>3 steps to trustless transactions</h2>
          </div>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">01</div>
              <h3>Upload and price</h3>
              <p>
                Creators set a title, description, and price in PYUSD. Content
                goes into Nillion Private Storage where only the Eclipse AI
                agent can access it.
              </p>
            </div>
            <div className="step">
              <div className="step-number">02</div>
              <h3>Ask questions</h3>
              <p>
                Buyers chat with the Eclipse AI to verify quality, authenticity,
                or any other product details before making a purchasing
                decision.
              </p>
            </div>
            <div className="step">
              <div className="step-number">03</div>
              <h3>Pay and download</h3>
              <p>
                Stable PYUSD payment transfers directly to the creator. Buyers
                instantly unlock full access to the content.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="container-eclipse">
          <div className="benefits-header">
            <div className="section-label">Why Eclipse</div>
            <h2>Trust through technology, not promises.</h2>
          </div>
          <div className="benefits-grid">
            <div className="benefit">
              <div className="benefit-for">For Creators</div>
              <h3 className="benefit-title">
                Monetize without giving away samples
              </h3>
              <p className="benefit-description">
                Keep full control of your work. Buyers verify quality through
                AI— they can't access, view, or copy your content until they
                pay.
              </p>
            </div>
            <div className="benefit">
              <div className="benefit-for">For Buyers</div>
              <h3 className="benefit-title">Verify before you commit</h3>
              <p className="benefit-description">
                Ask the AI detailed questions about content quality,
                authenticity, and details. Make informed decisions—no blind
                purchases.
              </p>
            </div>
            <div className="benefit">
              <div className="benefit-for">For Everyone</div>
              <h3 className="benefit-title">
                Direct payments, guaranteed privacy
              </h3>
              <p className="benefit-description">
                Creators receive instant payment. Buyers get immediate access.
                No escrow, no intermediaries—just cryptographically secured
                transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container-eclipse">
          <div className="cta-content">
            <h2>Start buying and selling private data today.</h2>
            <div className="cta-buttons">
              <Link href="/products" className="btn-primary">
                Launch Marketplace
              </Link>
              <Link
                href="https://github.com/oceans404/eclipse"
                target="_blank"
                className="btn-secondary"
              >
                Learn How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
