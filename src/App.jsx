import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x7060CFC416b2D8C962B0Ba44C85826B1f0CCD14A';
import NFTwitter from './utils/NFTwitterContract.json';

const App = () => {

const [correctChain, setCorrectChain] = useState(false)
const [currentAccount, _setCurrentAccount] = useState(null);
const [contract, setContract] = useState(null);
const [inputTweet, setInputTweet] = useState('')
const [tweets, setTweets] = useState([])
const [canPost, setCanPost] = useState(false)
const [postingTweet, setPostingTweet] = useState(false)
const [tippingTweet, setTippingTweet] = useState(false)
const [tippedTweet, setTippedTweet] = useState(0)
const [inputTip, setInputTip] = useState('0.001')

const currentAccountRef = useRef(currentAccount);
const setCurrentAccount = (data) => {
  currentAccountRef.current = data;
  _setCurrentAccount(data);
};

const networkChanged = async (chainId) => {
  const result = chainId == "0x4";
  setCorrectChain(result);

  if (!result)
    checkNetwork();
}

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

const readDate = (timestamp) => {
  var d = new Date(0);
  d.setUTCSeconds(timestamp);
  return d.toLocaleString()
}

const readTweet = (data, like) => {
  return {
    tweetId: data.tweetId.toNumber(),
    parentId: data.parentId.toNumber(),
    content: data.content,
    timestamp: data.timestamp.toNumber(),
    owner: data.owner,
    author: data.author,
    likes: data.likes.toNumber(),
    liked: like
  };
};

const loadTweets = async () => {
  try
  {
    if(contract)
    {
      const getTweetsTxn = await contract.getTweets();
      const tweetsList = getTweetsTxn[0];
      const likedByUser = getTweetsTxn[1];
      const result = tweetsList.map((tw, indice) => readTweet(tw, likedByUser[indice]));
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

const onTweetLiked = async(tweetId, liker, newNbLike) => {
  setTweets(tweets =>  
    tweets.map(tweet => {
      if(tweet.tweetId == tweetId)
      {
        tweet.likes = newNbLike.toNumber(); 

        if(liker.toLowerCase() === currentAccountRef.current.toLowerCase())
          tweet.liked = true;
      }
        return tweet;
    })
  );
}

const onTweetUnliked = async(tweetId, liker, newNbLike) => {
  setTweets(tweets =>  
    tweets.map(tweet => {
      if(tweet.tweetId == tweetId)
      {
        tweet.likes = newNbLike.toNumber(); 

        if(liker.toLowerCase() === currentAccountRef.current.toLowerCase())
          tweet.liked = false;
      }

      return tweet;
    })
  );
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
    else if(!correctChain)
    {
      setCorrectChain(true)
    }
  } catch(error) {
    console.log(error)
  }
}

const renderTweet = (tweet, withButtons) => {
  let children = tweets.filter(x => x.parentId == tweet.tweetId)
  return (
    <div className="tweetContainer" key={ "tweet" + tweet.tweetId }>
      <div className="tweet" id={ "tweet" + tweet.tweetId } >
        <span> Owner : { tweet.owner.toLowerCase() === currentAccount.toLowerCase() ? "You" : tweet.owner } </span> 
        { tweet.owner !== tweet.author && (<span><br/> Original author : { tweet.author } </span> )}
        <div className="tweetContent"> 
        <span>  { tweet.content } </span>
        </div>  
        <div className="tweetInfos"> 
        <span> { tweet.likes } likes. { readDate(tweet.timestamp) } </span>
        </div>  
        { withButtons && (
        <div className="tweetBtnContainer">
          <button className="viewOnOSBtn" onClick={() => window.open("https://testnets.opensea.io/assets/" +  CONTRACT_ADDRESS + "/" + tweet.tweetId)}> View on OpenSea </button>
          <div className="replyBtn">
            { tweet.author.toLowerCase() !== currentAccount.toLowerCase() && (tweet.liked ?
              (<button className="likeBtn" onClick={() => unlikeTweet(tweet.tweetId)}> Unlike </button>)
              :
              (<button className="likeBtn" onClick={() => likeTweet(tweet.tweetId)}> Like </button>))
            }
            <button onClick={() => { setTippingTweet(true);setTippedTweet(tweet.tweetId); }} > Tip </button>
            <button onClick={() => postTweet(tweet.tweetId)}> Reply </button>
          </div>
         
        </div>
        )}
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
      renderTweet(tweet, true)
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

const likeTweet = async (tweetId) => {
   try
    {
      if(contract)
      {
        const likeTxn = await contract.likeTweet(tweetId);
        await likeTxn.wait();
      }
    }
    catch(error) {
      console.warn("Like tweet Error: ", error);
    }
}

const unlikeTweet = async (tweetId) => {
   try
    {
      if(contract)
      {
        const txn = await contract.unlikeTweet(tweetId);
        await txn.wait();
      }
    }
    catch(error) {
      console.warn("Unlike tweet Error: ", error);
    }
}

const sendTip = async() => {
  try
  {
    if(contract)
    {
      const overrides = {
        value: ethers.utils.parseEther(inputTip) 
      }

      const txn = await contract.tipTweet(tippedTweet, overrides);
      await txn.wait();
    }
  }
  catch(error) {
      console.warn("Tip tweet Error: ", error);
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

const renderTippingTweet = () => {
  return (
    <div className="tweetsDiv"> 
      <button onClick={() => setTippingTweet(false)}> Back
      </button>
      <h2> Tipping Tweet </h2> 
      {  tweets.filter(x => x.tweetId == tippedTweet).map((tweet) => 
        (
          renderTweet(tweet, false)
        )) 
      }
      <div>
      <br />
      <span> ETH : </span>
      <input type="number" min="0" value={inputTip} onInput={e => setInputTip(e.target.value)} step="0.0001" /> 
      </div>
      <button onClick={() => sendTip()} > Send tip </button>
    </div>
  )
}

const renderContent = () => {
  if(!currentAccount)
  {
    return (
      <div className="tweetsDiv">
        <button
          onClick={connectWalletAction}> 
          Connect with Metamask 
        </button>

      { tweets && renderTweets() } 
      <footer> </footer>
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
  if(window.ethereum)
  {
    window.ethereum.on("chainChanged", networkChanged);

    return () => {
      window.ethereum.removeListener("chainChanged", networkChanged);
    }
  }
}, []);

useEffect(() => {
  loadTweets();

  if(contract)
  {
    contract.on("newTweet", onNewTweet);
    contract.on("tweetDeleted", onDeleteTweet);
    contract.on("tweetLiked", onTweetLiked);
    contract.on("tweetUnliked", onTweetUnliked);

    return () => {
      contract.off("newTweet", onNewTweet);
      contract.off("tweetDeleted", onDeleteTweet);
      contract.off("tweetLiked", onTweetLiked);
      contract.off("tweetUnliked", onTweetUnliked);
    }
  }
}, [contract]);

useEffect(() => {
  if(currentAccount != null)
    checkNetwork();
}, [currentAccount]);

useEffect(() => {
  if(correctChain && contract === null)
  {
    loadContract();
  }
}, [correctChain]);

useEffect(() => {
  setCanPost(inputTweet.length > 0)
}, [inputTweet])

return (  
  tippingTweet ? renderTippingTweet()
  : renderContent()
)

};

export default App;