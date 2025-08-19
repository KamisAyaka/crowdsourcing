// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "../BaseTask.sol";

/**
 * @title 一次性结清的任务合约
 * @notice 任务完成后一次性支付全部报酬的任务类型，适用于一对一结算场景
 * @dev 这是默认的支付方式，任务完成后支付全部报酬，只允许一个工作者参与
 */
contract FixedPaymentTask is BaseTask {
    using SafeERC20 for IERC20;

    // 存储任务的工作者地址（一对一任务）
    mapping(uint256 => address) public taskWorker;

    uint256 minTimeBeforeDispute = 3 days;

    // 自定义错误
    error FixedPaymentTask_OnlyWorkerCanSubmitProof();
    error FixedPaymentTask_TaskNotInProgress();
    error FixedPaymentTask_TaskDeadlinePassed();
    error FixedPaymentTask_ProofOfWorkEmpty();
    error FixedPaymentTask_ProofNotSubmitted();
    error FixedPaymentTask_TaskCannotBeCancelled();
    error FixedPaymentTask_TaskNotCompleted();
    error FixedPaymentTask_OnlyOneWorkerAllowed();
    error FixedPaymentTask_InvalidWorkerAddress();
    error FixedPaymentTask_NoWorkerAssigned();
    error FixedPaymentTask_TaskNotOpen(uint256 taskId);
    error FixedPaymentTask_NoProofOfWorkSubmitted();
    error FixedPaymentTask_ProofAlreadyApproved();

    // 自定义事件
    event FixedPaymentTask_TaskWorkerAdded(
        uint256 indexed taskId,
        address indexed worker
    );
    event FixedPaymentTask_TaskWorkerRemoved(
        uint256 indexed taskId,
        address indexed worker
    );
    event FixedPaymentTask_TaskCancelled(uint256 indexed taskId);
    event FixedPaymentTask_TaskPaid(
        uint256 indexed taskId,
        uint256 amount,
        uint256 platformFee
    );
    event FixedPaymentTask_ProofOfWorkSubmitted(
        uint256 indexed taskId,
        address indexed worker,
        string proof
    );
    event FixedPaymentTask_ProofOfWorkApproved(
        uint256 indexed taskId,
        address indexed worker
    );
    event FixedPaymentTask_DisputeFiledByWorker(
        uint256 indexed taskId,
        address indexed worker
    );

    event FixedPaymentTaskCreated(
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
            revert FixedPaymentTask_OnlyWorkerCanSubmitProof();
        }
        _;
    }

    /**
     * @notice modifier，检查任务是否处于进行中状态
     * @param _taskId 任务ID
     */
    modifier onlyTaskInProgress(uint256 _taskId) {
        if (tasks[_taskId].status != TaskStatus.InProgress) {
            revert FixedPaymentTask_TaskNotInProgress();
        }
        _;
    }

    modifier onlyTaskWorkerAddress(uint256 _taskId, address _worker) {
        if (taskWorker[_taskId] != _worker) {
            revert FixedPaymentTask_NoWorkerAssigned();
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
     * @notice 创建固定报酬任务
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
        newTask.totalreward = 0;
        newTask.description = _description;
        newTask.deadline = _deadline;
        newTask.status = TaskStatus.Open;
        newTask.createdAt = block.timestamp;

        emit FixedPaymentTaskCreated(
            taskCounter,
            msg.sender,
            _title,
            _deadline
        );
    }

    /**
     * @notice 添加工作者到任务中（一对一任务只允许一个工作者）
     * @param _taskId 任务ID
     * @param _worker 工作者地址
     */
    function addWorker(
        uint256 _taskId,
        address _worker,
        uint256 _reward
    ) public override onlyTaskCreator(_taskId) whenNotPaused {
        Task storage task = tasks[_taskId];

        if (task.status != TaskStatus.Open) {
            revert FixedPaymentTask_TaskNotOpen(_taskId);
        }

        if (_worker == address(0)) {
            revert FixedPaymentTask_InvalidWorkerAddress();
        }

        // 一次性结清任务只允许一个工作者
        if (taskWorker[_taskId] != address(0)) {
            revert FixedPaymentTask_OnlyOneWorkerAllowed();
        }

        taskWorker[_taskId] = _worker;
        task.totalreward = _reward;

        taskToken.safeTransferFrom(msg.sender, address(this), _reward);

        task.status = TaskStatus.InProgress;

        emit FixedPaymentTask_TaskWorkerAdded(_taskId, _worker);
    }

    /**
     * @notice 提交工作量证明
     * @param _taskId 任务ID
     * @param _proof 工作量证明内容
     */
    function submitProofOfWork(
        uint256 _taskId,
        string memory _proof
    )
        public
        override
        whenNotPaused
        onlyTaskWorker(_taskId)
        onlyTaskInProgress(_taskId)
    {
        Task storage task = tasks[_taskId];
        if (block.timestamp >= task.deadline) {
            revert FixedPaymentTask_TaskDeadlinePassed();
        }
        if (bytes(_proof).length == 0) {
            revert FixedPaymentTask_ProofOfWorkEmpty();
        }

        taskWorkProofs[_taskId][msg.sender] = ProofOfWork({
            proof: _proof,
            submitted: true,
            approved: false,
            submittedAt: block.timestamp
        });

        emit FixedPaymentTask_ProofOfWorkSubmitted(_taskId, msg.sender, _proof);
    }

    /**
     * @notice 验证工作量证明并检查工作者是否符合任务要求
     * @param _taskId 任务ID
     * @param _worker 工作者地址
     */
    function requireMeetsTaskRequirements(
        uint256 _taskId,
        address _worker
    )
        public
        override
        onlyTaskCreator(_taskId)
        whenNotPaused
        onlyTaskInProgress(_taskId)
        onlyTaskWorkerAddress(_taskId, _worker)
    {
        Task storage task = tasks[_taskId];

        ProofOfWork storage proof = taskWorkProofs[_taskId][_worker];
        if (!proof.submitted) {
            revert FixedPaymentTask_ProofNotSubmitted();
        }

        proof.approved = true;
        task.status = TaskStatus.Completed;

        emit FixedPaymentTask_ProofOfWorkApproved(_taskId, _worker);
    }

    /**
     * @notice 标记任务为完成,由于这是一次结算的任务，所以完成的逻辑放到验证工作量函数中了
     * @param _taskId 任务ID
     */
    function completeTask(uint256 _taskId) public override {}

    /**
     * @notice 支付任务奖励
     * @param _taskId 任务ID
     */
    function payTask(
        uint256 _taskId
    ) public override onlyTaskWorker(_taskId) whenNotPaused {
        Task storage task = tasks[_taskId];

        // 检查任务是否可以支付
        if (task.status != TaskStatus.Completed) {
            revert FixedPaymentTask_TaskNotCompleted();
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

        emit FixedPaymentTask_TaskPaid(_taskId, payment, fee);
    }

    /**
     * @notice 从任务中移除工作者
     * @param _taskId 任务ID
     * @param _worker 工作者地址
     */
    function removeWorker(
        uint256 _taskId,
        address _worker
    )
        public
        override
        onlyTaskCreator(_taskId)
        onlyTaskWorkerAddress(_taskId, _worker)
        whenNotPaused
    {
        Task storage task = tasks[_taskId];

        // 检查是否有工作量证明提交，如果有则可以提交纠纷
        ProofOfWork storage proof = taskWorkProofs[_taskId][_worker];
        if (proof.submitted) {
            // 如果工作者已经提交了工作量证明，则允许提交纠纷进行评判
            submitDispute(
                _taskId,
                _worker,
                task.creator,
                task.totalreward,
                proof.proof
            );
        }

        delete taskWorker[_taskId];
        task.status = TaskStatus.Open;

        emit FixedPaymentTask_TaskWorkerRemoved(_taskId, _worker);
    }

    /**
     * @notice 取消任务
     * @param _taskId 任务ID
     */
    function cancelTask(
        uint256 _taskId
    ) public override onlyTaskCreator(_taskId) {
        Task storage task = tasks[_taskId];

        if (
            task.status != TaskStatus.Open &&
            task.status != TaskStatus.InProgress
        ) {
            revert FixedPaymentTask_TaskCannotBeCancelled();
        }

        // 检查是否有工作者以及工作量证明，如果有则可以提交纠纷
        address worker = taskWorker[_taskId];
        ProofOfWork storage proof = taskWorkProofs[_taskId][worker];
        if (worker != address(0)) {
            if (proof.submitted) {
                // 如果工作者已经提交了工作量证明，则提交纠纷进行评判
                // 资金将在纠纷解决时分配，这里不需要进行补偿
                submitDispute(
                    _taskId,
                    worker,
                    task.creator,
                    task.totalreward,
                    proof.proof
                );

                // 提交纠纷后，直接将任务标记为取消，不进行其他资金操作
                task.status = TaskStatus.Cancelled;
                emit FixedPaymentTask_TaskCancelled(_taskId);
                return;
            }
        }

        // 在没有工作者或者工作者没有提交工作证明的情况下，资金直接退还给任务创建者
        if (worker == address(0) || !proof.submitted) {
            taskToken.safeTransfer(task.creator, task.totalreward);
        }

        task.status = TaskStatus.Cancelled;
        emit FixedPaymentTask_TaskCancelled(_taskId);
    }

    /**
     * @notice 允许工作者提交纠纷
     * @param _taskId 任务ID
     * @dev 只有任务的工作者可以调用此函数
     * @dev 只有在工作证明已提交但未被批准时才能调用
     * @dev 只有在工作证明提交一段时间后才能提交纠纷（防止过早提交）
     */
    function fileDisputeByWorker(
        uint256 _taskId
    ) public onlyTaskWorker(_taskId) onlyTaskInProgress(_taskId) whenNotPaused {
        Task storage task = tasks[_taskId];
        ProofOfWork storage proof = taskWorkProofs[_taskId][msg.sender];

        // 检查是否已提交工作证明
        if (!proof.submitted) {
            revert FixedPaymentTask_NoProofOfWorkSubmitted();
        }

        // 检查工作证明是否已被批准
        if (proof.approved) {
            revert FixedPaymentTask_ProofAlreadyApproved();
        }

        // 检查是否已经过了足够的时间（例如3天）工作者才能提交纠纷
        // 这给任务创建者一些时间来批准工作证明

        if (block.timestamp < proof.submittedAt + minTimeBeforeDispute) {
            revert FixedPaymentTask_TaskNotCompleted();
        }

        // 提交纠纷
        submitDispute(
            _taskId,
            msg.sender,
            task.creator,
            task.totalreward,
            proof.proof
        );

        emit FixedPaymentTask_DisputeFiledByWorker(_taskId, msg.sender);
    }

    /**
     * @notice 实现基础任务合约中的提交纠纷抽象函数
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
    ) internal override {
        // 批准纠纷解决合约转移所需的资金
        taskToken.safeIncreaseAllowance(
            address(disputeResolver),
            _rewardAmount
        );

        // 调用纠纷解决合约的fileDispute函数
        // 资金将从当前合约转移到纠纷解决合约中
        disputeResolver.fileDispute(
            address(this), // 任务合约地址
            _taskId, // 任务ID
            _worker, // 工作者地址
            _taskCreator, // 任务创建者地址
            _rewardAmount, // 奖励金额
            _proofOfWork // 工作量证明内容
        );

        tasks[_taskId].totalreward = 0;
    }
}
