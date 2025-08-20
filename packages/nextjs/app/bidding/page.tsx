"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useTransactor } from "~~/hooks/scaffold-eth/useTransactor";
import { notification } from "~~/utils/scaffold-eth";

const BiddingTasksPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDeadline, setTaskDeadline] = useState(0);
  const [bidAmount, setBidAmount] = useState(0);
  const [bidDescription, setBidDescription] = useState("");
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [activeTab, setActiveTab] = useState("create");
  const writeTxn = useTransactor();

  // 读取合约信息
  const { data: taskCounter, isLoading: isTaskCounterLoading } = useScaffoldReadContract({
    contractName: "BiddingTask",
    functionName: "taskCounter",
  });

  const { data: platformFee } = useScaffoldReadContract({
    contractName: "BiddingTask",
    functionName: "platformFee",
  });

  // 写入合约功能 - 使用推荐的对象参数版本
  const { writeContractAsync: createTask } = useScaffoldWriteContract({ contractName: "BiddingTask" });
  const { writeContractAsync: submitBid } = useScaffoldWriteContract({ contractName: "BiddingTask" });

  const handleCreateTask = async () => {
    if (!taskTitle || !taskDescription || taskDeadline <= 0) {
      notification.error("请填写所有任务信息");
      return;
    }

    try {
      await writeTxn(
        () =>
          createTask({
            functionName: "createTask",
            args: [taskTitle, taskDescription, BigInt(Math.floor(Date.now() / 1000) + taskDeadline)],
          }) as Promise<`0x${string}`>,
      );

      notification.success("任务创建成功");
      // 清空表单
      setTaskTitle("");
      setTaskDescription("");
      setTaskDeadline(0);
    } catch (e) {
      console.error("Error creating task:", e);
      notification.error("创建任务失败");
    }
  };

  const handleSubmitBid = async (taskId: number) => {
    if (bidAmount <= 0 || !bidDescription || estimatedTime <= 0) {
      notification.error("请填写竞标信息");
      return;
    }

    try {
      await writeTxn(
        () =>
          submitBid({
            functionName: "submitBid",
            args: [BigInt(taskId), BigInt(bidAmount), bidDescription, BigInt(estimatedTime)],
          }) as Promise<`0x${string}`>,
      );

      notification.success("竞标提交成功");
      // 清空表单
      setBidAmount(0);
      setBidDescription("");
      setEstimatedTime(0);
    } catch (e) {
      console.error("Error submitting bid:", e);
      notification.error("提交竞标失败");
    }
  };

  return (
    <div className="flex flex-col items-center pt-10 px-4">
      <div className="flex justify-between items-center w-full max-w-6xl mb-8">
        <h1 className="text-3xl font-bold">竞标任务</h1>
        <Link href="/" className="btn btn-secondary">
          返回主页
        </Link>
      </div>

      <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 p-6 w-full max-w-6xl mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">任务概览</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">网络:</span> {targetNetwork.name}
            </div>
            <div className="text-sm">
              <span className="font-medium">已连接:</span>
              <Address address={connectedAddress} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-base-200 p-4 rounded-xl">
            <p className="text-sm text-gray-500">总任务数</p>
            <p className="text-2xl font-bold">
              {isTaskCounterLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                `#${taskCounter?.toString() || "0"}`
              )}
            </p>
          </div>
          <div className="bg-base-200 p-4 rounded-xl">
            <p className="text-sm text-gray-500">平台费用</p>
            <p className="text-2xl font-bold">{platformFee ? (Number(platformFee) / 100).toString() : "0"}%</p>
          </div>
          <div className="bg-base-200 p-4 rounded-xl">
            <p className="text-sm text-gray-500">任务类型</p>
            <p className="text-2xl font-bold">竞标任务</p>
          </div>
        </div>

        <div className="tabs tabs-boxed mb-6">
          <a className={`tab ${activeTab === "create" ? "tab-active" : ""}`} onClick={() => setActiveTab("create")}>
            创建任务
          </a>
          <a className={`tab ${activeTab === "bid" ? "tab-active" : ""}`} onClick={() => setActiveTab("bid")}>
            提交竞标
          </a>
        </div>

        {activeTab === "create" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">创建新任务</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">任务标题</span>
                </label>
                <input
                  type="text"
                  placeholder="输入任务标题"
                  className="input input-bordered w-full"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">任务描述</span>
                </label>
                <textarea
                  placeholder="详细描述任务要求"
                  className="textarea textarea-bordered w-full"
                  value={taskDescription}
                  onChange={e => setTaskDescription(e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">截止时间 (秒)</span>
                </label>
                <input
                  type="number"
                  placeholder="任务截止时间"
                  className="input input-bordered w-full"
                  value={taskDeadline || ""}
                  onChange={e => setTaskDeadline(Number(e.target.value))}
                />
              </div>
              <button className="btn btn-primary w-full" onClick={handleCreateTask}>
                创建任务
              </button>
            </div>
          </div>
        )}

        {activeTab === "bid" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">提交竞标</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">任务ID</span>
                </label>
                <input type="number" placeholder="输入任务ID" className="input input-bordered w-full" />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">竞标金额</span>
                </label>
                <input
                  type="number"
                  placeholder="竞标金额"
                  className="input input-bordered w-full"
                  value={bidAmount || ""}
                  onChange={e => setBidAmount(Number(e.target.value))}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">竞标描述</span>
                </label>
                <textarea
                  placeholder="竞标描述/提案"
                  className="textarea textarea-bordered w-full"
                  value={bidDescription}
                  onChange={e => setBidDescription(e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">预计完成时间 (秒)</span>
                </label>
                <input
                  type="number"
                  placeholder="预计完成时间"
                  className="input input-bordered w-full"
                  value={estimatedTime || ""}
                  onChange={e => setEstimatedTime(Number(e.target.value))}
                />
              </div>
              <button className="btn btn-primary w-full" onClick={() => handleSubmitBid(1)}>
                提交竞标
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 p-6 w-full max-w-6xl">
        <h2 className="text-2xl font-bold mb-6">功能说明</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-base-200 p-6 rounded-xl">
            <h3 className="font-bold text-lg mb-2">创建任务</h3>
            <p className="text-sm">
              任务创建者可以创建一个竞标任务，指定任务标题、描述和截止时间。
              创建任务时不需要指定工作者和报酬，工作者可以提交竞标。
            </p>
          </div>
          <div className="bg-base-200 p-6 rounded-xl">
            <h3 className="font-bold text-lg mb-2">提交竞标</h3>
            <p className="text-sm">
              工作者可以为已创建的竞标任务提交竞标，包括竞标金额、描述和预计完成时间。
              任务创建者可以选择最优的竞标并接受。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiddingTasksPage;
