const Character = ({ className, charKey, value }) => {
  return (
    <span data-value={value} className={`character ${className || ""}`}>
      <span className="character__track" style={{ "--v": value }}>
        <span>9</span>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((val, index) => {
          return <span key={`${charKey}--${index}`}>{val}</span>;
        })}
        <span>0</span>
      </span>
    </span>
  );
};

export default Character;
