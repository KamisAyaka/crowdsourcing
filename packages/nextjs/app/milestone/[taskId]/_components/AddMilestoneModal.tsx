import { useState } from "react";
import { parseEther } from "viem";
import { InputBase } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
}

export const AddMilestoneModal = ({ isOpen, onClose, taskId }: AddMilestoneModalProps) => {
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { writeContractAsync: addMilestone } = useScaffoldWriteContract({ contractName: "MilestonePaymentTask" });

  const handleAddMilestone = async () => {
    if (!description || !reward) {
      alert("请填写所有字段");
      return;
    }

    const rewardInWei = parseEther(reward);

    try {
      setIsSubmitting(true);
      await addMilestone({
        functionName: "addMilestone",
        args: [BigInt(taskId), description, rewardInWei],
      });
      setDescription("");
      setReward("");
      onClose();
    } catch (e) {
      console.error("Error adding milestone:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-base-100 rounded-lg p-6 w-96 max-w-full">
        <h3 className="font-bold text-lg mb-4">添加里程碑</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">里程碑描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="输入里程碑描述"
              className="textarea textarea-bordered w-full"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">里程碑报酬 (TST)</label>
            <InputBase value={reward} onChange={value => setReward(value)} placeholder="输入里程碑报酬" />
            <div className="text-xs text-gray-500 mt-1">输入数字，单位为TST代币</div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
            取消
          </button>
          <button
            className={`btn btn-primary ${isSubmitting ? "loading" : ""}`}
            onClick={handleAddMilestone}
            disabled={isSubmitting}
          >
            {isSubmitting ? "添加中..." : "添加里程碑"}
          </button>
        </div>
      </div>
    </div>
  );
};
