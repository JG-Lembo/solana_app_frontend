import React from 'react';
import "./MissingCard.css"

const MissingCard = ({ name, onButtonClick }) => {

  const handleClick = () => {
    onButtonClick(name);
  }

  return (
    <div className="missing-card">
      <h3>{name}</h3>
      <button className="add-gif-button" onClick={handleClick}>Adicionar</button>
    </div>
  )
}

export default MissingCard;