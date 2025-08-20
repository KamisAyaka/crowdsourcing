"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useTransactor } from "~~/hooks/scaffold-eth/useTransactor";
import { notification } from "~~/utils/scaffold-eth";

const DisputePage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const [disputeId, setDisputeId] = useState(0);
  const [workerShare, setWorkerShare] = useState(0);
  const [activeTab, setActiveTab] = useState("stake");
  const writeTxn = useTransactor();

  // 读取合约信息
  const { data: disputeCounter, isLoading: isDisputeCounterLoading } = useScaffoldReadContract({
    contractName: "DisputeResolver",
    functionName: "disputeCounter",
  });

  const { data: adminStakeAmount } = useScaffoldReadContract({
    contractName: "DisputeResolver",
    functionName: "adminStakeAmount",
  });

  // 写入合约功能
  const { writeContractAsync: stakeToBecomeAdmin } = useScaffoldWriteContract({ contractName: "DisputeResolver" });
  const { writeContractAsync: voteOnDispute } = useScaffoldWriteContract({ contractName: "DisputeResolver" });
  const { writeContractAsync: processVotes } = useScaffoldWriteContract({ contractName: "DisputeResolver" });

  const handleStakeToBecomeAdmin = async () => {
    try {
      await writeTxn(
        () =>
          stakeToBecomeAdmin({
            functionName: "stakeToBecomeAdmin",
          }) as Promise<`0x${string}`>,
      );

      notification.success("质押成功");
    } catch (e) {
      console.error("Error staking:", e);
      notification.error("质押失败");
    }
  };

  const handleVoteOnDispute = async () => {
    if (workerShare < 0) {
      notification.error("工作者份额必须大于等于0");
      return;
    }

    try {
      await writeTxn(
        () =>
          voteOnDispute({
            functionName: "voteOnDispute",
            args: [BigInt(disputeId), BigInt(workerShare)],
          }) as Promise<`0x${string}`>,
      );

      notification.success("投票成功");
      setWorkerShare(0);
    } catch (e) {
      console.error("Error voting:", e);
      notification.error("投票失败");
    }
  };

  const handleProcessVotes = async () => {
    try {
      await writeTxn(
        () =>
          processVotes({
            functionName: "processVotes",
            args: [BigInt(disputeId)],
          }) as Promise<`0x${string}`>,
      );

      notification.success("处理投票成功");
    } catch (e) {
      console.error("Error processing votes:", e);
      notification.error("处理投票失败");
    }
  };

  return (
    <div className="flex flex-col items-center pt-10 px-4">
      <div className="flex justify-between items-center w-full max-w-6xl mb-8">
        <h1 className="text-3xl font-bold">纠纷解决</h1>
        <Link href="/" className="btn btn-secondary">
          返回主页
        </Link>
      </div>

      <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 p-6 w-full max-w-6xl mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">纠纷概览</h2>
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
            <p className="text-sm text-gray-500">总纠纷数</p>
            <p className="text-2xl font-bold">
              {isDisputeCounterLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                `#${disputeCounter?.toString() || "0"}`
              )}
            </p>
          </div>
          <div className="bg-base-200 p-4 rounded-xl">
            <p className="text-sm text-gray-500">管理员质押金额</p>
            <p className="text-2xl font-bold">
              {adminStakeAmount ? (Number(adminStakeAmount) / 10 ** 18).toString() : "0"} TST
            </p>
          </div>
          <div className="bg-base-200 p-4 rounded-xl">
            <p className="text-sm text-gray-500">功能类型</p>
            <p className="text-2xl font-bold">纠纷解决</p>
          </div>
        </div>

        <div className="tabs tabs-boxed mb-6">
          <a className={`tab ${activeTab === "stake" ? "tab-active" : ""}`} onClick={() => setActiveTab("stake")}>
            成为管理员
          </a>
          <a className={`tab ${activeTab === "vote" ? "tab-active" : ""}`} onClick={() => setActiveTab("vote")}>
            投票
          </a>
          <a className={`tab ${activeTab === "process" ? "tab-active" : ""}`} onClick={() => setActiveTab("process")}>
            处理投票
          </a>
        </div>

        {activeTab === "stake" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">成为纠纷解决管理员</h3>
            <div className="space-y-4">
              <p className="text-sm">
                质押 {adminStakeAmount ? (Number(adminStakeAmount) / 10 ** 18).toString() : "1000"} TST 代币成为管理员。
                作为管理员，您可以参与纠纷投票并获得奖励。
              </p>
              <button className="btn btn-primary w-full" onClick={handleStakeToBecomeAdmin}>
                质押成为管理员
              </button>
            </div>
          </div>
        )}

        {activeTab === "vote" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">为纠纷投票</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">纠纷ID</span>
                </label>
                <input
                  type="number"
                  placeholder="输入纠纷ID"
                  className="input input-bordered w-full"
                  value={disputeId || ""}
                  onChange={e => setDisputeId(Number(e.target.value))}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">分配给工作者的金额</span>
                </label>
                <input
                  type="number"
                  placeholder="工作者份额"
                  className="input input-bordered w-full"
                  value={workerShare || ""}
                  onChange={e => setWorkerShare(Number(e.target.value))}
                />
              </div>
              <button className="btn btn-primary w-full" onClick={handleVoteOnDispute}>
                提交投票
              </button>
            </div>
          </div>
        )}

        {activeTab === "process" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">处理纠纷投票</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">纠纷ID</span>
                </label>
                <input
                  type="number"
                  placeholder="输入纠纷ID"
                  className="input input-bordered w-full"
                  value={disputeId || ""}
                  onChange={e => setDisputeId(Number(e.target.value))}
                />
              </div>
              <p className="text-sm">处理纠纷的投票结果，计算平均值并解决纠纷。 需要至少3个管理员投票才能处理。</p>
              <button className="btn btn-primary w-full" onClick={handleProcessVotes}>
                处理投票
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 p-6 w-full max-w-6xl">
        <h2 className="text-2xl font-bold mb-6">功能说明</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-base-200 p-6 rounded-xl">
            <h3 className="font-bold text-lg mb-2">成为管理员</h3>
            <p className="text-sm">
              用户可以通过质押一定数量的TST代币成为纠纷解决管理员。 管理员可以参与纠纷投票并获得奖励。
            </p>
          </div>
          <div className="bg-base-200 p-6 rounded-xl">
            <h3 className="font-bold text-lg mb-2">投票</h3>
            <p className="text-sm">
              管理员可以对纠纷进行投票，决定工作者应得的报酬份额。 投票需要提供纠纷ID和工作者应得的金额。
            </p>
          </div>
          <div className="bg-base-200 p-6 rounded-xl">
            <h3 className="font-bold text-lg mb-2">处理投票</h3>
            <p className="text-sm">
              当纠纷收集到足够投票后（至少3票），可以处理投票结果。 系统将计算平均值并解决纠纷。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputePage;
