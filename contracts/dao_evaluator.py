# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
import json
import urllib.parse
from genlayer import *

class DAOEvaluator(gl.Contract):
    constitution: str
    proposals: TreeMap[u256, str]
    proposal_counter: u256

    def __init__(self):
        # Define the DAO's core constitution rules
        self.constitution = """
        Syntrix Labs DAO Constitution:
        Article 1 (Security): Never compromise the underlying protocol security.
        Article 2 (Capital Preservation): Avoid high-risk, unproven financial instruments or entities with a history of fraud/bankruptcy.
        Article 3 (Growth): Incentivize ecosystem growth and liquidity.
        """
        self.proposals = TreeMap()
        self.proposal_counter = u256(0)

    @gl.public.write
    def submit_proposal(self, title: str, description: str) -> u256:
        proposal_id = self.proposal_counter
        self.proposals[proposal_id] = json.dumps({
            "title": title,
            "description": description,
            "status": "Pending",
            "analysis": "",
            "submitter": str(gl.message.sender_address).lower()
        })
        self.proposal_counter += 1
        return proposal_id

    @gl.public.write
    def evaluate_proposal(self, proposal_id: u256) -> str:
        if proposal_id not in self.proposals:
            raise Exception("Proposal not found")
        
        proposal = json.loads(self.proposals[proposal_id])
        
        # 1. Extract subject for web fetch
        def get_proposal_text() -> str:
            return f"Proposal Title: {proposal['title']}\nProposal Description: {proposal['description']}"
            
        subject = gl.eq_principle.prompt_non_comparative(
            get_proposal_text,
            task="Extract the main real-world entity, protocol, company, or concept from this proposal to search for on Wikipedia. Return ONLY the raw subject string (e.g. 'Bitcoin', 'FTX', 'Ethereum'). If none applies, return 'None'.",
            criteria="The result must be a short string representing the main entity extracted from the proposal text, or 'None'."
        ).strip()
        
        evidence = "No specific external evidence fetched."
        if subject.lower() != "none" and subject:
            # 2. Fetch evidence non-deterministically
            safe_subject = urllib.parse.quote(subject)
            url = f"https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=4&explaintext=1&titles={safe_subject}&format=json"
            
            def fetch_wiki() -> str:
                response = gl.nondet.web.get(url)
                return response.body.decode("utf-8")
            
            try:
                # Ensuring consensus using the Equivalence Principle
                raw_data = gl.eq_principle.strict_eq(fetch_wiki)
                
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
        def get_evaluation_context() -> str:
            return f"""Constitution: {self.constitution}
Proposal Title: {proposal['title']}
Proposal Description: {proposal['description']}
External Web Evidence on Subject '{subject}':
{evidence}"""
        
        response = gl.eq_principle.prompt_non_comparative(
            get_evaluation_context,
            task="Based on the Constitution and the External Web Evidence (if any), return a JSON response with two keys: 'decision' ('Approved' or 'Rejected') and 'reasoning' (a short explanation referencing the constitution and the external evidence).",
            criteria="The result must be a valid JSON object containing exactly 'decision' (either Approved or Rejected) and 'reasoning' (string explanation)."
        )
        
        # Clean potential markdown from LLM response
        clean_response = response.strip()
        if clean_response.startswith("```json"):
            clean_response = clean_response[7:]
        elif clean_response.startswith("```"):
            clean_response = clean_response[3:]
        if clean_response.endswith("```"):
            clean_response = clean_response[:-3]
        clean_response = clean_response.strip()
        
        try:
            result = json.loads(clean_response)
            proposal["status"] = result["decision"]
            
            # Format the final analysis string for the UI
            short_evidence = (evidence[:150] + '...') if len(evidence) > 150 else evidence
            proposal["analysis"] = f"Web Fact-Check ({subject}): {short_evidence}\n\nVerdict: {result['reasoning']}"
            
            # Save the updated proposal back to persistent storage
            self.proposals[proposal_id] = json.dumps(proposal)
            return json.dumps(result)
        except Exception as e:
            proposal["status"] = "Error"
            proposal["analysis"] = "Failed to parse AI consensus"
            self.proposals[proposal_id] = json.dumps(proposal)
            return str(e)

    @gl.public.view
    def get_proposal(self, proposal_id: u256) -> str:
        if proposal_id not in self.proposals:
            raise Exception("Proposal not found")
        return self.proposals[proposal_id]
