declare global {
  interface Window {
    ethereum: any;
  }
}

// pages/ProposeTransaction.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Contract, ethers } from 'ethers';


import { createWeb3Modal, defaultConfig, useWeb3ModalProvider } from '@web3modal/ethers/react'

// 1. Get projectId
const projectId = '406598dd2c21a5c4ffcbb4f7ec212c42'

// 2. Set chains
const gnosis = {
  chainId: 100,
  name: 'Gnosis',
  currency: 'xDAI',
  explorerUrl: 'https://gnosisscan.io',
  rpcUrl: 'https://rpc.ankr.com/gnosis'
}

const mainnet = {
  chainId: 1,
  name: 'Ethereum Mainnet',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://rpc.ankr.com/eth'
}

// 3. Create a metadata object
const metadata = {
  name: 'Curate Admin Panel',
  description: 'An interface for managing Kleros LCurate registries',
  url: 'https://curate-admin.vercel.app', // origin must match your domain & subdomain
  icons: ['https://avatars.mywebsite.com/']
}

// 4. Create Ethers config
const ethersConfig = defaultConfig({
  /*Required*/
  metadata,

  /*Optional*/
  enableEIP6963: true, // true by default
  enableInjected: true, // true by default
  enableCoinbase: true, // true by default
  rpcUrl: '...', // used for the Coinbase SDK
  defaultChainId: 1, // used for the Coinbase SDK
})
// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: [gnosis, mainnet],
  projectId,
  enableAnalytics: true // Optional - defaults to your Cloud configuration
})

const globalStyle = {
  fontFamily: '"Inter", sans-serif',
  backgroundColor: '#2a0a4a', // Dark purple background
};

// Assuming this is the shape of your ABI items for functions
interface AbiItem {
  name: string;
  type: string;
  stateMutability?: string;
  constant?: boolean;
  inputs: Array<{
    name: string;
    type: string;
  }>;
}

interface QueryResponse {
  data: any;  // Allows any structure for the data
  errors?: any[];  // Optionally include errors, assuming they are provided in an array
}
const seanceStyle: React.CSSProperties = {
  color: 'transparent',
  animation: 'hue 10s infinite linear',
  backgroundClip: 'text',
  backgroundImage: 'linear-gradient(45deg, #9a70ab, #c7a4cf)', // Lighter purple gradient for the text
  fontWeight: 'bold',
  textAlign: 'center',
  fontSize: '8rem',
};

const headingStyle: React.CSSProperties = {
  backgroundClip: 'text',
  color: 'transparent',
  backgroundImage: 'linear-gradient(330.4deg, #b39ddb 4.54%, #d1c4e9 59.2%, #e1bee7 148.85%)', // Another lighter purple gradient for the text
};

interface FormParameters {
  [key: string]: string;
}

const ProposeTransaction = () => {
  const [contractAddress, setContractAddress] = useState('');

  const [abi, setAbi] = useState<AbiItem[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<AbiItem | null>(null);
  const [parameters, setParameters] = useState<FormParameters>({});

  const [file, setFile] = React.useState<File | null>(null);
  const [ipfsPath, setIpfsPath] = useState(''); // State to hold the IPFS path after uploading

  const [isEditing, setIsEditing] = useState(false);
  const [editableAddress, setEditableAddress] = useState('');
  const rpcEndpoint = 'https://rpc.ankr.com/gnosis'; // Change this to your RPC URL

  const { walletProvider } = useWeb3ModalProvider()
  //const { open } = useWeb3Modal()

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const address = queryParams.get('lregistry') || '0x4577BE6550e7eb4b074bDAcbE4dd44c9245a9bF3'.toLowerCase();
    setContractAddress(address);
    setEditableAddress(address); // Initialize editableAddress with the fetched address
  }, []);

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditableAddress(event.target.value);
  };
  const handleAddressBlur = () => {
    setContractAddress(editableAddress);
    const newUrl = `${window.location.origin}${window.location.pathname}?lregistry=${editableAddress.toLowerCase()}`;
    window.location.href = newUrl;
  };


  useEffect(() => {
    // Fetch the ABI from the public folder
    fetch('/contractABI.json')
      .then((res) => res.json())
      .then((data: AbiItem[]) => setAbi(data)) // Cast the response to the AbiItem[]
      .catch(console.error);
  }, []);

  const fetchDataFromContract = async (functionName: string, args = []) => {
    const provider = new ethers.JsonRpcProvider(rpcEndpoint);
    const contract = new ethers.Contract(contractAddress, abi, provider);

    try {
      const data = await contract[functionName](...args);
      return data;
    } catch (error) {
      console.error(`Error fetching data from ${functionName}:`, error);
      return null;
    }
  };

  useEffect(() => {
    if (selectedFunction?.name === 'changeArbitrationParams') {
      // Fetch arbitrator extra data
      fetchDataFromContract('arbitratorExtraData').then(arbitratorExtraData => {
        if (arbitratorExtraData) {
          setParameters(prevParams => ({
            ...prevParams,
            _arbitratorExtraData: arbitratorExtraData,
          }));
        }
      }).catch(console.error);

      // Continue to fetch other necessary data
      fetchKlerosData(`{
        lregistry(id:"${contractAddress.toLowerCase()}"){
          registrationMetaEvidence{URI}
          clearingMetaEvidence{URI}
        }
      }`).then((response) => {
        const { data } = response;
        if (data && data.lregistry) {
          setParameters(prevParams => ({
            ...prevParams,
            _registrationMetaEvidence: data.lregistry.registrationMetaEvidence.URI,
            _arbitrator: "0x9c1da9a04925bdfdedf0f6421bc7eea8305f9002",
            _clearingMetaEvidence: data.lregistry.clearingMetaEvidence.URI,
          }));
        }
      }).catch(console.error);
    }
  }, [selectedFunction, contractAddress]); // Added contractAddress as a dependency


  const handleFunctionChange = (functionName: string) => {
    const func = abi.find((f) => f.name === functionName) || null;
    setSelectedFunction(func);
    setParameters({});
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, paramName: string) => {
    const { value } = event.target;
    setParameters((prev) => ({ ...prev, [paramName]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFunction) {
      console.error('No function selected');
      return;
    }
    if (!window.ethereum) {
      throw new Error("Ethereum provider not found!");
    }


    if (!walletProvider) {
      console.error("Ethereum provider not found!");
      return; // Optionally, you could display a user-friendly error message here.
    }

    // Initialize the provider with the user's Ethereum provider
    const ethersProvider = new ethers.BrowserProvider(walletProvider);

    // Get the signer from the provider
    const signer = await ethersProvider.getSigner();
    console.log(signer)
    const contract = new Contract(contractAddress, abi, signer);

    // Prepare the parameters for the function call
    const functionArgs = selectedFunction.inputs.map(input => parameters[input.name]);

    try {
      // Send a transaction to execute the selected function with the provided arguments
      const transactionResponse = await contract[selectedFunction.name](...functionArgs);
      console.log('Transaction submitted:', transactionResponse);

      // Wait for the transaction to be mined
      const receipt = await transactionResponse.wait();
      console.log('Transaction confirmed:', receipt);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };


  async function fetchKlerosData(query: string): Promise<QueryResponse> {
    const response = await fetch('https://api.thegraph.com/subgraphs/name/kleros/legacy-curate-xdai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  const postJSONtoKlerosIPFS = async (buffer: ArrayBuffer) => {
    const final_dict = {
      "fileName": "new.pdf",
      // Directly use the buffer array without converting it to JSON first
      "buffer": { "type": "Buffer", "data": Array.from(new Uint8Array(buffer)) }
    };

    const response = await fetch("https://ipfs.kleros.io/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(final_dict)
    });

    if (response.ok) {
      const data = await response.json();
      console.log("/ipfs/" + data.data[0].hash)
      return "/ipfs/" + data.data[0].hash;
    } else {
      throw new Error("Failed to upload to IPFS");
    }
  };

  const uploadToIPFS = async (data: Uint8Array, fileName: string) => {
    const payload = {
      fileName,
      buffer: { "type": "Buffer", "data": Array.from(data) },
    };

    const response = await fetch("https://ipfs.kleros.io/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log("/ipfs/" + responseData.data[0].hash);
      return "/ipfs/" + responseData.data[0].hash;
    } else {
      throw new Error("Failed to upload to IPFS");
    }
  };

  const handleMetaEvidenceFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      console.log("No file selected.");
      return;
    }

    const selectedFile = event.target.files[0];
    setFile(selectedFile);

    if (selectedFile.type !== "application/pdf") {
      console.error("File is not a PDF.");
      return;
    }

    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(selectedFile);
    fileReader.onload = async (e: ProgressEvent<FileReader>) => {
      const arrayBuffer = e.target?.result;
      if (arrayBuffer instanceof ArrayBuffer) {
        try {
          // Upload the PDF to IPFS
          const binaryData = new Uint8Array(arrayBuffer);
          const ipfsResultPath = await uploadToIPFS(binaryData, 'policy.pdf');
          setIpfsPath(ipfsResultPath);
          console.log('File uploaded to IPFS at:', ipfsResultPath);

          const updateAndUploadMetaEvidence = async (metaEvidenceUri: string) => {
            const metaEvidenceRes = await fetch("https://ipfs.kleros.io" + metaEvidenceUri);
            const metaEvidenceJson = await metaEvidenceRes.json();
            metaEvidenceJson.fileURI = ipfsResultPath;
            const jsonStr = JSON.stringify(metaEvidenceJson);
            const jsonData = new TextEncoder().encode(jsonStr);
            return await uploadToIPFS(jsonData, "metaevidence.json");
          };

          interface MetaEvidenceParameters {
            _clearingMetaEvidence?: string;
            _registrationMetaEvidence?: string;
          }
          const metaEvidencesToUpdate: MetaEvidenceParameters = {};
          if (selectedFunction && selectedFunction.inputs.some(input => input.name === '_clearingMetaEvidence')) {
            const clearingMetaEvidencePath = await updateAndUploadMetaEvidence(parameters['_clearingMetaEvidence']!);
            metaEvidencesToUpdate['_clearingMetaEvidence'] = clearingMetaEvidencePath;
          }
          if (selectedFunction && selectedFunction.inputs.some(input => input.name === '_registrationMetaEvidence')) {
            const registrationMetaEvidencePath = await updateAndUploadMetaEvidence(parameters['_registrationMetaEvidence']!);
            metaEvidencesToUpdate['_registrationMetaEvidence'] = registrationMetaEvidencePath;
          }

          // Update parameters with new IPFS hashes
          setParameters(prevParams => ({
            ...prevParams,
            ...metaEvidencesToUpdate
          }));

          console.log('MetaEvidence updated and uploaded to IPFS:', metaEvidencesToUpdate);
        } catch (error) {
          console.error('Error uploading file to IPFS or updating MetaEvidence:', error);
        }
      }
    };

    fileReader.onerror = (e) => {
      console.error('FileReader error:', e);
    };
  };



  interface TooltipProps {
    children: React.ReactNode; // Assuming children is some react content
    text: string; // Assuming text is a string
  }

  const Tooltip: React.FC<TooltipProps> = ({ children, text }) => {
    const [isTooltipVisible, setTooltipVisible] = useState(false);

    return (
      <span className="relative inline group">
        <span
          onMouseEnter={() => setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
          className="cursor-pointer"
        >
          {children}
        </span>
        {isTooltipVisible && (
          <div className="absolute bottom-0 flex-col items-center hidden mb-6 group-hover:flex">
            <span className="relative z-10 p-2 text-xs leading-none text-white whitespace-no-wrap bg-black shadow-lg rounded-md">
              {text}
            </span>
            <div className="w-3 h-3 -mt-2 rotate-45 bg-black"></div>
          </div>
        )}
      </span>
    );
  };

  return (
    <div style={globalStyle} className="min-h-screen flex flex-col justify-center items-center px-4 bg-blue-50">
      <h2 style={seanceStyle} className="mb-8 text-center">
        Curate Admin Panel
      </h2>
      {isEditing ? (
        <div>
          <h3 style={headingStyle} className="text-2xl font-bold mb-8 text-center">Change address to:
            <input
              type="text"
              value={editableAddress}
              onChange={handleAddressChange}
              onBlur={handleAddressBlur}
              className="contract-address-input"
              autoFocus
              style={{ color: 'darkgrey' }}  // Inline style for text color
            /></h3>
        </div>
      ) : (
        <h2 style={headingStyle} className="text-2xl font-bold mb-8 text-center" onClick={() => setIsEditing(true)}>
          Update or submit data to {`${contractAddress.slice(0, 7)}...${contractAddress.slice(-4)}`}
        </h2>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white shadow-2xl border-1.5 border-blue-200 rounded-xl p-8 space-y-6">

        <div>
          <Tooltip text={`Retrieved from ABI record of the root (sub)DNS`}>
            <label htmlFor="function" className="block text-sm font-semibold text-gray-600">Function</label>
          </Tooltip>
          <select
            id="function"
            value={selectedFunction?.name || ''}
            onChange={(e) => handleFunctionChange(e.target.value)}
            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500 py-2 px-2"
          >
            <option value="">Select Function</option>
            {abi.filter((item) =>
              item.type === 'function' &&
              item.stateMutability !== 'view' &&
              item.stateMutability !== 'pure' &&
              !item.constant // Exclude constant functions, which are typically 'view' or 'pure'
            ).map((func) => (
              <option key={func.name} value={func.name}>{func.name}</option>
            ))}
          </select>
        </div>
        {selectedFunction && selectedFunction.inputs.map((input, index) => (
          <div key={index} className="ml-4">
            <label
              htmlFor={`param-${index}`}
              className="block text-sm font-semibold text-gray-400" // 'font-semibold' for chubbier text and 'text-gray-900' for very dark grey
            >{input.name} ({input.type})</label>
            <input
              type="text"
              id={`param-${index}`}
              value={parameters[input.name] || ''}
              onChange={(e) => handleInputChange(e, input.name)}
              className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500 py-2 px-2"
            />
          </div>
        ))}
        {/* Conditional rendering of the file upload input */}
        {selectedFunction?.name === 'changeArbitrationParams' && (
          <div>
            <label htmlFor="file-upload" className="block text-sm font-semibold text-gray-600">Upload new policy PDF document</label>
            <input id="file-upload" type="file" onChange={handleMetaEvidenceFileChange} />
          </div>
        )}
        <w3m-button />
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Submit to Curate Contract
        </button>
      </form>
    </div>
  );
};

export default ProposeTransaction;
