import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth/useTransactor";
import { notification } from "~~/utils/scaffold-eth";

interface SubmitBidProps {
  taskId: bigint;
  isTaskOpen: boolean;
}

export const SubmitBid = ({ taskId, isTaskOpen }: SubmitBidProps) => {
  const { address } = useAccount();
  const [bidAmount, setBidAmount] = useState("");
  const [bidDescription, setBidDescription] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const writeTxn = useTransactor();
  const { writeContractAsync: submitBid } = useScaffoldWriteContract({ contractName: "BiddingTask" });

  const handleSubmitBid = async () => {
    if (!address) {
      notification.error("请先连接钱包");
      return;
    }

    if (!isTaskOpen) {
      notification.error("任务不在开放状态，无法提交竞标");
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
            args: [taskId, BigInt(bidAmount), bidDescription, BigInt(estimatedTime)],
          }) as Promise<`0x${string}`>,
      );
      notification.success("竞标提交成功");
      // 清空表单
      setBidAmount("");
      setBidDescription("");
      setEstimatedTime("");
    } catch (e) {
      console.error("Error submitting bid:", e);
      notification.error("提交竞标失败");
    }
  };

  if (!isTaskOpen) {
    return (
      <div className="bg-base-200 p-4 rounded-xl">
        <h3 className="font-bold text-lg mb-2">提交竞标</h3>
        <p className="text-gray-500">任务已关闭，无法提交竞标</p>
      </div>
    );
  }

  return (
    <div className="bg-base-200 p-4 rounded-xl">
      <h3 className="font-bold text-lg mb-2">提交竞标</h3>
      <div className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold">竞标金额</span>
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
            <span className="label-text font-bold">预计完成时间 (秒)</span>
          </label>
          <input
            type="number"
            placeholder="预计完成时间"
            className="input input-bordered w-full"
            value={estimatedTime}
            onChange={e => setEstimatedTime(e.target.value)}
          />
        </div>
        <button className="btn btn-primary w-full" onClick={handleSubmitBid}>
          提交竞标
        </button>
      </div>
    </div>
  );
};
