import cron from "cron";
import http from "http"; // Use the http module for http requests

const URL = "http://localhost:3000"; // Keep this as http since it's localhost

const job = new cron.CronJob("*/14 * * * *", function () {
    http // Change to use http.get
        .get(URL, (res) => {
            if (res.statusCode === 200) {
                console.log("GET request sent successfully");
            } else {
                console.log("GET request failed", res.statusCode);
            }
        })
        .on("error", (e) => {
            console.error("Error while sending request", e);
        });
});

// Start the cron job
job.start();

export default job;
