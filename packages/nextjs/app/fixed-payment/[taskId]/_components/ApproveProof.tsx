import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth/useTransactor";

interface ApproveProofProps {
  taskId: string;
  workerAddress: string;
  onSuccess?: () => void;
}

export const ApproveProof = ({ taskId, workerAddress, onSuccess }: ApproveProofProps) => {
  const [isApproving, setIsApproving] = useState(false);
  const writeTxn = useTransactor();
  const { writeContractAsync: approveProofOfWork } = useScaffoldWriteContract({ contractName: "FixedPaymentTask" });

  const handleApproveProof = async () => {
    try {
      setIsApproving(true);

      await writeTxn(
        () =>
          approveProofOfWork({
            functionName: "approveProofOfWork",
            args: [BigInt(taskId), workerAddress],
          }) as Promise<`0x${string}`>,
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (e) {
      console.error("Error approving proof of work:", e);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <button
      className={`btn btn-success ${isApproving ? "loading" : ""}`}
      onClick={handleApproveProof}
      disabled={isApproving}
    >
      {isApproving ? "批准中..." : "批准工作量证明"}
    </button>
  );
};
