import React, { useState } from 'react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface ActionPart {
  user: string;
  offer: number;
}

interface NFT {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  owner: string;
  rarity: string | number;
  royalty: number;
  saleType: number;
  price?: number;
  auction_duration?: number;
  action_part?: ActionPart[]; // Array of { user, offer }
}

interface NFTCardProps {
  nft: NFT;
}

function NFTCard({ nft }: NFTCardProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { account } = useWallet();

  const isOwner = nft.owner === (account?.address || localStorage.getItem("address")); // Replace with actual user ID check

  const getRarityText = (rarity: string | number): string => {
    if (typeof rarity === 'number') {
      switch (rarity) {
        case 0: return 'Common';
        case 1: return 'Uncommon';
        case 2: return 'Rare';
        case 3: return 'Epic';
        case 4: return 'Legendary';
        default: return 'Common';
      }
    }
    // If it's already a string, return as is
    return rarity;
  };

  // Rarity badge color mapping
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'bg-gray-300 text-gray-800';
      case 'uncommon': return 'bg-green-300 text-green-800';
      case 'rare': return 'bg-blue-300 text-blue-800';
      case 'epic': return 'bg-purple-300 text-purple-800';
      case 'legendary': return 'bg-orange-300 text-orange-800';
      default: return 'bg-gray-300 text-gray-800';
    }
  };

  const rarityText = getRarityText(nft.rarity);

  return (
    <div className="relative bg-white rounded-lg shadow-md overflow-hidden">
      {/* NFT Image */}
      <div className="relative">
        <img
          src={nft.imageUrl}
          alt={nft.name}
          className="w-full h-64 object-cover"
        />

        {/* Rarity Badge */}
        <span className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold ${getRarityColor(rarityText)}`}>
          {rarityText}
        </span>

        {/* Info Button */}
        <button
          onClick={() => setShowInfoModal(true)}
          className="absolute top-2 right-2 bg-white/70 p-2 rounded-full hover:bg-white/90 transition"
        >
          <InformationCircleIcon className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Price Section */}
      <div className="p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{nft.name}</h3>
          {nft.price && (
            <span className="text-xl font-bold text-green-600">
              {nft.price} APT
            </span>
          )}
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-4">{nft.name}</h2>
            <div className="space-y-2">
              <p><strong>Description:</strong> {nft.description}</p>
              <p><strong>Owner:</strong> {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}</p>
              <p><strong>Royalty:</strong> {nft.royalty}%</p>
              <p><strong>Sale Type:</strong> {nft.saleType === 1 ? 'Straight Sale' : 'Auction'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NFTCard;
