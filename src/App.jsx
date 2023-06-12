import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import {
  Program, AnchorProvider, web3
} from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

import Pokecard from "./Components/Pokecard.jsx";
import MissingCard from "./Components/MissingCard.jsx";
import { PokemonList, numberToPokemon } from "./utils/constants.jsx";
import pokeball from "./assets/pokeball.svg"

import idl from './idl.json';
import kp from './keypair.json'

// SystemProgram é uma referencia ao 'executor' (runtime) da Solana!
const { SystemProgram, Keypair } = web3;

// Cria um par de chaves para a conta que irá guardar os dados do GIF.
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Obtém o id do nosso programa do arquivo IDL.
const programID = new PublicKey(idl.metadata.address);

// Define nossa rede para devnet.
const network = clusterApiUrl('devnet');

// Controla como queremos 'saber' quando uma transação está 'pronta'.
const opts = {
  preflightCommitment: "processed"
}

const TEST_GIFS = [
  {
    gifLink: "https://i.giphy.com/media/xUOxffMyVjqAnuJpJu/giphy.webp", userAddress: programID,
    name: "Charizard"
  },
  { gifLink: "https://media3.giphy.com/media/26n7aJwq73ubRevoQ/giphy.gif?cid=ecf05e47gpuxzul6z0774k47hcjp5p74uwfbfaq4xfjjco0c&rid=giphy.gif&ct=g", userAddress: programID, name: "Volcarona" },
  { gifLink: "https://media3.giphy.com/media/3o7aD5euYKz5Ly7Wq4/giphy.gif?cid=ecf05e47gx235xsfy7tqmzvhwz06ztzaxr63av1f446mlluz&rid=giphy.gif&ct=g", userAddress: programID, name: "Necrozma" },
  { gifLink: "https://media2.giphy.com/media/XKwfxBDG32ayrLHfAY/giphy.gif?cid=ecf05e47he0xf0mwnfx51x1f6m0wi4hzi52ql2dh0lnfe0tk&rid=giphy.gif&ct=g", userAddress: programID, name: "Totodile" }];

// Constantes
const TWITTER_HANDLE = "web3dev_";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const numList = Array.from({ length: 1010 }, (_, index) => index + 1);

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [linkInputValue, setLinkInputValue] = useState("");
  const [nameInputValue, setNameInputValue] = useState("");
  const [gifList, setGifList] = useState([]);
  const [pokemonDict, setPokemonDict] = useState([]);

  // Ações
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet encontrada!");
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            "Conectado com a Chave Pública:",
            response.publicKey.toString()
          );

          /*
           * Define a chave pública do usuário no estado para ser usado posteriormente!
           */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        //alert("Objeto Solana não encontrado! Instale a Phantom Wallet 👻");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log(
        "Conectado com a Chave Pública:",
        response.publicKey.toString()
      );
      setWalletAddress(response.publicKey.toString());
    }
  };

  const onLinkInputChange = (event) => {
    const { value } = event.target;
    setLinkInputValue(value);
  };

  const onNameInputChange = (event) => {
    const { value } = event.target;
    setNameInputValue(value);
  };

  const handleAddPokemon = (name) => {
    setNameInputValue(name);
    const inputElement = document.querySelector('#gif-link-input');
    inputElement.focus();
  }

  const handleLikePokemon = async (liked, name) => {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);

    if (!liked) {
      await program.rpc.likeGif(name, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
    }

    else if (liked) {
      await program.rpc.removeLikeGif(name, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
    }

    await getGifList();
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Conta obtida", account)
      setGifList(account.gifList)
      // setGifList(TEST_GIFS)
    } catch (error) {
      console.log("Erro em getGifList: ", error)
      setGifList(null);
    }
  }

  const sendGif = async () => {
    if (linkInputValue.length === 0) {
      console.log("Nenhum link de GIF foi dado!")
      return
    }
    console.log('Link do GIF:', linkInputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(linkInputValue, nameInputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF enviado com sucesso para o programa", linkInputValue)

      await getGifList();
      setLinkInputValue('');
    } catch (error) {
      console.log("Erro enviando GIF:", error)
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Conecte sua carteira
    </button>
  );

  const renderConnectedContainer = () => {

    const provider = getProvider();
    const userAddress = provider.wallet.publicKey;
    // Se chegarmos aqui, significa que a conta do programa não foi inicializada.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Fazer inicialização única para conta do programa GIF
          </button>
        </div>
      )
    }
    // Caso contrário, estamos bem! A conta existe. Usuários podem submeter GIFs.
    else {
      return (
        <div className="connected-container">
          <form className="gif-form"
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <div className="gif-input">
              <input
                id="gif-link-input"
                type="text"
                placeholder="Entre com o link do GIF!"
                value={linkInputValue}
                onChange={onLinkInputChange}
                style={{ "marginBottom": "5px" }}
              />
              <input
                id="pokemon-name-input"
                type="text"
                placeholder="Entre com o nome do Pokémon do GIF!"
                value={nameInputValue}
                onChange={onNameInputChange}
                style={{ "marginTop": "5px" }}
              />
            </div>
            <button type="submit" className="cta-button submit-gif-button">
              Enviar
            </button>
          </form>
          <div className="gif-grid">
            {numList.map((num, index) => {
              if (num in pokemonDict) {
                return (
                  <Pokecard pokemon={pokemonDict[num]} onLike={handleLikePokemon} user={userAddress} key={num} />
                )
              } else {
                return (
                  <MissingCard name={numberToPokemon[num]} onButtonClick={handleAddPokemon} key={num} />
                )
              }
            })}
          </div>
        </div>
      )
    }
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("BaseAccount criado com sucesso com o endereço :", baseAccount.publicKey.toString())
      await getGifList();

    } catch (error) {
      console.log("Erro criando uma nova BaseAccount:", error)
    }
  }

  // UseEffects
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log('Obtendo a lista de GIF...');
      getGifList()
    }
  }, [walletAddress]);

  useEffect(() => {
    let dict = {};
    gifList.map((item, index) => {
      const order = PokemonList[item.name];
      dict[order] = { ...item, order: order };
    });
    setPokemonDict(dict);
  }, [gifList])

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <div className="title">
            <img alt="Pokeball" className="pokeball" src={pokeball} />
            <p className="header">GIFDEX!</p>
            <img alt="Pokeball" className="pokeball" src={pokeball} />
          </div>
          <p className="sub-text">Veja a Pokédex completa em versão GIF! ✨</p>
        </div>
        {!walletAddress && renderNotConnectedContainer()}
        {/* Precisamos apenas adicionar o inverso aqui! */}
        {walletAddress && renderConnectedContainer()}
      </div>
    </div>
  );
};

export default App;