import { useState } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface CreatorActionsProps {
  taskId: string;
  onAddWorkerClick: () => void;
  onAddMilestoneClick: () => void;
}

export const CreatorActions = ({ taskId, onAddWorkerClick, onAddMilestoneClick }: CreatorActionsProps) => {
  const [showActions, setShowActions] = useState(false);

  const { data: taskWorker } = useScaffoldReadContract({
    contractName: "MilestonePaymentTask",
    functionName: "taskWorker",
    args: [BigInt(taskId)],
  });

  const toggleActions = () => {
    setShowActions(!showActions);
  };

  return (
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h2 className="card-title">任务创建者操作</h2>
          <button onClick={toggleActions} className="btn btn-sm btn-outline">
            {showActions ? "隐藏操作" : "显示操作"}
          </button>
        </div>

        {showActions && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <button className="btn btn-primary" onClick={onAddWorkerClick}>
              添加工作者
            </button>
            <button className="btn btn-primary" onClick={onAddMilestoneClick}>
              添加里程碑
            </button>
            {!taskWorker && (
              <button className="btn btn-secondary" onClick={onAddWorkerClick}>
                分配工作者
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
