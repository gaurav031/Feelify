import cron from "cron";
import http from "http"; // Import http for HTTP requests
import https from "https"; // Import https for HTTPS requests

const URL = "https://localhost:3000"; // Change to HTTPS if your server supports it

const job = new cron.CronJob("*/14 * * * *", function () {
    const protocol = URL.startsWith("https") ? https : http; // Determine which module to use based on the URL

    protocol
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

export default job;