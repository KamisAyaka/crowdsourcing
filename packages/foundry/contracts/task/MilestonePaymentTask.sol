// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "../BaseTask.sol";

/**
 * @title 按里程碑付款的任务合约
 * @notice 支持按里程碑付款的任务类型，任务可以分为多个阶段，每个阶段完成后支付相应报酬
 * @dev 实现里程碑式付款机制，任务创建者可以定义多个付款里程碑
 */
