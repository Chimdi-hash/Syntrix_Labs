"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const DEFAULT_CONTRACT = "0xF86Dcac5aE45AC784C3aB4eb1C24Ac498DEc7D78";
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || DEFAULT_CONTRACT;
  const [proposals, setProposals] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [txMessage, setTxMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [userBalance, setUserBalance] = useState<string>("0");
  
  const [readClient, setReadClient] = useState<any>(null);
  const [writeClient, setWriteClient] = useState<any>(null);

  useEffect(() => {
    const rc = createClient({
      chain: studionet,
    });
    setReadClient(rc);
  }, []);

  const fetchProposals = useCallback(async (isBackground = false) => {
    if (!readClient || !contractAddress) return;
    if (!isBackground) setLoading(true);
    try {
      const fetched = [];
      let i = 0;
      while (true) {
        try {
          const propStr = await readClient.readContract({
             address: contractAddress,
             functionName: 'get_proposal',
             args: [i]
          });
          const prop = JSON.parse(propStr as string);
          
          // Show all proposals, regardless of submitter
          fetched.push({ id: i, ...prop });
          i++;
        } catch (e) {
          // Breaks the loop when we hit an index that doesn't exist yet
          break;
        }
      }
      setProposals(fetched);
    } catch (err) {
      console.error(err);
      console.log("Failed to fetch proposals, this might be normal if the contract is empty or address is wrong.");
    }
    setLoading(false);
  }, [readClient, contractAddress, account]);

  const fetchBalance = useCallback(async () => {
    if (!account) return;
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = (window as any).ethereum;
        const balanceWei = await provider.request({ method: 'eth_getBalance', params: [account, "latest"] });
        const balanceGen = parseInt(balanceWei, 16) / 1e18;
        setUserBalance(balanceGen.toFixed(2));
      }
    } catch (err) {
      console.error("Failed to fetch balance", err);
    }
  }, [account]);

  useEffect(() => {
    // Always fetch proposals if we have readClient and contractAddress
    if (readClient && contractAddress) {
      fetchProposals();
      if (account) fetchBalance();
      // Auto-poll every 5 seconds silently to catch consensus completion
      const interval = setInterval(() => {
        fetchProposals(true);
        if (account) fetchBalance();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [readClient, contractAddress, account, fetchProposals, fetchBalance]);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const provider = (window as any).ethereum;
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        setAccount(address);
        
        const wc = createClient({
          chain: studionet,
          account: address,
          provider: provider,
        });
        
        // Ensure MetaMask is on studionet
        await wc.connect("studionet");

        setWriteClient(wc);
      } catch (err) {
        console.error("Failed to connect wallet", err);
      }
    } else {
      alert("Please install MetaMask or another Web3 wallet.");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setWriteClient(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc || !writeClient || !contractAddress) {
      setTxMessage({ type: 'error', text: "Please connect wallet, enter contract address, and fill out the proposal." });
      return;
    }
    
    try {
      setTxMessage(null);
      const txHash = await writeClient.writeContract({
        address: contractAddress,
        functionName: 'submit_proposal',
        args: [newTitle, newDesc],
        value: BigInt("1000000000000000000"), // 1 GEN
      });
      setTxMessage({ type: 'success', text: `Proposal submitted! Waiting for confirmation...` });
      setNewTitle("");
      setNewDesc("");
      setTimeout(() => fetchProposals(true), 3000);
      setTimeout(() => setTxMessage(null), 8000);
    } catch (error) {
      console.error(error);
      setTxMessage({ type: 'error', text: "Error submitting proposal." });
    } finally {
      setLoading(false);
    }
  };

  const evaluateProposal = async (id: number) => {
    if (!writeClient || !contractAddress) return;
    try {
      setTxMessage(null);
      const txHash = await writeClient.writeContract({
        address: contractAddress,
        functionName: 'evaluate_proposal',
        args: [id],
        value: BigInt(0),
      });
      setTxMessage({ type: 'success', text: `Evaluation triggered! GenVM is reaching consensus...` });
      setTimeout(() => fetchProposals(true), 3000);
      setTimeout(() => setTxMessage(null), 8000);
    } catch (error) {
      console.error(error);
      setTxMessage({ type: 'error', text: "Error triggering AI evaluation." });
    }
  };

  return (
    <main className={styles.container}>
      <header className={`${styles.header} animate-slide-up`}>
        <h1 className={styles.title}>Syntrix Labs</h1>
        <div>
          {!account ? (
            <button className="btn-primary" onClick={connectWallet}>Connect Wallet</button>
          ) : (
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div className="glass-panel" style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#a3a3a3', fontSize: '0.85rem' }}>Balance:</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{userBalance} GEN</span>
              </div>
              <span className="btn-secondary" style={{ cursor: 'default' }}>
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              <button className="btn-secondary" onClick={disconnectWallet}>Disconnect</button>
            </div>
          )}
        </div>
      </header>

      <div className={`${styles.hero} animate-slide-up`}>
        <div className={styles.heroLayer1}>AI-Governed DAO</div>
        <div className={styles.heroLayer2}>Powered by GenLayer</div>
        <div className={styles.heroLayer3}>
          pay fees and get proposals evaluated by intelligent contracts for constitutional alignment
        </div>
      </div>

      <div className={styles.dashboard}>
        {/* Sidebar / Stats */}
        <div className={`glass-panel ${styles.sidebarCard} animate-float`}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total Proposals</span>
            <span className={styles.statValue}>{proposals.length}</span>
          </div>
          
          {!account ? (
             <div style={{ marginTop: '30px', textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px' }}>
               <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Join the DAO</h3>
               <p style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '15px', lineHeight: '1.5' }}>
                 Connect your Web3 wallet to submit proposals and trigger AI evaluations.
               </p>
               <button className="btn-primary" onClick={connectWallet} style={{ width: '100%' }}>
                 Connect Wallet
               </button>
             </div>
          ) : (
            <form className={styles.inputGroup} style={{ marginTop: '30px' }} onSubmit={handleSubmit}>
              <span className={styles.statLabel}>Submit Proposal</span>
              <input 
                className={styles.input} 
                type="text" 
                placeholder="Proposal Title" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                disabled={loading}
              />
              <textarea 
                className={styles.textarea} 
                placeholder="Describe your proposal in detail..." 
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                disabled={loading}
              />
              <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={loading}>
                {loading ? "Submitting..." : "Sign & Submit"}
              </button>
              
              {txMessage && (
                <div style={{
                  marginTop: '15px', 
                  padding: '10px', 
                  borderRadius: '8px', 
                  fontSize: '0.85rem',
                  backgroundColor: txMessage.type === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                  color: txMessage.type === 'success' ? '#2ecc71' : '#dc3545',
                  border: `1px solid ${txMessage.type === 'success' ? '#2ecc71' : '#dc3545'}`
                }}>
                  {txMessage.text}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Proposals List */}
            <div className={styles.proposalsList}>
              {proposals.length === 0 && !loading && (
                <div className={`glass-panel ${styles.proposalCard}`} style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: '#a3a3a3' }}>No active proposals found. Be the first to submit a proposal to the GenVM Intelligent Contract.</p>
                </div>
              )}
              
              {loading && proposals.length === 0 && (
                <div className={`glass-panel ${styles.proposalCard}`} style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: '#a3a3a3' }}>Fetching from GenLayer...</p>
                </div>
              )}

              {proposals.map((prop, idx) => (
                <div key={prop.id} className={`glass-panel ${styles.proposalCard} animate-slide-up`} style={{ animationDelay: `${(idx + 1) * 0.1}s` }}>
                  <div className={styles.proposalHeader}>
                    <h3 className={styles.proposalTitle}>{prop.title}</h3>
                    <span className={`${styles.statusBadge} ${
                      prop.status === 'Approved' ? styles.statusApproved : 
                      prop.status === 'Rejected' ? styles.statusRejected : 
                      styles.statusPending
                    }`}>
                      {prop.status}
                    </span>
                  </div>
                  <p className={styles.proposalDesc}>{prop.description}</p>
                  
                  {prop.analysis && (
                    <div className={styles.aiAnalysis} style={{ 
                      borderLeftColor: prop.status === 'Approved' ? 'var(--accent)' : 
                                      prop.status === 'Rejected' ? '#dc3545' : '#ffc107' 
                    }}>
                      <h4 className={styles.aiAnalysisTitle} style={{
                        color: prop.status === 'Approved' ? 'var(--accent)' : 
                               prop.status === 'Rejected' ? '#dc3545' : '#ffc107'
                      }}>
                        GenVM Analysis & Web Fact-Check
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#d4d4d4', whiteSpace: 'pre-wrap' }}>{prop.analysis}</p>
                    </div>
                  )}
                  
                  <div className={styles.actions}>
                    {prop.payout_status === 'PAID' && (
                      <span className={`${styles.payoutBadge} ${styles.badgePaid}`}>
                        PAID
                      </span>
                    )}
                    {prop.payout_status === 'BURNED' && (
                      <span className={`${styles.payoutBadge} ${styles.badgeBurned}`}>
                        BURNED
                      </span>
                    )}
                    
                    {prop.status === 'Pending' && account && (
                      <button className="btn-primary" onClick={() => evaluateProposal(prop.id)} style={{ marginLeft: 'auto' }}>
                        Trigger AI Evaluation
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
      </div>
    </main>
  );
}
