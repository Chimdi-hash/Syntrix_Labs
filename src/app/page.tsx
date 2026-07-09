"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
// import { createClient } from "genlayer-js"; // SDK integration placeholder

export default function Home() {
  const [proposals, setProposals] = useState([
    {
      id: 1,
      title: "SIP-12: Expand Liquidity Mining to DEXs",
      desc: "This proposal suggests allocating 50,000 SYN tokens to incentivize liquidity providers on major decentralized exchanges to deepen market liquidity.",
      status: "Approved",
      analysis: "Aligned with Syntrix Constitution Article 3 (Growth). Risk assessment: Low. The requested amount is within treasury limits and promotes ecosystem expansion."
    },
    {
      id: 2,
      title: "SIP-13: Increase Validator Minimum Stake",
      desc: "Increase the minimum stake required to run a validator node from 10,000 SYN to 50,000 SYN to ensure higher network security.",
      status: "Pending",
      analysis: "Intelligent Contract is currently reaching consensus via Optimistic Democracy..."
    },
    {
      id: 3,
      title: "SIP-14: Migrate Treasury to High-Risk Strategy",
      desc: "Move 80% of the DAO treasury into experimental algorithmic stablecoins to maximize yield during the bull market.",
      status: "Rejected",
      analysis: "Violates Syntrix Constitution Article 7 (Capital Preservation). Risk assessment: Critical. Algorithmic stablecoins present an unacceptable tail-risk for core treasury funds."
    }
  ]);

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    // Initialize GenLayer JS SDK client (GenLayer Studio network)
    // const genlayerClient = createClient({
    //   endpoint: "https://studio.genlayer.com/api",
    // });
    // setClient(genlayerClient);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    
    // In a real app, this would call genlayerClient.writeContract(...)
    setProposals([
      ...proposals,
      {
        id: proposals.length + 1,
        title: newTitle,
        desc: newDesc,
        status: "Pending",
        analysis: "Intelligent Contract is evaluating proposal via GenVM..."
      }
    ]);
    
    setNewTitle("");
    setNewDesc("");
  };

  return (
    <main className={styles.container}>
      <header className={`${styles.header} animate-slide-up`}>
        <h1 className={styles.title}>Syntrix Labs</h1>
        <p className={styles.subtitle}>
          AI-Governed DAO powered by GenLayer. Proposals are evaluated by Intelligent Contracts for constitutional alignment.
        </p>
      </header>

      <div className={styles.dashboard}>
        {/* Sidebar / Stats */}
        <div className={`glass-panel ${styles.sidebarCard} animate-float`}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Treasury</span>
            <span className={styles.statValue}>2,450,000 SYN</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Active Proposals</span>
            <span className={styles.statValue}>{proposals.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>AI Confidence</span>
            <span className={styles.statValue}>98.5%</span>
          </div>
          
          <form className={styles.inputGroup} style={{ marginTop: 'auto' }} onSubmit={handleSubmit}>
            <span className={styles.statLabel}>Submit Proposal</span>
            <input 
              className={styles.input} 
              type="text" 
              placeholder="Proposal Title" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea 
              className={styles.textarea} 
              placeholder="Describe your proposal in detail..." 
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
              Submit to GenVM
            </button>
          </form>
        </div>

        {/* Proposals List */}
        <div className={styles.proposalsList}>
          {proposals.map((prop, idx) => (
            <div key={prop.id} className={`glass-panel ${styles.proposalCard} animate-slide-up`} style={{ animationDelay: `${(idx + 1) * 0.1}s` }}>
              <div className={styles.proposalHeader}>
                <h3 className={styles.proposalTitle}>{prop.title}</h3>
                <span className={`${styles.statusBadge} ${
                  prop.status === 'Approved' ? styles.statusApproved : 
                  prop.status === 'Rejected' ? styles.statusRejected : 
                  styles.statusPending
                }`}>
                  {prop.status === 'Pending' ? 'Evaluating' : `AI ${prop.status}`}
                </span>
              </div>
              <p className={styles.proposalDesc}>{prop.desc}</p>
              
              <div className={styles.aiAnalysis} style={{ 
                borderLeftColor: prop.status === 'Approved' ? 'var(--accent)' : 
                                prop.status === 'Rejected' ? '#dc3545' : '#ffc107' 
              }}>
                <h4 className={styles.aiAnalysisTitle} style={{
                  color: prop.status === 'Approved' ? 'var(--accent)' : 
                         prop.status === 'Rejected' ? '#dc3545' : '#ffc107'
                }}>
                  {prop.status === 'Approved' ? (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> GenVM Analysis</>
                  ) : prop.status === 'Rejected' ? (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Violation Detected</>
                  ) : (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Processing...</>
                  )}
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#d4d4d4' }}>{prop.analysis}</p>
              </div>
              
              <div className={styles.actions}>
                {prop.status === 'Approved' ? (
                  <button className="btn-primary">Execute on GenLayer</button>
                ) : prop.status === 'Pending' ? (
                  <button className="btn-secondary" disabled>Wait for Consensus</button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
