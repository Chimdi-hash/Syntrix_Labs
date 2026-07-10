# Syntrix Labs - AI-Governed DAO

Welcome to **Syntrix Labs**, a next-generation AI-Governed Decentralized Autonomous Organization (DAO) powered by **GenLayer**. 

Unlike traditional DAOs that rely solely on human voting, Syntrix Labs uses **Intelligent Contracts** running on the GenVM network to automatically evaluate and filter proposals based on a predefined constitutional framework.

## 🌟 Overview

The Syntrix Labs platform allows members to submit proposals to the DAO. Once submitted, a GenVM Intelligent Contract steps in. It actively searches the internet for real-world data and fact-checks the proposal against the DAO's core constitution:

*   **Article 1 (Security):** Never compromise the underlying protocol security.
*   **Article 2 (Capital Preservation):** Avoid high-risk, unproven financial instruments or entities with a history of fraud/bankruptcy.
*   **Article 3 (Growth):** Incentivize ecosystem growth and liquidity.

If the AI determines the proposal violates these rules (e.g., investing in a known fraudulent entity), the proposal is **Rejected**. If it aligns with the growth and security metrics, it is **Approved**.

## ✨ Features

*   **AI-Powered Consensus:** Smart contracts that can literally read the internet and make subjective, intelligent decisions using Large Language Models (LLMs).
*   **Privacy-First Dashboard:** Proposals are isolated. A user must connect their Web3 wallet, and they will only see the proposals that they have personally submitted.
*   **Real-time Polling:** The beautiful glassmorphism dashboard automatically polls the GenLayer network in the background, updating your proposal status seamlessly without page reloads.
*   **In-Form Toasts:** Smooth, non-blocking toast notifications alert you of your transaction status without interrupting your workflow.

## 🛠️ Technology Stack

*   **Frontend:** Next.js (React), TypeScript, CSS Modules
*   **Blockchain Integration:** `genlayer-js` SDK
*   **Smart Contracts:** GenVM Intelligent Contracts (Python)
*   **Network:** GenLayer StudioNet

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+)
*   npm or yarn
*   MetaMask (or any Web3 compatible wallet)
*   GenLayer Studio account (for deploying the contract)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Chimdi-hash/Syntrix_Labs.git
   cd Syntrix_Labs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root directory and add your deployed GenLayer contract address:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xf34400f6466F7ac1d8391aA0247F1DdA622617C8
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the App**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Intelligent Contract

The AI evaluator contract is written in Python for the GenVM. You can find the contract code in the `contracts/` directory.

### Deploying the Contract
If you want to deploy your own version of the DAO contract:
1. Open the [GenLayer Studio](https://studio.genlayer.com/)
2. Create a new file and paste the contents of `contracts/dao_evaluator.py`.
3. Deploy the contract to StudioNet.
4. Copy the deployed contract address and update your `.env.local` file.

## 🎮 How to Use

1. **Connect Wallet:** Click the "Connect Wallet to Continue" button to link your MetaMask.
2. **Submit a Proposal:** Fill out the "Proposal Title" and "Description" fields, then click "Sign & Submit".
3. **Wait for Consensus:** Your proposal will appear as *Pending*. GenLayer's decentralized AI nodes will research your proposal.
4. **Trigger Evaluation:** Click the "Trigger AI Evaluation" button on your pending proposal.
5. **View Results:** After a few seconds, the AI will reach consensus and update the status to either **APPROVED** or **REJECTED**, along with a detailed explanation of its findings based on the Constitution.

---
*Built with ❤️ for the future of AI-Governed Web3*
