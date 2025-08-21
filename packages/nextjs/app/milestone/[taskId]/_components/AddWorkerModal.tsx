import { useState } from "react";
import { parseEther } from "viem";
import { AddressInput, InputBase } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth/useTransactor";

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
}

export const AddWorkerModal = ({ isOpen, onClose, taskId }: AddWorkerModalProps) => {
  const [workerAddress, setWorkerAddress] = useState("");
  const [reward, setReward] = useState("");
  const writeTxn = useTransactor();

  // 获取MilestonePaymentTask合约信息
  const { data: milestonePaymentTaskContract } = useDeployedContractInfo({ contractName: "MilestonePaymentTask" });

  // 获取TaskToken合约地址
  const { data: taskTokenData } = useScaffoldReadContract({
    contractName: "MilestonePaymentTask",
    functionName: "taskToken",
  });

  const { writeContractAsync: addWorker } = useScaffoldWriteContract({ contractName: "MilestonePaymentTask" });
  const { writeContractAsync: approveToken } = useScaffoldWriteContract({ contractName: "TaskToken" });

  const handleAddWorker = async () => {
    if (!workerAddress || !reward) {
      alert("请填写所有字段");
      return;
    }

    const rewardInWei = parseEther(reward);

    if (!milestonePaymentTaskContract || !taskTokenData) {
      alert("合约未部署或地址无效");
      return;
    }

    try {
      // 先授权代币
      await writeTxn(
        () =>
          approveToken({
            functionName: "approve",
            args: [milestonePaymentTaskContract.address, rewardInWei],
          }) as Promise<`0x${string}`>,
        { onBlockConfirmation: onClose },
      );

      // 然后添加工作者
      await writeTxn(
        () =>
          addWorker({
            functionName: "addWorker",
            args: [BigInt(taskId), workerAddress as `0x${string}`, rewardInWei],
          }) as Promise<`0x${string}`>,
        { onBlockConfirmation: onClose },
      );

      setWorkerAddress("");
      setReward("");
    } catch (e) {
      console.error("Error adding worker:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-base-100 rounded-lg p-6 w-96 max-w-full">
        <h3 className="font-bold text-lg mb-4">分配工作者</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">工作者地址</label>
            <AddressInput
              value={workerAddress}
              onChange={value => setWorkerAddress(value)}
              placeholder="输入工作者地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">任务报酬 (TST)</label>
            <InputBase value={reward} onChange={value => setReward(value)} placeholder="输入任务报酬" />
            <div className="text-xs text-gray-500 mt-1">输入数字，单位为TST代币</div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button className="btn btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleAddWorker}>
            确认分配
          </button>
        </div>
      </div>
    </div>
  );
};
