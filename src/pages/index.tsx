// pages/ProposeTransaction.tsx
import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    // Fetch the ABI from the public folder
    fetch('/contractABI.json')
      .then((res) => res.json())
      .then((data: AbiItem[]) => setAbi(data)) // Cast the response to the AbiItem[]
      .catch(console.error);
  }, []);

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
        Séance
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

        <label htmlFor="function" className="block text-sm font-semibold text-gray-600"><Tooltip text={`Decides whether the transaction goes optimistically to Reality.eth or UMA, or straight to Arbitration.`}>Verification mechanism </Tooltip><Tooltip text={`Configured as this Seance arbitrable contract's metaevidence.`}>
          <span className='block text-sm font-medium text-gray-300'>(<a href='https://ipfs.kleros.io/ipfs/QmQV4YmtAxBRZGM54zET9HbBJBPhuC5z248NyQscD6WE52/metaEvidence.json'>See policy</a>)</span>
        </Tooltip></label>


        <div className="flex gap-4">

          <div
            className={`flex-1 items-center cursor-pointer p-4 border-2 ${workflow === 'optimistic' ? 'border-blue-500' : 'border-gray-300'
              } rounded-lg shadow-sm transition duration-300 ease-in-out transform hover:-translate-y-1`}
            onClick={() => setWorkflow('optimistic')}
          >
            <h2 className="font-bold text-gray-800">Optimistic</h2>
            <p className="text-sm text-gray-500"><b>Deposit 3 ETH</b><br />If challenged within 5 days and you lose the dispute, you forfeit the deposit to the challenger.<br />Otherwise, the deposit is returned and the transaction proceeds.</p>
          </div>

          <div
            className={`flex-1 cursor-pointer p-4 border-2 ${workflow === 'pessimistic' ? 'border-blue-500' : 'border-gray-300'
              } rounded-lg shadow-sm transition duration-300 ease-in-out transform hover:-translate-y-1`}
            onClick={() => setWorkflow('pessimistic')}
          >
            <h2 className="font-bold text-gray-800">Pessimistic</h2>
            <p className="text-sm text-gray-500"><b>Pay 0.06 ETH</b><br />The transaction goes directly into arbitration in Kleros Court.<br />If the Kleros jurors rule in your favor.</p>
          </div>
        </div>
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
