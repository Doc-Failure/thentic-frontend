import axios from 'axios';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import Web3 from 'web3';

// ex. package types
// ex. package types
import { Meta } from '@/layouts/Meta';
import { Main } from '@/templates/Main';

import ERC721Abi from '../abis/ERC721-ABI.json';
import NFTBridgeAbi from '../abis/NFTBridge-ABI.json';

const Index = () => {
  const tokenDetailsObj = {
    uri: '',
    data: '',
    image: '',
    name: '',
    short_name: '',
  };
  const [currentAccount, setCurrentAccount] = useState(null);
  const [tokenDetails, setTokenDetails] = useState(tokenDetailsObj);
  const [contractAddress, setContractAddress] = useState('');
  const [newContractAddress, setNewContractAddress] = useState('');
  const [networkToDeploy, setNetworkToDeploy] = useState('97');
  const [tokenId, setTokenId] = useState('');
  const [readyChainlinkId, setReadyChainlinkId] = useState('');
  const [goChainlinkId, setGoChainlinkId] = useState('');
  const [setChainlinkId, setSetChainlinkId] = useState('');

  let ethereum: any;
  let signer: ethers.providers.JsonRpcSigner;
  let bridgeContract: ethers.Contract;

  const networkLoaded = async () => {
    ethereum = window.ethereum;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      signer = provider.getSigner();
      bridgeContract = new ethers.Contract(
        '0xAce4267bcB10c5fE6F8573eAf2a52f309FeAD60C',
        NFTBridgeAbi,
        signer
      );
    }
  };

  const checkWalletIsConnected = async () => {
    // Imported by Metamask
    if (!ethereum) {
      console.log('Make sure you have Metamask installed!');
      return;
    }
    console.log("Wallet exists! We're ready to go!");

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      setCurrentAccount(account);
    } else {
      console.log('No authorized account found');
    }
  };

  const connectWalletHandler = async () => {
    if (!ethereum) {
      alert('Please install Metamask!');
    }

    try {
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.log(err);
    }
  };

  const connectWalletButton = () => {
    return (
      <button
        onClick={connectWalletHandler}
        className="cta-button connect-wallet-button"
      >
        Connect Wallet
      </button>
    );
  };

  const loadNftHandler = async () => {
    if (!ethereum) networkLoaded();
    try {
      if (ethereum) {
        const web3 = new Web3(
          'https://goerli.infura.io/v3/f8abcb045ed64fb0a51b1e67ec54888d'
        );

        const tokenContract = new web3.eth.Contract(ERC721Abi, contractAddress);
        const tokenDataAddress = await tokenContract.methods
          .tokenURI(tokenId)
          .call();

        const tokenDataName = await tokenContract.methods.name().call();
        const tokenDataShortName = await tokenContract.methods.symbol().call();
        const tokenData = await axios(tokenDataAddress);

        setTokenDetails({
          uri: tokenDataAddress,
          data: tokenData.data.toString(),
          image: tokenData.data.image,
          name: tokenDataName,
          short_name: tokenDataShortName,
        });
      } else {
        alert('Ethereum object does not exist');
      }
    } catch (err) {
      console.log(err);
    }
  };

  const settingOperationFunction = async (currentOperation: number) => {
    // const networks=
    if (!ethereum) networkLoaded();
    try {
      if (ethereum) {
        console.log('Processing transaction....');
        if (currentOperation === 0) {
          const nftTxn = await bridgeContract.deleteContract(
            ethereum.networkVersion,
            contractAddress,
            tokenId,
            signer.getAddress()
          );
          const res = await nftTxn.wait();
          setReadyChainlinkId(res.events[0].topics[1]);
        } else if (currentOperation === 1) {
          const nftTxn = await bridgeContract.createContract(
            networkToDeploy,
            tokenDetails.name,
            tokenDetails.short_name
          );
          const res = await nftTxn.wait();
          setSetChainlinkId(res.events[0].topics[1]);
        } else {
          const nftTxn = await bridgeContract.mintNft(
            networkToDeploy.toString(),
            newContractAddress,
            tokenId,
            tokenDetails.uri,
            signer.getAddress()
          );
          const res = await nftTxn.wait();
          setGoChainlinkId(res.events[0].topics[1]);
        }
      } else {
        console.log('Ethereum object does not exist');
      }
    } catch (err) {
      console.log(err);
    }

    console.log('Transaction completed!');
  };

  const confirmOperationFunction = async (currentOperation: number) => {
    if (!bridgeContract) networkLoaded();
    const url =
      // eslint-disable-next-line no-nested-ternary
      currentOperation === 0
        ? readyChainlinkId
        : currentOperation === 1
        ? setChainlinkId
        : goChainlinkId;
    const transactionUrl = await bridgeContract.transaction_url(url);
    window.open(transactionUrl, '_blank');
  };

  const loadNftButton = () => {
    return (
      <button
        onClick={loadNftHandler}
        className="rounded border-b-4 border-blue-700 bg-blue-500 py-2 px-4 font-bold text-white hover:border-blue-500 hover:bg-blue-400"
      >
        Load NFT
      </button>
    );
  };

  useEffect(() => {
    checkWalletIsConnected();
    networkLoaded();
  }, []);

  const handleTokenAddressChange = (value: string, type: string) => {
    const addres: string = value;
    if (type === 'old') {
      setContractAddress(addres);
    } else {
      setNewContractAddress(addres);
    }
  };

  const handleTokenIdChange = (value: any) => {
    const id: string = value.target.value;
    setTokenId(id);
  };

  return (
    <Main
      meta={
        <Meta
          title="Next.js Boilerplate Presentation"
          description="Next js Boilerplate is the perfect starter code for your project. Build your React application with the Next.js framework."
        />
      }
    >
      <div>
        <div>
          <label className="mb-2 block text-sm font-medium">
            Contract Address:
            <input
              className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
              name="ContractAddress"
              type="text"
              value={contractAddress}
              onChange={(e) => handleTokenAddressChange(e?.target.value, 'old')}
            />
          </label>
          <label className="mb-2 block text-sm font-medium">
            Token Id:
            <input
              className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
              name="ContractAddress"
              type="text"
              value={tokenId}
              onChange={handleTokenIdChange}
            />
          </label>
          <div>{currentAccount ? loadNftButton() : connectWalletButton()}</div>
        </div>
        <div>
          {tokenDetails.image ? (
            <div className="text-justify">
              <img
                src={tokenDetails.image}
                alt="tokenTitle"
                width="500"
                height="600"
              ></img>
              <div className="mb-2">
                <label className="mb-2 block min-w-full text-sm font-medium text-gray-900">
                  Choose a network:
                </label>
                <select
                  id="network"
                  name="network"
                  className="block w-full min-w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                  onChange={(e) => {
                    setNetworkToDeploy(e?.target.value);
                  }}
                  value={networkToDeploy}
                >
                  <option value="97">BSC</option>
                </select>
              </div>
              <div>
                <ul>
                  <li className="inline-block text-justify">
                    <div className="inline-block text-justify">
                      <p>1) </p>
                      <button
                        className="m-2 rounded border-b-4 border-blue-700 bg-blue-500 py-2 px-4 font-bold text-white hover:border-blue-500 hover:bg-blue-400"
                        onClick={() => settingOperationFunction(0)}
                      >
                        Ready?
                      </button>
                      <button
                        className="m-2 rounded border-b-4 border-blue-700 bg-blue-500 py-2 px-4 font-bold text-white hover:border-blue-500 hover:bg-blue-400"
                        onClick={() => confirmOperationFunction(0)}
                      >
                        Confirm Operation
                      </button>
                    </div>
                  </li>
                  <li>
                    <div className="inline-block text-justify">
                      <p>2) </p>
                      <button
                        className="m-2 rounded border-b-4 border-blue-700 bg-blue-500 py-2 px-4 font-bold text-white hover:border-blue-500 hover:bg-blue-400"
                        onClick={() => settingOperationFunction(1)}
                      >
                        Set
                      </button>
                      <button
                        className="m-2 rounded border-b-4 border-blue-700 bg-blue-500 py-2 px-4 font-bold text-white hover:border-blue-500 hover:bg-blue-400"
                        onClick={() => confirmOperationFunction(1)}
                      >
                        Confirm Operation
                      </button>
                    </div>
                  </li>
                  <li>
                    <div className="inline-block text-justify">
                      <p>3) </p>
                      <label className="mb-2 block text-sm font-medium">
                        New Contract Address:
                        <input
                          className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                          name="NewContractAddress"
                          type="text"
                          value={newContractAddress}
                          onChange={(e) =>
                            handleTokenAddressChange(e?.target.value, 'new')
                          }
                        />
                      </label>
                      <button
                        className="m-2 rounded border-b-4 border-blue-700 bg-blue-500 py-2 px-4 font-bold text-white hover:border-blue-500 hover:bg-blue-400"
                        onClick={() => settingOperationFunction(2)}
                      >
                        Go!
                      </button>
                      <button
                        className="m-2 rounded border-b-4 border-blue-700 bg-blue-500 py-2 px-4 font-bold text-white hover:border-blue-500 hover:bg-blue-400"
                        onClick={() => confirmOperationFunction(2)}
                      >
                        Confirm Operation
                      </button>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div>...</div>
          )}
        </div>
      </div>
    </Main>
  );
};

export default Index;
