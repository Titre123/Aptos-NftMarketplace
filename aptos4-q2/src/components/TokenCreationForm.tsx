import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PinataSDK } from "pinata-web3";
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface Collection {
  name: string;
  description: string;
  uri: string;
  imageUrl?: string;
}

interface NFTCreationFormProps {
  existingCollection?: Collection | null;
  onBack: () => void;
  onSubmit: (collectionData: Collection, tokenData: any) => void;
}

const NFTCreationForm: React.FC<NFTCreationFormProps> = ({ existingCollection, onBack, onSubmit }) => {
  const [step, setStep] = useState<1 | 2>(existingCollection ? 2 : 1);
  
  // Collection states
  const [collectionName, setCollectionName] = useState(existingCollection?.name || '');
  const [collectionDescription, setCollectionDescription] = useState(existingCollection?.description || '');
  const [collectionImage, setCollectionImage] = useState<File | null>(null);
  const [collectionImagePreview, setCollectionImagePreview] = useState<string | null>(existingCollection?.uri || null);
  
  // Token states
  const [tokenName, setTokenName] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');
  const [tokenImage, setTokenImage] = useState<File | null>(null);
  const [tokenImagePreview, setTokenImagePreview] = useState<string | null>(null);
  const [rarity, setRarity] = useState('');
  const [royalty, setRoyalty] = useState('');

  const pinata = new PinataSDK({
    pinataJwt: process.env.REACT_APP_PINATA_JWT_KEY,
    pinataGateway: process.env.REACT_APP_PINATA_GATEWAY,
  });

  const uploadToPinata = async (file: File) => {
    const upload = await pinata.upload.file(file);
    return `https://violet-patient-squid-248.mypinata.cloud/ipfs/${upload.IpfsHash}`;
  }

  const onCollectionDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setCollectionImage(acceptedFiles[0]);
      setCollectionImagePreview(URL.createObjectURL(acceptedFiles[0]));
    }
  }, []);

  const onTokenDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setTokenImage(acceptedFiles[0]);
      setTokenImagePreview(URL.createObjectURL(acceptedFiles[0]));
    }
  }, []);

  const collectionDropzoneOptions: any = {
    onDrop: onCollectionDrop,
    accept: {
      'image/*': []
    },
    disabled: !!existingCollection
  };

  const tokenDropzoneOptions: any = {
    onDrop: onTokenDrop,
    accept: {
      'image/*': []
    }
  };

  const { getRootProps: getCollectionRootProps, getInputProps: getCollectionInputProps } = useDropzone(collectionDropzoneOptions);
  const { getRootProps: getTokenRootProps, getInputProps: getTokenInputProps } = useDropzone(tokenDropzoneOptions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      let collectionUri = existingCollection?.uri || '';
      let tokenUri = '';

      if (collectionImage) {
        collectionUri = await uploadToPinata(collectionImage);
      }

      if (tokenImage) {
        tokenUri = await uploadToPinata(tokenImage);
      }

      const collectionData: Collection = {
        name: collectionName,
        description: collectionDescription,
        uri: collectionUri,
        imageUrl: collectionImagePreview || undefined
      };

      const tokenData = {
        name: tokenName,
        description: tokenDescription,
        uri: tokenUri,
        rarity,
        royalty: parseFloat(royalty)
      };

      onSubmit(collectionData, tokenData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">
        {step === 1 ? 'Create New NFT Collection' : 'Add Token to Collection'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <>
            <div {...getCollectionRootProps()} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Collection Image
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {collectionImagePreview ? (
                      <img src={collectionImagePreview} alt="Collection Preview" className="w-32 h-32 object-cover mb-3" />
                    ) : (
                      <PhotoIcon className="w-12 h-12 text-gray-400 mb-3" />
                    )}
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  <input {...getCollectionInputProps()} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="collectionName" className="block text-sm font-medium text-gray-700">Collection Name</label>
              <input
                id="collectionName"
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="collectionDescription" className="block text-sm font-medium text-gray-700">Collection Description</label>
              <textarea
                id="collectionDescription"
                value={collectionDescription}
                onChange={(e) => setCollectionDescription(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div {...getTokenRootProps()} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Token Image
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {tokenImagePreview ? (
                      <img src={tokenImagePreview} alt="Token Preview" className="w-32 h-32 object-cover mb-3" />
                    ) : (
                      <PhotoIcon className="w-12 h-12 text-gray-400 mb-3" />
                    )}
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                  <input {...getTokenInputProps()} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="tokenName" className="block text-sm font-medium text-gray-700">Token Name</label>
              <input
                id="tokenName"
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="tokenDescription" className="block text-sm font-medium text-gray-700">Token Description</label>
              <textarea
                id="tokenDescription"
                value={tokenDescription}
                onChange={(e) => setTokenDescription(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="rarity" className="block text-sm font-medium text-gray-700">Rarity</label>
                <select
                  id="rarity"
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select rarity</option>
                  <option value="0">Common</option>
                  <option value="1">Uncommon</option>
                  <option value="2">Rare</option>
                  <option value="3">Epic</option>
                  <option value="4">Legendary</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="royalty" className="block text-sm font-medium text-gray-700">Royalty (%)</label>
                <input
                  id="royalty"
                  type="number"
                  min="0"
                  max="100"
                  value={royalty}
                  onChange={(e) => setRoyalty(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={step === 1 ? onBack : () => setStep(1)}
            className="px-4 py-2 border rounded-md hover:bg-gray-100"
          >
            {step === 1 ? 'Back' : 'Previous Step'}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {step === 1 ? 'Next Step' : 'Create NFT'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NFTCreationForm;

