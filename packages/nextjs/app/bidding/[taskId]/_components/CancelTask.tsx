import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth/useTransactor";

interface CancelTaskProps {
  taskId: string;
  taskStatus: number;
  onSuccess?: () => void;
}

export const CancelTask = ({ taskId, taskStatus, onSuccess }: CancelTaskProps) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const writeTxn = useTransactor();
  const { writeContractAsync: terminateTask } = useScaffoldWriteContract({ contractName: "BiddingTask" });

  const handleCancelTask = async () => {
    try {
      setIsCancelling(true);

      await writeTxn(
        () =>
          terminateTask({
            functionName: "terminateTask",
            args: [BigInt(taskId)],
          }) as Promise<`0x${string}`>,
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (e) {
      console.error("Error cancelling task:", e);
    } finally {
      setIsCancelling(false);
    }
  };

  // 根据合约逻辑更新，只要不是已经支付(3)或者已经取消(4)的任务都可以使用取消任务的功能
  const canCancelTask = taskStatus !== 3 && taskStatus !== 4;

  if (!canCancelTask) {
    return null;
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">取消任务</h2>
        <p className="text-sm text-gray-500">
          任务创建者可以取消处于开放或进行中的任务。取消后，任务将被标记为已取消，未支付的资金将退还给任务创建者。
        </p>
        <button
          className={`btn btn-error ${isCancelling ? "loading" : ""}`}
          onClick={handleCancelTask}
          disabled={isCancelling}
        >
          {isCancelling ? "取消中..." : "取消任务"}
        </button>
      </div>
    </div>
  );
};
