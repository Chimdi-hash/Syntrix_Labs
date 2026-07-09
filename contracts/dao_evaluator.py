import json
from genlayer import *

@genlayer.contract
class DAOEvaluator:
    def __init__(self):
        # Define the DAO's core constitution rules
        self.constitution = """
        Syntrix Labs DAO Constitution:
        Article 1 (Security): Never compromise the underlying protocol security.
        Article 2 (Capital Preservation): Avoid high-risk, unproven financial instruments.
        Article 3 (Growth): Incentivize ecosystem growth and liquidity.
        """
        self.proposals = {}
        self.proposal_counter = 0

    @genlayer.method
    def submit_proposal(self, title: str, description: str) -> int:
        proposal_id = self.proposal_counter
        self.proposals[proposal_id] = {
            "title": title,
            "description": description,
            "status": "Pending",
            "analysis": ""
        }
        self.proposal_counter += 1
        return proposal_id

    @genlayer.method
    def evaluate_proposal(self, proposal_id: int) -> str:
        if proposal_id not in self.proposals:
            raise Exception("Proposal not found")
        
        proposal = self.proposals[proposal_id]
        
        # Use GenLayer LLM to evaluate the proposal against the constitution
        prompt = f"""
        You are the AI Governor of Syntrix Labs DAO.
        Constitution: {self.constitution}
        
        Evaluate the following proposal:
        Title: {proposal['title']}
        Description: {proposal['description']}
        
        Return a JSON response with two keys:
        - "decision": "Approved" or "Rejected"
        - "reasoning": A short explanation referencing the relevant constitution article.
        """
        
        # Non-deterministic operation evaluated by validators using Equivalence Principle
        response = genlayer.llm.generate(prompt)
        
        try:
            result = json.loads(response)
            proposal["status"] = result["decision"]
            proposal["analysis"] = result["reasoning"]
            return json.dumps(result)
        except Exception as e:
            proposal["status"] = "Error"
            proposal["analysis"] = "Failed to parse AI consensus"
            return str(e)

    @genlayer.view
    def get_proposal(self, proposal_id: int) -> str:
        if proposal_id not in self.proposals:
            raise Exception("Proposal not found")
        return json.dumps(self.proposals[proposal_id])
