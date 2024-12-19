import React, { useEffect, useState } from "react";
import { Typography, Dropdown, message } from "antd";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { AptosClient } from "aptos";
import { ChevronDownIcon, ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline';
import { Link } from "react-router-dom";

const { Text } = Typography;

const client = new AptosClient("https://fullnode.testnet.aptoslabs.com/v1");

const NavBar = () => {
  const { connected, account, network, disconnect } = useWallet();
  const [balance, setBalance] = useState<Number | null>(0);

  useEffect(() => {
    const fetchBalance = async () => {
      if (account) {
        try {
          const resources = await client.getAccountResources(account.address);
          const accountResource = resources.find(
            (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
          );
          if (accountResource) {
            const balanceValue = (accountResource.data as any).coin.value;
            setBalance(balanceValue ? parseInt(balanceValue) / 100000000 : 0);
          } else {
            setBalance(0);
          }
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
    };

    if (connected) {
      localStorage.setItem("address", `${account?.address}`);
      fetchBalance();
      initializeAccount(); // Removed await to avoid returning a Promise
    }
  }, [account, connected])

  const handleLogout = async () => {
    try {
      await disconnect();
      setBalance(null);
      message.success("Disconnected from wallet");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      message.error("Failed to disconnect from wallet");
    }
  };
  
  const initializeAccount = async () => {
    const entryFunctionPayload = {
      type: "entry_function_payload",
      function: `${process.env.REACT_APP_MARKETPLACE_ADDRESS}::NFTMarketplace::initialize_account`,
      type_arguments: [],
      arguments: []
    };

    const txnResponse = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
    await client.waitForTransaction(txnResponse.hash);
  }

  const menu = (
    <div className="bg-white rounded-md shadow-lg py-2 w-64">
      <div className="px-4 py-2">
        <Text strong className="block mb-1">Address:</Text>
        <Text copyable className="text-sm break-all">{account?.address}</Text>
      </div>
      <div className="px-4 py-2">
        <Text strong className="block mb-1">Network:</Text>
        <span className="text-sm">{network ? network.name : "Unknown"}</span>
      </div>
      <div className="px-4 py-2">
        <Text strong className="block mb-1">Balance:</Text>
        <span className="text-sm">{balance !== null ? `${balance} APT` : "Loading..."}</span>
      </div>
      <div className="border-t border-gray-200 mt-2"></div>
      <button
        onClick={handleLogout}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
      >
        <ArrowRightEndOnRectangleIcon className="h-5 w-5 mr-2" />
        Log Out
      </button>
    </div>
  );

  return (
    <nav className="bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <img src="/Aptos_Primary_WHT.png" alt="Aptos Logo" className="h-8 w-auto mr-4" />
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Marketplace
                </Link>
                <Link to="/my-nfts" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  My Collection
                </Link>
                <Link to="/mint" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Mint NFT
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            {connected && account ? (
              <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
                <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-flex items-center">
                  <span>Connected</span>
                  <ChevronDownIcon className="h-5 w-5 ml-2" />
                </button>
              </Dropdown>
            ) : (
              <WalletSelector />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;

