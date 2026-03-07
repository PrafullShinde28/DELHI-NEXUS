import { startAlertEngine } from "./alert-cron";

export function startCronJobs(io:any){

  startAlertEngine(io);

}