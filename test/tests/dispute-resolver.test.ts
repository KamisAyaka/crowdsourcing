import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { DisputeResolver_AdminStaked } from "../generated/schema"
import { DisputeResolver_AdminStaked as DisputeResolver_AdminStakedEvent } from "../generated/DisputeResolver/DisputeResolver"
import { handleDisputeResolver_AdminStaked } from "../src/dispute-resolver"
import { createDisputeResolver_AdminStakedEvent } from "./dispute-resolver-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let admin = Address.fromString("0x0000000000000000000000000000000000000001")
    let amount = BigInt.fromI32(234)
    let newDisputeResolver_AdminStakedEvent =
      createDisputeResolver_AdminStakedEvent(admin, amount)
    handleDisputeResolver_AdminStaked(newDisputeResolver_AdminStakedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("DisputeResolver_AdminStaked created and stored", () => {
    assert.entityCount("DisputeResolver_AdminStaked", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "DisputeResolver_AdminStaked",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "admin",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "DisputeResolver_AdminStaked",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
