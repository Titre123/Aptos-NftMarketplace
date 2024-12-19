import React, { useState, useEffect } from 'react';
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { message } from "antd";
import NFTCard from '../components/Nftcard';

interface NFT {
  id: number;
  name: string;
  description: string;
  owner: string;
  rarity: string;
  royalty: number;
  saleType: number;
  price: number;
  for_sale: boolean;
  imageUrl: string;
}

function UserNFTsPage() {
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null); // For listing
  const [selectedNFTForUpdate, setSelectedNFTForUpdate] = useState<NFT | null>(null); // For updating price
  const [saleType, setSaleType] = useState("1");
  const [listingPrice, setListingPrice] = useState<string>('');
  const [auctionEndDate, setAuctionEndDate] = useState<string>(''); // Store the end date/time string for auctions
  const [updatePrice, setUpdatePrice] = useState<string>('');

  const { account, signAndSubmitTransaction } = useWallet();
  const client = new AptosClient("https://fullnode.testnet.aptoslabs.com/v1");

  const fetchNft = async () => {
    try {
      const nftDetails = await client.view({
        "function": `${process.env.REACT_APP_MARKETPLACE_ADDRESS}::NFTMarketplace::get_all_nfts_for_owner`,
        "type_arguments": [],
        "arguments": [
          `${process.env.REACT_APP_MARKETPLACE_ADDRESS}`,
          `${account?.address || localStorage.getItem("address")}`,
          "10",
          "0"
        ]
      });

      const mappedNFTs = nftDetails.flat().map((nft: any) => {
        const { id, name, description, owner, rarity, royalty, sale_type, price, uri, for_sale } = nft;
        return { id, name, description, owner, rarity, royalty, saleType: sale_type, price: price / 100000000, imageUrl: uri, for_sale };
      });

      if (mappedNFTs.length > 0 && nftDetails.flat().length > 0) {
        console.log(mappedNFTs);
        setUserNFTs(mappedNFTs);
      }
    } catch (e) {
      console.error("Error fetching NFT details:", e);
      message.error("Failed to fetch NFTs.");
    }
  };

  useEffect(() => {
    const fetchNFTs = async () => {
      await fetchNft();
    };
    fetchNFTs();
  }, []);

  const handleListForSale = async () => {
    if (selectedNFT && listingPrice) {
      try {
        let auctionEndTimestamp = 0;

        if (saleType === "2" && auctionEndDate) {
          // Convert the user-selected end date/time to a UNIX timestamp in seconds
          const endTime = new Date(auctionEndDate).getTime();
          auctionEndTimestamp = Math.floor(endTime / 1000);
        }

        let formatted = parseFloat(listingPrice) * 100000000
        console.log(formatted)

        const entryFunctionPayload = {
          type: "entry_function_payload",
          function: `${process.env.REACT_APP_MARKETPLACE_ADDRESS}::NFTMarketplace::list_for_sale`,
          type_arguments: [],
          arguments: [
            process.env.REACT_APP_MARKETPLACE_ADDRESS,
            selectedNFT.id,
            formatted.toString(),
            saleType,
            auctionEndTimestamp
          ]
        };

        const txnResponse = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
        await client.waitForTransaction(txnResponse.hash);

        message.success("NFT listed successfully!");
        setUserNFTs(userNFTs.map(nft =>
          nft.id === selectedNFT.id ? { ...nft, price: parseFloat(listingPrice), for_sale: true, saleType: Number(saleType) } : nft
        ));
        setSelectedNFT(null);
        setListingPrice('');
        setSaleType("1");
        setAuctionEndDate('');
      } catch (error) {
        console.error("Error listing NFT for sale:", error);
        message.error("Failed to list NFT.");
      }
    }
  };

  const handleUpdatePrice = async () => {
    if (selectedNFTForUpdate && updatePrice) {
      try {
        let formatted = parseFloat(updatePrice) * 100000000
        const entryFunctionPayload = {
          type: "entry_function_payload",
          function: `${process.env.REACT_APP_MARKETPLACE_ADDRESS}::NFTMarketplace::set_price`,
          type_arguments: [],
          arguments: [
            process.env.REACT_APP_MARKETPLACE_ADDRESS,
            selectedNFTForUpdate.id,
            formatted.toString()
          ]
        };

        const txnResponse = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
        await client.waitForTransaction(txnResponse.hash);

        message.success("NFT price updated successfully!");
        setUserNFTs(userNFTs.map(nft =>
          nft.id === selectedNFTForUpdate.id ? { ...nft, price: parseFloat(updatePrice) } : nft
        ));
        setSelectedNFTForUpdate(null);
        setUpdatePrice('');
      } catch (error) {
        console.error("Error updating NFT price:", error);
        message.error("Failed to update NFT price.");
      }
    }
  };

  console.log(userNFTs);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My NFTs</h1>
      {userNFTs.flat().length === 0 ? (
        <div className="text-center mt-10">
          <p className="text-lg">You don't have any minted NFTs.</p>
          <button
            onClick={() => window.location.href = '/mint'}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Minting Page
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {userNFTs.map((nft) => (
            <div key={nft.id} className="relative">
              <NFTCard nft={nft} />
              {!nft.for_sale && (
                <button
                  className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white rounded text-sm"
                  onClick={() => setSelectedNFT(nft)}
                >
                  List for Sale
                </button>
              )}
              {nft.for_sale && (
                <button
                  className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white rounded text-sm"
                  onClick={() => setSelectedNFTForUpdate(nft)}
                >
                  Update Price
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal for listing NFT */}
      {selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">List NFT for Sale</h2>
            <input
              type="number"
              placeholder="Listing price"
              value={listingPrice}
              onChange={(e) => setListingPrice(e.target.value)}
              className="px-3 py-2 border rounded mb-2 w-full"
            />
            <select
              value={saleType}
              onChange={(e) => setSaleType(e.target.value)}
              className="px-3 py-2 border rounded mb-2 w-full"
            >
              <option value="1">Straight Sale</option>
              <option value="2">Auction</option>
            </select>
            {saleType === "2" && (
              <>
                <label className="block mb-1 text-sm">Auction End Date and Time</label>
                <input
                  type="datetime-local"
                  value={auctionEndDate}
                  onChange={(e) => setAuctionEndDate(e.target.value)}
                  className="px-3 py-2 border rounded mb-2 w-full"
                />
              </>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedNFT(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleListForSale}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                List for Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for updating NFT price */}
      {selectedNFTForUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Update NFT Price</h2>
            <input
              type="number"
              placeholder="New price"
              value={updatePrice}
              onChange={(e) => setUpdatePrice(e.target.value)}
              className="px-3 py-2 border rounded mb-2 w-full"
            />
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedNFTForUpdate(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePrice}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Update Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserNFTsPage;
