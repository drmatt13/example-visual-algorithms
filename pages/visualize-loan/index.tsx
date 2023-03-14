import Chart from "chart.js/auto";
import Head from "next/head";
import React from "react";

import { useEffect, useRef, useState, useCallback } from "react";

function parseNumberString(numString: string): number {
  return parseInt(numString.replace(/,/g, ""), 10);
}

function percentageDifference(a: number, b: number): number {
  const difference = Math.abs(a - b);
  const average = (a + b) / 2;
  return (difference / average) * 100;
}

function createMonthlyAmortizationSchedule(
  interestRate: number, // Annual interest rate as a decimal
  durationMonths: number, // Total number of months for the loan
  compoundRate: "daily" | "monthly", // Interest compounding frequency
  principal: number, // Starting principal amount
  startDate: Date // Date the loan starts
): Array<{
  monthName: string;
  date: Date;
  beginningBalance: number;
  interest: number;
  principal: number;
  endingBalance: number;
}> {
  // Calculate the monthly interest rate based on the compounding frequency
  let monthlyInterestRate: number;
  switch (compoundRate) {
    case "daily":
      monthlyInterestRate = Math.pow(1 + interestRate / 365, 365 / 12) - 1;
      break;
    case "monthly":
      monthlyInterestRate = Math.pow(1 + interestRate / 12, 1) - 1;
      break;
    default:
      throw new Error(`Invalid compound rate: ${compoundRate}`);
  }

  // Calculate the monthly payment using the formula for the present value of an annuity
  const monthlyPayment =
    (principal * monthlyInterestRate) /
    (1 - Math.pow(1 + monthlyInterestRate, -durationMonths));

  // Initialize the array that will hold the amortization schedule
  const amortizationSchedule = [];

  // Initialize the balance to the principal amount
  let balance = principal;

  // Loop over each month and calculate the details of the payment
  for (let i = 0; i < durationMonths; i++) {
    // Calculate the interest for this month
    const interest = balance * monthlyInterestRate;

    // Calculate the principal for this month
    const principal = monthlyPayment - interest;

    // Calculate the new balance after the payment
    balance -= principal;

    // Add the details for this month to the amortization schedule
    amortizationSchedule.push({
      monthName: startDate.toLocaleString("default", { month: "long" }),
      date: new Date(startDate.getFullYear(), startDate.getMonth() + i, 1),
      beginningBalance: balance + principal,
      interest,
      principal,
      endingBalance: balance,
    });
  }

  return amortizationSchedule;
}

const Page = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const donutContainerRef = useRef<HTMLDivElement>(null);
  const [principal, setPrincipal] = useState(380000);
  const [interestRate, setInterestRate] = useState(7);
  const [duration, setDuration] = useState(30);
  const [durationType, setDurationType] = useState<"M" | "Y">("Y");
  const [compoundRate, setCompoundRate] = useState<"D" | "M">("D");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [calculatedData, setCalculatedData] = useState<
    Array<{
      monthName: string;
      date: Date;
      beginningBalance: number;
      interest: number;
      principal: number;
      endingBalance: number;
    }>
  >([]);
  const [report, setReport] = useState<
    | {
        loanAmount: string;
        interestRate: number;
        duration: string;
        compound: string;
        totalInterest: string;
        totalCost: string;
      }
    | undefined
  >();

  // calculate the amount of money you will pay each month to successfully pay off your loan in the given duration and interest rate
  const calculateMonthlyPayment = useCallback(() => {
    const adjustedInterestRate = interestRate / 100;
    const adjustedDuration = durationType === "M" ? duration : duration * 12;
    let monthlyInterestRate: number;
    if (compoundRate === "D") {
      monthlyInterestRate = Math.pow(1 + adjustedInterestRate / 365, 30) - 1;
    } else {
      monthlyInterestRate = adjustedInterestRate / 12;
    }
    const numerator =
      principal *
      monthlyInterestRate *
      Math.pow(1 + monthlyInterestRate, adjustedDuration);
    const denominator = Math.pow(1 + monthlyInterestRate, adjustedDuration) - 1;
    const monthlyPayment = numerator / denominator;
    setMonthlyPayment(+monthlyPayment.toFixed(2));
  }, [interestRate, durationType, duration, compoundRate, principal]);

  // generate the amortization schedule for the given loan
  const generateMonthlyAmortizationSchedule = useCallback(() => {
    const adjustedInterestRate = interestRate / 100;
    const adjustedDuration = durationType === "M" ? duration : duration * 12;
    const amortizationSchedule = createMonthlyAmortizationSchedule(
      adjustedInterestRate,
      adjustedDuration,
      compoundRate === "D" ? "daily" : "monthly",
      principal,
      selectedDate
    );
    setCalculatedData(amortizationSchedule);
    // calculate the report
    setReport({
      loanAmount: principal.toFixed(2),
      interestRate: interestRate,
      duration:
        durationType === "M" ? `${duration} months` : `${duration} years`,
      compound: compoundRate === "D" ? "Daily" : "Monthly",
      totalInterest: (
        monthlyPayment * calculatedData.length -
        principal
      ).toFixed(2),
      totalCost: (monthlyPayment * calculatedData.length).toFixed(2),
    });
  }, [
    calculatedData.length,
    compoundRate,
    duration,
    durationType,
    interestRate,
    monthlyPayment,
    principal,
    selectedDate,
  ]);

  const generateData = useCallback(() => {
    calculateMonthlyPayment();
    generateMonthlyAmortizationSchedule();
  }, [calculateMonthlyPayment, generateMonthlyAmortizationSchedule]);

  const drawChart = useCallback(() => {
    if (chartContainerRef.current === null) return;
    chartContainerRef.current.innerHTML = "";
    const canvas = document.createElement("canvas");
    chartContainerRef.current.appendChild(canvas);
    new Chart(canvas, {
      type: "line",
      data: {
        labels: [...calculatedData.map((data, i) => i), calculatedData.length],
        datasets: [
          {
            label: "Loan Balance",
            data: [
              principal,
              ...calculatedData.map((data) => data.endingBalance),
            ],
            pointBorderWidth: 0,
            borderColor: "rgb(60, 150, 255)",
            backgroundColor: "rgba(60, 150, 255, 0.25)",
            borderWidth: 2,
            tension: 0.1,
          },
          {
            label: "Total Paid",
            data: [
              0,
              ...calculatedData.map((data, i) => {
                return monthlyPayment * (i + 1);
              }),
            ],
            pointBorderWidth: 0,
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.25)",
            borderWidth: 2,
            tension: 0.1,
          },
        ],
      },
      // dont allow the y axis to go below 0
      options: {
        plugins: {
          legend: {
            labels: {
              color: "white",
            },
          },
        },
        responsive: true,
        maintainAspectRatio: false,
        borderColor: "rgba(255, 255, 255, 0.075)",
        scales: {
          // name of the x axis
          x: {
            title: {
              display: true,
              text: "Month",
              font: {
                size: 10,
              },
            },
            grid: {
              color: "rgba(255, 255, 255, 0.075)",
              lineWidth: 1,
            },
            ticks: {
              display: true,
              font: {
                size: 10,
              },
            },
          },
          y: {
            // name of the y axis
            title: {
              display: true,
              text: "Balance",
              font: {
                size: 10,
              },
            },
            grid: {
              color: "rgba(255, 255, 255, 0.075)",
              lineWidth: 1,
            },
            min: 0,
            ticks: {
              display: true,
              // callback: function (value: any) {
              //   return "$" + value;
              // },
              count: 11,
              font: {
                size: 10,
              },
            },
          },
        },
      },
    });
    // create the donut chart
    if (donutContainerRef.current === null) return;
    donutContainerRef.current.innerHTML = "";
    const donutCanvas = document.createElement("canvas");
    donutContainerRef.current.appendChild(donutCanvas);
    new Chart(donutCanvas, {
      type: "doughnut",
      // different labels for the different parts of the donut chart
      data: {
        labels: ["Principle", "Interest"],
        datasets: [
          {
            label: "Loan Balance",
            data: [
              principal,
              monthlyPayment * calculatedData.length - principal,
            ],
            borderColor: "black",
            backgroundColor: ["rgb(60, 150, 255)", "rgb(255, 99, 132)"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        // custom tooltips for the donut chart

        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "white",
            },
          },
          tooltip: {
            callbacks: {
              label: function (context: any) {
                const label = context.label;
                const value = parseNumberString(context.formattedValue);
                const total = monthlyPayment * calculatedData.length;
                // get the percentage of the total that the value is
                const percentage = ((value / total) * 100).toFixed(2);
                return ` ${percentage}%`;
              },
            },
          },
        },
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }, [calculatedData, monthlyPayment, principal]);

  useEffect(() => {
    if (calculatedData.length) {
      drawChart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedData]);

  const handleDateChange = (e: any) => {
    setSelectedDate(e.target.value ? new Date(e.target.value) : new Date());
  };

  return (
    <>
      <div className="w-full flex flex-col items-center">
        <div className="h-full w-full sm:w-4/5 max-w-3xl flex flex-col text-sm sm:text-base">
          <div
            className="w-full h-80 md:h-96 bg-white/10 sm:rounded shadow shadow-white/10"
            ref={chartContainerRef}
          ></div>
          <div className="w-full mt-4 flex justify-around">
            <div className="w-full flex flex-col md:flex-row md:justify-around">
              <div className="flex flex-col items-center">
                <div className="mb-2">Loan Amount</div>
                <input
                  type="number"
                  className="px-1 w-24"
                  value={principal}
                  onChange={(e) => setPrincipal(parseInt(e.target.value))}
                />
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-center">
                <div className="mb-2">Interest %</div>
                <input
                  type="number"
                  className="px-1 w-24"
                  value={interestRate}
                  onChange={(e) => setInterestRate(+e.target.value)}
                  step={0.1}
                />
              </div>
            </div>
            <div className="w-full flex flex-col md:flex-row md:justify-around">
              <div className="flex flex-col items-center">
                <div className="mb-2">Duration</div>
                <div className="flex">
                  <input
                    type="number"
                    className="px-1 w-12"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                  />
                  <div
                    className={`${
                      durationType === "M" ? "bg-blue-700" : "bg-white/25"
                    } ml-2.5 w-6 h-6 flex justify-center items-center rounded cursor-pointer hover:bg-blue-600 transition-colors ease-out`}
                    onClick={() => setDurationType("M")}
                  >
                    M
                  </div>
                  <div
                    className={`${
                      durationType === "Y" ? "bg-blue-700" : "bg-white/25"
                    } ml-2.5 w-6 h-6 flex justify-center items-center rounded cursor-pointer hover:bg-blue-600 transition-colors ease-out`}
                    onClick={() => setDurationType("Y")}
                  >
                    Y
                  </div>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-center">
                <div className="mb-2 items-center">Compound Rate</div>
                <div className="flex">
                  <div
                    className={`${
                      compoundRate === "D" ? "bg-blue-700" : "bg-white/25"
                    } w-6 h-6 flex justify-center items-center rounded cursor-pointer hover:bg-blue-600 transition-colors ease-out`}
                    onClick={() => setCompoundRate("D")}
                  >
                    D
                  </div>
                  <div
                    className={`${
                      compoundRate === "M" ? "bg-blue-700" : "bg-white/25"
                    } ml-2.5 w-6 h-6 flex justify-center items-center rounded cursor-pointer hover:bg-blue-600 transition-colors ease-out`}
                    onClick={() => setCompoundRate("M")}
                  >
                    M
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/*  */}
          <div className="mt-8 mb-2 flex justify-between items-start ">
            <div className="flex-1 flex justify-center">
              {calculatedData.length > 0 && (
                <div
                  className="/bg-white/25 h-48 sm:h-60 max-w-[25vw] sm:max-w-[35vw] md:max-w-[40vw]"
                  ref={donutContainerRef}
                />
              )}
            </div>
            <div className="flex-1 flex justify-center">
              <div>
                <div
                  className={`${
                    principal > 0 && interestRate > 0 && duration > 0
                      ? "bg-blue-700 hover:bg-blue-600 cursor-pointer"
                      : "bg-white/25 cursor-not-allowed"
                  } px-14 py-2.5  rounded-lg transition-colors ease-out`}
                  onClick={() => {
                    if (principal > 0 && interestRate > 0 && duration > 0) {
                      generateData();
                    }
                  }}
                >
                  Calculate
                </div>
                {report && (
                  <div className="text-xs sm:text-sm pt-2.5">
                    <div className="mt-2.5 flex justify-between">
                      <div>Loan Amount: </div>
                      <div className="text-green-400">
                        {" "}
                        ${report.loanAmount}
                      </div>
                    </div>
                    <div className="mt-2.5 flex justify-between">
                      <div>Interest Rate:</div>
                      <div> {report.interestRate}%</div>
                    </div>
                    <div className="mt-2.5 flex justify-between">
                      <div>Duration:</div>
                      <div> {report.duration}</div>
                    </div>
                    <div className="mt-2.5 flex justify-between">
                      <div>Compound:</div>
                      <div>{report.compound}</div>
                    </div>
                    <div className="mt-2.5 flex justify-between">
                      <div>Total Interest:</div>
                      <div className="text-red-400">
                        $
                        {(
                          monthlyPayment * calculatedData.length -
                          principal
                        ).toFixed(2)}
                      </div>
                    </div>
                    <div className="mt-2.5 flex justify-between">
                      <div>Total Cost:</div>
                      <div className="text-green-400">
                        ${(monthlyPayment * calculatedData.length).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/*  */}
          <div className="mt-4 flex flex-col mb-10 text-sm">
            {calculatedData.length > 0 && (
              <>
                <div className="flex justify-between px-2 py-1.5 bg-white/25">
                  <div className="w-12">#</div>
                  {/* <div className="flex-1 text-center truncate">Date</div> */}
                  <div className="flex-1 text-center truncate">
                    Beginning Balance
                  </div>
                  <div className="flex-1 text-center truncate">Interest</div>
                  <div className="flex-1 text-center truncate">Principal</div>
                  <div className="flex-1 text-center truncate">
                    Ending Balance
                  </div>
                </div>
                {calculatedData.map((data, i) => {
                  return (
                    <div
                      key={i}
                      className={`${
                        i % 2 === 0 ? "bg-white/10" : "bg-white/25"
                      } flex justify-between px-2 py-1.5`}
                    >
                      <div className="w-12 /text-yellow-400">{i + 1}</div>
                      {/* <div className="flex-1 text-center">
                    {data.date.toISOString().substr(0, 10)}
                  </div> */}
                      <div className="flex-1 text-center">
                        ${data.beginningBalance.toFixed(2)}
                      </div>
                      <div className="flex-1 text-center text-red-400">
                        ${data.interest.toFixed(2)}
                      </div>
                      <div className="flex-1 text-center text-green-400">
                        ${data.principal.toFixed(2)}
                      </div>
                      <div className="flex-1 text-center">
                        ${Math.abs(+data.endingBalance.toFixed(2))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
