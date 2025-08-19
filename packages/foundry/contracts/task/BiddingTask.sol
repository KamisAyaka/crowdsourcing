// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "../BaseTask.sol";

/**
 * @title 竞价薪酬的任务合约
 * @notice 支持工作者竞价的任务类型，任务创建者可以选择最优报价
 * @dev 实现竞价机制，工作者可以提交报价，任务创建者选择中标者
 */
contract BiddingTask is BaseTask {
    using SafeERC20 for IERC20;

    // 竞标信息结构
    struct Bid {
        address bidder;         // 竞标者地址
        uint256 amount;         // 竞标金额
        string description;     // 竞标描述/提案
        uint256 timestamp;      // 竞标时间
        bool accepted;          // 是否被接受
    }

    // 存储任务的竞标信息
    mapping(uint256 => Bid[]) public taskBids;
    
    // 存储任务的中标者
    mapping(uint256 => address) public taskWorker;

    // 自定义错误
    error BiddingTask_OnlyTaskCreatorCanAcceptBid();
    error BiddingTask_InvalidBidIndex();
    error BiddingTask_BidAlreadyAccepted();
    error BiddingTask_TaskNotOpen();
    error BiddingTask_InvalidBidAmount();
    error BiddingTask_BidDescriptionEmpty();
    error BiddingTask_NoBidsSubmitted();
    error BiddingTask_OnlyWorkerCanSubmitProof();
    error BiddingTask_TaskNotInProgress();
    error BiddingTask_ProofOfWorkEmpty();
    error BiddingTask_ProofNotSubmitted();
    error BiddingTask_TaskCannotBeCancelled();
    error BiddingTask_TaskNotCompleted();
    error BiddingTask_InvalidWorkerAddress();
    error BiddingTask_TaskDeadlinePassed();
    error BiddingTask_ProofAlreadyApproved();
    error BiddingTask_DisputeTimeNotReached();
    error BiddingTask_NoProofOfWorkSubmitted();

    // 自定义事件
    event BiddingTask_BidSubmitted(
        uint256 indexed taskId,
        address indexed bidder,
        uint256 amount
    );
    
    event BiddingTask_BidAccepted(
        uint256 indexed taskId,
        address indexed bidder,
        uint256 amount
    );
    
    event BiddingTask_TaskWorkerAdded(
        uint256 indexed taskId,
        address indexed worker
    );
    
    event BiddingTask_TaskCancelled(uint256 indexed taskId);
    
    event BiddingTask_TaskPaid(
        uint256 indexed taskId,
        uint256 amount,
        uint256 platformFee
    );
    
    event BiddingTask_ProofOfWorkSubmitted(
        uint256 indexed taskId,
        address indexed worker,
        string proof
    );
    
    event BiddingTask_ProofOfWorkApproved(
        uint256 indexed taskId,
        address indexed worker
    );
    
    event BiddingTask_DisputeFiledByWorker(
        uint256 indexed taskId,
        address indexed worker
    );

    event BiddingTaskCreated(
        uint256 indexed taskId,
        address indexed creator,
        string title,
        uint256 deadline
    );

    /**
     * @notice modifier，检查调用者是否为任务的工作者
     * @param _taskId 任务ID
     */
    modifier onlyTaskWorker(uint256 _taskId) {
        if (taskWorker[_taskId] != msg.sender) {
            revert BiddingTask_OnlyWorkerCanSubmitProof();
        }
        _;
    }

    /**
     * @notice modifier，检查任务是否处于进行中状态
     * @param _taskId 任务ID
     */
    modifier onlyTaskInProgress(uint256 _taskId) {
        if (tasks[_taskId].status != TaskStatus.InProgress) {
            revert BiddingTask_TaskNotInProgress();
        }
        _;
    }

    modifier onlyTaskWorkerAddress(uint256 _taskId, address _worker) {
        if (taskWorker[_taskId] != _worker) {
            revert BiddingTask_InvalidWorkerAddress();
        }
        _;
    }

    /**
     * @notice 构造函数
     * @param _taskToken 平台代币地址
     * @param _disputeResolver 纠纷解决合约地址
     */
    constructor(
        IERC20 _taskToken,
        DisputeResolver _disputeResolver
    ) BaseTask(_taskToken, _disputeResolver) {}

    /**
     * @notice 创建竞价任务
     * @param _title 任务标题
     * @param _description 任务描述
     * @param _deadline 任务截止时间
     */
    function createTask(
        string memory _title,
        string memory _description,
        uint256 _deadline
    ) public override whenNotPaused {
        if (_deadline < block.timestamp) {
            revert InvalidDeadline();
        }

        taskCounter++;

        Task storage newTask = tasks[taskCounter];
        newTask.id = taskCounter;
        newTask.creator = payable(msg.sender);
        newTask.title = _title;
        newTask.totalreward = 0; // 竞价任务的报酬将在中标时确定
        newTask.description = _description;
        newTask.deadline = _deadline;
        newTask.status = TaskStatus.Open;
        newTask.createdAt = block.timestamp;

        emit BiddingTaskCreated(
            taskCounter,
            msg.sender,
            _title,
            _deadline
        );
    }

    /**
     * @notice 提交竞标
     * @param _taskId 任务ID
     * @param _amount 竞标金额
     * @param _description 竞标描述
     */
    function submitBid(
        uint256 _taskId,
        uint256 _amount,
        string memory _description
    ) public whenNotPaused {
        Task storage task = tasks[_taskId];

        // 检查任务是否开放竞标
        if (task.status != TaskStatus.Open) {
            revert BiddingTask_TaskNotOpen();
        }

        // 检查竞标金额是否有效
        if (_amount == 0) {
            revert BiddingTask_InvalidBidAmount();
        }

        // 检查竞标描述是否为空
        if (bytes(_description).length == 0) {
            revert BiddingTask_BidDescriptionEmpty();
        }

        // 检查竞标者是否已经是任务工作者
        if (taskWorker[_taskId] == msg.sender) {
            revert BiddingTask_BidAlreadyAccepted();
        }

        // 创建新的竞标
        taskBids[_taskId].push(Bid({
            bidder: msg.sender,
            amount: _amount,
            description: _description,
            timestamp: block.timestamp,
            accepted: false
        }));

        // 转移竞标保证金到合约
        taskToken.safeTransferFrom(msg.sender, address(this), _amount);

        emit BiddingTask_BidSubmitted(_taskId, msg.sender, _amount);
    }

    /**
     * @notice 任务创建者接受竞标
     * @param _taskId 任务ID
     * @param _bidIndex 竞标索引
     */
    function acceptBid(
        uint256 _taskId,
        uint256 _bidIndex
    ) public onlyTaskCreator(_taskId) whenNotPaused {
        Task storage task = tasks[_taskId];
        
        // 检查任务是否开放
        if (task.status != TaskStatus.Open) {
            revert BiddingTask_TaskNotOpen();
        }

        // 检查竞标索引是否有效
        if (_bidIndex >= taskBids[_taskId].length) {
            revert BiddingTask_InvalidBidIndex();
        }

        Bid storage bid = taskBids[_taskId][_bidIndex];

        // 检查竞标是否已经被接受
        if (bid.accepted) {
            revert BiddingTask_BidAlreadyAccepted();
        }

        // 标记竞标为已接受
        bid.accepted = true;
        
        // 设置任务工作者
        taskWorker[_taskId] = bid.bidder;
        
        // 设置任务报酬
        task.totalreward = bid.amount;
        
        // 更新任务状态为进行中
        task.status = TaskStatus.InProgress;

        emit BiddingTask_BidAccepted(_taskId, bid.bidder, bid.amount);
        emit BiddingTask_TaskWorkerAdded(_taskId, bid.bidder);
    }

    /**
     * @notice 添加工作者到任务中（在竞标任务中，由接受竞标触发）
     * @param _taskId 任务ID
     * @param _worker 工作者地址
     * @param _reward 任务报酬
     */
    function addWorker(
        uint256 _taskId,
        address _worker,
        uint256 _reward
    ) public override onlyTaskCreator(_taskId) whenNotPaused {
        // 在竞价任务中，工作者添加由acceptBid函数处理
        // 这里保留函数以满足BaseTask合约要求
        revert("Use acceptBid function instead");
    }

    /**
     * @notice 终止任务
     * @param _taskId 任务ID
     */
    function terminateTask(
        uint256 _taskId
    ) public override onlyTaskCreator(_taskId) whenNotPaused {
        Task storage task = tasks[_taskId];

        // 检查任务状态是否允许终止
        if (
            task.status != TaskStatus.Open &&
            task.status != TaskStatus.InProgress
        ) {
            revert BiddingTask_TaskCannotBeCancelled();
        }

        if (task.status == TaskStatus.InProgress) {
            // 获取当前分配的工作者
            address worker = taskWorker[_taskId];

            // 检查是否有工作量证明提交，如果有则可以提交纠纷
            // 这里简化处理，实际可能需要更复杂的逻辑
            if (task.totalreward > 0) {
                taskToken.safeTransfer(task.creator, task.totalreward);
                task.totalreward = 0;
            }
        } else if (task.status == TaskStatus.Open) {
            // 如果任务还未分配，退还所有竞标保证金
            Bid[] storage bids = taskBids[_taskId];
            for (uint i = 0; i < bids.length; i++) {
                if (!bids[i].accepted && bids[i].amount > 0) {
                    taskToken.safeTransfer(bids[i].bidder, bids[i].amount);
                    bids[i].amount = 0;
                }
            }
        }

        // 清理任务工作者并更新状态
        task.status = TaskStatus.Cancelled;
        emit BiddingTask_TaskCancelled(_taskId);
    }

    /**
     * @notice 提交工作量证明
     * @param _taskId 任务ID
     * @param _proof 工作量证明内容
     */
    function submitProofOfWork(
        uint256 _taskId,
        string memory _proof
    ) public whenNotPaused onlyTaskWorker(_taskId) onlyTaskInProgress(_taskId) {
        Task storage task = tasks[_taskId];
        if (block.timestamp >= task.deadline) {
            revert BiddingTask_TaskDeadlinePassed();
        }
        if (bytes(_proof).length == 0) {
            revert BiddingTask_ProofOfWorkEmpty();
        }

        // 检查工作量证明是否已经批准
        // 注意：这里简化处理，实际应该有更完整的ProofOfWork结构
        if (task.status == TaskStatus.Completed) {
            revert BiddingTask_ProofAlreadyApproved();
        }

        // 在实际实现中，应该存储工作量证明
        // 这里为了简化，我们直接更新任务状态
        
        task.status = TaskStatus.Completed;

        emit BiddingTask_ProofOfWorkSubmitted(_taskId, msg.sender, _proof);
    }

    /**
     * @notice 验证工作量证明并检查工作者是否符合任务要求
     * @param _taskId 任务ID
     * @param _worker 工作者地址
     */
    function approveProofOfWork(
        uint256 _taskId,
        address _worker
    )
        public
        onlyTaskCreator(_taskId)
        whenNotPaused
        onlyTaskInProgress(_taskId)
        onlyTaskWorkerAddress(_taskId, _worker)
    {
        Task storage task = tasks[_taskId];

        // 检查是否已提交工作量证明（简化检查）
        if (task.status != TaskStatus.Completed) {
            revert BiddingTask_ProofNotSubmitted();
        }

        task.status = TaskStatus.Completed;

        emit BiddingTask_ProofOfWorkApproved(_taskId, _worker);
    }

    /**
     * @notice 支付任务奖励
     * @param _taskId 任务ID
     */
    function payTask(
        uint256 _taskId
    ) public onlyTaskWorker(_taskId) whenNotPaused {
        Task storage task = tasks[_taskId];

        // 检查任务是否可以支付
        if (task.status != TaskStatus.Completed) {
            revert BiddingTask_TaskNotCompleted();
        }

        // 计算平台费用
        uint256 fee = (task.totalreward * platformFee) / 10000;
        uint256 payment = task.totalreward - fee;

        // 更新平台总收入
        totalPlatformRevenue += fee;

        // 支付给工作者
        address worker = taskWorker[_taskId];
        taskToken.safeTransfer(worker, payment);

        // 更新任务状态
        task.status = TaskStatus.Paid;

        emit BiddingTask_TaskPaid(_taskId, payment, fee);
    }

    /**
     * @notice 获取任务的竞标数量
     * @param _taskId 任务ID
     * @return 竞标数量
     */
    function getBidCount(uint256 _taskId) public view returns (uint256) {
        return taskBids[_taskId].length;
    }

    /**
     * @notice 获取特定竞标信息
     * @param _taskId 任务ID
     * @param _bidIndex 竞标索引
     * @return 竞标信息
     */
    function getBid(uint256 _taskId, uint256 _bidIndex) public view returns (Bid memory) {
        if (_bidIndex >= taskBids[_taskId].length) {
            revert BiddingTask_InvalidBidIndex();
        }
        return taskBids[_taskId][_bidIndex];
    }
}