import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  DisputeResolver_AdminStaked,
  DisputeResolver_AdminVoted,
  DisputeResolver_AdminWithdrawn,
  DisputeResolver_DisputeFiled,
  DisputeResolver_DisputeResolved,
  DisputeResolver_FundsDistributed,
  DisputeResolver_ProposalApprovedByCreator,
  DisputeResolver_ProposalApprovedByWorker,
  DisputeResolver_ProposalRejected,
  OwnershipTransferred
} from "../generated/DisputeResolver/DisputeResolver"

export function createDisputeResolver_AdminStakedEvent(
  admin: Address,
  amount: BigInt
): DisputeResolver_AdminStaked {
  let disputeResolverAdminStakedEvent =
    changetype<DisputeResolver_AdminStaked>(newMockEvent())

  disputeResolverAdminStakedEvent.parameters = new Array()

  disputeResolverAdminStakedEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )
  disputeResolverAdminStakedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return disputeResolverAdminStakedEvent
}

export function createDisputeResolver_AdminVotedEvent(
  disputeId: BigInt,
  admin: Address,
  workerShare: BigInt
): DisputeResolver_AdminVoted {
  let disputeResolverAdminVotedEvent =
    changetype<DisputeResolver_AdminVoted>(newMockEvent())

  disputeResolverAdminVotedEvent.parameters = new Array()

  disputeResolverAdminVotedEvent.parameters.push(
    new ethereum.EventParam(
      "disputeId",
      ethereum.Value.fromUnsignedBigInt(disputeId)
    )
  )
  disputeResolverAdminVotedEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )
  disputeResolverAdminVotedEvent.parameters.push(
    new ethereum.EventParam(
      "workerShare",
      ethereum.Value.fromUnsignedBigInt(workerShare)
    )
  )

  return disputeResolverAdminVotedEvent
}

export function createDisputeResolver_AdminWithdrawnEvent(
  admin: Address,
  amount: BigInt
): DisputeResolver_AdminWithdrawn {
  let disputeResolverAdminWithdrawnEvent =
    changetype<DisputeResolver_AdminWithdrawn>(newMockEvent())

  disputeResolverAdminWithdrawnEvent.parameters = new Array()

  disputeResolverAdminWithdrawnEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )
  disputeResolverAdminWithdrawnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return disputeResolverAdminWithdrawnEvent
}

export function createDisputeResolver_DisputeFiledEvent(
  disputeId: BigInt,
  taskId: BigInt,
  taskContract: Address,
  worker: Address,
  taskCreator: Address
): DisputeResolver_DisputeFiled {
  let disputeResolverDisputeFiledEvent =
    changetype<DisputeResolver_DisputeFiled>(newMockEvent())

  disputeResolverDisputeFiledEvent.parameters = new Array()

  disputeResolverDisputeFiledEvent.parameters.push(
    new ethereum.EventParam(
      "disputeId",
      ethereum.Value.fromUnsignedBigInt(disputeId)
    )
  )
  disputeResolverDisputeFiledEvent.parameters.push(
    new ethereum.EventParam("taskId", ethereum.Value.fromUnsignedBigInt(taskId))
  )
  disputeResolverDisputeFiledEvent.parameters.push(
    new ethereum.EventParam(
      "taskContract",
      ethereum.Value.fromAddress(taskContract)
    )
  )
  disputeResolverDisputeFiledEvent.parameters.push(
    new ethereum.EventParam("worker", ethereum.Value.fromAddress(worker))
  )
  disputeResolverDisputeFiledEvent.parameters.push(
    new ethereum.EventParam(
      "taskCreator",
      ethereum.Value.fromAddress(taskCreator)
    )
  )

  return disputeResolverDisputeFiledEvent
}

export function createDisputeResolver_DisputeResolvedEvent(
  disputeId: BigInt,
  workerShare: BigInt
): DisputeResolver_DisputeResolved {
  let disputeResolverDisputeResolvedEvent =
    changetype<DisputeResolver_DisputeResolved>(newMockEvent())

  disputeResolverDisputeResolvedEvent.parameters = new Array()

  disputeResolverDisputeResolvedEvent.parameters.push(
    new ethereum.EventParam(
      "disputeId",
      ethereum.Value.fromUnsignedBigInt(disputeId)
    )
  )
  disputeResolverDisputeResolvedEvent.parameters.push(
    new ethereum.EventParam(
      "workerShare",
      ethereum.Value.fromUnsignedBigInt(workerShare)
    )
  )

  return disputeResolverDisputeResolvedEvent
}

export function createDisputeResolver_FundsDistributedEvent(
  disputeId: BigInt,
  worker: Address,
  workerShare: BigInt,
  taskCreator: Address
): DisputeResolver_FundsDistributed {
  let disputeResolverFundsDistributedEvent =
    changetype<DisputeResolver_FundsDistributed>(newMockEvent())

  disputeResolverFundsDistributedEvent.parameters = new Array()

  disputeResolverFundsDistributedEvent.parameters.push(
    new ethereum.EventParam(
      "disputeId",
      ethereum.Value.fromUnsignedBigInt(disputeId)
    )
  )
  disputeResolverFundsDistributedEvent.parameters.push(
    new ethereum.EventParam("worker", ethereum.Value.fromAddress(worker))
  )
  disputeResolverFundsDistributedEvent.parameters.push(
    new ethereum.EventParam(
      "workerShare",
      ethereum.Value.fromUnsignedBigInt(workerShare)
    )
  )
  disputeResolverFundsDistributedEvent.parameters.push(
    new ethereum.EventParam(
      "taskCreator",
      ethereum.Value.fromAddress(taskCreator)
    )
  )

  return disputeResolverFundsDistributedEvent
}

export function createDisputeResolver_ProposalApprovedByCreatorEvent(
  disputeId: BigInt,
  taskCreator: Address
): DisputeResolver_ProposalApprovedByCreator {
  let disputeResolverProposalApprovedByCreatorEvent =
    changetype<DisputeResolver_ProposalApprovedByCreator>(newMockEvent())

  disputeResolverProposalApprovedByCreatorEvent.parameters = new Array()

  disputeResolverProposalApprovedByCreatorEvent.parameters.push(
    new ethereum.EventParam(
      "disputeId",
      ethereum.Value.fromUnsignedBigInt(disputeId)
    )
  )
  disputeResolverProposalApprovedByCreatorEvent.parameters.push(
    new ethereum.EventParam(
      "taskCreator",
      ethereum.Value.fromAddress(taskCreator)
    )
  )

  return disputeResolverProposalApprovedByCreatorEvent
}

export function createDisputeResolver_ProposalApprovedByWorkerEvent(
  disputeId: BigInt,
  worker: Address
): DisputeResolver_ProposalApprovedByWorker {
  let disputeResolverProposalApprovedByWorkerEvent =
    changetype<DisputeResolver_ProposalApprovedByWorker>(newMockEvent())

  disputeResolverProposalApprovedByWorkerEvent.parameters = new Array()

  disputeResolverProposalApprovedByWorkerEvent.parameters.push(
    new ethereum.EventParam(
      "disputeId",
      ethereum.Value.fromUnsignedBigInt(disputeId)
    )
  )
  disputeResolverProposalApprovedByWorkerEvent.parameters.push(
    new ethereum.EventParam("worker", ethereum.Value.fromAddress(worker))
  )

  return disputeResolverProposalApprovedByWorkerEvent
}

export function createDisputeResolver_ProposalRejectedEvent(
  disputeId: BigInt
): DisputeResolver_ProposalRejected {
  let disputeResolverProposalRejectedEvent =
    changetype<DisputeResolver_ProposalRejected>(newMockEvent())

  disputeResolverProposalRejectedEvent.parameters = new Array()

  disputeResolverProposalRejectedEvent.parameters.push(
    new ethereum.EventParam(
      "disputeId",
      ethereum.Value.fromUnsignedBigInt(disputeId)
    )
  )

  return disputeResolverProposalRejectedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}
