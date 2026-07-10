import json
import urllib.parse
from genlayer import *

@genlayer.contract
class DAOEvaluator:
    def __init__(self):
        # Define the DAO's core constitution rules
        self.constitution = """
        Syntrix Labs DAO Constitution:
        Article 1 (Security): Never compromise the underlying protocol security.
        Article 2 (Capital Preservation): Avoid high-risk, unproven financial instruments or entities with a history of fraud/bankruptcy.
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
        
        # 1. Extract subject for web fetch
        extraction_prompt = f"""
        Extract the main real-world entity, protocol, company, or concept from this proposal to search for on Wikipedia.
        Return ONLY the raw subject string (e.g. 'Bitcoin', 'FTX', 'Ethereum'). If none applies, return 'None'.
        Proposal Title: {proposal['title']}
        Proposal Description: {proposal['description']}
        """
        subject = genlayer.llm.generate(extraction_prompt).strip()
        
        evidence = "No specific external evidence fetched."
        if subject.lower() != "none" and subject:
            # 2. Fetch evidence non-deterministically
            safe_subject = urllib.parse.quote(subject)
            url = f"https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=4&explaintext=1&titles={safe_subject}&format=json"
            
            def fetch_wiki() -> str:
                response = genlayer.nondet.web.get(url)
                return response.body.decode("utf-8")
            
            try:
                # Ensuring consensus using the Equivalence Principle
                # We use genlayer.eq_principle.strict_eq to make sure validators agree on the fetched HTML/JSON
                raw_data = genlayer.eq_principle.strict_eq(fetch_wiki)
                
                # Parse Wikipedia JSON to get the extract
                data = json.loads(raw_data)
                pages = data.get("query", {}).get("pages", {})
                for page_id, page_info in pages.items():
                    if "extract" in page_info and page_info["extract"]:
                        evidence = page_info["extract"]
                        break
            except Exception as e:
                evidence = f"Failed to fetch external evidence: {str(e)}"
        
        # 3. Final Evaluation based on Evidence
        prompt = f"""
        You are the AI Governor of Syntrix Labs DAO.
        Constitution: {self.constitution}
        
        Evaluate the following proposal:
        Title: {proposal['title']}
        Description: {proposal['description']}
        
        External Web Evidence on Subject '{subject}':
        {evidence}
        
        Based on the Constitution and the External Web Evidence (if any), return a JSON response with two keys:
        - "decision": "Approved" or "Rejected"
        - "reasoning": A short explanation referencing the constitution and the external evidence.
        """
        
        response = genlayer.llm.generate(prompt)
        
        try:
            result = json.loads(response)
            proposal["status"] = result["decision"]
            
            # Format the final analysis string for the UI
            short_evidence = (evidence[:150] + '...') if len(evidence) > 150 else evidence
            proposal["analysis"] = f"Web Fact-Check ({subject}): {short_evidence}\n\nVerdict: {result['reasoning']}"
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
