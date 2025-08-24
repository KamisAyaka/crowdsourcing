import {
  DisputeResolver_AdminStaked as DisputeResolver_AdminStakedEvent,
  DisputeResolver_AdminVoted as DisputeResolver_AdminVotedEvent,
  DisputeResolver_AdminWithdrawn as DisputeResolver_AdminWithdrawnEvent,
  DisputeResolver_DisputeFiled as DisputeResolver_DisputeFiledEvent,
  DisputeResolver_DisputeResolved as DisputeResolver_DisputeResolvedEvent,
  DisputeResolver_FundsDistributed as DisputeResolver_FundsDistributedEvent,
  DisputeResolver_ProposalApprovedByCreator as DisputeResolver_ProposalApprovedByCreatorEvent,
  DisputeResolver_ProposalApprovedByWorker as DisputeResolver_ProposalApprovedByWorkerEvent,
  DisputeResolver_ProposalRejected as DisputeResolver_ProposalRejectedEvent,
  OwnershipTransferred as OwnershipTransferredEvent
} from "../generated/DisputeResolver/DisputeResolver"
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
} from "../generated/schema"

export function handleDisputeResolver_AdminStaked(
  event: DisputeResolver_AdminStakedEvent
): void {
  let entity = new DisputeResolver_AdminStaked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.admin = event.params.admin
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDisputeResolver_AdminVoted(
  event: DisputeResolver_AdminVotedEvent
): void {
  let entity = new DisputeResolver_AdminVoted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.disputeId = event.params.disputeId
  entity.admin = event.params.admin
  entity.workerShare = event.params.workerShare

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDisputeResolver_AdminWithdrawn(
  event: DisputeResolver_AdminWithdrawnEvent
): void {
  let entity = new DisputeResolver_AdminWithdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.admin = event.params.admin
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDisputeResolver_DisputeFiled(
  event: DisputeResolver_DisputeFiledEvent
): void {
  let entity = new DisputeResolver_DisputeFiled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.disputeId = event.params.disputeId
  entity.taskId = event.params.taskId
  entity.taskContract = event.params.taskContract
  entity.worker = event.params.worker
  entity.taskCreator = event.params.taskCreator

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDisputeResolver_DisputeResolved(
  event: DisputeResolver_DisputeResolvedEvent
): void {
  let entity = new DisputeResolver_DisputeResolved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.disputeId = event.params.disputeId
  entity.workerShare = event.params.workerShare

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDisputeResolver_FundsDistributed(
  event: DisputeResolver_FundsDistributedEvent
): void {
  let entity = new DisputeResolver_FundsDistributed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.disputeId = event.params.disputeId
  entity.worker = event.params.worker
  entity.workerShare = event.params.workerShare
  entity.taskCreator = event.params.taskCreator

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDisputeResolver_ProposalApprovedByCreator(
  event: DisputeResolver_ProposalApprovedByCreatorEvent
): void {
  let entity = new DisputeResolver_ProposalApprovedByCreator(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.disputeId = event.params.disputeId
  entity.taskCreator = event.params.taskCreator

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDisputeResolver_ProposalApprovedByWorker(
  event: DisputeResolver_ProposalApprovedByWorkerEvent
): void {
  let entity = new DisputeResolver_ProposalApprovedByWorker(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.disputeId = event.params.disputeId
  entity.worker = event.params.worker

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDisputeResolver_ProposalRejected(
  event: DisputeResolver_ProposalRejectedEvent
): void {
  let entity = new DisputeResolver_ProposalRejected(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.disputeId = event.params.disputeId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
