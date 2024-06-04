
const config = {
    twilioUrl: process.env.twilioUrl,
    twilioUsername: process.env.twilioUsername,
    twilioPassword: process.env.twilioPassword,
    twilioPhoneNumber: process.env.twilioPhoneNumber,
    brevoUrl: process.env.brevoUrl,
    brevoApiKey: process.env.brevoApiKey,
    brevoSender: process.env.brevoSender,
    recipientsPhoneNumbers: process.env.recipientsPhoneNumbers,
    crlUrl: process.env.crlUrl,
    opensslPath: process.env.opensslPath,
    crlAcceptableLifetimeMinutes: process.env.crlAcceptableLifetimeMinutes,
    heartbeatTimeRange: process.env.heartbeatTimeRange,
    timeZone: process.env.TZ ? process.env.TZ : "Europe/Amsterdam",
    debug: (process.env.debug && (process.env.debug === true || process.env.debug.toLowerCase() === "true")) ? true : false,
}

export default config