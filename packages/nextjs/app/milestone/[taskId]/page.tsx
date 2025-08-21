"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AddMilestoneModal } from "./_components/AddMilestoneModal";
import { AddWorkerModal } from "./_components/AddWorkerModal";
import { CancelTask } from "./_components/CancelTask";
import { CompleteTaskButton } from "./_components/CompleteTaskButton";
import { CreatorActions } from "./_components/CreatorActions";
import { ExtendDeadline } from "./_components/ExtendDeadline";
import { IncreaseReward } from "./_components/IncreaseReward";
import { MilestonesList } from "./_components/MilestonesList";
import { SubmitProofModal } from "./_components/SubmitProofModal";
import { TaskInfoCard } from "./_components/TaskInfoCard";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth/useTransactor";

const MilestoneTaskDetailPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { address: connectedAddress } = useAccount();
  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);
  const [isAddMilestoneModalOpen, setIsAddMilestoneModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState<number | null>(null);
  const writeTxn = useTransactor();

  // 获取任务详情
  const {
    data: task,
    isLoading: isTaskLoading,
    refetch: refetchTask,
  } = useScaffoldReadContract({
    contractName: "MilestonePaymentTask",
    functionName: "tasks",
    args: [BigInt(taskId)],
  });

  // 获取任务工作者
  const { data: taskWorker } = useScaffoldReadContract({
    contractName: "MilestonePaymentTask",
    functionName: "taskWorker",
    args: [BigInt(taskId)],
  });

  // 获取所有里程碑数据
  const { data: milestones } = useScaffoldReadContract({
    contractName: "MilestonePaymentTask",
    functionName: "getAllMilestones",
    args: [BigInt(taskId)],
  });

  // 合约写入hooks
  const { writeContractAsync: approveMilestone } = useScaffoldWriteContract({
    contractName: "MilestonePaymentTask",
  });

  const { writeContractAsync: completeTask } = useScaffoldWriteContract({
    contractName: "MilestonePaymentTask",
  });

  const { writeContractAsync: payMilestone } = useScaffoldWriteContract({
    contractName: "MilestonePaymentTask",
  });

  // 将只读数组转换为可变数组
  const mutableMilestones = milestones ? [...milestones] : [];

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
          <Link href="/milestone" className="btn btn-primary">
            返回任务列表
          </Link>
        </div>
      </div>
    );
  }

  // 解构任务数据
  const [, creator, title, description, totalreward, deadline, status, createdAt] = task || [];

  // 检查当前用户是否为任务创建者
  const isTaskCreator = connectedAddress && creator && connectedAddress.toLowerCase() === creator.toLowerCase();
  const isTaskWorker = connectedAddress && taskWorker && connectedAddress.toLowerCase() === taskWorker.toLowerCase();

  // 检查任务状态
  const isTaskOpen = BigInt(status || 0n) === 0n;
  const isTaskInProgress = BigInt(status || 0n) === 1n;
  const isTaskCompleted = BigInt(status || 0n) === 2n;
  // const isTaskPaid = status === 4n;
  // const isTaskCancelled = status === 3n;

  // 处理各种操作
  const handleAddWorkerClick = () => {
    setIsAddWorkerModalOpen(true);
  };

  const handleAddMilestoneClick = () => {
    setIsAddMilestoneModalOpen(true);
  };

  const handleApproveMilestone = async (index: number) => {
    try {
      await writeTxn(
        () =>
          approveMilestone({
            functionName: "approveMilestone",
            args: [BigInt(taskId), BigInt(index)],
          }) as Promise<`0x${string}`>,
      );
      refetchTask();
    } catch (e) {
      console.error("Error approving milestone:", e);
    }
  };

  const handlePayMilestone = async (index: number) => {
    try {
      await writeTxn(
        () =>
          payMilestone({
            functionName: "payMilestone",
            args: [BigInt(taskId), BigInt(index)],
          }) as Promise<`0x${string}`>,
      );
      refetchTask();
    } catch (e) {
      console.error("Error claiming milestone reward:", e);
    }
  };

  const handleSubmitProof = (index: number) => {
    setSelectedMilestoneIndex(index);
    setIsProofModalOpen(true);
  };

  const handleCompleteTask = async () => {
    try {
      await writeTxn(
        () =>
          completeTask({
            functionName: "completeTask",
            args: [BigInt(taskId)],
          }) as Promise<`0x${string}`>,
      );
      refetchTask();
    } catch (e) {
      console.error("Error completing task:", e);
    }
  };

  return (
    <div className="flex flex-col items-center pt-10 px-4">
      <div className="w-full max-w-4xl">
        <div className="mb-6">
          <Link href="/milestone" className="btn btn-sm btn-outline">
            ← 返回任务列表
          </Link>
        </div>

        <TaskInfoCard
          task={{
            creator: creator || "",
            title: title || "",
            description: description || "",
            totalreward: totalreward || 0n,
            deadline: deadline || 0n,
            status: Number(status) || 0,
            createdAt: createdAt || 0n,
          }}
          isTaskCreator={!!isTaskCreator}
          isTaskWorker={!!isTaskWorker}
          taskWorker={taskWorker}
        />

        <CreatorActions
          taskId={taskId}
          onAddWorkerClick={handleAddWorkerClick}
          onAddMilestoneClick={handleAddMilestoneClick}
        />

        <MilestonesList
          milestones={mutableMilestones}
          isTaskCreator={!!isTaskCreator}
          isTaskWorker={!!isTaskWorker}
          onApproveMilestone={handleApproveMilestone}
          onPayMilestone={handlePayMilestone}
          onSubmitProof={handleSubmitProof}
        />

        <CompleteTaskButton
          isTaskCreator={!!isTaskCreator}
          isTaskInProgress={isTaskInProgress}
          milestonesLength={mutableMilestones.length}
          onCompleteTask={handleCompleteTask}
        />

        {/* 只有任务创建者且任务状态为Open或InProgress时才能取消任务 */}
        {isTaskCreator && (
          <CancelTask taskId={taskId} isTaskCreator={!!isTaskCreator} isTaskInProgress={isTaskInProgress} />
        )}

        {/* 只有任务创建者且任务状态为Open或InProgress时才能延长截止日期 */}
        {isTaskCreator && (isTaskOpen || isTaskInProgress) && (
          <ExtendDeadline taskId={taskId} currentDeadline={deadline} onSuccess={refetchTask} />
        )}

        {/* 只有任务创建者且任务状态为Open、InProgress或Completed时才能增加奖励 */}
        {isTaskCreator && (isTaskOpen || isTaskInProgress || isTaskCompleted) && (
          <IncreaseReward taskId={taskId} onSuccess={refetchTask} />
        )}
      </div>

      <AddWorkerModal isOpen={isAddWorkerModalOpen} onClose={() => setIsAddWorkerModalOpen(false)} taskId={taskId} />

      <AddMilestoneModal
        isOpen={isAddMilestoneModalOpen}
        onClose={() => setIsAddMilestoneModalOpen(false)}
        taskId={taskId}
      />

      <SubmitProofModal
        isOpen={isProofModalOpen}
        onClose={() => {
          setIsProofModalOpen(false);
          setSelectedMilestoneIndex(null);
        }}
        taskId={taskId}
        milestoneIndex={selectedMilestoneIndex}
      />
    </div>
  );
};

export default MilestoneTaskDetailPage;
