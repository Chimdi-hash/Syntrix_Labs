"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { createWalletClient, custom, createPublicClient, parseAbi } from "viem";

const daoAbi = parseAbi([
  "function submit_proposal(string title, string description) returns (uint256)",
  "function evaluate_proposal(uint256 proposal_id) returns (string)",
  "function get_proposal(uint256 proposal_id) view returns (string)",
  "function proposal_counter() view returns (uint256)"
]);

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000"; // Using hardcoded or env address
  const [proposals, setProposals] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [publicClient, setPublicClient] = useState<any>(null);
  const [walletClient, setWalletClient] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const pClient = createPublicClient({
        transport: custom((window as any).ethereum)
      });
      setPublicClient(pClient);
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const client = createWalletClient({
          transport: custom((window as any).ethereum)
        });
        const [address] = await client.requestAddresses();
        setAccount(address);
        setWalletClient(client);
      } catch (err) {
        console.error("Failed to connect wallet", err);
      }
    } else {
      alert("Please install MetaMask or another Web3 wallet.");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setWalletClient(null);
  };

  const fetchProposals = async () => {
    if (!publicClient || !contractAddress) return;
    setLoading(true);
    try {
      const count = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: daoAbi,
        functionName: 'proposal_counter',
      });
      
      const fetched = [];
      for (let i = 0; i < Number(count); i++) {
        const propStr = await publicClient.readContract({
           address: contractAddress as `0x${string}`,
           abi: daoAbi,
           functionName: 'get_proposal',
           args: [BigInt(i)]
        });
        fetched.push({ id: i, ...JSON.parse(propStr as string) });
      }
      setProposals(fetched);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch proposals. Ensure you are on the GenLayer Studio network and the address is correct.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc || !walletClient || !contractAddress) {
      alert("Please connect wallet, enter contract address, and fill out the proposal.");
      return;
    }
    
    try {
      const { request } = await publicClient.simulateContract({
        account: account as `0x${string}`,
        address: contractAddress as `0x${string}`,
        abi: daoAbi,
        functionName: 'submit_proposal',
        args: [newTitle, newDesc]
      });
      await walletClient.writeContract(request);
      alert("Transaction signed and submitted to GenLayer!");
      setNewTitle("");
      setNewDesc("");
      setTimeout(fetchProposals, 5000); // refresh after a delay
    } catch (err) {
      console.error(err);
      alert("Transaction failed");
    }
  };

  const evaluateProposal = async (id: number) => {
    if (!walletClient || !contractAddress) return;
    try {
      const { request } = await publicClient.simulateContract({
        account: account as `0x${string}`,
        address: contractAddress as `0x${string}`,
        abi: daoAbi,
        functionName: 'evaluate_proposal',
        args: [BigInt(id)]
      });
      await walletClient.writeContract(request);
      alert("Evaluation triggered! GenVM is reaching consensus...");
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
              <p style={{ color: '#a3a3a3' }}>No proposals loaded. Connect wallet and enter a deployed contract address.</p>
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
                    GenVM Analysis
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#d4d4d4' }}>{prop.analysis}</p>
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
