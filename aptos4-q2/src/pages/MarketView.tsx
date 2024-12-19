import React, { useState, useEffect } from 'react';
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { message, Modal, Table } from "antd";
import NFTCard from '../components/Nftcard';

interface ActionPart {
  user: string;
  offer: number;
}

interface ListedNFT {
  id: number;
  name: string;
  description: string;
  owner: string;
  price: number;
  rarity: string;
  royalty: number;
  auction_duration: number;
  action_part: ActionPart[]; // Array of { user, offer }
  saleType: number; // 1 for straight sale, 2 for auction (adjust as per your contract)
  imageUrl: string;
}

function MarketplacePage() {
  const [nfts, setNfts] = useState<ListedNFT[]>([]);
  const { account } = useWallet();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [selectedNFTForOffers, setSelectedNFTForOffers] = useState<ListedNFT | null>(null);

  const client = new AptosClient("https://fullnode.testnet.aptoslabs.com/v1");
  const marketplaceAddr = process.env.REACT_APP_MARKETPLACE_ADDRESS; // set this in your env
  const limit = 50;
  const offset = 0;

  // Fetch NFTs from on-chain view function
  const fetchNFTs = async () => {
    try {
      const result = await client.view({
        function: `${marketplaceAddr}::NFTMarketplace::get_all_nfts_for_sale`,
        arguments: [marketplaceAddr, limit.toString(), offset.toString()],
        type_arguments: [],
      });

      // Result should be an array of ListedNFT from the contract
      const listedNfts: ListedNFT[] = result.flat().map((nft: any) => ({
        ...nft,
        // Ensure fields are properly typed
        id: Number(nft.id),
        price: Number(nft.price) / 100000000, // Corrected division
        royalty: Number(nft.royalty),
        auction_duration: Number(nft.auction_duration),
        action_part: nft.action_part.map((ap: any) => ({
          user: ap.user,
          offer: Number(ap.offer)
        })),
        saleType: nft.sale_type || 1,
        imageUrl: nft.uri || 'https://via.placeholder.com/150' // Fallback image
      }));

      setNfts(listedNfts);
    } catch (e) {
      console.error("Error fetching NFTs:", e);
      message.error("Failed to fetch NFTs.");
    }
  };

  useEffect(() => {
    fetchNFTs();
    const interval = setInterval(() => {
      // Update state to trigger re-render for countdowns
      setNfts((prevNfts) => [...prevNfts]);
    }, 1000); // Update every second for countdown
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePurchase = async (nft: ListedNFT) => {
    try {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::purchase_nft`,
        type_arguments: [],
        arguments: [
          marketplaceAddr,
          nft.id,
          (nft.price * 100000000).toString()
        ]
      };
      const txnResponse = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(txnResponse.hash);
      message.success("NFT purchased successfully!");
      // Refresh after purchase
      fetchNFTs();
    } catch (error) {
      console.error("Error purchasing NFT:", error);
      message.error("Failed to purchase NFT.");
    }
  };

  const handleMakeOffer = async (nft: ListedNFT, offerAmount: number) => {
    try {
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${marketplaceAddr}::NFTMarketplace::make_offer`,
        type_arguments: [],
        arguments: [
          marketplaceAddr,
          nft.id,
          (offerAmount * 100000000).toString()
        ]
      };

      const txnResponse = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(txnResponse.hash);

      message.success("Offer made successfully!");
      // Refresh after making offer
      fetchNFTs();
    } catch (error) {
      console.error("Error making offer:", error);
      message.error("Failed to make offer.");
    }
  };

  // Filter and sort NFTs
  const filteredNFTs = nfts.filter((nft) =>
    nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nft.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    if (sortBy === 'royalty') return b.royalty - a.royalty;
    if (sortBy === 'price') return a.price - b.price;
    return 0;
  });

  const getAuctionCountdown = (endTimestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = endTimestamp - now;
    if (diff <= 0) return "Auction ended";
    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    return `${hours}h ${mins}m ${secs}s remaining`;
  };

  const showOffersModal = (nft: ListedNFT) => {
    setSelectedNFTForOffers(nft);
    setOfferModalVisible(true);
  };

  const handleModalClose = () => {
    setOfferModalVisible(false);
    setSelectedNFTForOffers(null);
  };

  // Modal columns for offers
  const offerColumns = [
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (user: string) => (
        <span>{user.slice(0,6)}...{user.slice(-4)}</span>
      )
    },
    {
      title: 'Offer (APT)',
      dataIndex: 'offer',
      key: 'offer',
      render: (offer: number) => (offer / 100000000)
    }
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">NFT Marketplace</h1>
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search NFTs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border rounded"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="">Sort by</option>
          <option value="royalty">Royalty</option>
          <option value="price">Price</option>
        </select>
      </div>

      {sortedNFTs.length === 0 ? (
        <div className="text-center mt-10">
          <p className="text-lg">No NFTs are currently listed for sale.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedNFTs.map((nft) => (
            <div key={nft.id} className="border p-4 rounded shadow relative">
              <NFTCard nft={nft} />
              {(account?.address || localStorage.getItem("address")) !== nft.owner && (
                <div className="mt-2">
                  {nft.saleType === 2 ? (
                    <>
                      {/* Auction */}
                      <div className="text-sm text-gray-600">
                        {getAuctionCountdown(nft.auction_duration)}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="number"
                          placeholder="Your offer"
                          className="border px-2 py-1 rounded w-1/2"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const value = parseFloat((e.target as HTMLInputElement).value);
                              if (!isNaN(value)) handleMakeOffer(nft, value);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const inputValue = parseFloat((document.querySelector('input[type="number"]') as HTMLInputElement).value);
                            if (!isNaN(inputValue)) handleMakeOffer(nft, inputValue);
                          }}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          Make Offer
                        </button>
                      </div>
                      {nft.action_part && nft.action_part.length > 0 && (
                        <button
                          onClick={() => showOffersModal(nft)}
                          className="mt-2 bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
                        >
                          View Offers
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Straight Sale */}
                      <div className="text-sm text-gray-600">
                        Price: {nft.price} APT
                      </div>
                      <button
                        onClick={() => handlePurchase(nft)}
                        className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      >
                        Purchase
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        title="Offers"
        visible={offerModalVisible}
        onCancel={handleModalClose}
        footer={null}
      >
        {selectedNFTForOffers && selectedNFTForOffers.action_part && selectedNFTForOffers.action_part.length > 0 ? (
          <Table
            columns={offerColumns}
            dataSource={selectedNFTForOffers.action_part.map((ap, idx) => ({ ...ap, key: idx }))}
            pagination={false}
          />
        ) : (
          <p>No offers available for this NFT.</p>
        )}
      </Modal>
    </div>
  );
}

export default MarketplacePage;
