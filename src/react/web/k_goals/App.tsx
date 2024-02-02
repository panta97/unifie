import React, { useEffect, useState } from "react";
import { fetchStoreGoals } from "./api/goals";
import { DateTime } from "luxon";
import Reload from "./Reload";
import {
  StoreSectionAmountObj,
  StoreSectionEnum,
  StoreSectionGoalCumulative,
} from "./types";
import { currencyFormat } from "./currency";

const storeSectionDisplay: Record<StoreSectionEnum, string> = {
  ACCESSORIES: "EQ ACCESORIOS",
  MEN: "EQ CABALLEROS",
  WOMEN: "EQ DAMAS",
  SPORTS: "EQ DEPORTIVO",
  HOME: "EQ HOME",
  CHILDREN: "EQ NINO",
  CLEARANCE: "LIQUIDACION",
  MISCELLANEOUS: "OTROS",
};

const App = () => {
  const [storeSectionAmounObj, setStoreSectionAmountObj] =
    useState<StoreSectionAmountObj>({
      ACCESSORIES: 0,
      MEN: 0,
      WOMEN: 0,
      SPORTS: 0,
      HOME: 0,
      CHILDREN: 0,
      CLEARANCE: 0,
      MISCELLANEOUS: 0,
    });

  const [storeSectionGoalCumulativeList, setStoreSectionGoalCumulativeList] =
    useState<StoreSectionGoalCumulative[]>([]);
  const [selectedSectionGoalCumulative, setSelectedSectionGoalCumulative] =
    useState<StoreSectionGoalCumulative>({
      amount: 0,
      goal: 0,
      manager: "",
      month: 0,
      year: 0,
      section: StoreSectionEnum.MISCELLANEOUS,
    });
  const [selectedSection, setSelectedSection] = useState<StoreSectionEnum>(
    StoreSectionEnum.MISCELLANEOUS
  );

  const [date, setDate] = useState(DateTime.local().toISODate());
  const [isLoading, setIsLoading] = useState(false);

  const fetchStoreSections = async (date: string) => {
    setIsLoading(true);

    try {
      const storeSectionResponse = await fetchStoreGoals(date);
      if (storeSectionResponse) {
        setStoreSectionAmountObj(storeSectionResponse.selected_day);
        setStoreSectionGoalCumulativeList(storeSectionResponse.cumulative);
        getSelectedSection(storeSectionResponse.cumulative);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedSection = (
    storeSectionGoalCumulativeList: StoreSectionGoalCumulative[]
  ) => {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get("section") as StoreSectionEnum;

    if (section) {
      setSelectedSectionGoalCumulative((prev) => {
        const newVal = storeSectionGoalCumulativeList.find(
          (item) => item.section == section
        );
        return newVal ?? prev;
      });
      setSelectedSection(section);
    }
  };

  useEffect(() => {
    fetchStoreSections(date);
  }, []);

  return (
    <div className="relative">
      <div className="absolute right-[15px] top-[20px]">
        <Reload
          isLoading={isLoading}
          action={() => {
            fetchStoreSections(date);
          }}
        />
      </div>
      <div className="flex justify-between mx-5 pt-[25vh] sm:max-w-[500px] sm:mx-auto">
        <div>
          <ul>
            {storeSectionGoalCumulativeList
              .sort((a, b) => b.amount / b.goal - a.amount / a.goal)
              .map((item) => (
                <li key={item.section} className="flex justify-between gap-2">
                  <span>{item.manager}</span>{" "}
                  <span>{((item.amount / item.goal) * 100).toFixed(2)} %</span>
                </li>
              ))}
          </ul>
        </div>
        <GoalWidget
          goal={selectedSectionGoalCumulative.goal}
          amountLeft={
            selectedSectionGoalCumulative.amount -
            selectedSectionGoalCumulative.goal
          }
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
            fetchStoreSections(newDate);
          }}
        />
      </div>

      <div className="px-5 py-3 mt-10 bg-black">
        <div className="flex justify-between sm:max-w-[500px] sm:mx-auto">
          <p className="text-white">{storeSectionDisplay[selectedSection]}</p>
          <p className="text-white">
            {currencyFormat(storeSectionAmounObj[selectedSection])}
          </p>
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
