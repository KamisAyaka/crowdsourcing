import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth/useTransactor";

interface CancelTaskProps {
  taskId: string;
  isTaskCreator: boolean;
  isTaskInProgress: boolean;
}

export const CancelTask = ({ taskId, isTaskCreator, isTaskInProgress }: CancelTaskProps) => {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const writeTxn = useTransactor();

  const { writeContractAsync: terminateTask } = useScaffoldWriteContract({
    contractName: "MilestonePaymentTask",
  });

  const handleCancelTask = async () => {
    try {
      await writeTxn(
        () =>
          terminateTask({
            functionName: "terminateTask",
            args: [BigInt(taskId)],
          }) as Promise<`0x${string}`>,
      );
      setIsCancelModalOpen(false);
    } catch (e) {
      console.error("Error cancelling task:", e);
    }
  };

  if (!isTaskCreator || !isTaskInProgress) return null;

  return (
    <>
      <div className="flex justify-end mb-4">
        <button className="btn btn-error btn-sm" onClick={() => setIsCancelModalOpen(true)}>
          取消任务
        </button>
      </div>

      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-base-100 rounded-lg p-6 w-96">
            <h3 className="font-bold text-lg mb-4">确认取消任务</h3>
            <p className="mb-4">您确定要取消此任务吗？这将终止任务并根据里程碑状态处理相关资金。</p>
            <div className="flex justify-end space-x-3">
              <button className="btn btn-ghost" onClick={() => setIsCancelModalOpen(false)}>
                取消
              </button>
              <button className="btn btn-error" onClick={handleCancelTask}>
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
