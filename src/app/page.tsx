"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x57691C7814390884e9718b6c543A7aF233e71fb5"; // Using hardcoded or env address
  const [proposals, setProposals] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [readClient, setReadClient] = useState<any>(null);
  const [writeClient, setWriteClient] = useState<any>(null);

  useEffect(() => {
    const rc = createClient({
      chain: studionet,
    });
    setReadClient(rc);
  }, []);

  const fetchProposals = useCallback(async () => {
    if (!readClient || !contractAddress) return;
    setLoading(true);
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
          fetched.push({ id: i, ...JSON.parse(propStr as string) });
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
  }, [readClient, contractAddress]);

  useEffect(() => {
    if (readClient && contractAddress) {
      fetchProposals();
    }
  }, [readClient, contractAddress, fetchProposals]);

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
      alert("Please connect wallet, enter contract address, and fill out the proposal.");
      return;
    }
    
    try {
      const txHash = await writeClient.writeContract({
        address: contractAddress,
        functionName: 'submit_proposal',
        args: [newTitle, newDesc],
        value: BigInt(0),
      });
      alert(`Transaction submitted! Hash: ${txHash}`);
      setNewTitle("");
      setNewDesc("");
      setTimeout(fetchProposals, 5000); // refresh after a delay
    } catch (err) {
      console.error(err);
      alert("Transaction failed");
    }
  };

  const evaluateProposal = async (id: number) => {
    if (!writeClient || !contractAddress) return;
    try {
      const txHash = await writeClient.writeContract({
        address: contractAddress,
        functionName: 'evaluate_proposal',
        args: [id],
        value: BigInt(0),
      });
      alert(`Evaluation triggered! Hash: ${txHash}. GenVM is reaching consensus...`);
      setTimeout(fetchProposals, 5000);
    } catch (err) {
      console.error(err);
      alert("Failed to trigger evaluation");
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
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
          Proposals are evaluated by Intelligent Contracts for constitutional alignment.
        </div>
      </div>

      <div className={styles.dashboard}>
        {/* Sidebar / Stats */}
        <div className={`glass-panel ${styles.sidebarCard} animate-float`}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Active Proposals</span>
            <span className={styles.statValue}>{proposals.length}</span>
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
              Sign & Submit
            </button>
          </form>
        </div>

        {/* Proposals List */}
        <div className={styles.proposalsList}>
          {proposals.length === 0 && !loading && (
            <div className={`glass-panel ${styles.proposalCard}`} style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#a3a3a3' }}>No active proposals found. Connect your wallet to submit the first proposal to the GenVM Intelligent Contract.</p>
            </div>
          )}
          
          {loading && (
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
                {prop.status === 'Pending' && (
                  <button className="btn-primary" onClick={() => evaluateProposal(prop.id)}>
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
