interface CompleteTaskButtonProps {
  isTaskCreator: boolean;
  isTaskInProgress: boolean;
  milestonesLength: number;
  onCompleteTask: () => void;
}

export const CompleteTaskButton = ({
  isTaskCreator,
  isTaskInProgress,
  milestonesLength,
  onCompleteTask,
}: CompleteTaskButtonProps) => {
  if (!isTaskCreator || !isTaskInProgress || milestonesLength === 0) return null;

  return (
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h2 className="card-title">完成任务</h2>
        <p className="text-sm text-gray-500">当所有里程碑都已完成并批准后，您可以标记任务为完成状态</p>
        <div className="card-actions justify-end">
          <button className="btn btn-primary" onClick={onCompleteTask}>
            标记任务为完成
          </button>
        </div>
      </div>
    </div>
  );
};
