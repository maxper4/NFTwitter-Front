import React, { useEffect, useState } from 'react';
import './App.css';
import { ethers } from 'ethers';

const App = () => {
const [currentAccount, setCurrentAccount] = useState(null);

const connectWalletAction = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log('Make sure you have MetaMask!');
        return;
      } else {
        const accounts = await ethereum.request({ method: 'eth_accounts' });

        if (accounts.length !== 0) {
          const account = accounts[0];
          setCurrentAccount(account);
        }
      }
    } catch (error) {
      console.log(error);
    }
}

const checkNetwork = async () => {
  try { 
    if (window.ethereum.networkVersion !== '4') {
      //ask Metamask to switch network
      console.log("Please connect to Rinkeby!")
    }
  } catch(error) {
    console.log(error)
  }
}

const renderContent = () => {
  //show all tweets

  if(!currentAccount)
  {
    return (
     <button
          onClick={connectWalletAction}
        > Connect Metamask </button>
    );
  }
  else
  {
    return (
      // allow to post a tweet
    <span> Connected to Metamask ! </span>
    );
  }
}

useEffect(() => {
  checkIfWalletIsConnected();
  checkNetwork();
}, []);

useEffect(() => {
    //load user profile
}, [currentAccount]);

return ( 
  <div>
  {renderContent()}
  </div>
  );
};

export default App;