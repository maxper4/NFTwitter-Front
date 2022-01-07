import React, { useEffect, useState } from 'react';
import './App.css';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0xfd328d8f1E133DAcF6a74AD5bADcA1AdFdB3709a';
import NFTwitter from './utils/NFTwitterContract.json';

const App = () => {

const [currentAccount, setCurrentAccount] = useState(null);
const [contract, setContract] = useState(null);
const [inputTweet, setInputTweet] = useState('')
const [tweets, setTweets] = useState([])
const [canPost, setCanPost] = useState(false)
const [postingTweet, setPostingTweet] = useState(false)

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
    tweetId: data.tweetId.toNumber(),
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
    else
    {   
      setTweets([]);
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

const onDeleteTweet = async(tweetId) => {
  tweetId = tweetId.toNumber();
  setTweets(tweets => tweets.filter(x => x.tweetId != tweetId));
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

const renderTweet = (tweet) => {
  let children = tweets.filter(x => x.parentId == tweet.tweetId)
  return (
    <div className="tweetContainer" key={ "tweet" + tweet.tweetId }>
      <div className="tweet" id={ "tweet" + tweet.tweetId } >
        <span> Owner : { tweet.owner.toLowerCase() === currentAccount.toLowerCase() ? "You" : tweet.owner } </span> 
        { tweet.owner !== tweet.author && (<span><br/> Original author : { tweet.author } </span> )}
        <div className="tweetContent"> 
        <span>  { tweet.content } </span>
        </div>  
        <div className="tweetBtnContainer">
          <button className="replyBtn" onClick={() => postTweet(tweet.tweetId)}> Reply </button>
          <button className="viewOnOSBtn" onClick={() => window.open("https://testnets.opensea.io/assets/" +  CONTRACT_ADDRESS + "/" + tweet.tweetId)}> View on OpenSea </button>
          <button className="likeBtn" onClick={() => alert("Sorry, not yet implemented.")}> Like </button>
        </div>
      </div>
      {
        children.length > 0 && 
          ( 
            <div className="childTweet" key={ "childTweets" + tweet.tweetId }> 
              {
                children.map(child => 
                (
                  renderTweet(child)
                ))
              }
            </div>
          )
      }
    </div>
  )
}

const renderTweets = () => { 
  return ( <div className="tweets"> 
  { 
    tweets.filter(x => x.parentId == 0).map((tweet) => 
    (
      renderTweet(tweet)
    ))
  } 
  </div>
  );
}

const postTweet = async (parentId) => {
  if(canPost)
  {
    try
    {
      if(contract)
      {
        setPostingTweet(true);
        const postTxn = await contract.tweet(inputTweet, parentId);
        await postTxn.wait();

        setPostingTweet(false);
        setInputTweet("")
      }
    }
    catch(error) {
      console.warn("Post tweet Error: ", error);
      setPostingTweet(false);
    }
  }
  else
  {
    alert("Write a tweet first.");
  }
}

const renderPostTweet = () => {
  return (
    <footer>
      <div className="postDiv"> 
        <textarea value={inputTweet} onInput={e => setInputTweet(e.target.value)}/>
        { postingTweet ? 
          ( <button disabled> 
            Posting Tweet...
            </button> 
          ) 
          : 
          (
            <button onClick={() => postTweet(0)} > 
              Post Tweet
            </button>
          )
        }
        
      </div>
    </footer>
  );
}

const renderContent = () => {
  if(!currentAccount)
  {
    return (
      <div className="tweetsDiv">
        <button
          onClick={connectWalletAction}> 
          Connect Metamask 
        </button>

      { tweets && renderTweets() } 
      </div>
    );
  }
  else
  {
    return (
      <div className="tweetsDiv">
        { tweets && renderTweets() } 
        { renderPostTweet() }
      </div>
    );
  }
}

useEffect(() => {
  checkIfWalletIsConnected();
}, []);

useEffect(() => {
  loadTweets();

  if(contract)
  {
    contract.on("newTweet", onNewTweet);
    contract.on("tweetDeleted", onDeleteTweet);
  }
}, [contract]);

useEffect(() => {
  checkNetwork();
  if(contract === null)
  {
    loadContract();
  }
}, [currentAccount]);

useEffect(() => {
  setCanPost(inputTweet.length > 0)
}, [inputTweet])

return renderContent();
};

export default App;