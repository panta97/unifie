import "./style.css";
import Character from "./Character";

// inspired from https://x.com/jh3yy/status/1735499859715584298?s=20

const CONFIG = {
  max: 1e9,
};

const Counter = ({ pad, value }) => {
  const padCount = pad
    ? CONFIG.max.toFixed(2).toString().length - value.toString().length
    : 0;

  const paddedValue = value
    .toString()
    .padStart(value.toString().length + padCount, "1");

  let i = 0;
  const renderValue = new Intl.NumberFormat("en-PE", {
    style: "currency",
    currency: "PEN",
  })
    .format(paddedValue)
    .split("")
    .map((character) => {
      if (!isNaN(parseInt(character, 10)) && i < padCount) {
        i++;
        return "0";
      }
      return character;
    })
    .join("")
    .substring(3); // REMOVE PEN
  // .replace(/,/g, "");

  return (
    <div className="counter">
      <fieldset>
        <span>
          <span className="sr-only">{renderValue}</span>
          <span aria-hidden="true" className="characters">
            {renderValue.split("").map((character, index) => {
              if (isNaN(parseInt(character, 10)))
                return (
                  <span key={index} className="character character--symbol">
                    {character}
                  </span>
                );
              return (
                <Character
                  key={index}
                  value={character}
                  className={
                    index > renderValue.split("").length - 3 ? "fraction" : ""
                  }
                />
              );
            })}
          </span>
        </span>
      </fieldset>
    </div>
  );
};

export default Counter;
