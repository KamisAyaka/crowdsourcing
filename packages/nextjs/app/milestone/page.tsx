"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useTransactor } from "~~/hooks/scaffold-eth/useTransactor";
import { notification } from "~~/utils/scaffold-eth";

const MilestoneTasksPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDeadline, setTaskDeadline] = useState(0);
  const [workerAddress, setWorkerAddress] = useState("");
  const [taskReward, setTaskReward] = useState(0);
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [milestoneReward, setMilestoneReward] = useState(0);
  const [activeTab, setActiveTab] = useState("create");
  const writeTxn = useTransactor();

  // 读取合约信息
  const { data: taskCounter, isLoading: isTaskCounterLoading } = useScaffoldReadContract({
    contractName: "MilestonePaymentTask",
    functionName: "taskCounter",
  });

  const { data: platformFee } = useScaffoldReadContract({
    contractName: "MilestonePaymentTask",
    functionName: "platformFee",
  });

  // 写入合约功能 - 使用推荐的对象参数版本
  const { writeContractAsync: createTask } = useScaffoldWriteContract({ contractName: "MilestonePaymentTask" });
  const { writeContractAsync: addWorker } = useScaffoldWriteContract({ contractName: "MilestonePaymentTask" });
  const { writeContractAsync: addMilestone } = useScaffoldWriteContract({ contractName: "MilestonePaymentTask" });

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

  const handleAddWorker = async (taskId: number) => {
    if (!workerAddress || taskReward <= 0) {
      notification.error("请填写工作者地址和报酬");
      return;
    }

    try {
      await writeTxn(
        () =>
          addWorker({
            functionName: "addWorker",
            args: [BigInt(taskId), workerAddress, BigInt(taskReward)],
          }) as Promise<`0x${string}`>,
      );

      notification.success("工作者添加成功");
      // 清空表单
      setWorkerAddress("");
      setTaskReward(0);
    } catch (e) {
      console.error("Error adding worker:", e);
      notification.error("添加工作者失败");
    }
  };

  const handleAddMilestone = async (taskId: number) => {
    if (!milestoneDescription || milestoneReward <= 0) {
      notification.error("请填写里程碑描述和报酬");
      return;
    }

    try {
      await writeTxn(
        () =>
          addMilestone({
            functionName: "addMilestone",
            args: [BigInt(taskId), milestoneDescription, BigInt(milestoneReward)],
          }) as Promise<`0x${string}`>,
      );

      notification.success("里程碑添加成功");
      // 清空表单
      setMilestoneDescription("");
      setMilestoneReward(0);
    } catch (e) {
      console.error("Error adding milestone:", e);
      notification.error("添加里程碑失败");
    }
  };

  return (
    <div className="flex flex-col items-center pt-10 px-4">
      <div className="flex justify-between items-center w-full max-w-6xl mb-8">
        <h1 className="text-3xl font-bold">里程碑任务</h1>
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
            <p className="text-2xl font-bold">里程碑任务</p>
          </div>
        </div>

        <div className="tabs tabs-boxed mb-6">
          <a className={`tab ${activeTab === "create" ? "tab-active" : ""}`} onClick={() => setActiveTab("create")}>
            创建任务
          </a>
          <a className={`tab ${activeTab === "manage" ? "tab-active" : ""}`} onClick={() => setActiveTab("manage")}>
            管理任务
          </a>
          <a
            className={`tab ${activeTab === "milestone" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("milestone")}
          >
            添加里程碑
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

        {activeTab === "manage" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">添加工作者</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">任务ID</span>
                </label>
                <input type="number" placeholder="输入任务ID" className="input input-bordered w-full" />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">工作者地址</span>
                </label>
                <input
                  type="text"
                  placeholder="工作者钱包地址"
                  className="input input-bordered w-full"
                  value={workerAddress}
                  onChange={e => setWorkerAddress(e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">任务总报酬</span>
                </label>
                <input
                  type="number"
                  placeholder="任务总报酬"
                  className="input input-bordered w-full"
                  value={taskReward || ""}
                  onChange={e => setTaskReward(Number(e.target.value))}
                />
              </div>
              <button className="btn btn-primary w-full" onClick={() => handleAddWorker(1)}>
                添加工作者
              </button>
            </div>
          </div>
        )}

        {activeTab === "milestone" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">添加里程碑</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">任务ID</span>
                </label>
                <input type="number" placeholder="输入任务ID" className="input input-bordered w-full" />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">里程碑描述</span>
                </label>
                <input
                  type="text"
                  placeholder="里程碑描述"
                  className="input input-bordered w-full"
                  value={milestoneDescription}
                  onChange={e => setMilestoneDescription(e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">里程碑报酬</span>
                </label>
                <input
                  type="number"
                  placeholder="里程碑报酬"
                  className="input input-bordered w-full"
                  value={milestoneReward || ""}
                  onChange={e => setMilestoneReward(Number(e.target.value))}
                />
              </div>
              <button className="btn btn-primary w-full" onClick={() => handleAddMilestone(1)}>
                添加里程碑
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 p-6 w-full max-w-6xl">
        <h2 className="text-2xl font-bold mb-6">功能说明</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-base-200 p-6 rounded-xl">
            <h3 className="font-bold text-lg mb-2">创建任务</h3>
            <p className="text-sm">
              任务创建者可以创建一个里程碑任务，指定任务标题、描述和截止时间。 创建任务时不需要指定工作者和报酬。
            </p>
          </div>
          <div className="bg-base-200 p-6 rounded-xl">
            <h3 className="font-bold text-lg mb-2">添加工作者</h3>
            <p className="text-sm">
              任务创建者可以为已创建的任务添加工作者和总报酬。 报酬会从创建者账户转移到合约中托管。
            </p>
          </div>
          <div className="bg-base-200 p-6 rounded-xl">
            <h3 className="font-bold text-lg mb-2">添加里程碑</h3>
            <p className="text-sm">
              任务创建者可以为任务添加多个里程碑，每个里程碑有描述和报酬。 里程碑报酬总和不能超过任务总报酬。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneTasksPage;
