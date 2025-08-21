import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth/useTransactor";
import { notification } from "~~/utils/scaffold-eth";

interface AcceptBidProps {
  taskId: bigint;
  isTaskCreator: boolean;
  isTaskOpen: boolean;
}

export const AcceptBid = ({ taskId, isTaskCreator, isTaskOpen }: AcceptBidProps) => {
  const { address } = useAccount();
  const [bidIndex, setBidIndex] = useState("");
  const writeTxn = useTransactor();
  const { writeContractAsync: acceptBid } = useScaffoldWriteContract({ contractName: "BiddingTask" });

  // 获取竞标数量
  const { data: bidCount } = useScaffoldReadContract({
    contractName: "BiddingTask",
    functionName: "getBidCount",
    args: [taskId],
  });

  // 获取竞标信息
  const { data: bidInfo } = useScaffoldReadContract({
    contractName: "BiddingTask",
    functionName: "getBid",
    args: [taskId, bidIndex ? BigInt(bidIndex) : 0n],
  });

  const handleAcceptBid = async () => {
    if (!address) {
      notification.error("请先连接钱包");
      return;
    }

    if (!isTaskCreator) {
      notification.error("只有任务创建者可以接受竞标");
      return;
    }

    if (!isTaskOpen) {
      notification.error("任务不在开放状态，无法接受竞标");
      return;
    }

    if (!bidIndex) {
      notification.error("请选择要接受的竞标");
      return;
    }

    try {
      await writeTxn(
        () =>
          acceptBid({
            functionName: "acceptBid",
            args: [taskId, BigInt(bidIndex)],
          }) as Promise<`0x${string}`>,
      );
      notification.success("竞标接受成功");
    } catch (e) {
      console.error("Error accepting bid:", e);
      notification.error("接受竞标失败");
    }
  };

  if (!isTaskCreator) {
    return null;
  }

  if (!isTaskOpen) {
    return (
      <div className="bg-base-200 p-4 rounded-xl">
        <h3 className="font-bold text-lg mb-2">接受竞标</h3>
        <p className="text-gray-500">任务已关闭，无法接受竞标</p>
      </div>
    );
  }

  return (
    <div className="bg-base-200 p-4 rounded-xl">
      <h3 className="font-bold text-lg mb-2">接受竞标</h3>
      <div className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold">竞标数量: {bidCount?.toString() || "0"}</span>
          </label>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold">
              选择竞标索引 (0 到 {bidCount ? (Number(bidCount) - 1).toString() : "0"})
            </span>
          </label>
          <input
            type="number"
            placeholder="竞标索引"
            className="input input-bordered w-full"
            value={bidIndex}
            onChange={e => setBidIndex(e.target.value)}
          />
        </div>
        {bidInfo && bidIndex && (
          <div className="bg-base-300 p-3 rounded-lg">
            <p>
              <span className="font-bold">竞标者:</span> {bidInfo.bidder}
            </p>
            <p>
              <span className="font-bold">金额:</span> {bidInfo.amount.toString()}
            </p>
            <p>
              <span className="font-bold">描述:</span> {bidInfo.description}
            </p>
            <p>
              <span className="font-bold">预计时间:</span> {bidInfo.estimatedTime.toString()} 秒
            </p>
          </div>
        )}
        <button className="btn btn-primary w-full" onClick={handleAcceptBid}>
          接受竞标
        </button>
      </div>
    </div>
  );
};
