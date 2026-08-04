"""Integration tests for DAO Evaluator fail-closed logic.

Run with: gltest contracts/test_evaluator.py -v -s
"""

import pytest
import json
from gltest import get_contract_factory
from gltest.helpers import load_fixture
from gltest.assertions import tx_execution_succeeded

@pytest.mark.integration
def deploy_contract():
    factory = get_contract_factory("DAOEvaluator")
    contract = factory.deploy()
    return contract

@pytest.mark.integration
def test_fail_closed_no_evidence():
    contract = load_fixture(deploy_contract)
    
    # 1. Submit a nonsense proposal that will not yield verifiable Wikipedia evidence
    result_submit = contract.submit_proposal(
        args=["Nonsense Subject", "This proposal is about xyzabcnonsense123, which does not exist anywhere."],
        value=1 * 10**18
    )
    assert tx_execution_succeeded(result_submit)
    
    # Check proposal status
    prop_initial = json.loads(contract.get_proposal(args=[0]))
    assert prop_initial["status"] == "Pending"
    
    # 2. Evaluate the proposal
    # Since 'xyzabcnonsense123' isn't a verifiable Wikipedia entity, 
    # it should fail closed and be instantly Rejected.
    result_eval = contract.evaluate_proposal(args=[0])
    assert tx_execution_succeeded(result_eval)
    
    # 3. Verify it failed closed
    prop_final = json.loads(contract.get_proposal(args=[0]))
    
    # It must be Rejected
    assert prop_final["status"] == "Rejected"
    
    # The payout status should indicate the 1 GEN deposit was explicitly burned
    assert prop_final["payout_status"] == "BURNED"
    
    # The reasoning in the analysis must mention the fail closed message
    assert "Fail closed" in prop_final["analysis"] or "No verifiable external evidence could be fetched" in prop_final["analysis"]
