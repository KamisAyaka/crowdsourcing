"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ApproveProofOfWork } from "./_components/ApproveProofOfWork";
import { CancelTask } from "./_components/CancelTask";
import { ClaimReward } from "./_components/ClaimReward";
import { DisputeButton } from "./_components/DisputeButton";
import { ExtendDeadline } from "./_components/ExtendDeadline";
import { IncreaseReward } from "./_components/IncreaseReward";
import { SubmitProofOfWork } from "./_components/SubmitProofOfWork";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth/useTransactor";
import { notification } from "~~/utils/scaffold-eth";

export default function BiddingTaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { address: connectedAddress } = useAccount();
  const [taskData, setTaskData] = useState<any>(null);
  const [taskWorker, setTaskWorker] = useState<string>("");
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidDescription, setBidDescription] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const writeTxn = useTransactor();
  const { writeContractAsync: submitBid } = useScaffoldWriteContract({ contractName: "BiddingTask" });

  // 获取任务详情
  const {
    data: task,
    isLoading: isTaskLoading,
    refetch: refetchTask,
  } = useScaffoldReadContract({
    contractName: "BiddingTask",
    functionName: "tasks",
    args: [BigInt(taskId)],
  });

  // 获取任务工作者
  const { data: worker } = useScaffoldReadContract({
    contractName: "BiddingTask",
    functionName: "taskWorker",
    args: [BigInt(taskId)],
  });

  // 获取任务的工作量证明
  const { data: taskProof } = useScaffoldReadContract({
    contractName: "BiddingTask",
    functionName: "taskWorkProofs",
    args: [BigInt(taskId), taskWorker || ""],
  });

  // 获取任务详情
  useEffect(() => {
    if (task) {
      setTaskData({
        id: task[0],
        creator: task[1],
        title: task[2],
        description: task[3],
        totalreward: task[4],
        deadline: task[5],
        status: task[6],
        createdAt: task[7],
      });
    }
  }, [task]);

  useEffect(() => {
    if (worker) {
      setTaskWorker(worker);
    }
  }, [worker]);

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

  const handleSubmitBid = async () => {
    if (!connectedAddress) {
      notification.error("请先连接钱包");
      return;
    }

    if (!bidAmount || !bidDescription || !estimatedTime) {
      notification.error("请填写所有竞标信息");
      return;
    }

    try {
      await writeTxn(
        () =>
          submitBid({
            functionName: "submitBid",
            args: [BigInt(taskId), parseEther(bidAmount), bidDescription, BigInt(estimatedTime) * BigInt(86400)],
          }) as Promise<`0x${string}`>,
      );
      notification.success("竞标提交成功");
      setShowBidForm(false);
      setBidAmount("");
      setBidDescription("");
      setEstimatedTime("");
      refetchTask(); // 添加这行来刷新任务数据
    } catch (e) {
      console.error("Error submitting bid:", e);
      notification.error("提交竞标失败");
    }
  };

  if (isTaskLoading) {
    return (
      <div className="flex items-center justify-center pt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!taskData) {
    return (
      <div className="flex items-center justify-center pt-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">任务未找到</h2>
          <Link href="/bidding" className="btn btn-primary">
            返回任务列表
          </Link>
        </div>
      </div>
    );
  }

  // 解构任务数据
  const { id, creator, title, description, totalreward, deadline, status, createdAt } = taskData;

  // 检查当前用户是否为任务创建者
  const isTaskCreator = connectedAddress && creator && connectedAddress.toLowerCase() === creator.toLowerCase();
  const isTaskOpen = Number(status) === 0;
  const isTaskInProgress = Number(status) === 1;
  const isTaskCompleted = Number(status) === 2;
  const hasWorker = taskWorker && taskWorker !== "0x0000000000000000000000000000000000000000";
  const isTaskWorker = connectedAddress === taskWorker;

  return (
    <div className="flex flex-col items-center pt-10 px-4">
      <div className="w-full max-w-4xl">
        <div className="mb-6">
          <Link href="/bidding" className="btn btn-sm btn-outline">
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
                <p>{(Number(totalreward.toString()) / 1e18).toFixed(2)} TST</p>
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

        {/* 根据用户角色和任务状态显示不同内容 */}
        {isTaskCreator ? (
          <>
            {/* 任务创建者视图 - 如果任务已经有工作者，则不显示竞标者列表链接 */}
            {!hasWorker && isTaskOpen && (
              <div className="card bg-base-100 shadow-xl mb-6">
                <div className="card-body text-center">
                  <Link href={`/bidding/${taskId}/BidPage`} className="btn btn-primary">
                    查看竞标者列表
                  </Link>
                </div>
              </div>
            )}

            {/* 只有任务创建者且任务状态为Open或InProgress时才能取消任务 */}
            <CancelTask taskId={taskId} taskStatus={status} onSuccess={refetchTask} />

            {/* 只有任务创建者且任务状态为Open或InProgress时才能延长截止日期 */}
            {(isTaskOpen || isTaskInProgress) && (
              <ExtendDeadline taskId={taskId} currentDeadline={deadline} onSuccess={refetchTask} />
            )}

            {/* 只有任务创建者且任务状态为Open、InProgress或Completed时才能增加奖励 */}
            {(isTaskOpen || isTaskInProgress || isTaskCompleted) && (
              <IncreaseReward taskId={taskId} onSuccess={refetchTask} />
            )}
          </>
        ) : (
          // 工作者视图
          <>
            <div className="card bg-base-100 shadow-xl mb-6">
              <div className="card-body">
                {isTaskOpen ? (
                  <>
                    {!showBidForm ? (
                      <div className="text-center">
                        <button className="btn btn-primary" onClick={() => setShowBidForm(true)}>
                          参与竞标
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="card-title text-xl mb-4">提交竞标</h3>
                        <div className="space-y-4">
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-bold">竞标金额 (Tokens)</span>
                            </label>
                            <input
                              type="number"
                              placeholder="竞标金额"
                              className="input input-bordered w-full"
                              value={bidAmount}
                              onChange={e => setBidAmount(e.target.value)}
                            />
                          </div>
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-bold">竞标描述/提案</span>
                            </label>
                            <textarea
                              placeholder="详细描述您的竞标方案"
                              className="textarea textarea-bordered w-full"
                              value={bidDescription}
                              onChange={e => setBidDescription(e.target.value)}
                            />
                          </div>
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-bold">预计完成时间 (天)</span>
                            </label>
                            <input
                              type="number"
                              placeholder="预计完成时间"
                              className="input input-bordered w-full"
                              value={estimatedTime}
                              onChange={e => setEstimatedTime(e.target.value)}
                            />
                          </div>
                          <div className="card-actions justify-end">
                            <button
                              className="btn btn-ghost"
                              onClick={() => {
                                setShowBidForm(false);
                                setBidAmount("");
                                setBidDescription("");
                                setEstimatedTime("");
                              }}
                            >
                              取消
                            </button>
                            <button className="btn btn-primary" onClick={handleSubmitBid}>
                              提交竞标
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-gray-500">任务已关闭，无法提交竞标</p>
                )}
              </div>
            </div>

            {/* 任务状态为InProgress时显示工作者信息和提交工作量证明按钮 */}
            {isTaskInProgress && hasWorker && isTaskWorker && (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex justify-between items-center">
                    <h2 className="card-title">任务进行中</h2>
                    <button className="btn btn-primary" onClick={() => setIsProofModalOpen(true)}>
                      提交工作量证明
                    </button>
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
            {isTaskInProgress && hasWorker && isTaskWorker && (
              <SubmitProofOfWork
                taskId={BigInt(taskId)}
                taskDeadline={deadline}
                isOpen={isProofModalOpen}
                onClose={() => setIsProofModalOpen(false)}
                onSuccess={() => {
                  refetchTask();
                  setIsProofModalOpen(false);
                }}
              />
            )}

            {/* 只有工作者且任务状态为Completed时才能申领报酬 */}
            {isTaskWorker && isTaskCompleted && (
              <div className="card bg-base-100 shadow-xl mt-6">
                <div className="card-body">
                  <h2 className="card-title">申领报酬</h2>
                  <p className="text-sm text-gray-500">您的工作量证明已被批准，现在可以申领您的报酬。</p>
                  <div className="card-actions justify-end">
                    <ClaimReward taskId={taskId} onSuccess={refetchTask} />
                  </div>
                </div>
              </div>
            )}
          </>
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
              {isTaskCreator && !taskProof[2] && isTaskInProgress && hasWorker && (
                <div className="card-actions justify-end mt-4">
                  <ApproveProofOfWork
                    taskId={BigInt(taskId)}
                    taskWorker={taskWorker}
                    isTaskCreator={isTaskCreator}
                    isTaskInProgress={isTaskInProgress}
                  />
                </div>
              )}

              {/* 只有工作者且工作量证明尚未批准时才显示提出纠纷按钮 */}
              {isTaskWorker && !taskProof[2] && isTaskInProgress && (
                <div className="card-actions justify-end mt-4">
                  <DisputeButton taskId={taskId} onSuccess={refetchTask} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
