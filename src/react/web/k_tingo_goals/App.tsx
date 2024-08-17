import React, { useEffect, useState } from "react";
import { fetchStoreGoals } from "./api/goals";
import { DateTime } from "luxon";
import Reload from "./Reload";
import { StoreSectionAmountObj, StoreSectionEnum } from "./types";
import { currencyFormat } from "./currency";

const storeSectionDisplay: Record<StoreSectionEnum, string> = {
  ACCESSORIES: "ACCESORIOS",
  MEN: "CABALLERO",
  WOMEN: "DAMA",
  SPORTS: "DEPORTE",
  HOME: "HOME",
  CHILDREN: "KIDS",
};

const storeSectionColor: Record<StoreSectionEnum, string> = {
  ACCESSORIES: "#f9e0de",
  MEN: "#71cea3",
  WOMEN: "#ed6fc1",
  SPORTS: "#82dee5",
  HOME: "#cdfd84",
  CHILDREN: "#fae170",
};

const storeSectionOrder: Record<StoreSectionEnum, number> = {
  ACCESSORIES: 1,
  MEN: 4,
  WOMEN: 2,
  SPORTS: 3,
  HOME: 6,
  CHILDREN: 5,
};

const App = () => {
  const [storeSectionCumulativeAmounObj, setStoreSectionCumulativeAmountObj] =
    useState<StoreSectionAmountObj>({
      ACCESSORIES: 0,
      MEN: 0,
      WOMEN: 0,
      SPORTS: 0,
      HOME: 0,
      CHILDREN: 0,
    });
  const [storeSectionDailyAmounObj, setStoreSectionDailyAmountObj] =
    useState<StoreSectionAmountObj>({
      ACCESSORIES: 0,
      MEN: 0,
      WOMEN: 0,
      SPORTS: 0,
      HOME: 0,
      CHILDREN: 0,
    });
  const [globalGoal, setGlobalGoal] = useState(0);
  const [cumulativeTotal, setCumulativeTotal] = useState(0);
  const [dailyTotal, setDailyTotal] = useState(0);

  const [date, setDate] = useState(DateTime.local().toISODate());
  const [isLoading, setIsLoading] = useState(false);

  const fetchStore = async (date: string) => {
    setIsLoading(true);

    try {
      const storeSectionResponse = await fetchStoreGoals(date);
      if (storeSectionResponse) {
        setStoreSectionCumulativeAmountObj(storeSectionResponse.cumulative);
        setStoreSectionDailyAmountObj(storeSectionResponse.selected_day);
        setGlobalGoal(storeSectionResponse.global_goal);
        setCumulativeTotal(
          Object.values(storeSectionResponse.cumulative).reduce(
            (acc, curr) => acc + curr,
            0
          )
        );
        setDailyTotal(
          Object.values(storeSectionResponse.selected_day).reduce(
            (acc, curr) => acc + curr,
            0
          )
        );
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStore(date);
  }, []);

  return (
    <div className="relative">
      <div className="absolute right-[15px] top-[20px]">
        <Reload
          isLoading={isLoading}
          action={() => {
            fetchStore(date);
          }}
        />
      </div>
      <div className="flex justify-end mx-5 pt-[25vh] sm:max-w-[500px] sm:mx-auto">
        <div className="w-[105.336px]">
          <p className="text-[#2D1ED2]">ACUMULADO</p>
          {cumulativeTotal !== 0 && (
            <p className="text-[#1A3CD0] text-right">
              {currencyFormat(cumulativeTotal)}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-between mt-2 mx-5 sm:max-w-[500px] sm:mx-auto">
        <GoalWidget
          goal={globalGoal}
          amountLeft={cumulativeTotal - globalGoal}
        />
      </div>

      <div className="mx-5 mt-5 sm:max-w-[500px] sm:mx-auto">
        <p className="mb-2">
          ventas{", "}
          {DateTime.fromFormat(date, "yyyy-MM-dd")
            .setLocale("es")
            .toFormat("cccc dd 'de' LLLL")}
        </p>
        <input
          type="date"
          name="date"
          id="date"
          value={date}
          onChange={(e) => {
            const newDate = e.target.value;
            if (newDate === date) return;
            setDate(e.target.value);
            fetchStore(newDate);
          }}
        />
      </div>

      <div className="space-y-2">
        {Object.entries(storeSectionDailyAmounObj)
          .sort((a, b) => storeSectionOrder[a[0]] - storeSectionOrder[b[0]])
          .map(([key, value]) => (
            <div
              key={key}
              className="px-5 py-3 first:mt-10"
              style={{
                backgroundColor: storeSectionColor[key],
              }}
            >
              <div className="flex justify-between sm:max-w-[500px] sm:mx-auto">
                <p className="text-black font-bold text-lg">
                  {storeSectionDisplay[key]}
                </p>
                <div className="flex w-[40%] justify-between">
                  <p className="text-black font-bold text-lg">
                    {currencyFormat(value)}
                  </p>
                  <p className="text-black font-bold text-lg">
                    {((value / dailyTotal) * 100).toFixed(2) + "%"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        <div className="px-5 py-3 bg-white">
          <div className="flex justify-between sm:max-w-[500px] sm:mx-auto">
            <p className="text-black font-bold text-lg">TOTAL</p>
            <div className="flex w-[40%] justify-between">
              <p className="text-black font-bold text-lg">
                {currencyFormat(dailyTotal)}
              </p>
              <p className="text-black font-bold text-lg">
                {((dailyTotal / dailyTotal) * 100).toFixed(2) + "%"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GoalWidgetProps {
  goal: number;
  amountLeft: number;
}

const GoalWidget: React.FC<GoalWidgetProps> = ({ goal, amountLeft }) => {
  return (
    <div>
      <p>META</p>
      {goal !== 0 && (
        <div className="text-right">
          <p>{currencyFormat(goal)}</p>
          {amountLeft < 0 ? (
            <p className="text-red-500">{currencyFormat(amountLeft)}</p>
          ) : (
            <p className="text-blue-500">{currencyFormat(amountLeft)}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
