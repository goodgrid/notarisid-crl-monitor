import axios from "axios";
import config from "./config.js";
import { truncateMessage, logger } from "./utils.js"

const brevoApi = axios.create({
    baseURL: config.brevoUrl,
    headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": config.brevoApiKey
    }
})


export const brevo = {
    send: async (message) => {
        try {
            for (const recipientPhoneNumber of config.recipientsPhoneNumbers.split(",")) {
                if (config.debug) logger(`Sending message to ${recipientPhoneNumber}`)
                await brevoApi.post("/sms",{
                    recipient:  recipientPhoneNumber,
                    sender: config.brevoSender,
                    content: truncateMessage(message)
                })
                
            }
            
        } catch(error) {
            console.error(`ERROR while sending '${message}' message to ${config.recipientsPhoneNumbers}`)
            console.error(error.response ? error.response.data : (error.cause ? error.cause : error))
        }
    }

}