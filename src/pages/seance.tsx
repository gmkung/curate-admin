// pages/ProposeTransaction.tsx
import React, { useState, useEffect } from 'react';

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

interface FormParameters {
    [key: string]: string;
}

const ProposeTransaction = () => {
    const [abi, setAbi] = useState<AbiItem[]>([]);
    const [selectedFunction, setSelectedFunction] = useState<AbiItem | null>(null);
    const [parameters, setParameters] = useState<FormParameters>({});
    const [comment, setComment] = useState('');
    const [workflow, setWorkflow] = useState('');

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

    return (
        <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-blue-50">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Propose a New Transaction</h1>
            <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white shadow-2xl border-2 border-blue-200 rounded-xl p-8 space-y-6">

                <div>
                    <label htmlFor="function" className="block text-sm font-medium text-gray-800">Function</label>
                    <select
                        id="function"
                        value={selectedFunction?.name || ''}
                        onChange={(e) => handleFunctionChange(e.target.value)}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Select Function</option>
                        {abi.filter((item) => item.type === 'function').map((func) => (
                            <option key={func.name} value={func.name}>{func.name}</option>
                        ))}
                    </select>
                </div>
                {selectedFunction && abi.find((f) => f.name === selectedFunction.name)?.inputs.map((input, index) => (
                    <div key={index}>
                        <label htmlFor={`param-${index}`} className="block text-sm font-medium text-gray-700">{input.name} ({input.type})</label>
                        <input
                            type="text"
                            id={`param-${index}`}
                            value={parameters[input.name] || ''}
                            onChange={(e) => handleInputChange(e, input.name)}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                ))}
                <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Comment</label>
                    <textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="workflow" className="block text-sm font-medium text-gray-700">Workflow</label>
                    <select
                        id="workflow"
                        value={workflow}
                        onChange={(e) => setWorkflow(e.target.value)}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Select Workflow</option>
                        <option value="optimistic">Optimistic</option>
                        <option value="pessimistic">Pessimistic</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Sign and Push to Arbitration
                </button>
            </form>
        </div>
    );
};

export default ProposeTransaction;
