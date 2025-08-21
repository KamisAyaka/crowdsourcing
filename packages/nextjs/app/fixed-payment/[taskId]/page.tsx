"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AddWorker } from "./_components/AddWorker";
import { ApproveProof } from "./_components/ApproveProof";
import { CancelTask } from "./_components/CancelTask";
import { ClaimReward } from "./_components/ClaimReward";
import { DisputeButton } from "./_components/DisputeButton";
import { ExtendDeadline } from "./_components/ExtendDeadline";
import { IncreaseReward } from "./_components/IncreaseReward";
import { ProofOfWork } from "./_components/ProofOfWork";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const FixedPaymentTaskDetailPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { address: connectedAddress } = useAccount();

  // 控制工作量证明模态框的显示状态
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  // 从链上获取任务详情
  const {
    data: task,
    isLoading: isTaskLoading,
    refetch: refetchTask,
  } = useScaffoldReadContract({
    contractName: "FixedPaymentTask",
    functionName: "tasks",
    args: [BigInt(taskId as string)],
  });

  // 从链上获取任务的工作者地址
  const { data: taskWorker } = useScaffoldReadContract({
    contractName: "FixedPaymentTask",
    functionName: "taskWorker",
    args: [BigInt(taskId as string)],
  });

  // 从链上获取任务的工作量证明
  const { data: taskProof } = useScaffoldReadContract({
    contractName: "FixedPaymentTask",
    functionName: "taskWorkProofs",
    args: [BigInt(taskId as string), taskWorker || ""],
  });

  const formatDeadline = (deadline: bigint) => {
    const date = new Date(Number(deadline) * 1000);
    return date.toLocaleString();
  };

  const formatCreatedAt = (createdAt: bigint) => {
    const date = new Date(Number(createdAt) * 1000);
    return date.toLocaleString();
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "Open";
      case 1:
        return "InProgress";
      case 2:
        return "Completed";
      case 3:
        return "Paid";
      case 4:
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

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

  if (isTaskLoading) {
    return (
      <div className="flex items-center justify-center pt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center pt-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">任务未找到</h2>
          <Link href="/fixed-payment" className="btn btn-primary">
            返回任务列表
          </Link>
        </div>
      </div>
    );
  }

  // 解构任务数据
  const [id, creator, title, description, totalreward, deadline, status, createdAt] = task || [];

  // 检查当前用户是否为任务创建者
  const isTaskCreator = connectedAddress && creator && connectedAddress.toLowerCase() === creator.toLowerCase();

  return (
    <div className="flex flex-col items-center pt-10 px-4">
      <div className="w-full max-w-4xl">
        <div className="mb-6">
          <Link href="/fixed-payment" className="btn btn-sm btn-outline">
            ← 返回任务列表
          </Link>
        </div>

        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <h1 className="card-title text-2xl">{title}</h1>
              <span className={`badge ${getStatusColor(status)} badge-lg`}>{getStatusText(status)}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">任务ID</p>
                <p>#{id.toString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">创建时间</p>
                <p>{formatCreatedAt(createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">截止时间</p>
                <p>{formatDeadline(deadline)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">任务报酬</p>
                <p>{formatUnits(totalreward, 18)} TST</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500">任务描述</p>
              <p className="mt-1">{description}</p>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500">任务创建者</p>
              <Address address={creator} />
            </div>

            {taskWorker && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">工作者</p>
                <Address address={taskWorker} />
              </div>
            )}
          </div>
        </div>

        {/* 只有任务创建者且任务状态为Open时才能添加工作者 */}
        {isTaskCreator && status === 0 && <AddWorker taskId={taskId as string} onSuccess={refetchTask} />}

        {/* 任务状态为InProgress时显示工作者信息 */}
        {status === 1 && taskWorker && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title">任务进行中</h2>
                {connectedAddress && taskWorker && connectedAddress.toLowerCase() === taskWorker.toLowerCase() && (
                  <button className="btn btn-primary" onClick={() => setIsProofModalOpen(true)}>
                    提交工作量证明
                  </button>
                )}
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">工作者</span>
                </label>
                <Address address={taskWorker} />
              </div>
            </div>
          </div>
        )}

        {/* 工作量证明提交模态框 */}
        {status === 1 && taskWorker && (
          <ProofOfWork
            taskId={taskId as string}
            taskDeadline={deadline}
            isOpen={isProofModalOpen}
            onClose={() => setIsProofModalOpen(false)}
            onSuccess={refetchTask}
          />
        )}

        {/* 显示已提交的工作量证明 */}
        {taskProof && taskProof[0] && (
          <div className="card bg-base-100 shadow-xl mt-6">
            <div className="card-body">
              <h2 className="card-title">工作量证明</h2>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">提交时间</span>
                </label>
                <p>{new Date(Number(taskProof[3]) * 1000).toLocaleString()}</p>
              </div>
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">证明内容</span>
                </label>
                <div className="p-4 bg-base-200 rounded-lg">
                  <p>{taskProof[0]}</p>
                </div>
              </div>
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">状态</span>
                </label>
                <p>{taskProof[2] ? "已批准" : "待批准"}</p>
              </div>

              {/* 只有任务创建者且工作量证明尚未批准时才显示批准按钮 */}
              {isTaskCreator && !taskProof[2] && status === 1 && taskWorker && (
                <div className="card-actions justify-end mt-4">
                  <ApproveProof taskId={taskId as string} workerAddress={taskWorker} onSuccess={refetchTask} />
                </div>
              )}

              {/* 只有工作者且工作量证明尚未批准时才显示提出纠纷按钮 */}
              {connectedAddress &&
                taskWorker &&
                connectedAddress.toLowerCase() === taskWorker.toLowerCase() &&
                !taskProof[2] &&
                status === 1 && (
                  <div className="card-actions justify-end mt-4">
                    <DisputeButton taskId={taskId as string} onSuccess={refetchTask} />
                  </div>
                )}
            </div>
          </div>
        )}

        {/* 只有任务创建者且任务状态为Open或InProgress时才能取消任务 */}
        {isTaskCreator && <CancelTask taskId={taskId as string} taskStatus={status} onSuccess={refetchTask} />}

        {/* 只有任务创建者且任务状态为Open或InProgress时才能延长截止日期 */}
        {isTaskCreator && (status === 0 || status === 1) && (
          <ExtendDeadline taskId={taskId as string} currentDeadline={deadline} onSuccess={refetchTask} />
        )}

        {/* 只有任务创建者且任务状态为Open、InProgress或Completed时才能增加奖励 */}
        {isTaskCreator && (status === 0 || status === 1 || status === 2) && (
          <IncreaseReward taskId={taskId as string} onSuccess={refetchTask} />
        )}

        {/* 只有工作者且任务状态为Completed时才能申领报酬 */}
        {connectedAddress &&
          taskWorker &&
          connectedAddress.toLowerCase() === taskWorker.toLowerCase() &&
          status === 2 && (
            <div className="card bg-base-100 shadow-xl mt-6">
              <div className="card-body">
                <h2 className="card-title">申领报酬</h2>
                <p className="text-sm text-gray-500">您的工作量证明已被批准，现在可以申领您的报酬。</p>
                <div className="card-actions justify-end">
                  <ClaimReward taskId={taskId as string} onSuccess={refetchTask} />
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default FixedPaymentTaskDetailPage;
