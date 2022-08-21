import './Line.scss';

function Line({sales}) {
  const totalSales = sales.reduce((acc, curr) => acc += curr['amount'] , 0);
  return (
    <div className="line-percentage">
      {sales.filter(({amount}) => amount > 0).map(({code, amount}) => (
        <div
          key={code}
          style={{'width': `${amount/totalSales*100}%`}}
          className={code}/>
      ))}
    </div>
  )
}

export default Line;
