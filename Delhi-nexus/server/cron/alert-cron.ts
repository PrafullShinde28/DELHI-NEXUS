import cron from "node-cron";
import { checkAlerts } from "../services/alert-monitor";

export function startAlertEngine(io:any) {

  cron.schedule("*/20 * * * * *", async () => {

    await checkAlerts(io);

  });

}