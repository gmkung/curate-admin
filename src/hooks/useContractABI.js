// hooks/useContractABI.js
import { useEffect, useState } from 'react';

const useContractABI = (path) => {
  const [abi, setABI] = useState(null);

  useEffect(() => {
    fetch(path)
      .then((response) => response.json())
      .then((data) => {
        setABI(data);
      })
      .catch((error) => {
        console.error('Error fetching ABI:', error);
      });
  }, [path]);

  return abi;
};

export default useContractABI;
