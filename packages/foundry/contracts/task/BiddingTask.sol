// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "../BaseTask.sol";

/**
 * @title 竞价薪酬的任务合约
 * @notice 支持工作者竞价的任务类型，任务创建者可以选择最优报价
 * @dev 实现竞价机制，工作者可以提交报价，任务创建者选择中标者
 */
