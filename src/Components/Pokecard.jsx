import React from 'react';
import "./Pokecard.css"

const Pokecard = ({ pokemon, onLike, user }) => {

  const address = pokemon.userAddress.toString();

  let liked = false;

  for (let i = 0; i < pokemon.usersLiked.length; i++) {
    if (user.toString() == pokemon.usersLiked[i].toString()) {
      liked = true;
    }
  }

  const handleClick = () => {
    onLike(liked, pokemon.name);
  }

  return (
    <div className="gif-item">
      <img src={pokemon.gifLink} />
      <div className="extras">
        <div className="extra-info">
          <span>{`#${pokemon.order.toString().padStart(4, '0')} - ${pokemon.name}`}</span>
          <span>{`Sender: ${address.slice(0, 4)}...${address.slice(-4)}`}</span>
        </div>
        <button className={`like-button ${liked ? "liked" : "not-liked"}`} onClick={handleClick}>
          {`${pokemon.numLikes} curtida${pokemon.numLikes > 1 ? "s" : ""}`}
          {/* {liked ? "Curtir" : "Descurtir"} */}
        </button>
      </div>
    </div>
  )
}

export default Pokecard;