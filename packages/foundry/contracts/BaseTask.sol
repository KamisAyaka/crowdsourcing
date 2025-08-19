// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./DisputeResolver.sol";

/**
 * @title 基础任务合约
 * @notice 定义众包任务的基本结构和功能，作为各种特定任务类型的基类
 * @dev 使用抽象合约模式，允许子合约实现特定任务类型的功能
 * @dev 提供任务核心逻辑的抽象接口
 */
abstract contract BaseTask is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // 任务状态枚举
    enum TaskStatus {
        Open, // 开放中，可被接受
        InProgress, // 进行中，已被接受
        Completed, // 已完成，等待支付
        Paid, // 已支付
        Cancelled // 已取消
    }

    // 任务结构体
    struct Task {
        uint256 id; // 任务ID
        address payable creator; // 任务创建者
        string title; // 任务标题
        string description; // 任务描述
        uint256 totalreward; // 任务奖励
        uint256 deadline; // 截止时间 (timestamp)
        TaskStatus status; // 任务状态
        uint256 createdAt; // 创建时间
    }

    // 工作量证明结构
    struct ProofOfWork {
        string proof; // 工作量证明内容
        bool submitted; // 是否已提交
        bool approved; // 是否已通过验证
        uint256 submittedAt; // 提交时间
    }

    // 自定义错误
    error OnlyTaskCreator(address caller, uint256 taskId);
    error FeeTooHigh(uint256 newFee);
    error NoRevenueToWithdraw();
    error RewardMoreThanZero();
    error InvalidDeadline();
    error InvalidDisputeResolverAddress();
    error DisputeFilingFailed();

    // 平台费用 (以基点计算，100 = 1%)
    uint256 public platformFee = 100; // 1%

    // 任务计数器
    uint256 public taskCounter;

    // 平台总收入
    uint256 public totalPlatformRevenue;

    // 平台代币地址
    IERC20 public taskToken;

    // 纠纷解决合约地址
    DisputeResolver public disputeResolver;

    // 存储所有任务
    mapping(uint256 => Task) public tasks;

    // 存储任务的工作量证明
    mapping(uint256 => mapping(address => ProofOfWork)) public taskWorkProofs;

    // 事件定义
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event DisputeResolverUpdated(address oldResolver, address newResolver);

    /**
     * @notice modifier，检查调用者是否为任务创建者
     * @param _taskId 任务ID
     */
    modifier onlyTaskCreator(uint256 _taskId) {
        if (tasks[_taskId].creator != msg.sender) {
            revert OnlyTaskCreator(msg.sender, _taskId);
        }
        _;
    }

    /**
     * @notice 构造函数，设置合约所有者和平台代币
     * @param _taskToken 平台代币地址
     * @param _disputeResolver 纠纷解决合约地址
     */
    constructor(
        IERC20 _taskToken,
        DisputeResolver _disputeResolver
    ) Ownable(msg.sender) {
        taskToken = _taskToken;
        disputeResolver = _disputeResolver;
    }

    /**
     * @notice 抽象函数，由子合约实现具体的任务创建逻辑
     * @param _title 任务标题
     * @param _description 任务描述
     * @param _deadline 任务截止时间
     */
    function createTask(
        string memory _title,
        string memory _description,
        uint256 _deadline
    ) public virtual;

    /**
     * @notice 抽象函数，由子合约实现具体的提交工作证明逻辑
     * @param _taskId 任务ID
     * @param _proof 工作量证明内容
     */
    function submitProofOfWork(
        uint256 _taskId,
        string memory _proof
    ) public virtual {}

    /**
     * @notice 抽象函数，由子合约实现具体的任务完成逻辑
     * @param _taskId 任务ID
     */
    function completeTask(uint256 _taskId) public virtual;

    /**
     * @notice 抽象函数，由子合约实现具体的支付逻辑
     * @param _taskId 任务ID
     */
    function payTask(uint256 _taskId) public virtual;

    /**
     * @notice 抽象函数，由子合约实现具体的任务取消逻辑
     * @param _taskId 任务ID
     */
    function cancelTask(uint256 _taskId) public virtual;

    /**
     * @notice 抽象函数，由子合约实现具体的添加工作者逻辑
     * @param _taskId 任务ID
     * @param _worker 工作者地址
     */
    function addWorker(
        uint256 _taskId,
        address _worker,
        uint256 _reward
    ) public virtual;

    /**
     * @notice 抽象函数，由子合约实现具体的移除工作者逻辑
     * @param _taskId 任务ID
     * @param _worker 工作者地址
     */
    function removeWorker(uint256 _taskId, address _worker) public virtual;

    /**
     * @notice 抽象函数，由子合约实现具体的纠纷提交逻辑
     * @param _taskId 任务ID
     * @param _worker 工作者地址
     * @param _taskCreator 任务创建者地址
     * @param _rewardAmount 奖励金额
     * @param _proofOfWork 工作量证明内容
     */
    function submitDispute(
        uint256 _taskId,
        address _worker,
        address _taskCreator,
        uint256 _rewardAmount,
        string memory _proofOfWork
    ) internal virtual;

    /**
     * @notice 抽象函数，由子合约实现，检查工作者是否符合特定任务类型的要求
     * @param _taskId 任务ID
     * @param _worker 工作者地址
     */
    function requireMeetsTaskRequirements(
        uint256 _taskId,
        address _worker
    ) public virtual;

    /**
     * @notice 更新平台费用
     * @param _newFee 新费用 (基点)
     */
    function updatePlatformFee(uint256 _newFee) public onlyOwner {
        if (_newFee > 1000) {
            revert FeeTooHigh(_newFee);
        }

        emit PlatformFeeUpdated(platformFee, _newFee);
        platformFee = _newFee;
    }

    /**
     * @notice 暂停合约（紧急情况下）
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @notice 恢复合约
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @notice 提取平台收入
     */
    function withdrawPlatformRevenue() public onlyOwner nonReentrant {
        if (totalPlatformRevenue == 0) {
            revert NoRevenueToWithdraw();
        }

        uint256 amount = totalPlatformRevenue;
        totalPlatformRevenue = 0;

        taskToken.safeTransfer(owner(), amount);
    }

    function changedeadline(uint256 _taskId, uint256 _deadline) public {
        Task storage task = tasks[_taskId];

        if (task.creator != msg.sender) {
            revert OnlyTaskCreator(msg.sender, _taskId);
        }
        if (task.deadline >= _deadline) {
            revert InvalidDeadline();
        }

        task.deadline = _deadline;
    }

    function increaseReward(uint256 _taskId, uint256 _reward) public {
        Task storage task = tasks[_taskId];

        if (task.creator != msg.sender) {
            revert OnlyTaskCreator(msg.sender, _taskId);
        }
        if (_reward == 0) {
            revert RewardMoreThanZero();
        }

        task.totalreward += _reward;

        taskToken.safeTransferFrom(msg.sender, address(this), _reward);
    }

    /**
     * @notice 获取任务详情
     * @param _taskId 任务ID
     * @return 任务结构体
     */
    function getTask(uint256 _taskId) public view returns (Task memory) {
        return tasks[_taskId];
    }
}
