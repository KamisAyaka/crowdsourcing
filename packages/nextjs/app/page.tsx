"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, ClipboardDocumentIcon, MagnifyingGlassIcon, WalletIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 w-full">
          <h1 className="text-center mb-8">
            <span className="block text-2xl mb-2">欢迎使用</span>
            <span className="block text-4xl font-bold">任务众包平台</span>
          </h1>

          <div className="flex justify-center items-center space-x-2 flex-col mb-8">
            <p className="my-2 font-medium">已连接地址:</p>
            <Address address={connectedAddress} />
          </div>

          <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 px-6 py-4 mb-8">
            <h2 className="text-2xl font-bold text-center mb-4">平台介绍</h2>
            <p className="text-center mb-6">
              这是一个基于区块链的去中心化任务众包平台，支持多种任务类型和支付方式。
              通过智能合约确保交易的安全性和透明性。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-base-200 p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-2">竞标任务</h3>
                <p className="text-sm">任务创建者发布任务，工作者可以提交竞标，创建者选择最优报价。</p>
              </div>
              <div className="bg-base-200 p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-2">固定薪酬任务</h3>
                <p className="text-sm">任务创建者直接指定工作者和固定报酬，任务完成后一次性支付。</p>
              </div>
              <div className="bg-base-200 p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-2">里程碑任务</h3>
                <p className="text-sm">任务可以分为多个阶段，每个阶段完成后支付相应报酬。</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-lg mb-6">请使用以下功能页面与平台进行交互:</p>
          </div>
        </div>

        <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <ClipboardDocumentIcon className="h-8 w-8 fill-secondary" />
              <p>
                使用{" "}
                <Link href="/tasks/fixed-payment" passHref className="link">
                  固定薪酬任务
                </Link>{" "}
                页面创建和管理固定薪酬任务。
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BugAntIcon className="h-8 w-8 fill-secondary" />
              <p>
                使用{" "}
                <Link href="/debug" passHref className="link">
                  调试合约
                </Link>{" "}
                页面与智能合约进行交互。
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p>
                使用{" "}
                <Link href="/blockexplorer" passHref className="link">
                  区块链浏览器
                </Link>{" "}
                浏览交易和地址信息。
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <WalletIcon className="h-8 w-8 fill-secondary" />
              <p>
                使用{" "}
                <Link href="/dispute" passHref className="link">
                  纠纷解决
                </Link>{" "}
                页面处理任务纠纷。
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
