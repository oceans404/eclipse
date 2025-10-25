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
          <div
            className="logo"
            style={{ fontFamily: 'var(--font-crimson-pro)' }}
          >
            🌒 Eclipse
          </div>
          <div className="nav-links">
            <Link href="https://github.com/oceans404/eclipse" target="_blank">
              Github Repo
            </Link>
            <Link href="/products" className="btn-nav">
              Launch Marketplace
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container-eclipse">
          <div className="hero-content">
            <div style={{ fontSize: '4rem' }}>🌒</div>
            <h1>
              Verify before you buy.
              <br />
              Protect until you sell.
            </h1>
            <p className="hero-subtitle">
              Buyers ask questions to verify content quality. <br />
              Creators keep their work protected until payment clears.
            </p>
            <div className="hero-buttons">
              <Link href="/products" className="btn-primary">
                Launch Marketplace
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

      {/* Problem Statement */}
      <section
        className="problem-statement"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="container-eclipse">
          <div className="problem-content">
            <div className="section-label">The Problem We're Solving</div>
            <h2>Buyers guess blindly. Creators answer endlessly.</h2>
            <p>
              <strong>Buyers:</strong> You want to know if a meal plan works for
              vegetarians, if a dataset has the right format, if a tutorial
              matches your skill level—but you can't see inside until you pay.
            </p>
            <p>
              <strong>Creators:</strong> Every buyer has different questions.
              You answer the same things over and over, try to predict FAQs, and
              still miss edge cases. Or worse—you give away too much and lose
              the sale.
            </p>
            <p
              style={{
                marginTop: '2rem',
                fontSize: '1.125rem',
                fontWeight: '500',
              }}
            >
              Eclipse: An AI agent reads your content and answers unlimited
              buyer questions in real-time. Neutral, accurate, tireless.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="container-eclipse">
          <div className="how-it-works-header">
            <div className="section-label">How It Works</div>
            <h2>For Creators</h2>
            <p
              style={{
                marginTop: '1.5rem',
                fontSize: '1.125rem',
                color: 'rgba(250, 250, 248, 0.8)',
                maxWidth: '700px',
                margin: '1.5rem auto 0',
              }}
            >
              Upload once. The AI handles all buyer questions automatically.
            </p>
          </div>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">01</div>
              <h3>Upload & Encrypt</h3>
              <p>
                Your content is encrypted with AES-256-GCM and stored in Vercel
                Blob. The encryption key and metadata go into Nillion's
                nilDB—accessible only within the TEE.
              </p>
            </div>
            <div className="step">
              <div className="step-number">02</div>
              <h3>Set Your Price</h3>
              <p>
                Add a title, description, and price in PYUSD. That's it—no FAQ
                writing, no question prediction, no customer support.
              </p>
            </div>
            <div className="step">
              <div className="step-number">03</div>
              <h3>AI Answers Questions</h3>
              <p>
                When buyers ask questions, Google Gemini 2.0 Flash runs inside
                Nillion's TEE (nilCC). It decrypts content in memory, analyzes
                it, and gives accurate answers—privacy guardrails prevent
                content leakage.
              </p>
            </div>
          </div>
          <div style={{ marginTop: '6rem' }}>
            <div className="step">
              <div className="step-number">04</div>
              <h3>Get Paid, Grant Access</h3>
              <p>
                PYUSD transfers to your wallet via smart contract. Envio indexes
                the payment event, the TEE verifies it, and the buyer gets
                instant download access. Guaranteed and simultaneous.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - For Buyers */}
      <section className="problem-statement">
        <div className="container-eclipse">
          <div className="problem-content">
            <div className="section-label">How It Works</div>
            <h2>For Buyers</h2>
            <p style={{ marginTop: '1.5rem', fontSize: '1.125rem' }}>
              Ask the AI anything. Get real answers before you commit.
            </p>
            <div
              style={{
                marginTop: '4rem',
                textAlign: 'left',
                maxWidth: '800px',
                margin: '4rem auto 0',
              }}
            >
              <div style={{ marginBottom: '3rem' }}>
                <h3
                  style={{
                    fontSize: '1.75rem',
                    marginBottom: '1rem',
                    fontWeight: '400',
                  }}
                >
                  1. Browse Listings
                </h3>
                <p>
                  Find meal plans, datasets, templates, guides—whatever you
                  need.
                </p>
              </div>
              <div style={{ marginBottom: '3rem' }}>
                <h3
                  style={{
                    fontSize: '1.75rem',
                    marginBottom: '1rem',
                    fontWeight: '400',
                  }}
                >
                  2. Ask the AI Questions
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                  Google Gemini 2.0 Flash analyzes content inside the TEE. Ask
                  anything:
                </p>
                <ul
                  style={{
                    paddingLeft: '1.5rem',
                    color: '#666',
                    lineHeight: '1.8',
                  }}
                >
                  <li>"Is this meal plan suitable for vegetarians?"</li>
                  <li>"Does this dataset include geographic coordinates?"</li>
                  <li>"What skill level is this tutorial aimed at?"</li>
                  <li>"How many pages is this guide?"</li>
                  <li>"Does this include example code?"</li>
                </ul>
                <p style={{ marginTop: '1.5rem', fontWeight: '500' }}>
                  Get neutral, accurate answers in real-time. The AI reads
                  encrypted content in memory—privacy guardrails prevent it from
                  revealing raw data.
                </p>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '1.75rem',
                    marginBottom: '1rem',
                    fontWeight: '400',
                  }}
                >
                  3. Buy with Confidence
                </h3>
                <p>
                  Pay in PYUSD. Instantly download the full content. Verify the
                  AI was telling the truth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How the AI Agent Works - NEW TECHNICAL SECTION */}
      <section className="how-it-works" id="how-ai-works">
        <div className="container-eclipse">
          <div className="how-it-works-header">
            <div className="section-label">Technical Deep Dive</div>
            <h2>How the AI Agent Works</h2>
            <p
              style={{
                marginTop: '1.5rem',
                fontSize: '1.125rem',
                color: 'rgba(250, 250, 248, 0.8)',
                maxWidth: '800px',
                margin: '1.5rem auto 0',
              }}
            >
              Private execution. Real-time analysis. Zero data leakage.
            </p>
          </div>
          <div
            style={{
              maxWidth: '900px',
              margin: '4rem auto 0',
              textAlign: 'left',
            }}
          >
            <p
              style={{
                fontSize: '1.125rem',
                color: 'rgba(250, 250, 248, 0.9)',
                lineHeight: '1.8',
                marginBottom: '2rem',
              }}
            >
              When you upload content, it's encrypted with AES-256-GCM and
              stored with encryption keys in Nillion Private Storage (nilDB).
              The Eclipse AI agent—Google Gemini 2.0 Flash running inside
              Nillion's TEE (nilCC)—gets access only when buyers ask questions:
            </p>
            <div className="steps-grid" style={{ marginTop: '3rem' }}>
              <div className="step">
                <div className="step-number">01</div>
                <h3>Encrypted Upload</h3>
                <p>
                  Content is encrypted with a unique key. Encrypted metadata and
                  the encryption key go into Nillion Private Storage, where it
                  is only accessible within the TEE.
                </p>
              </div>
              <div className="step">
                <div className="step-number">02</div>
                <h3>Private Analysis</h3>
                <p>
                  When a buyer asks a question, Gemini 2.0 Flash runs inside
                  nilCC (the TEE). It decrypts content in memory, analyzes it,
                  and answers—but privacy guardrails prevent it from revealing
                  raw data.
                </p>
              </div>
              <div className="step">
                <div className="step-number">03</div>
                <h3>Verified Access</h3>
                <p>
                  After PYUSD payment is verified on-chain via Envio indexing,
                  the TEE decrypts and serves the full content. Until then,
                  buyers get answers—not files.
                </p>
              </div>
            </div>
            <p
              style={{
                fontSize: '1rem',
                color: 'rgba(250, 250, 248, 0.7)',
                lineHeight: '1.8',
                marginTop: '3rem',
                fontStyle: 'italic',
              }}
            >
              The AI can verify "this image is a sunset" or "this dataset has
              10,000 rows" without ever exposing the actual pixels or data to
              the buyer. Content stays encrypted everywhere except inside the
              TEE's memory during analysis.
            </p>
          </div>
        </div>
      </section>

      {/* Why This Works */}
      <section className="benefits">
        <div className="container-eclipse">
          <div className="benefits-header">
            <div className="section-label">Why Eclipse Works</div>
            <h2>Real answers. Zero exposure.</h2>
          </div>
          <div className="benefits-grid">
            <div className="benefit">
              <div className="benefit-for">For Creators</div>
              <h3 className="benefit-title">
                Never answer another buyer question
              </h3>
              <p className="benefit-description">
                The AI handles unlimited questions in real-time. No more DMs, no
                FAQ writing, no edge cases you didn't predict. Just upload and
                let the AI do the work.
              </p>
            </div>
            <div className="benefit">
              <div className="benefit-for">For Buyers</div>
              <h3 className="benefit-title">Get answers, not marketing</h3>
              <p className="benefit-description">
                The AI has real-time access to the actual content. Ask specific
                questions about format, contents, compatibility, style—get
                neutral, factual answers instantly.
              </p>
            </div>
            <div className="benefit">
              <div className="benefit-for">For Trust</div>
              <h3 className="benefit-title">Verified on-chain payments</h3>
              <p className="benefit-description">
                PYUSD transfers to creator wallet via smart contract. Envio
                indexes the payment event in real-time. The TEE verifies payment
                before granting content access. No escrow, no waiting, no manual
                approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="problem-statement">
        <div className="container-eclipse">
          <div className="problem-content">
            <div className="section-label">The Technology</div>
            <h2>Built on proven infrastructure</h2>
            <div
              style={{
                marginTop: '4rem',
                textAlign: 'left',
                maxWidth: '800px',
                margin: '4rem auto 0',
              }}
            >
              <p style={{ marginBottom: '2rem' }}>
                <strong>Nillion nilDB (Private Storage):</strong> Encrypted
                content metadata and encryption keys are stored in Nillion's
                private database. Only accessible within the TEE—not by buyers,
                sellers, or us.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                <strong>Nillion nilCC (TEE):</strong> Google Gemini 2.0 Flash
                runs inside Nillion's Trusted Execution Environment. Content is
                decrypted in memory only during analysis. Privacy guardrails
                prevent data leakage—AI can describe but never reproduce raw
                content.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                <strong>Hardhat 3 + Smart Contracts:</strong>{' '}
                ProductPaymentService contract on Ethereum Sepolia handles all
                PYUSD payments. Tracks purchases per product ID and emits events
                for indexing.
              </p>
              <p style={{ marginBottom: '2rem' }}>
                <strong>Envio HyperIndex:</strong> Real-time indexing of payment
                events from the smart contract. Verifies purchases before the
                TEE grants content access. Live GraphQL API for marketplace
                data.
              </p>
              <p>
                <strong>PayPal USD (PYUSD):</strong> Stablecoin payments via
                direct transfers to creator wallets. When a buyer purchases,
                payment is verified on-chain and content access is granted
                simultaneously. List at $50, get $50. No volatility, no escrow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="how-it-works" id="use-cases">
        <div className="container-eclipse">
          <div className="how-it-works-header">
            <div className="section-label">What Can You Sell?</div>
            <h2>Best for digital goods where samples defeat the purpose</h2>
          </div>
          <div className="steps-grid">
            <div className="step">
              <h3>Datasets</h3>
              <p>Research data, training sets, proprietary databases</p>
            </div>
            <div className="step">
              <h3>Digital Templates</h3>
              <p>Design files, code libraries, 3D models</p>
            </div>
            <div className="step">
              <h3>Research & Reports</h3>
              <p>Market analysis, white papers, case studies</p>
            </div>
          </div>
          <div style={{ marginTop: '5rem' }}>
            <div className="steps-grid">
              <div className="step">
                <h3>Creative Assets</h3>
                <p>High-res images, sound packs, video footage</p>
              </div>
              <div className="step">
                <h3>Educational Content</h3>
                <p>Courses, tutorials, documentation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="problem-statement">
        <div className="container-eclipse">
          <div className="problem-content">
            <div className="section-label">FAQ</div>
            <h2>Common Questions</h2>
            <div
              style={{
                marginTop: '4rem',
                textAlign: 'left',
                maxWidth: '900px',
                margin: '4rem auto 0',
              }}
            >
              <div style={{ marginBottom: '3rem' }}>
                <h3
                  style={{
                    fontSize: '1.5rem',
                    marginBottom: '1rem',
                    fontWeight: '400',
                  }}
                >
                  "How is the AI neutral if creators upload the content?"
                </h3>
                <p>
                  Google Gemini 2.0 Flash runs inside Nillion's TEE (nilCC) and
                  operates on the encrypted content itself—not on marketing copy
                  or listing descriptions. When you ask "is this vegetarian?" it
                  analyzes the actual file content. Privacy guardrails prevent
                  it from reproducing raw data. Post-purchase, you can verify
                  every answer by checking the downloaded content.
                </p>
              </div>
              <div style={{ marginBottom: '3rem' }}>
                <h3
                  style={{
                    fontSize: '1.5rem',
                    marginBottom: '1rem',
                    fontWeight: '400',
                  }}
                >
                  "What if the AI gives wrong answers?"
                </h3>
                <p>
                  The AI operates on the encrypted content itself—it's reading
                  the actual file in real-time. Post-purchase, you get the full
                  content and can immediately verify. We're adding a reputation
                  system where buyers can flag misleading listings.
                </p>
              </div>
              <div style={{ marginBottom: '3rem' }}>
                <h3
                  style={{
                    fontSize: '1.5rem',
                    marginBottom: '1rem',
                    fontWeight: '400',
                  }}
                >
                  "Can the AI reveal the content in its answers?"
                </h3>
                <p>
                  Content is encrypted with AES-256-GCM. The AI decrypts it in
                  memory only within the TEE during analysis. Privacy guardrails
                  instruct it to verify and describe, not reproduce. It can tell
                  you a meal plan is vegetarian-friendly, but won't list the
                  recipes. It can confirm a dataset has timestamps, but won't
                  show the data. The TEE architecture prevents content
                  extraction—only analysis and answers.
                </p>
              </div>
              <div style={{ marginBottom: '3rem' }}>
                <h3
                  style={{
                    fontSize: '1.5rem',
                    marginBottom: '1rem',
                    fontWeight: '400',
                  }}
                >
                  "How does payment verification work?"
                </h3>
                <p>
                  When you purchase, PYUSD transfers from your wallet to the
                  creator's wallet via the ProductPaymentService smart contract
                  on Ethereum Sepolia. The contract emits a payment event.
                  Envio's HyperIndex indexes this event in real-time. The TEE
                  service queries Envio's GraphQL API to verify the payment,
                  then grants you download access. Payment and access are
                  separate steps but happen within seconds.
                </p>
              </div>
              <div style={{ marginBottom: '3rem' }}>
                <h3
                  style={{
                    fontSize: '1.5rem',
                    marginBottom: '1rem',
                    fontWeight: '400',
                  }}
                >
                  "Why PYUSD?"
                </h3>
                <p>
                  Stablecoin = no price volatility. You list at $50, you get $50
                  worth of value. No conversion math, no surprise fees from
                  market swings. Plus, PayPal USD has wide adoption and easy
                  on-ramps.
                </p>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '1.5rem',
                    marginBottom: '1rem',
                    fontWeight: '400',
                  }}
                >
                  "What stops post-purchase piracy?"
                </h3>
                <p>
                  Nothing—same as any digital marketplace. Eclipse solves the
                  pre-purchase verification problem. Once someone buys, it's
                  like any digital download. Use watermarking or DRM if piracy
                  is a concern.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container-eclipse">
          <div className="cta-content">
            <h2>Stop answering questions. Start selling.</h2>
            <p
              style={{
                fontSize: '1.25rem',
                color: '#666',
                marginBottom: '3rem',
              }}
            >
              <strong>Creators:</strong> Let AI handle buyer questions
              automatically.
              <br />
              <strong>Buyers:</strong> Get real answers before you commit.
            </p>
            <div className="cta-buttons">
              <Link href="/products" className="btn-primary">
                Launch Marketplace
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
    </>
  );
}
