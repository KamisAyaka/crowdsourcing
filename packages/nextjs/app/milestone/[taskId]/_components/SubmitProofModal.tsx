import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-eth/useTransactor";

interface SubmitProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  milestoneIndex: number | null;
}

export const SubmitProofModal = ({ isOpen, onClose, taskId, milestoneIndex }: SubmitProofModalProps) => {
  const [proof, setProof] = useState("");
  const writeTxn = useTransactor();

  const { writeContractAsync: submitMilestoneProofOfWork } = useScaffoldWriteContract({
    contractName: "MilestonePaymentTask",
  });

  const handleSubmitProof = async () => {
    if (!proof || milestoneIndex === null) {
      alert("请填写工作量证明");
      return;
    }

    try {
      await writeTxn(
        () =>
          submitMilestoneProofOfWork({
            functionName: "submitMilestoneProofOfWork",
            args: [BigInt(taskId), BigInt(milestoneIndex), proof],
          }) as Promise<`0x${string}`>,
        { onBlockConfirmation: onClose },
      );
      setProof("");
    } catch (e) {
      console.error("Error submitting proof:", e);
    }
  };

  if (!isOpen || milestoneIndex === null) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-base-100 rounded-lg p-6 w-96 max-w-full">
        <h3 className="font-bold text-lg mb-4">提交工作量证明</h3>
        <p className="text-sm text-gray-500 mb-4">里程碑 #{milestoneIndex + 1}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">工作量证明</label>
            <textarea
              value={proof}
              onChange={e => setProof(e.target.value)}
              placeholder="描述完成的工作"
              className="textarea textarea-bordered w-full"
              rows={6}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button className="btn btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSubmitProof}>
            提交证明
          </button>
        </div>
      </div>
    </div>
  );
};
