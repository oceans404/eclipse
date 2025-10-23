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
          <div className="logo">Eclipse</div>
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
              Buy private data
              <br />
              with confidence.
            </h1>
            <p className="hero-subtitle">
              A private AI agent answers your questions about encrypted content,
              so you know what you&apos;re buying before you commit.
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
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="tech">
        <div className="container-eclipse">
          <div className="problem-content">
            <div className="section-label">The Problem</div>
            <h2>Buying private data requires blind trust.</h2>
            <p>
              As a buyer, you can&apos;t verify what you&apos;re getting without
              seeing it. As a seller, you can&apos;t prove your data&apos;s
              value without giving it away for free.
            </p>
            <p>
              Eclipse bridges this gap with privacy-preserving verification.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="container-eclipse">
          <div className="how-it-works-header">
            <div className="section-label">How It Works</div>
            <h2>
              Ask questions,
              <br />
              buy with certainty.
            </h2>
            <p>
              Our private AI agent has access to encrypted content. You can
              verify what you&apos;re buying without the seller revealing
              anything.
            </p>
          </div>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">01</div>
              <h3>Creator uploads</h3>
              <p>
                Creators upload private content with a title, description, and
                price. A private AI agent gains encrypted access.
              </p>
            </div>
            <div className="step">
              <div className="step-number">02</div>
              <h3>Buyer verifies</h3>
              <p>
                Ask the AI agent questions about the content. Verify it matches
                the description before making a purchase decision.
              </p>
            </div>
            <div className="step">
              <div className="step-number">03</div>
              <h3>Secure payment</h3>
              <p>
                Pay with PYUSD through our smart contract. Content access is
                automatically granted after verified payment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="benefits">
        <div className="container-eclipse">
          <div className="benefits-header">
            <div className="section-label">Benefits</div>
            <h2>Built for buyers and sellers.</h2>
          </div>
          <div className="benefits-grid">
            <div className="benefit">
              <div className="benefit-for">For Buyers</div>
              <h3 className="benefit-title">Verify before you buy</h3>
              <p className="benefit-description">
                Ask questions about encrypted content through our private AI
                agent. Confirm authenticity and value without the seller
                revealing anything prematurely.
              </p>
            </div>
            <div className="benefit">
              <div className="benefit-for">For Sellers</div>
              <h3 className="benefit-title">Prove value without risk</h3>
              <p className="benefit-description">
                Demonstrate your data&apos;s worth to potential buyers while
                maintaining complete control. No free samples, no data leakage.
              </p>
            </div>
            <div className="benefit">
              <div className="benefit-for">For Buyers</div>
              <h3 className="benefit-title">Transparent pricing</h3>
              <p className="benefit-description">
                All transactions are on-chain with PYUSD. View complete price
                history and transaction records on Etherscan.
              </p>
            </div>
            <div className="benefit">
              <div className="benefit-for">For Sellers</div>
              <h3 className="benefit-title">Direct payments</h3>
              <p className="benefit-description">
                Receive payments instantly to your wallet. No intermediaries, no
                delays. Smart contracts handle everything automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="tech">
        <div className="container-eclipse">
          <div className="tech-content">
            <div className="section-label">Technology</div>
            <h2>Built on cutting-edge infrastructure.</h2>
            <p>
              Eclipse combines privacy-preserving computation, stable digital
              payments, and decentralized verification to create a trustless
              marketplace.
            </p>
            <div className="tech-stack">
              <div className="tech-item">Nillion Private Storage & LLMs</div>
              <div className="tech-item">PYUSD Stablecoin Payments</div>
              <div className="tech-item">Envio Event Indexing</div>
              <div className="tech-item">Ethereum Smart Contracts</div>
              <div className="tech-item">Verifiable Compute</div>
              <div className="tech-item">On-chain Permissioning</div>
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
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container-eclipse">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">Eclipse</div>

              <Link href="https://github.com/oceans404/eclipse" target="_blank">
                <p>Github repo</p>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
