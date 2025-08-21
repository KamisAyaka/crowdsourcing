import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

interface Task {
  creator: string;
  title: string;
  description: string;
  totalreward: bigint;
  deadline: bigint;
  status: number;
  createdAt: bigint;
}

interface TaskInfoCardProps {
  task: Task;
  isTaskCreator: boolean;
  isTaskWorker: boolean;
  taskWorker: string | undefined;
}

export const TaskInfoCard = ({ task, isTaskCreator, isTaskWorker, taskWorker }: TaskInfoCardProps) => {
  const { address: connectedAddress } = useAccount();
  const [timeLeft, setTimeLeft] = useState("");

  // 获取任务状态文本
  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "开放";
      case 1:
        return "进行中";
      case 2:
        return "已完成";
      case 3:
        return "已取消";
      case 4:
        return "已支付";
      default:
        return "未知";
    }
  };

  // 获取任务状态颜色
  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: // Open
        return "badge-success";
      case 1: // InProgress
        return "badge-warning";
      case 2: // Completed
        return "badge-info";
      case 3: // Paid
        return "badge-primary";
      case 4: // Cancelled
        return "badge-error";
      default:
        return "badge-ghost";
    }
  };

  // 格式化创建时间
  const formatCreatedAt = (createdAt: bigint) => {
    const date = new Date(Number(createdAt) * 1000);
    return date.toLocaleString();
  };

  // 计算剩余时间
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now() / 1000;
      const deadline = Number(task.deadline);
      const difference = deadline - now;

      if (difference > 0) {
        const days = Math.floor(difference / (60 * 60 * 24));
        const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60));
        const minutes = Math.floor((difference % (60 * 60)) / 60);

        return `${days}天 ${hours}小时 ${minutes}分钟`;
      }
      return "已过期";
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);

    return () => clearInterval(timer);
  }, [task.deadline]);

  return (
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h2 className="card-title text-2xl">{task.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-lg mb-2">任务详情</h3>
            <div className="mb-1">
              <span className="font-semibold">描述:</span> {task.description}
            </div>
            <div className="mb-1">
              <span className="font-semibold">创建者:</span>
              <Address address={task.creator} disableAddressLink />
            </div>
            <div className="mb-1">
              <span className="font-semibold">总奖励:</span> {formatUnits(task.totalreward, 18)} TST
            </div>
            <div className="mb-1">
              <span className="font-semibold">截止日期:</span> {new Date(Number(task.deadline) * 1000).toLocaleString()}
            </div>
            <div className="mb-1">
              <span className="font-semibold">剩余时间:</span> {timeLeft}
            </div>
            <div className="mb-1">
              <span className="font-semibold">创建时间:</span> {formatCreatedAt(task.createdAt)}
            </div>
            <div className="mb-1">
              <span className="font-semibold">状态:</span>
              <span className={`badge ${getStatusColor(task.status)} ml-2`}>{getStatusText(task.status)}</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">参与者</h3>
            <div className="mb-1">
              <span className="font-semibold">任务创建者:</span>
              <Address address={task.creator} disableAddressLink />
              {isTaskCreator && <span className="badge badge-primary ml-2">您</span>}
            </div>
            {taskWorker && (
              <div className="mb-1">
                <span className="font-semibold">工作者:</span>
                <Address address={taskWorker} disableAddressLink />
                {isTaskWorker && <span className="badge badge-primary ml-2">您</span>}
              </div>
            )}
            {connectedAddress && !isTaskCreator && !isTaskWorker && (
              <div className="mt-4">
                <span className="badge badge-ghost">观察者</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
