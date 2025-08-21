import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth/useTransactor";

interface ClaimRewardProps {
  taskId: string;
  onSuccess?: () => void;
}

export const ClaimReward = ({ taskId, onSuccess }: ClaimRewardProps) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const writeTxn = useTransactor();
  const { writeContractAsync: payTask } = useScaffoldWriteContract({ contractName: "FixedPaymentTask" });

  const handleClaimReward = async () => {
    try {
      setIsClaiming(true);

      await writeTxn(
        () =>
          payTask({
            functionName: "payTask",
            args: [BigInt(taskId)],
          }) as Promise<`0x${string}`>,
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (e) {
      console.error("Error claiming reward:", e);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <button
      className={`btn btn-primary ${isClaiming ? "loading" : ""}`}
      onClick={handleClaimReward}
      disabled={isClaiming}
    >
      {isClaiming ? "申领中..." : "申领报酬"}
    </button>
  );
};
