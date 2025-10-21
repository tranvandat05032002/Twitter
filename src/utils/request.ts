const NS_PER_SEC = 1e9;  // 10^9 (Số nano giây trong 1 giây)
const MS_PER_SEC = 1e6;  // 10^6 (Số nano giây trong 1 mili giây)

export const reqTimeMeasure = async(moduleName: string, startTime: [number, number]) => {
    const chalk = (await import("chalk")).default;
  if (startTime.length !== 2) return;

  const endTime = process.hrtime(startTime);

  const totalNanoseconds = endTime[0] * NS_PER_SEC + endTime[1];
  const timeInMilliseconds = totalNanoseconds / MS_PER_SEC;

  console.log(
    `${chalk.cyan(`[${moduleName}]`)} ${chalk.yellow('==>')} ${chalk.green('Thời gian trôi qua')}` +
      chalk.white(` (giây, nano giây): ${endTime[0]}s, ${endTime[1]}ns`)
  );
  console.log(
    `${chalk.cyan(`[${moduleName}]`)} ${chalk.yellow('==>')} ${chalk.magenta('Thời gian truy vấn đã chuyển đổi:')} ` +
      chalk.bold(`${timeInMilliseconds.toFixed(3)} ms`)
  );
};

export const getStartTime = (): [number, number] => {
     const startTime = process.hrtime();
     return startTime
}