// pages/ProposeTransaction.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';

const globalStyle = {
  fontFamily: '"Inter", sans-serif',
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
  backgroundImage: 'linear-gradient(45deg, #6e45e2, #88d3ce)',
  fontWeight: 'bold',
  textAlign: 'center',
  fontSize: '8rem', // fontSize should be a string for inline styles
};

const headingStyle: React.CSSProperties = {
  backgroundClip: 'text',
  color: 'transparent',
  backgroundImage: 'linear-gradient(330.4deg, rgb(68, 188, 240) 4.54%, rgb(114, 152, 248) 59.2%, rgb(160, 153, 255) 148.85%)'
};

interface FormParameters {
  [key: string]: string;
}

const ProposeTransaction = () => {
  const [abi, setAbi] = useState<AbiItem[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<AbiItem | null>(null);
  const [parameters, setParameters] = useState<FormParameters>({});
  const [comment, setComment] = useState('');
  const [workflow, setWorkflow] = useState('pessimistic');
  const [file, setFile] = React.useState<File | null>(null);
  const [ipfsPath, setIpfsPath] = useState(''); // State to hold the IPFS path after uploading


  useEffect(() => {
    // Fetch the ABI from the public folder
    fetch('/contractABI.json')
      .then((res) => res.json())
      .then((data: AbiItem[]) => setAbi(data)) // Cast the response to the AbiItem[]
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedFunction?.name === 'changeArbitrationParams') {
      fetchKlerosData(`{
        lregistry(id:"0x957a53a994860be4750810131d9c876b2f52d6e1"){
          registrationMetaEvidence{URI}
          clearingMetaEvidence{URI}
        }
      }`).then((response) => {
        const { data } = response;
        if (data && data.lregistry) {
          setParameters(prevParams => ({
            ...prevParams,
            _registrationMetaEvidence: data.lregistry.registrationMetaEvidence.URI,
            _clearingMetaEvidence: data.lregistry.clearingMetaEvidence.URI,
          }));
        }
      }).catch(console.error);
    }
  }, [selectedFunction]);

  const handleFunctionChange = (functionName: string) => {
    const func = abi.find((f) => f.name === functionName) || null;
    setSelectedFunction(func);
    setParameters({});
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, paramName: string) => {
    const { value } = event.target;
    setParameters((prev) => ({ ...prev, [paramName]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Here you would handle the submission of the transaction proposal
    console.log('Submitting proposal:', { selectedFunction, parameters, comment, workflow });
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
            const metaEvidenceRes = await fetch("https://ipfs.kleros.io"+metaEvidenceUri);
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
      <h1 style={seanceStyle} className="mb-8 text-center">
        Curate Admin Panel
      </h1>
      <h2 style={headingStyle} className="text-2xl font-bold mb-8 text-center">
        Permissionlessly propose a new transaction to 0x957...d6E1
      </h2>
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
        <div>
          <Tooltip text={`Describes what the transaction is for and is emitted as 'evidence'`}>
            <label htmlFor="comment" className="block text-sm font-semibold text-gray-600">Comment</label>
          </Tooltip>
          <textarea
            id="comment"
            value={comment}
            placeholder='This is a transaction to update the challenge period of the contract from 5 to 3.5 days...'
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500 py-2 px-2"
          ></textarea>
        </div>
        {/* Conditional rendering of the file upload input */}
        {selectedFunction?.name === 'changeArbitrationParams' && (
          <div>
            <label htmlFor="file-upload" className="block text-sm font-semibold text-gray-600">Upload new policy PDF document</label>
            <input id="file-upload" type="file" onChange={handleMetaEvidenceFileChange} />
            {/* Optionally display the IPFS path or upload status */}
            {ipfsPath && <div>File uploaded to IPFS: {ipfsPath}</div>}
          </div>
        )}

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Submit to Seance
        </button>
      </form>
    </div>
  );
};

export default ProposeTransaction;
