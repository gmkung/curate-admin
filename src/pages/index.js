"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// pages/ProposeTransaction.tsx
const react_1 = __importStar(require("react"));
const ethers_1 = require("ethers");
const react_2 = require("@web3modal/ethers/react");
// 1. Get projectId
const projectId = '406598dd2c21a5c4ffcbb4f7ec212c42';
// 2. Set chains
const gnosis = {
    chainId: 100,
    name: 'Gnosis',
    currency: 'xDAI',
    explorerUrl: 'https://gnosisscan.io',
    rpcUrl: 'https://rpc.ankr.com/gnosis'
};
const mainnet = {
    chainId: 1,
    name: 'Ethereum Mainnet',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://rpc.ankr.com/eth'
};
// 3. Create a metadata object
const metadata = {
    name: 'Curate Admin Panel',
    description: 'An interface for managing Kleros LCurate registries',
    url: 'https://curate-admin.vercel.app', // origin must match your domain & subdomain
    icons: ['https://avatars.mywebsite.com/']
};
// 4. Create Ethers config
const ethersConfig = (0, react_2.defaultConfig)({
    /*Required*/
    metadata,
    /*Optional*/
    enableEIP6963: true, // true by default
    enableInjected: true, // true by default
    enableCoinbase: true, // true by default
    rpcUrl: '...', // used for the Coinbase SDK
    defaultChainId: 1, // used for the Coinbase SDK
});
// 5. Create a Web3Modal instance
(0, react_2.createWeb3Modal)({
    ethersConfig,
    chains: [gnosis, mainnet],
    projectId,
    enableAnalytics: true // Optional - defaults to your Cloud configuration
});
const globalStyle = {
    fontFamily: '"Inter", sans-serif',
    backgroundColor: '#2a0a4a', // Dark purple background
};
const seanceStyle = {
    color: 'transparent',
    animation: 'hue 10s infinite linear',
    backgroundClip: 'text',
    backgroundImage: 'linear-gradient(45deg, #9a70ab, #c7a4cf)', // Lighter purple gradient for the text
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: '8rem',
};
const headingStyle = {
    backgroundClip: 'text',
    color: 'transparent',
    backgroundImage: 'linear-gradient(330.4deg, #b39ddb 4.54%, #d1c4e9 59.2%, #e1bee7 148.85%)', // Another lighter purple gradient for the text
};
const ProposeTransaction = () => {
    const [contractAddress, setContractAddress] = (0, react_1.useState)('');
    const [abi, setAbi] = (0, react_1.useState)([]);
    const [selectedFunction, setSelectedFunction] = (0, react_1.useState)(null);
    const [parameters, setParameters] = (0, react_1.useState)({});
    const [file, setFile] = react_1.default.useState(null);
    const [ipfsPath, setIpfsPath] = (0, react_1.useState)(''); // State to hold the IPFS path after uploading
    const [isEditing, setIsEditing] = (0, react_1.useState)(false);
    const [editableAddress, setEditableAddress] = (0, react_1.useState)('');
    const rpcEndpoint = 'https://rpc.ankr.com/gnosis'; // Change this to your RPC URL
    const { walletProvider } = (0, react_2.useWeb3ModalProvider)();
    //const { open } = useWeb3Modal()
    (0, react_1.useEffect)(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const address = queryParams.get('lregistry') || '0x4577BE6550e7eb4b074bDAcbE4dd44c9245a9bF3'.toLowerCase();
        setContractAddress(address);
        setEditableAddress(address); // Initialize editableAddress with the fetched address
    }, []);
    const handleAddressChange = (event) => {
        setEditableAddress(event.target.value);
    };
    const handleAddressBlur = () => {
        setContractAddress(editableAddress);
        const newUrl = `${window.location.origin}${window.location.pathname}?lregistry=${editableAddress.toLowerCase()}`;
        window.location.href = newUrl;
    };
    (0, react_1.useEffect)(() => {
        // Fetch the ABI from the public folder
        fetch('/contractABI.json')
            .then((res) => res.json())
            .then((data) => setAbi(data)) // Cast the response to the AbiItem[]
            .catch(console.error);
    }, []);
    const fetchDataFromContract = (functionName_1, ...args_1) => __awaiter(void 0, [functionName_1, ...args_1], void 0, function* (functionName, args = []) {
        const provider = new ethers_1.ethers.JsonRpcProvider(rpcEndpoint);
        const contract = new ethers_1.ethers.Contract(contractAddress, abi, provider);
        try {
            const data = yield contract[functionName](...args);
            return data;
        }
        catch (error) {
            console.error(`Error fetching data from ${functionName}:`, error);
            return null;
        }
    });
    (0, react_1.useEffect)(() => {
        if ((selectedFunction === null || selectedFunction === void 0 ? void 0 : selectedFunction.name) === 'changeArbitrationParams') {
            // Fetch arbitrator extra data
            fetchDataFromContract('arbitratorExtraData').then(arbitratorExtraData => {
                if (arbitratorExtraData) {
                    setParameters(prevParams => (Object.assign(Object.assign({}, prevParams), { _arbitratorExtraData: arbitratorExtraData })));
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
                    setParameters(prevParams => (Object.assign(Object.assign({}, prevParams), { _registrationMetaEvidence: data.lregistry.registrationMetaEvidence.URI, _arbitrator: "0x9c1da9a04925bdfdedf0f6421bc7eea8305f9002", _clearingMetaEvidence: data.lregistry.clearingMetaEvidence.URI })));
                }
            }).catch(console.error);
        }
    }, [selectedFunction, contractAddress]); // Added contractAddress as a dependency
    const handleFunctionChange = (functionName) => {
        const func = abi.find((f) => f.name === functionName) || null;
        setSelectedFunction(func);
        setParameters({});
    };
    const handleInputChange = (event, paramName) => {
        const { value } = event.target;
        setParameters((prev) => (Object.assign(Object.assign({}, prev), { [paramName]: value })));
    };
    const handleSubmit = (event) => __awaiter(void 0, void 0, void 0, function* () {
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
        const ethersProvider = new ethers_1.ethers.BrowserProvider(walletProvider);
        // Get the signer from the provider
        const signer = yield ethersProvider.getSigner();
        console.log(signer);
        const contract = new ethers_1.Contract(contractAddress, abi, signer);
        // Prepare the parameters for the function call
        const functionArgs = selectedFunction.inputs.map(input => parameters[input.name]);
        try {
            // Send a transaction to execute the selected function with the provided arguments
            const transactionResponse = yield contract[selectedFunction.name](...functionArgs);
            console.log('Transaction submitted:', transactionResponse);
            // Wait for the transaction to be mined
            const receipt = yield transactionResponse.wait();
            console.log('Transaction confirmed:', receipt);
        }
        catch (error) {
            console.error('Transaction failed:', error);
        }
    });
    function fetchKlerosData(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch('https://api.thegraph.com/subgraphs/name/kleros/legacy-curate-xdai', {
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
        });
    }
    const postJSONtoKlerosIPFS = (buffer) => __awaiter(void 0, void 0, void 0, function* () {
        const final_dict = {
            "fileName": "new.pdf",
            // Directly use the buffer array without converting it to JSON first
            "buffer": { "type": "Buffer", "data": Array.from(new Uint8Array(buffer)) }
        };
        const response = yield fetch("https://ipfs.kleros.io/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(final_dict)
        });
        if (response.ok) {
            const data = yield response.json();
            console.log("/ipfs/" + data.data[0].hash);
            return "/ipfs/" + data.data[0].hash;
        }
        else {
            throw new Error("Failed to upload to IPFS");
        }
    });
    const uploadToIPFS = (data, fileName) => __awaiter(void 0, void 0, void 0, function* () {
        const payload = {
            fileName,
            buffer: { "type": "Buffer", "data": Array.from(data) },
        };
        const response = yield fetch("https://ipfs.kleros.io/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (response.ok) {
            const responseData = yield response.json();
            console.log("/ipfs/" + responseData.data[0].hash);
            return "/ipfs/" + responseData.data[0].hash;
        }
        else {
            throw new Error("Failed to upload to IPFS");
        }
    });
    const handleMetaEvidenceFileChange = (event) => __awaiter(void 0, void 0, void 0, function* () {
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
        fileReader.onload = (e) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const arrayBuffer = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
            if (arrayBuffer instanceof ArrayBuffer) {
                try {
                    // Upload the PDF to IPFS
                    const binaryData = new Uint8Array(arrayBuffer);
                    const ipfsResultPath = yield uploadToIPFS(binaryData, 'policy.pdf');
                    setIpfsPath(ipfsResultPath);
                    console.log('File uploaded to IPFS at:', ipfsResultPath);
                    const updateAndUploadMetaEvidence = (metaEvidenceUri) => __awaiter(void 0, void 0, void 0, function* () {
                        const metaEvidenceRes = yield fetch("https://ipfs.kleros.io" + metaEvidenceUri);
                        const metaEvidenceJson = yield metaEvidenceRes.json();
                        metaEvidenceJson.fileURI = ipfsResultPath;
                        const jsonStr = JSON.stringify(metaEvidenceJson);
                        const jsonData = new TextEncoder().encode(jsonStr);
                        return yield uploadToIPFS(jsonData, "metaevidence.json");
                    });
                    const metaEvidencesToUpdate = {};
                    if (selectedFunction && selectedFunction.inputs.some(input => input.name === '_clearingMetaEvidence')) {
                        const clearingMetaEvidencePath = yield updateAndUploadMetaEvidence(parameters['_clearingMetaEvidence']);
                        metaEvidencesToUpdate['_clearingMetaEvidence'] = clearingMetaEvidencePath;
                    }
                    if (selectedFunction && selectedFunction.inputs.some(input => input.name === '_registrationMetaEvidence')) {
                        const registrationMetaEvidencePath = yield updateAndUploadMetaEvidence(parameters['_registrationMetaEvidence']);
                        metaEvidencesToUpdate['_registrationMetaEvidence'] = registrationMetaEvidencePath;
                    }
                    // Update parameters with new IPFS hashes
                    setParameters(prevParams => (Object.assign(Object.assign({}, prevParams), metaEvidencesToUpdate)));
                    console.log('MetaEvidence updated and uploaded to IPFS:', metaEvidencesToUpdate);
                }
                catch (error) {
                    console.error('Error uploading file to IPFS or updating MetaEvidence:', error);
                }
            }
        });
        fileReader.onerror = (e) => {
            console.error('FileReader error:', e);
        };
    });
    const Tooltip = ({ children, text }) => {
        const [isTooltipVisible, setTooltipVisible] = (0, react_1.useState)(false);
        return (<span className="relative inline group">
        <span onMouseEnter={() => setTooltipVisible(true)} onMouseLeave={() => setTooltipVisible(false)} className="cursor-pointer">
          {children}
        </span>
        {isTooltipVisible && (<div className="absolute bottom-0 flex-col items-center hidden mb-6 group-hover:flex">
            <span className="relative z-10 p-2 text-xs leading-none text-white whitespace-no-wrap bg-black shadow-lg rounded-md">
              {text}
            </span>
            <div className="w-3 h-3 -mt-2 rotate-45 bg-black"></div>
          </div>)}
      </span>);
    };
    return (<div style={globalStyle} className="min-h-screen flex flex-col justify-center items-center px-4 bg-blue-50">
      <h2 style={seanceStyle} className="mb-8 text-center">
        Curate Admin Panel
      </h2>
      {isEditing ? (<div>
          <h3 style={headingStyle} className="text-2xl font-bold mb-8 text-center">Change address to:
            <input type="text" value={editableAddress} onChange={handleAddressChange} onBlur={handleAddressBlur} className="contract-address-input" autoFocus style={{ color: 'darkgrey' }} // Inline style for text color
        /></h3>
        </div>) : (<h2 style={headingStyle} className="text-2xl font-bold mb-8 text-center" onClick={() => setIsEditing(true)}>
          Update or submit data to {`${contractAddress.slice(0, 7)}...${contractAddress.slice(-4)}`}
        </h2>)}

      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white shadow-2xl border-1.5 border-blue-200 rounded-xl p-8 space-y-6">

        <div>
          <Tooltip text={`Retrieved from ABI record of the root (sub)DNS`}>
            <label htmlFor="function" className="block text-sm font-semibold text-gray-600">Function</label>
          </Tooltip>
          <select id="function" value={(selectedFunction === null || selectedFunction === void 0 ? void 0 : selectedFunction.name) || ''} onChange={(e) => handleFunctionChange(e.target.value)} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500 py-2 px-2">
            <option value="">Select Function</option>
            {abi.filter((item) => item.type === 'function' &&
            item.stateMutability !== 'view' &&
            item.stateMutability !== 'pure' &&
            !item.constant // Exclude constant functions, which are typically 'view' or 'pure'
        ).map((func) => (<option key={func.name} value={func.name}>{func.name}</option>))}
          </select>
        </div>
        {selectedFunction && selectedFunction.inputs.map((input, index) => (<div key={index} className="ml-4">
            <label htmlFor={`param-${index}`} className="block text-sm font-semibold text-gray-400" // 'font-semibold' for chubbier text and 'text-gray-900' for very dark grey
        >{input.name} ({input.type})</label>
            <input type="text" id={`param-${index}`} value={parameters[input.name] || ''} onChange={(e) => handleInputChange(e, input.name)} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500 py-2 px-2"/>
          </div>))}
        {/* Conditional rendering of the file upload input */}
        {(selectedFunction === null || selectedFunction === void 0 ? void 0 : selectedFunction.name) === 'changeArbitrationParams' && (<div>
            <label htmlFor="file-upload" className="block text-sm font-semibold text-gray-600">Upload new policy PDF document</label>
            <input id="file-upload" type="file" onChange={handleMetaEvidenceFileChange}/>
          </div>)}
        <w3m-button />
        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Submit to Curate Contract
        </button>
      </form>
    </div>);
};
exports.default = ProposeTransaction;
