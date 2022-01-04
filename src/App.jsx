import React, { useEffect, useState } from 'react';
import './App.css';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0xc51fC2Df60f763157c4BdEDEcA0521a8D9c051e0';
import NFTwitter from './utils/NFTwitterContract.json';

const App = () => {

const [currentAccount, setCurrentAccount] = useState(null);
const [contract, setContract] = useState(null);
const [inputTweet, setInputTweet] = useState('')
const [tweets, setTweets] = useState([])

const loadContract = async () => {
  const { ethereum } = window;

  if (ethereum)
  {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        NFTwitter.abi,
        signer
    );

    setContract(contract);
  }
}

const readTweet = (data) => {
  return {
    parentId: data.parentId.toNumber(),
    content: data.content,
    timestamp: data.timestamp.toNumber(),
    owner: data.owner,
    author: data.author
  };
};

const loadTweets = async () => {
  try
  {
    if(contract)
    {
      const getTweetsTxn = await contract.getTweets();
      const result = getTweetsTxn.map((tw) => readTweet(tw) );
      result.reverse()
      setTweets(result);
    }
  }
  catch (error) {
      console.error("Error reading tweets", error);
  }
};

const onNewTweet = async(tweetId) => {
  try
  {
    if(contract)
    {
      const getTweetTxn = await contract.getTweet(tweetId);
      const result = readTweet(getTweetTxn);
      setTweets(tweets => [result].concat(tweets))
    }
  }
  catch (error) {
      console.error("Error reading new tweet", error);
  }
}

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
      await ethereum.request({ method: 'wallet_switchEthereumChain', params:[{chainId: '0x4'}]});
      console.log("Please connect to Rinkeby!")
    }
  } catch(error) {
    console.log(error)
  }
}

const renderTweets = () => { 
  return ( <div className="tweets"> 
  { 
    tweets.map((tweet) => 
    (
      <div className="tweet">
        <span> Owner : { tweet.owner } </span>
        { tweet.owner !== tweet.author && (<span> Original author : { tweet.author } </span> )}
        <p> { tweet.content } </p>  
      </div>
    ))
  } 
  </div>
  );
}

const postTweet = async () => {
  try
  {
    if(contract)
    {
      const postTxn = await contract.tweet(inputTweet, 0);
      await postTxn.wait();
    }
  }
  catch(error) {
    console.warn("Post tweet Error: ", error);
  }
}

const renderPostTweet = () => {
  return (
    <div> 
      <textarea value={inputTweet} onInput={e => setInputTweet(e.target.value)}/>
      <button onClick={postTweet}> 
        Post Tweet
      </button>
    </div>
  );
}

const renderContent = () => {

  if(!currentAccount)
  {
    return ( 
      <div>
       { tweets && renderTweets() } 
     <button
          onClick={connectWalletAction}
        > Connect Metamask </button>
        </div>
    );
  }
  else
  {
    return (
      <div>
      { tweets && renderTweets() } 
      { renderPostTweet() }
    </div>
    );
  }
}

useEffect(() => {
  loadContract();
  checkIfWalletIsConnected();
}, []);

useEffect(() => {
  loadTweets();

  if(contract)
    contract.on('newTweet', onNewTweet);
}, [contract]);

useEffect(() => {
  checkNetwork();
}, [currentAccount]);

return ( 
  <div>
  {renderContent()}
  </div>
  );
};

export default App;